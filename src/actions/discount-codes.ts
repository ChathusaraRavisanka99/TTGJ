"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/rbac";
import { normalizeCode, generateUniqueCode, discountCodeError } from "@/lib/discount-codes";
import type { ActionResult } from "./auth";

// ---------- Admin: generate/manage codes ----------

export interface GenerateDiscountCodeInput {
  amountOff: number;
  customCode?: string;
  scope: "SITE_WIDE" | "CUSTOMER";
  assignedUserId?: string;
  /** null/undefined = unlimited. */
  maxUses?: number | null;
  /** ISO date string (from an <input type="date">), or null/undefined for never. */
  expiresAt?: string | null;
}

export async function generateDiscountCode(input: GenerateDiscountCodeInput): Promise<ActionResult & { code?: string }> {
  await requireAdmin();

  if (!Number.isFinite(input.amountOff) || input.amountOff <= 0) return { ok: false, error: "Enter an amount greater than $0." };
  if (input.scope === "CUSTOMER" && !input.assignedUserId) return { ok: false, error: "Select a customer for a customer-specific code." };
  if (input.maxUses != null && (!Number.isFinite(input.maxUses) || input.maxUses < 1)) {
    return { ok: false, error: "Max uses must be at least 1 (leave blank for unlimited)." };
  }

  let code: string;
  if (input.customCode && input.customCode.trim()) {
    code = normalizeCode(input.customCode);
    if (!/^[A-Z0-9-]{3,20}$/.test(code)) {
      return { ok: false, error: "Codes are 3-20 characters — letters, numbers, and hyphens only." };
    }
    const existing = await prisma.discountCode.findUnique({ where: { code } });
    if (existing) return { ok: false, error: `${code} already exists.` };
  } else {
    code = await generateUniqueCode();
  }

  await prisma.discountCode.create({
    data: {
      code,
      amountOff: input.amountOff,
      scope: input.scope,
      assignedUserId: input.scope === "CUSTOMER" ? input.assignedUserId : null,
      maxUses: input.maxUses ?? null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    },
  });
  revalidatePath("/admin/discount-codes");
  return { ok: true, code };
}

// A code can only be deleted before its first redemption — once any
// cart/order has actually redeemed it, it's part of that record's
// history, same reasoning every other "don't silently rewrite the past"
// record in this schema follows. Use the "active" toggle instead to stop
// a partially-used code from being redeemed again.
export async function deleteDiscountCode(id: string): Promise<ActionResult> {
  await requireAdmin();
  const code = await prisma.discountCode.findUnique({ where: { id } });
  if (!code) return { ok: false, error: "Code not found." };
  if (code.usesCount > 0) return { ok: false, error: "This code has already been redeemed and can't be deleted — disable it instead." };

  await prisma.discountCode.delete({ where: { id } });
  revalidatePath("/admin/discount-codes");
  return { ok: true };
}

export async function setDiscountCodeActive(id: string, active: boolean): Promise<ActionResult> {
  await requireAdmin();
  await prisma.discountCode.update({ where: { id }, data: { active } });
  revalidatePath("/admin/discount-codes");
  return { ok: true };
}

// ---------- Customer: apply/remove on their own open cart ----------
//
// Applying only previews the discount (cart.discountAmount) and links
// cart.discountCodeId — it does NOT touch DiscountCode.usesCount and
// writes no DiscountCodeRedemption row. That only happens once the cart
// actually completes (see finalizeDiscountRedemption, called from
// submitCart in actions/cart.ts), so applying then removing a code from
// a still-open cart never burns one of its limited uses.

export async function applyDiscountCode(rawCode: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in required." };

  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, error: "Enter a code." };

  const cart = await prisma.cart.findFirst({ where: { userId: session.user.id, status: "OPEN" }, include: { items: true } });
  if (!cart || cart.items.length === 0) return { ok: false, error: "Your cart is empty." };
  if (cart.discountCodeId) return { ok: false, error: "Remove the current code before applying a different one." };

  const discount = await prisma.discountCode.findUnique({ where: { code } });
  if (!discount) return { ok: false, error: "That code doesn't exist." };
  const error = discountCodeError(discount, session.user.id);
  if (error) return { ok: false, error };

  await prisma.cart.update({ where: { id: cart.id }, data: { discountCodeId: discount.id, discountAmount: discount.amountOff } });

  revalidatePath("/account/cart");
  return { ok: true };
}

// Only reachable while the cart is still OPEN (see the UI — the control
// simply isn't shown once submitted).
export async function removeDiscountCode(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in required." };

  const cart = await prisma.cart.findFirst({ where: { userId: session.user.id, status: "OPEN" } });
  if (!cart || !cart.discountCodeId) return { ok: false, error: "No code is applied." };

  await prisma.cart.update({ where: { id: cart.id }, data: { discountCodeId: null, discountAmount: null } });

  revalidatePath("/account/cart");
  return { ok: true };
}
