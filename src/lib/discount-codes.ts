import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

// Discount codes are matched case-insensitively — a customer typing
// "welcome50" should redeem the same code an admin generated as
// "WELCOME50". Storing (and always looking up by) the uppercase form
// means every comparison is a plain equality check, no collation
// gymnastics at the DB level.
export function normalizeCode(input: string): string {
  return input.trim().toUpperCase();
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — easy to misread aloud or by hand

function randomCode(length = 8): string {
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return code;
}

/** Generates a fresh, guaranteed-unique code — collisions are checked for
 * and retried rather than assumed away, even though astronomically
 * unlikely at this alphabet/length. */
export async function generateUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode();
    const existing = await prisma.discountCode.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique code — try again.");
}

export function cartTotal(items: { amount: number }[], discountAmount: number | null | undefined): number {
  const subtotal = items.reduce((sum, i) => sum + i.amount, 0);
  return Math.max(0, subtotal - (discountAmount ?? 0));
}

interface DiscountCodeLike {
  active: boolean;
  expiresAt: Date | null;
  scope: string;
  assignedUserId: string | null;
  maxUses: number | null;
  usesCount: number;
}

// The single set of rules a code has to pass — shared by the soft,
// UX-only check at apply-time and the hard, transactional re-check at
// finalize-time (see finalizeDiscountRedemption) — so the two can never
// drift out of sync and let something through at finalize that apply
// would have rejected.
export function discountCodeError(discount: DiscountCodeLike, userId: string): string | null {
  if (!discount.active) return "This code is no longer active.";
  if (discount.expiresAt && discount.expiresAt.getTime() < Date.now()) return "This code has expired.";
  if (discount.scope === "CUSTOMER" && discount.assignedUserId !== userId) return "This code isn't valid for your account.";
  if (discount.maxUses != null && discount.usesCount >= discount.maxUses) return "This code has reached its usage limit.";
  return null;
}

// Called once, at the exact moment a cart/order that had a code applied
// actually completes (submitCart for the existing wholesale pipeline,
// the PayHere webhook for the new retail one — see lib/checkout.ts) —
// never at apply-time, which only previews the discount. Re-validates
// inside a transaction: applying a code and completing a cart aren't the
// same moment, so a maxUses/expiry/active check made when the code was
// applied could be stale by the time this runs. The updateMany's WHERE
// re-checks usesCount against the fixed maxUses threshold at write time
// (not against a possibly-stale in-memory count), so two concurrent
// finalizations racing for the last remaining use can't both succeed —
// same claim-via-conditional-updateMany pattern the old cartId/usedAt
// binding used. Only on success is usesCount incremented and a
// DiscountCodeRedemption row written — applying then removing a code
// from a still-open cart/order never reaches this function at all, so it
// never burns a use.
export async function finalizeDiscountRedemption(input: {
  discountCodeId: string;
  userId: string;
  cartId?: string;
  orderId?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      const discount = await tx.discountCode.findUnique({ where: { id: input.discountCodeId } });
      if (!discount) throw new Error("That discount code no longer exists.");
      const err = discountCodeError(discount, input.userId);
      if (err) throw new Error(err);

      const claim = await tx.discountCode.updateMany({
        where: {
          id: input.discountCodeId,
          active: true,
          OR: [{ maxUses: null }, { usesCount: { lt: discount.maxUses ?? undefined } }],
        },
        data: { usesCount: { increment: 1 } },
      });
      if (claim.count === 0) throw new Error("That code has just reached its usage limit.");

      await tx.discountCodeRedemption.create({
        data: {
          discountCodeId: input.discountCodeId,
          userId: input.userId,
          cartId: input.cartId,
          orderId: input.orderId,
        },
      });
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Couldn't finalize that discount code." };
  }
}
