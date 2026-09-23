"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import type { ActionResult } from "./auth";

export async function createShippingWeightTier(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const label = String(formData.get("label") ?? "").trim();
  const rate = Number(formData.get("ratePerOrderLKR"));
  if (!label) return { ok: false, error: "Enter a tier label." };
  if (!Number.isFinite(rate) || rate < 0) return { ok: false, error: "Enter a valid rate." };

  await prisma.shippingWeightTier.create({
    data: { label, ratePerOrderLKR: rate, sortOrder: (await prisma.shippingWeightTier.count()) + 1 },
  });
  revalidatePath("/admin/shipping-zones");
  return { ok: true };
}

export async function updateShippingWeightTier(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const label = String(formData.get("label") ?? "").trim();
  const rate = Number(formData.get("ratePerOrderLKR"));
  if (!label) return { ok: false, error: "Enter a tier label." };
  if (!Number.isFinite(rate) || rate < 0) return { ok: false, error: "Enter a valid rate." };

  await prisma.shippingWeightTier.update({
    where: { id },
    data: { label, ratePerOrderLKR: rate, active: formData.has("active") },
  });
  revalidatePath("/admin/shipping-zones");
  return { ok: true };
}

// A tier in use by a catalog item can't just disappear from under it —
// unassign it everywhere first (the item falls back to the normal
// destination-based zone rate, same as if it never had one), then delete.
export async function deleteShippingWeightTier(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.$transaction([
    prisma.gemstone.updateMany({ where: { shippingWeightTierId: id }, data: { shippingWeightTierId: null } }),
    prisma.jewelryPiece.updateMany({ where: { shippingWeightTierId: id }, data: { shippingWeightTierId: null } }),
    prisma.shippingWeightTier.delete({ where: { id } }),
  ]);
  revalidatePath("/admin/shipping-zones");
  return { ok: true };
}
