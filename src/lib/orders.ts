import { prisma } from "@/lib/prisma";
import { finalizeDiscountRedemption } from "@/lib/discount-codes";

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
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
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

  // Empty the retail cart now that it's been paid for — a fresh one is
  // implicitly available for the next purchase (getOrCreateRetailCart).
  // Also clears discountCodeId: leaving a just-redeemed (possibly now
  // exhausted or expired) code attached would make it look "still
  // applied" the moment the customer adds a new item to their now-empty
  // cart.
  const cart = await prisma.retailCart.findUnique({ where: { userId_market: { userId: order.userId, market: order.market } } });
  if (cart) {
    await prisma.retailCartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.retailCart.update({ where: { id: cart.id }, data: { discountCodeId: null } });
  }

  return { alreadyPaid: false };
}

/**
 * Cancels an order that's still awaiting payment, and hands back any items
 * a bank-transfer order was holding (RESERVED -> AVAILABLE; a card order
 * never reserves, so this is a no-op for it). Only touches items still
 * RESERVED — never resurrects one that has since been sold some other way.
 * The customer's cart is left alone so they can retry.
 */
export async function cancelPendingOrder(orderId: string): Promise<{ cancelled: boolean }> {
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
  return { cancelled: true };
}
