"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "./auth";

const bundleItemSchema = z.object({
  gemstoneId: z.string().optional(),
  jewelryId: z.string().optional(),
});

const createBundleSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(200),
  market: z.enum(["intl", "lk"]),
  price: z.coerce.number().positive("Bundle price must be greater than 0."),
  items: z
    .string()
    .transform((raw, ctx) => {
      try {
        return z.array(bundleItemSchema).parse(JSON.parse(raw));
      } catch {
        ctx.addIssue({ code: "custom", message: "Invalid items." });
        return z.NEVER;
      }
    })
    .refine((items) => items.length >= 2, "A bundle needs at least 2 items."),
});

function revalidateBundles() {
  revalidatePath("/admin/bundles");
}

export async function createBundle(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = createBundleSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid bundle." };
  const { name, market, price, items } = parsed.data;

  // Every item must actually exist and belong to this bundle's own store —
  // a bundle can't mix intl and lk items (carts are already one-per-market,
  // so a mixed bundle could never actually be bought as a set).
  const gemstoneIds = items.map((i) => i.gemstoneId).filter((id): id is string => !!id);
  const jewelryIds = items.map((i) => i.jewelryId).filter((id): id is string => !!id);
  const [gemCount, jewelryCount] = await Promise.all([
    gemstoneIds.length > 0 ? prisma.gemstone.count({ where: { id: { in: gemstoneIds }, market } }) : 0,
    jewelryIds.length > 0 ? prisma.jewelryPiece.count({ where: { id: { in: jewelryIds }, market } }) : 0,
  ]);
  if (gemCount !== gemstoneIds.length || jewelryCount !== jewelryIds.length) {
    return { ok: false, error: "One or more items weren't found in this store's catalog." };
  }

  await prisma.bundle.create({
    data: {
      name,
      market,
      price,
      items: { create: items.map((i) => ({ gemstoneId: i.gemstoneId, jewelryId: i.jewelryId })) },
    },
  });
  revalidateBundles();
  return { ok: true };
}

export async function toggleBundleActive(id: string, active: boolean): Promise<ActionResult> {
  await requireAdmin();
  await prisma.bundle.update({ where: { id }, data: { active } });
  revalidateBundles();
  return { ok: true };
}

export async function deleteBundle(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.bundle.delete({ where: { id } });
  revalidateBundles();
  return { ok: true };
}
