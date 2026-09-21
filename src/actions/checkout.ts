"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { buildCheckoutBreakdown } from "@/lib/checkout";
import { buildPayhereCheckoutFields, payhereCheckoutUrl, type PayhereCheckoutFields } from "@/lib/payhere";
import { nextOrderNumber, cancelPendingOrder as cancelOrder } from "@/lib/orders";
import { getMarket } from "@/lib/market";
import { LK_PREFIX } from "@/lib/market-shared";
import { defaultPaymentMethod, isPaymentMethodLive } from "@/lib/payment-methods";

// Not ActionResult — that type's success case is a bare { ok: true },
// which would make it indistinguishable at the call site from this
// function's success case (also ok: true) once unioned together, so
// TypeScript couldn't narrow which fields are actually present.
export type InitiateCheckoutResult =
  | { ok: false; error: string }
  | { ok: true; method: "PAYHERE_CARD"; checkoutUrl: string; fields: PayhereCheckoutFields }
  // A bank-transfer order is already created (and its items held) — the
  // browser goes on to the page that shows where to send the money.
  | { ok: true; method: "WIRE_TRANSFER"; orderRecordId: string };

// Creates the Order (PENDING_PAYMENT) and its OrderItems up front — the
// order_id has to exist before redirecting to PayHere, since it's a
// required field in the checkout request itself. The order only becomes
// PAID once the notify_url webhook confirms it (see
// app/api/payhere/notify/route.ts); a customer who never completes
// payment just leaves an orphaned PENDING_PAYMENT row, same as an
// abandoned wholesale Cart.
export async function initiateRetailCheckout(formData: FormData): Promise<InitiateCheckoutResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in required." };

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const market = await getMarket();
  // The Sri Lanka store delivers within Sri Lanka only (v1), so the country
  // isn't a free-text field there — it also drives the domestic VAT rule and
  // the LKR shipping zone.
  const country = market === "lk" ? "Sri Lanka" : String(formData.get("country") ?? "").trim();

  const requestedMethod = String(formData.get("paymentMethod") ?? "") || defaultPaymentMethod(market);
  if (!isPaymentMethodLive(market, requestedMethod)) {
    return { ok: false, error: "That payment method isn't available yet — please choose another." };
  }
  const paymentMethod = requestedMethod;

  if (!firstName || !lastName || !phone || !address || !city || !country) {
    return { ok: false, error: "Please fill in every shipping field." };
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });

  let breakdown;
  try {
    breakdown = await buildCheckoutBreakdown({ userId: session.user.id, shippingCountry: country, market, paymentMethod });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Couldn't build your order." };
  }

  const orderNumber = await nextOrderNumber();
  const orderData = {
      orderNumber,
      userId: session.user.id,
      market,
      paymentMethod,
      paymentGateway: paymentMethod === "PAYHERE_CARD" ? "payhere" : "wire",
      currency: breakdown.currency,
      subtotal: breakdown.subtotal,
      discountAmount: breakdown.codeDiscount,
      birthdayDiscountAmount: breakdown.birthdayDiscount,
      taxAmount: breakdown.tax,
      shippingAmount: breakdown.shipping,
      handlingFeeAmount: breakdown.handlingFee,
      total: breakdown.total,
      shipName: `${firstName} ${lastName}`.trim(),
      shipPhone: phone,
      shipCountry: country,
      shipCity: city,
      shipAddressLine1: address,
      status: "PENDING_PAYMENT" as const,
      discountCodeId: breakdown.discountCodeId,
      items: {
        create: breakdown.items.map((item) => ({
          gemstoneId: item.gemstoneId,
          jewelryId: item.jewelryId,
          label: item.label,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
        })),
      },
  };

  if (paymentMethod === "WIRE_TRANSFER") {
    // Every piece is one-of-a-kind, so a pending transfer has to hold its
    // items or a second customer could pay for the same stone in the
    // meantime. The order and the hold are one transaction, and the hold is
    // a conditional update (AVAILABLE -> RESERVED): if anything was taken
    // between the availability check above and now, none of it commits.
    const gemstoneIds = breakdown.items.map((i) => i.gemstoneId).filter((id): id is string => id != null);
    const jewelryIds = breakdown.items.map((i) => i.jewelryId).filter((id): id is string => id != null);
    try {
      const wireOrder = await prisma.$transaction(async (tx) => {
        const created = await tx.order.create({ data: orderData });
        const gems = await tx.gemstone.updateMany({ where: { id: { in: gemstoneIds }, stockStatus: "AVAILABLE" }, data: { stockStatus: "RESERVED" } });
        const jewels = await tx.jewelryPiece.updateMany({ where: { id: { in: jewelryIds }, stockStatus: "AVAILABLE" }, data: { stockStatus: "RESERVED" } });
        if (gems.count !== gemstoneIds.length || jewels.count !== jewelryIds.length) throw new Error("ITEM_UNAVAILABLE");
        return created;
      });
      return { ok: true, method: "WIRE_TRANSFER", orderRecordId: wireOrder.id };
    } catch (error) {
      if (error instanceof Error && error.message === "ITEM_UNAVAILABLE") {
        return { ok: false, error: "One of the items in your cart was just taken by another customer — please review your cart." };
      }
      throw error;
    }
  }

  const order = await prisma.order.create({ data: orderData });

  const appUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  const itemsLabel = breakdown.items.length === 1 ? breakdown.items[0].label : `${breakdown.items.length} items`;

  let fields;
  try {
    fields = buildPayhereCheckoutFields({
      orderNumber: order.orderNumber,
      orderRecordId: order.id,
      amount: breakdown.total,
      currency: breakdown.currency,
      items: itemsLabel,
      firstName,
      lastName,
      email: user.email,
      phone,
      address,
      city,
      country,
      appUrl,
      pathPrefix: market === "lk" ? LK_PREFIX : undefined,
    });
  } catch (error) {
    // Roll back the order — PAYHERE_MERCHANT_ID/SECRET aren't set yet, so
    // this checkout attempt can't actually proceed to a real payment.
    await prisma.order.delete({ where: { id: order.id } });
    return { ok: false, error: error instanceof Error ? error.message : "Payment gateway isn't configured yet." };
  }

  return { ok: true, method: "PAYHERE_CARD", checkoutUrl: payhereCheckoutUrl(), fields };
}

