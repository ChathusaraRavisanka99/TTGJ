"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { buildCheckoutBreakdown } from "@/lib/checkout";
import { buildPayhereCheckoutFields, payhereCheckoutUrl, type PayhereCheckoutFields } from "@/lib/payhere";

// Sequential per calendar year (ORD-2026-0007, ...) — same convention as
// nextInvoiceNumber/nextCartInvoiceNumber in lib/invoicing.ts.
async function nextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;
  const count = await prisma.order.count({ where: { orderNumber: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

// Not ActionResult — that type's success case is a bare { ok: true },
// which would make it indistinguishable at the call site from this
// function's success case (also ok: true) once unioned together, so
// TypeScript couldn't narrow which fields are actually present.
export type InitiateCheckoutResult =
  | { ok: false; error: string }
  | { ok: true; checkoutUrl: string; fields: PayhereCheckoutFields };

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
  const country = String(formData.get("country") ?? "").trim();

  if (!firstName || !lastName || !phone || !address || !city || !country) {
    return { ok: false, error: "Please fill in every shipping field." };
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });

  let breakdown;
  try {
    breakdown = await buildCheckoutBreakdown({ userId: session.user.id, shippingCountry: country });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Couldn't build your order." };
  }

  const orderNumber = await nextOrderNumber();
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: session.user.id,
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
      status: "PENDING_PAYMENT",
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
    },
  });

  const appUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  const itemsLabel = breakdown.items.length === 1 ? breakdown.items[0].label : `${breakdown.items.length} items`;

  let fields;
  try {
    fields = buildPayhereCheckoutFields({
      orderId: order.orderNumber,
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
    });
  } catch (error) {
    // Roll back the order — PAYHERE_MERCHANT_ID/SECRET aren't set yet, so
    // this checkout attempt can't actually proceed to a real payment.
    await prisma.order.delete({ where: { id: order.id } });
    return { ok: false, error: error instanceof Error ? error.message : "Payment gateway isn't configured yet." };
  }

  return { ok: true, checkoutUrl: payhereCheckoutUrl(), fields };
}
