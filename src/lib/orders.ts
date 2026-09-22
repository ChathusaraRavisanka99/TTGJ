import { prisma } from "@/lib/prisma";
import { finalizeDiscountRedemption } from "@/lib/discount-codes";
import { createNotification } from "@/lib/notifications";
import { settlePointsForPaidOrder, settleReferralForPaidOrder } from "@/lib/rewards";
import { getLoyaltySettings } from "@/lib/loyalty-settings";
import { getCommerceSettings } from "@/lib/commerce-settings";
import { sendEmail } from "@/lib/email";
import { orderConfirmationEmail, shipmentStatusEmail } from "@/lib/email-templates";
import { registerTracking } from "@/lib/track17";
import { withMarket, type Market } from "@/lib/market-shared";

// Order lifecycle steps shared by every way an order gets settled: PayHere's
// notify webhook (card) and an admin confirming a bank transfer landed
// (wire). Kept in one place so the two can't drift on what "paid" means.

// Sequential per calendar year (ORD-2026-0007, ...) — same convention as
// nextInvoiceNumber/nextCartInvoiceNumber in lib/invoicing.ts.
export async function nextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;
  const count = await prisma.order.count({ where: { orderNumber: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

/**
 * Marks an order PAID and runs everything that follows from that: items
 * SOLD, discount-code redemption, the birthday-discount stamp, and clearing
 * the customer's cart for that market. Idempotent — an already-PAID order
 * returns without touching anything (PayHere retries its notification, and
 * an admin can double-click).
 *
 * Every gemstone/jewelry piece here is one-of-a-kind (see StockStatus) —
 * flipping it to SOLD is what closes the loop the checkout-time availability
 * re-check (buildCheckoutBreakdown) depends on.
 */
export async function finalizePaidOrder(orderId: string, payment: { gatewayPaymentId?: string } = {}): Promise<{ alreadyPaid: boolean }> {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true, user: { select: { email: true } } } });
  if (order.status === "PAID") return { alreadyPaid: true };

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "PAID", paidAt: new Date(), gatewayPaymentId: payment.gatewayPaymentId },
  });

  const gemstoneIds = order.items.map((i) => i.gemstoneId).filter((id): id is string => id != null);
  const jewelryIds = order.items.map((i) => i.jewelryId).filter((id): id is string => id != null);
  if (gemstoneIds.length > 0) {
    await prisma.gemstone.updateMany({ where: { id: { in: gemstoneIds } }, data: { stockStatus: "SOLD" } });
  }
  if (jewelryIds.length > 0) {
    await prisma.jewelryPiece.updateMany({ where: { id: { in: jewelryIds } }, data: { stockStatus: "SOLD" } });
  }

  if (order.discountCodeId) {
    // Best-effort — a code going bad between checkout and payment
    // (expired, disabled, hit its limit via a race with another
    // customer) shouldn't block or reverse an already-taken payment;
    // it just isn't counted as a redemption.
    const result = await finalizeDiscountRedemption({ discountCodeId: order.discountCodeId, userId: order.userId, orderId: order.id });
    if (!result.ok) console.warn(`Order ${order.orderNumber}: discount code redemption not finalized: ${result.error}`);
  }

  if (order.birthdayDiscountAmount > 0) {
    await prisma.user.update({ where: { id: order.userId }, data: { lastBirthdayDiscountAt: new Date() } });
  }

  // Rewards: earn points on the subtotal, claim any points redeemed at
  // checkout, and pay out a referral bonus if this is the referee's first
  // qualifying order — see lib/rewards.ts for why each step is best-effort
  // rather than something that can fail this whole function. Settings are
  // read once here, before either transaction opens, rather than inside
  // one — every extra query inside an interactive transaction is extra
  // time the DB connection sits open, and this app's DB round-trip is slow
  // enough (a remote pooler) that pulling settings in mid-transaction blew
  // the default 5s interactive-transaction timeout during testing. Two
  // small transactions rather than one combined one, for the same reason
  // — each comfortably clears the raised timeout below even on a slow
  // connection.
  const rewardsSettings = { loyalty: await getLoyaltySettings(), commerce: await getCommerceSettings() };
  const REWARDS_TX_OPTS = { timeout: 15000 };
  await prisma.$transaction(
    (tx) => settlePointsForPaidOrder(tx, { id: order.id, userId: order.userId, currency: order.currency, subtotal: order.subtotal, pointsRedeemed: order.pointsRedeemed }, rewardsSettings),
    REWARDS_TX_OPTS,
  );
  const settledReferral = await prisma.$transaction(
    (tx) => settleReferralForPaidOrder(tx, { id: order.id, userId: order.userId, currency: order.currency, subtotal: order.subtotal }, rewardsSettings),
    REWARDS_TX_OPTS,
  );

  if (settledReferral) {
    await createNotification({
      userId: settledReferral.referrerId,
      type: "STATUS_CHANGE",
      message: `Your referral just placed their first order — you've earned ${settledReferral.referrerBonus} rewards points.`,
      requestType: "referral",
      requestId: settledReferral.referralId,
    });
    await createNotification({
      userId: settledReferral.refereeId,
      type: "STATUS_CHANGE",
      message: `You've earned ${settledReferral.refereeBonus} bonus rewards points for your first order.`,
      requestType: "referral",
      requestId: settledReferral.referralId,
    });
  }

  // Empty the retail cart now that it's been paid for — a fresh one is
  // implicitly available for the next purchase (getOrCreateRetailCart).
  // Also clears discountCodeId: leaving a just-redeemed (possibly now
  // exhausted or expired) code attached would make it look "still
  // applied" the moment the customer adds a new item to their now-empty
  // cart.
  const cart = await prisma.retailCart.findUnique({ where: { userId_market: { userId: order.userId, market: order.market } } });
  if (cart) {
    await prisma.retailCartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.retailCart.update({ where: { id: cart.id }, data: { discountCodeId: null, pointsToRedeem: 0 } });
  }

  // Always fires — unlike a chat reply or a status an admin sets by hand,
  // "paid" is never something the customer themselves just did (the webhook
  // and an admin's "Mark paid" are the only two callers), so there's no
  // "don't notify me about my own action" case to skip here.
  await createNotification({
    userId: order.userId,
    type: "STATUS_CHANGE",
    message: `Payment received for order ${order.orderNumber} — we're preparing it for delivery.`,
    requestType: "order",
    requestId: order.id,
  });

  // Best-effort, same as every other email send in this app — a customer
  // who isn't currently signed in and checking the bell still learns their
  // payment went through, but a misconfigured/down email provider must
  // never fail an already-successful payment.
  const orderUrl = `${process.env.AUTH_URL ?? "http://localhost:3000"}${withMarket(`/account/orders/${order.id}`, order.market as Market)}`;
  const { subject, html, text } = orderConfirmationEmail({
    orderNumber: order.orderNumber,
    currency: order.currency === "LKR" ? "LKR" : "USD",
    total: order.total,
    items: order.items.map((item) => ({ label: item.label, quantity: item.quantity, lineTotal: item.lineTotal })),
    orderUrl,
  });
  const emailResult = await sendEmail({ to: order.user.email, subject, html, text });
  if (!emailResult.ok) console.warn(`Order confirmation email not sent for order ${order.orderNumber}: ${emailResult.error}`);

  return { alreadyPaid: false };
}