export interface PublicOrderStatus {
  status: "PENDING_PAYMENT" | "PAID" | "PAYMENT_FAILED" | "CANCELLED";
  orderNumber: string;
}

// Deliberately no auth/session check and no ownership check — this is
// what powers the public (no-login-required) /checkout/return and
// /checkout/cancel pages PayHere redirects the browser to (see the
// middleware comment on why those are public). Safe specifically because
// it's looked up by the order's internal id (a cuid — effectively
// unguessable, unlike the sequential orderNumber) and returns nothing
// beyond a status and the order's own reference number — no amount,
// items, or shipping address. Anything sensitive only ever renders on
// the authenticated /account/orders page.
export async function getPublicOrderStatus(orderRecordId: string): Promise<PublicOrderStatus | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderRecordId },
    select: { status: true, orderNumber: true },
  });
  return order ?? null;
}

// Cancels an order still awaiting payment — called from the public
// /checkout/cancel page, which PayHere redirects to when the customer
// backs out before completing payment. Same no-ownership-check reasoning
// as getPublicOrderStatus: the order id is unguessable, and this only
// ever moves a PENDING_PAYMENT order (one nobody has paid for yet) to
// CANCELLED — it never touches the customer's cart, so they can still
// retry checkout with the same items.
export async function cancelPendingOrder(orderRecordId: string): Promise<PublicOrderStatus | null> {
  const order = await prisma.order.findUnique({ where: { id: orderRecordId }, select: { status: true, orderNumber: true, paymentMethod: true } });
  if (!order) return null;
  // Only a card checkout the customer backed out of. A bank-transfer order
  // is held for them and released by an admin (or the customer from their
  // orders page) — never by this public, no-session endpoint.
  if (order.status !== "PENDING_PAYMENT" || order.paymentMethod !== "PAYHERE_CARD") return { status: order.status, orderNumber: order.orderNumber };

  await cancelOrder(orderRecordId);
  return { status: "CANCELLED", orderNumber: order.orderNumber };
}
