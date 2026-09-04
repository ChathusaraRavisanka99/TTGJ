"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { SEASONAL_THEME_KEYS, type SeasonalThemeKey } from "@/lib/seasonal-themes";
import type { ActionResult } from "./auth";

export async function addPromotionItem(input: {
  theme: SeasonalThemeKey;
  gemstoneId: string | null;
  jewelryId: string | null;
  promoPrice: number;
}): Promise<ActionResult> {
  await requireAdmin();
  if (!SEASONAL_THEME_KEYS.includes(input.theme)) return { ok: false, error: "Unknown theme." };
  if (!input.gemstoneId && !input.jewelryId) return { ok: false, error: "Pick a gemstone or jewelry piece to promote." };
  if (input.gemstoneId && input.jewelryId) return { ok: false, error: "Pick only one item — a gemstone or a jewelry piece, not both." };
  if (!Number.isFinite(input.promoPrice) || input.promoPrice <= 0) return { ok: false, error: "Enter a promotional price greater than $0." };

  // Scoped to this theme — the same item can already be promoted under a
  // different theme (that's the point: one gemstone can headline both
  // the Spring and Summer collections, at whatever price fits each), so
  // only a duplicate within *this* theme is refused.
  const existing = await prisma.promotionItem.findFirst({
    where: input.gemstoneId ? { theme: input.theme, gemstoneId: input.gemstoneId } : { theme: input.theme, jewelryId: input.jewelryId },
  });
  if (existing) return { ok: false, error: "That item is already in this theme's collection." };

  // Appended at the end of this theme's own order — same "count at
  // insert time" convention MediaAsset.sortOrder already uses.
  const count = await prisma.promotionItem.count({ where: { theme: input.theme } });
  await prisma.promotionItem.create({
    data: {
      theme: input.theme,
      gemstoneId: input.gemstoneId,
      jewelryId: input.jewelryId,
      promoPrice: input.promoPrice,
      sortOrder: count,
    },
  });

  revalidatePath("/promotions");
  revalidatePath("/admin/promotions");
  return { ok: true };
}

export async function updatePromotionItemPrice(id: string, promoPrice: number): Promise<ActionResult> {
  await requireAdmin();
  if (!Number.isFinite(promoPrice) || promoPrice <= 0) return { ok: false, error: "Enter a promotional price greater than $0." };

  await prisma.promotionItem.update({ where: { id }, data: { promoPrice } });
  revalidatePath("/promotions");
  revalidatePath("/admin/promotions");
  return { ok: true };
}

export async function removePromotionItem(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.promotionItem.delete({ where: { id } });
  revalidatePath("/promotions");
  revalidatePath("/admin/promotions");
  return { ok: true };
}