/**
 * Cancels an order that's still awaiting payment, and hands back any items
 * a bank-transfer order was holding (RESERVED -> AVAILABLE; a card order
 * never reserves, so this is a no-op for it). Only touches items still
 * RESERVED — never resurrects one that has since been sold some other way.
 * The customer's cart is left alone so they can retry.
 *
 * `notifyCustomer` defaults to true (an admin cancelling on the customer's
 * behalf) — pass false when the customer is cancelling their own order (see
 * actions/orders.ts's cancelMyWireOrder), matching the "never notify someone
 * about their own action" rule every other notification here follows.
 */
export async function cancelPendingOrder(orderId: string, options: { notifyCustomer?: boolean } = {}): Promise<{ cancelled: boolean }> {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
  if (order.status !== "PENDING_PAYMENT") return { cancelled: false };

  await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });

  const gemstoneIds = order.items.map((i) => i.gemstoneId).filter((id): id is string => id != null);
  const jewelryIds = order.items.map((i) => i.jewelryId).filter((id): id is string => id != null);
  if (gemstoneIds.length > 0) {
    await prisma.gemstone.updateMany({ where: { id: { in: gemstoneIds }, stockStatus: "RESERVED" }, data: { stockStatus: "AVAILABLE" } });
  }
  if (jewelryIds.length > 0) {
    await prisma.jewelryPiece.updateMany({ where: { id: { in: jewelryIds }, stockStatus: "RESERVED" }, data: { stockStatus: "AVAILABLE" } });
  }

  if (options.notifyCustomer ?? true) {
    await createNotification({
      userId: order.userId,
      type: "STATUS_CHANGE",
      message: `Order ${order.orderNumber} has been cancelled and its items released.`,
      requestType: "order",
      requestId: order.id,
    });
  }

  return { cancelled: true };
}

