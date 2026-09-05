"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import type { ActionResult } from "./auth";

function parseCountries(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

export async function createShippingZone(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const label = String(formData.get("label") ?? "").trim();
  const rate = Number(formData.get("ratePerOrderLKR"));
  const isFallback = formData.get("isFallback") === "true";
  if (!label) return { ok: false, error: "Enter a zone label." };
  if (!Number.isFinite(rate) || rate < 0) return { ok: false, error: "Enter a valid rate." };

  await prisma.shippingZone.create({
    data: {
      label,
      countries: isFallback ? [] : parseCountries(formData.get("countries")),
      isFallback,
      ratePerOrderLKR: rate,
      sortOrder: (await prisma.shippingZone.count()) + 1,
    },
  });
  revalidatePath("/admin/shipping-zones");
  return { ok: true };
}

export async function updateShippingZone(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const label = String(formData.get("label") ?? "").trim();
  const rate = Number(formData.get("ratePerOrderLKR"));
  const isFallback = formData.get("isFallback") === "true";
  if (!label) return { ok: false, error: "Enter a zone label." };
  if (!Number.isFinite(rate) || rate < 0) return { ok: false, error: "Enter a valid rate." };

  await prisma.shippingZone.update({
    where: { id },
    data: {
      label,
      countries: isFallback ? [] : parseCountries(formData.get("countries")),
      isFallback,
      ratePerOrderLKR: rate,
      // Plain checkbox, no hidden false/true pairing — a present "active"
      // key means checked, absent means unchecked. (z.coerce.boolean()
      // and the hidden-false/checkbox-true pairing don't mix well: see
      // formBoolean in lib/validation/catalog.ts.)
      active: formData.has("active"),
    },
  });
  revalidatePath("/admin/shipping-zones");
  return { ok: true };
}

export async function deleteShippingZone(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.shippingZone.delete({ where: { id } });
  revalidatePath("/admin/shipping-zones");
  return { ok: true };
}
