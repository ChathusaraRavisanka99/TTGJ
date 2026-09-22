import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_BYTES = 32;
export const RESET_TOKEN_TTL_MINUTES = 60;

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Mints a fresh reset token for a user, invalidating any still-live ones
 * they already had first (only the most recently requested link should
 * ever work — otherwise several old emails could all still grant access).
 * Returns the RAW token — it only ever exists here, in memory, and in the
 * emailed link; the database only ever stores its SHA-256 hash, so a
 * database leak alone can't be used to walk a still-valid reset link back
 * into an account takeover.
 */
export async function createPasswordResetToken(userId: string): Promise<{ rawToken: string; expiresAt: Date }> {
  const rawToken = randomBytes(TOKEN_BYTES).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } }),
  ]);

  return { rawToken, expiresAt };
}

export interface VerifiedResetToken {
  id: string;
  userId: string;
}

/**
 * Checks a raw token from the reset-confirm page against its stored hash
 * — valid only if it exists, hasn't already been used, and hasn't expired.
 * Deliberately collapses every failure reason (never existed, already
 * used, expired) into the same `null` — none of those distinctions are
 * safe to reveal to whoever is holding the link.
 */
export async function verifyPasswordResetToken(rawToken: string): Promise<VerifiedResetToken | null> {
  const tokenHash = hashToken(rawToken);
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!row || row.usedAt || row.expiresAt < new Date()) return null;
  return { id: row.id, userId: row.userId };
}

/**
 * Marks a token used and sets the new password hash, atomically — a
 * conditional updateMany (usedAt: null in the WHERE) claims the token the
 * same way finalizeDiscountRedemption's conditional updateMany claims a
 * discount code's last use, so two concurrent submissions of the same
 * reset link can't both succeed. Returns false if the token was already
 * claimed (by a racing request, or reused after already being consumed)
 * without touching the user's password at all.
 */
export async function consumePasswordResetToken(tokenId: string, userId: string, newPasswordHash: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const claim = await tx.passwordResetToken.updateMany({ where: { id: tokenId, usedAt: null }, data: { usedAt: new Date() } });
    if (claim.count === 0) return false;
    await tx.user.update({ where: { id: userId }, data: { passwordHash: newPasswordHash } });
    return true;
  });
}
