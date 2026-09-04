"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import type { ActionResult } from "./auth";

export async function addPromotionItem(input: {
  gemstoneId: string | null;
  jewelryId: string | null;
  promoPrice: number;
}): Promise<ActionResult> {
  await requireAdmin();
  if (!input.gemstoneId && !input.jewelryId) return { ok: false, error: "Pick a gemstone or jewelry piece to promote." };
  if (input.gemstoneId && input.jewelryId) return { ok: false, error: "Pick only one item — a gemstone or a jewelry piece, not both." };
  if (!Number.isFinite(input.promoPrice) || input.promoPrice <= 0) return { ok: false, error: "Enter a promotional price greater than $0." };

  const existing = await prisma.promotionItem.findFirst({
    where: input.gemstoneId ? { gemstoneId: input.gemstoneId } : { jewelryId: input.jewelryId },
  });
  if (existing) return { ok: false, error: "That item is already in the promotional collection." };

  // Appended at the end of the current order — same "count at insert
  // time" convention MediaAsset.sortOrder already uses, no drag-to-
  // reorder needed for a list admins are expected to keep short.
  const count = await prisma.promotionItem.count();
  await prisma.promotionItem.create({
    data: {
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
