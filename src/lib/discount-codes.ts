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