/**
 * Moves a PAID order to SHIPPED — an admin's manual entry of the carrier
 * and tracking number (see actions/orders.ts's markOrderShippedByAdmin).
 * If a 17track API key is configured, the tracking number is also
 * registered with them best-effort (lib/track17.ts) — their webhook
 * (app/api/17track/webhook) can then advance the order straight to
 * DELIVERED automatically; without one, an admin marks it delivered by
 * hand from the same place they marked it shipped.
 */
export async function markOrderShipped(
  orderId: string,
  input: { carrier: string; trackingNumber: string; trackingUrl?: string },
): Promise<{ ok: boolean; error?: string }> {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { user: { select: { email: true } } } });
  if (order.status !== "PAID") return { ok: false, error: "Only a paid order can be marked shipped." };

  const shippedAt = new Date();
  await prisma.order.update({
    where: { id: order.id },
    data: { status: "SHIPPED", carrier: input.carrier, trackingNumber: input.trackingNumber, trackingUrl: input.trackingUrl || null, shippedAt },
  });

  const registerResult = await registerTracking(input.trackingNumber);
  if (!registerResult.ok) console.warn(`Order ${order.orderNumber}: tracking number not registered with 17track: ${registerResult.error}`);

  const orderUrl = `${process.env.AUTH_URL ?? "http://localhost:3000"}${withMarket(`/account/orders/${order.id}`, order.market as Market)}`;
  await createNotification({
    userId: order.userId,
    type: "STATUS_CHANGE",
    message: `Order ${order.orderNumber} has shipped${input.carrier ? ` via ${input.carrier}` : ""}.`,
    requestType: "order",
    requestId: order.id,
  });
  const { subject, html, text } = shipmentStatusEmail({
    orderNumber: order.orderNumber, status: "SHIPPED", carrier: input.carrier, trackingNumber: input.trackingNumber, orderUrl,
  });
  const emailResult = await sendEmail({ to: order.user.email, subject, html, text });
  if (!emailResult.ok) console.warn(`Shipment email not sent for order ${order.orderNumber}: ${emailResult.error}`);

  return { ok: true };
}

/**
 * Moves a SHIPPED order to DELIVERED — either an admin confirming it by
 * hand, or 17track's webhook reporting a delivery event for a registered
 * tracking number. `source` is purely for the caller's own logging; the
 * transition itself is identical either way. Idempotent the same way
 * finalizePaidOrder is: called on an order that isn't SHIPPED, this is a
 * no-op rather than an error, since a retried webhook push (or a
 * double-click) shouldn't fail.
 */
export async function markOrderDelivered(orderId: string, options: { source: "admin" | "17track" } = { source: "admin" }): Promise<{ ok: boolean }> {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { user: { select: { email: true } } } });
  if (order.status !== "SHIPPED") return { ok: false };

  const deliveredAt = new Date();
  await prisma.order.update({ where: { id: order.id }, data: { status: "DELIVERED", deliveredAt } });

  const orderUrl = `${process.env.AUTH_URL ?? "http://localhost:3000"}${withMarket(`/account/orders/${order.id}`, order.market as Market)}`;
  await createNotification({
    userId: order.userId,
    type: "STATUS_CHANGE",
    message: `Order ${order.orderNumber} has been delivered.`,
    requestType: "order",
    requestId: order.id,
  });
  const { subject, html, text } = shipmentStatusEmail({ orderNumber: order.orderNumber, status: "DELIVERED", orderUrl });
  const emailResult = await sendEmail({ to: order.user.email, subject, html, text });
  if (!emailResult.ok) console.warn(`Delivery email not sent for order ${order.orderNumber} (source: ${options.source}): ${emailResult.error}`);

  return { ok: true };
}
