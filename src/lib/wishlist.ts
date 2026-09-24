import { prisma } from "@/lib/prisma";

export interface ToggleWishlistInput {
  gemstoneId?: string;
  jewelryId?: string;
}

/** Every id (gemstone or jewelry) `userId` currently has saved, as one Set
 * — cheap enough to fetch unfiltered on any catalog page (a wishlist is
 * realistically at most a few dozen rows), so every card can show its real
 * saved state without an N+1 lookup per item. */
export async function getWishlistedIds(userId: string | null | undefined): Promise<Set<string>> {
  if (!userId) return new Set();
  const items = await prisma.wishlistItem.findMany({ where: { userId }, select: { gemstoneId: true, jewelryId: true } });
  const ids = new Set<string>();
  for (const item of items) {
    if (item.gemstoneId) ids.add(item.gemstoneId);
    if (item.jewelryId) ids.add(item.jewelryId);
  }
  return ids;
}

/** Toggles a single item's saved state for this user — a plain check-then-
 * write (see WishlistItem's own schema comment on why this isn't a DB-
 * constrained upsert): fine for a save/unsave button with no financial
 * stakes if a rare double-click race ever created a duplicate row. */
export async function toggleWishlist(userId: string, input: ToggleWishlistInput): Promise<{ saved: boolean }> {
  const where = input.gemstoneId ? { userId, gemstoneId: input.gemstoneId } : { userId, jewelryId: input.jewelryId! };
  const existing = await prisma.wishlistItem.findFirst({ where });
  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return { saved: false };
  }
  await prisma.wishlistItem.create({ data: { userId, gemstoneId: input.gemstoneId, jewelryId: input.jewelryId } });
  return { saved: true };
}
