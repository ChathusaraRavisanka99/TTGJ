import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { recomputeJewelryAvailability } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";
import type { RefundReason, RefundResolution } from "@prisma/client";

// Only an order that's actually been paid for (and hasn't already been
// cancelled) has anything to refund.
const REFUND_ELIGIBLE_STATUSES = new Set(["PAID", "SHIPPED", "DELIVERED"]);

export function isRefundEligible(order: { status: string }): boolean {
  return REFUND_ELIGIBLE_STATUSES.has(order.status);
}

export type RefundActionResult = { ok: true } | { ok: false; error: string };

/**
 * The customer starting a return/refund from their own order page. The
 * actual back-and-forth about it happens in the order's existing chat
 * thread (ChatThread.orderId) — this just records the request and its
 * reason, and is the thing an admin resolves later.
 */
export async function requestRefund(
  orderId: string,
  userId: string,
  input: { reason: RefundReason; reasonNotes?: string },
): Promise<RefundActionResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { userId: true, status: true } });
  if (!order || order.userId !== userId) return { ok: false, error: "Order not found." };
  if (!isRefundEligible(order)) return { ok: false, error: "This order isn't eligible for a refund request." };

  const existing = await prisma.refundRequest.findUnique({ where: { orderId } });
  if (existing) return { ok: false, error: "A refund request already exists for this order." };

  await prisma.refundRequest.create({
    data: { orderId, userId, reason: input.reason, reasonNotes: input.reasonNotes?.trim() || undefined },
  });
  return { ok: true };
}

/**
 * An admin finalizing a refund request as approved — computes the actual
 * refund amount from the chosen resolution, optionally releases the
 * item(s) back to AVAILABLE (the admin's own call, not automatic: a
 * damaged/non-returnable item might be refunded without restocking), and
 * notifies the customer. There's no payment-gateway refund API call here
 * (PayHere/bank transfer) — same as every other "admin confirms an
 * external action happened" pattern in this app (markOrderPaid, etc.);
 * actually moving the money is on the admin, this just records that it
 * was approved and for how much.
 */
export async function resolveRefundRequest(
  id: string,
  input: { resolution: RefundResolution; customAmount?: number; restock: boolean; adminNotes?: string },
): Promise<RefundActionResult> {
  const refund = await prisma.refundRequest.findUnique({
    where: { id },
    include: { order: { include: { items: true } } },
  });
  if (!refund) return { ok: false, error: "Refund request not found." };
  if (refund.status !== "REQUESTED") return { ok: false, error: "This request has already been resolved." };

  let amount: number;
  if (input.resolution === "FULL") {
    amount = refund.order.total;
  } else if (input.resolution === "MINUS_SHIPPING") {
    amount = Math.max(0, refund.order.total - refund.order.shippingAmount);
  } else {
    if (!(input.customAmount != null && input.customAmount > 0)) return { ok: false, error: "Enter a partial refund amount." };
    amount = Math.min(input.customAmount, refund.order.total);
  }

  await prisma.refundRequest.update({
    where: { id },
    data: {
      status: "REFUNDED",
      resolution: input.resolution,
      refundAmount: amount,
      restocked: input.restock,
      adminNotes: input.adminNotes?.trim() || undefined,
      resolvedAt: new Date(),
    },
  });

  if (input.restock) {
    const gemstoneIds = refund.order.items.map((i) => i.gemstoneId).filter((v): v is string => v != null);
    const variantItems = refund.order.items.filter((i) => i.jewelryVariantId != null);
    const plainJewelryIds = refund.order.items.filter((i) => i.jewelryId && !i.jewelryVariantId).map((i) => i.jewelryId!);
    if (gemstoneIds.length > 0) await prisma.gemstone.updateMany({ where: { id: { in: gemstoneIds } }, data: { stockStatus: "AVAILABLE" } });
    if (plainJewelryIds.length > 0) await prisma.jewelryPiece.updateMany({ where: { id: { in: plainJewelryIds } }, data: { stockStatus: "AVAILABLE" } });
    if (variantItems.length > 0) {
      await prisma.jewelryVariant.updateMany({ where: { id: { in: variantItems.map((i) => i.jewelryVariantId!) } }, data: { stockStatus: "AVAILABLE" } });
      await recomputeJewelryAvailability(prisma, variantItems.map((i) => i.jewelryId!));
    }
  }

  await createNotification({
    userId: refund.userId,
    type: "STATUS_CHANGE",
    message: `Your refund request for order ${refund.order.orderNumber} has been approved — ${formatPrice(amount, refund.order.currency === "LKR" ? "LKR" : "USD")} will be refunded.`,
    requestType: "order",
    requestId: refund.orderId,
  });

  return { ok: true };
}

export async function denyRefundRequest(id: string, adminNotes?: string): Promise<RefundActionResult> {
  const refund = await prisma.refundRequest.findUnique({ where: { id }, include: { order: { select: { orderNumber: true } } } });
  if (!refund) return { ok: false, error: "Refund request not found." };
  if (refund.status !== "REQUESTED") return { ok: false, error: "This request has already been resolved." };

  await prisma.refundRequest.update({
    where: { id },
    data: { status: "DENIED", adminNotes: adminNotes?.trim() || undefined, resolvedAt: new Date() },
  });

  await createNotification({
    userId: refund.userId,
    type: "STATUS_CHANGE",
    message: `Your refund request for order ${refund.order.orderNumber} was not approved — see the order's messages for details.`,
    requestType: "order",
    requestId: refund.orderId,
  });

  return { ok: true };
}
