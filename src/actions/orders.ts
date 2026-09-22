"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/rbac";
import { finalizePaidOrder, cancelPendingOrder } from "@/lib/orders";
import type { ActionResult } from "./auth";

function revalidateOrders() {
  revalidatePath("/admin/orders");
  revalidatePath("/account/orders");
  revalidatePath("/lk/account/orders");
}

// An admin confirming that a customer's bank transfer has landed — the
// bank-transfer counterpart of PayHere's notify webhook, and it runs the
// exact same finalization (items SOLD, discount redemption, cart cleared).
// Only a still-pending bank-transfer order qualifies: a card order is
// settled by PayHere itself, never by hand.
export async function markOrderPaid(orderId: string): Promise<ActionResult> {
  await requireAdmin();
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true, paymentMethod: true } });
  if (!order) return { ok: false, error: "Order not found." };
  if (order.paymentMethod !== "WIRE_TRANSFER") return { ok: false, error: "Only bank-transfer orders can be marked paid by hand." };
  if (order.status !== "PENDING_PAYMENT") return { ok: false, error: "This order isn't awaiting payment." };

  await finalizePaidOrder(orderId);
  revalidateOrders();
  return { ok: true };
}

// Releases a bank-transfer order (transfer never came, customer changed
// their mind) and puts its held items back on sale.
export async function cancelOrderAsAdmin(orderId: string): Promise<ActionResult> {
  await requireAdmin();
  const { cancelled } = await cancelPendingOrder(orderId);
  if (!cancelled) return { ok: false, error: "This order isn't awaiting payment." };
  revalidateOrders();
  return { ok: true };
}

// The customer backing out of their own unpaid bank-transfer order from the
// payment-instructions page — same release, but scoped to the signed-in
// owner of a pending wire order.
export async function cancelMyWireOrder(orderId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in required." };
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { userId: true, paymentMethod: true } });
  if (!order || order.userId !== session.user.id || order.paymentMethod !== "WIRE_TRANSFER") return { ok: false, error: "Order not found." };

  // Their own action — no "your order was cancelled" notification for
  // something they just did themselves (see cancelPendingOrder's own comment).
  const { cancelled } = await cancelPendingOrder(orderId, { notifyCustomer: false });
  if (!cancelled) return { ok: false, error: "This order can no longer be cancelled." };
  revalidateOrders();
  return { ok: true };
}
