"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/rbac";
import { ensureCartInvoice } from "@/lib/invoicing";
import { finalizeDiscountRedemption } from "@/lib/discount-codes";
import type { ActionResult } from "./auth";

/**
 * Customer action: moves their open cart from OPEN to SUBMITTED, making it
 * visible in the admin's Submitted Carts view. A fresh OPEN cart is
 * implicitly available afterward — see getOrCreateOpenCart — for anything
 * accepted from here on, so submitting one cart never blocks starting
 * another.
 */
export async function submitCart(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in required." };

  const cart = await prisma.cart.findFirst({
    where: { userId: session.user.id, status: "OPEN" },
    include: { items: true },
  });
  if (!cart) return { ok: false, error: "You don't have an open cart." };
  if (cart.items.length === 0) return { ok: false, error: "Your cart is empty — accept a quote or sourcing request first." };

  // A code applied earlier was only ever previewed (see applyDiscountCode)
  // — this is the actual redemption, re-validated fresh (it may have
  // expired, been disabled, or hit its use limit via a race with another
  // customer since it was applied) and only now counted against its
  // usesCount/expiry.
  if (cart.discountCodeId) {
    const result = await finalizeDiscountRedemption({ discountCodeId: cart.discountCodeId, userId: session.user.id, cartId: cart.id });
    if (!result.ok) return { ok: false, error: `${result.error} Remove it from your cart and try again.` };
  }

  await prisma.cart.update({ where: { id: cart.id }, data: { status: "SUBMITTED", submittedAt: new Date() } });

  revalidatePath("/account/cart");
  revalidatePath("/admin/carts");
  return { ok: true };
}

export async function markCartPaid(cartId: string): Promise<ActionResult> {
  await requireAdmin();
  const cart = await prisma.cart.findUnique({ where: { id: cartId } });
  if (!cart) return { ok: false, error: "Cart not found." };
  if (cart.status !== "SUBMITTED") return { ok: false, error: "Only a submitted cart can be marked paid." };

  await prisma.cart.update({ where: { id: cartId }, data: { paymentStatus: "PAID", paidAt: new Date() } });

  revalidatePath("/admin/carts");
  revalidatePath(`/admin/carts/${cartId}`);
  revalidatePath("/account/cart");
  return { ok: true };
}

// The reverse of markCartPaid — for correcting a mistaken confirmation
// (marked paid before the wire actually cleared, etc.), not part of any
// normal flow.
export async function markCartAwaitingPayment(cartId: string): Promise<ActionResult> {
  await requireAdmin();
  const cart = await prisma.cart.findUnique({ where: { id: cartId } });
  if (!cart) return { ok: false, error: "Cart not found." };

  await prisma.cart.update({ where: { id: cartId }, data: { paymentStatus: "AWAITING_PAYMENT", paidAt: null } });

  revalidatePath("/admin/carts");
  revalidatePath(`/admin/carts/${cartId}`);
  revalidatePath("/account/cart");
  return { ok: true };
}

export async function generateCartInvoice(cartId: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await ensureCartInvoice(cartId);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Couldn't generate an invoice." };
  }
  revalidatePath(`/admin/carts/${cartId}`);
  return { ok: true };
}
