"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/rbac";
import { normalizeCode, generateUniqueCode } from "@/lib/discount-codes";
import type { ActionResult } from "./auth";

// ---------- Admin: generate/manage codes ----------

export async function generateDiscountCode(amountOff: number, customCode?: string): Promise<ActionResult & { code?: string }> {
  await requireAdmin();

  if (!Number.isFinite(amountOff) || amountOff <= 0) return { ok: false, error: "Enter an amount greater than $0." };

  let code: string;
  if (customCode && customCode.trim()) {
    code = normalizeCode(customCode);
    if (!/^[A-Z0-9-]{3,20}$/.test(code)) {
      return { ok: false, error: "Codes are 3-20 characters — letters, numbers, and hyphens only." };
    }
    const existing = await prisma.discountCode.findUnique({ where: { code } });
    if (existing) return { ok: false, error: `${code} already exists.` };
  } else {
    code = await generateUniqueCode();
  }

  await prisma.discountCode.create({ data: { code, amountOff } });
  revalidatePath("/admin/discount-codes");
  return { ok: true, code };
}

// A code can only be deleted while unused — once it's redeemed it's part
// of a cart's (and eventually an invoice's) history, same reasoning every
// other "don't silently rewrite the past" record in this schema follows.
export async function deleteDiscountCode(id: string): Promise<ActionResult> {
  await requireAdmin();
  const code = await prisma.discountCode.findUnique({ where: { id } });
  if (!code) return { ok: false, error: "Code not found." };
  if (code.usedAt) return { ok: false, error: "This code has already been redeemed and can't be deleted." };

  await prisma.discountCode.delete({ where: { id } });
  revalidatePath("/admin/discount-codes");
  return { ok: true };
}

// ---------- Customer: apply/remove on their own open cart ----------

export async function applyDiscountCode(rawCode: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in required." };

  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, error: "Enter a code." };

  const cart = await prisma.cart.findFirst({ where: { userId: session.user.id, status: "OPEN" }, include: { items: true } });
  if (!cart || cart.items.length === 0) return { ok: false, error: "Your cart is empty." };
  if (cart.discountAmount != null) return { ok: false, error: "Remove the current code before applying a different one." };

  const discount = await prisma.discountCode.findUnique({ where: { code } });
  if (!discount) return { ok: false, error: "That code doesn't exist." };
  if (discount.usedAt || discount.cartId) return { ok: false, error: "That code has already been used." };

  // Both writes together: the code is claimed by this cart, and the cart
  // records the amount, atomically — a second, concurrent apply of the
  // same code can't succeed once this transaction commits (the code's
  // cartId is no longer null), and a failure partway through can't leave
  // the code claimed with no cart to show for it.
  await prisma.$transaction([
    prisma.discountCode.update({ where: { id: discount.id }, data: { cartId: cart.id, usedAt: new Date() } }),
    prisma.cart.update({ where: { id: cart.id }, data: { discountAmount: discount.amountOff } }),
  ]);

  revalidatePath("/account/cart");
  return { ok: true };
}

// Only reachable while the cart is still OPEN (see the UI — the control
// simply isn't shown once submitted) — releases the code back to unused
// rather than leaving it permanently spent on an abandoned discount.
export async function removeDiscountCode(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in required." };

  const cart = await prisma.cart.findFirst({ where: { userId: session.user.id, status: "OPEN" }, include: { discountCode: true } });
  if (!cart || !cart.discountCode) return { ok: false, error: "No code is applied." };

  await prisma.$transaction([
    prisma.discountCode.update({ where: { id: cart.discountCode.id }, data: { cartId: null, usedAt: null } }),
    prisma.cart.update({ where: { id: cart.id }, data: { discountAmount: null } }),
  ]);

  revalidatePath("/account/cart");
  return { ok: true };
}
