"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { isSubcultureKey, type SubcultureKey } from "@/lib/subculture-collections";
import type { ActionResult } from "./auth";

function revalidateCollection(key: SubcultureKey) {
  revalidatePath(`/collections/${key}`);
  revalidatePath("/admin/alt-collections");
}

export async function addCollectionItem(input: {
  collection: SubcultureKey;
  gemstoneId: string | null;
  jewelryId: string | null;
}): Promise<ActionResult> {
  await requireAdmin();
  if (!isSubcultureKey(input.collection)) return { ok: false, error: "Unknown collection." };
  if (!input.gemstoneId && !input.jewelryId) return { ok: false, error: "Pick a gemstone or jewelry piece to add." };
  if (input.gemstoneId && input.jewelryId) return { ok: false, error: "Pick only one item — a gemstone or a jewelry piece, not both." };

  const existing = await prisma.subcultureCollectionItem.findFirst({
    where: input.gemstoneId ? { collection: input.collection, gemstoneId: input.gemstoneId } : { collection: input.collection, jewelryId: input.jewelryId },
  });
  if (existing) return { ok: false, error: "That item is already in this collection." };

  const count = await prisma.subcultureCollectionItem.count({ where: { collection: input.collection } });
  await prisma.subcultureCollectionItem.create({
    data: {
      collection: input.collection,
      gemstoneId: input.gemstoneId,
      jewelryId: input.jewelryId,
      sortOrder: count,
    },
  });

  revalidateCollection(input.collection);
  return { ok: true };
}

export async function removeCollectionItem(id: string): Promise<ActionResult> {
  await requireAdmin();
  const item = await prisma.subcultureCollectionItem.delete({ where: { id } });
  revalidateCollection(item.collection as SubcultureKey);
  return { ok: true };
}

export async function setCollectionItemFeatured(id: string, featured: boolean): Promise<ActionResult> {
  await requireAdmin();
  const item = await prisma.subcultureCollectionItem.update({ where: { id }, data: { featured } });
  revalidateCollection(item.collection as SubcultureKey);
  return { ok: true };
}

/** Swaps this item's sortOrder with its neighbor in the given direction —
 * the simplest reordering UI that doesn't need a drag-and-drop library
 * (none exists in this codebase; PromotionItemsManager doesn't reorder at
 * all, so this is the nearest precedent). */
export async function moveCollectionItem(id: string, direction: "up" | "down"): Promise<ActionResult> {
  await requireAdmin();
  const item = await prisma.subcultureCollectionItem.findUnique({ where: { id } });
  if (!item) return { ok: false, error: "Item not found." };

  const siblings = await prisma.subcultureCollectionItem.findMany({
    where: { collection: item.collection },
    orderBy: { sortOrder: "asc" },
  });
  const index = siblings.findIndex((s) => s.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= siblings.length) return { ok: true }; // already at an edge, no-op

  const neighbor = siblings[swapIndex];
  await prisma.$transaction([
    prisma.subcultureCollectionItem.update({ where: { id: item.id }, data: { sortOrder: neighbor.sortOrder } }),
    prisma.subcultureCollectionItem.update({ where: { id: neighbor.id }, data: { sortOrder: item.sortOrder } }),
  ]);

  revalidateCollection(item.collection as SubcultureKey);
  return { ok: true };
}
