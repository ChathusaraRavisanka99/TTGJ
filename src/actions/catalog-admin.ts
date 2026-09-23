"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { slugify } from "@/lib/utils";
import { saveCertificateFile, deleteUploadedFile } from "@/lib/media";
import { gemstoneSchema, jewelrySchema } from "@/lib/validation/catalog";
import type { ActionResult } from "./auth";

function formToObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

async function uniqueSlug(base: string, check: (slug: string) => Promise<boolean>) {
  const root = slugify(base) || "item";
  let slug = root;
  let n = 1;
  while (await check(slug)) {
    n += 1;
    slug = `${root}-${n}`;
  }
  return slug;
}

export async function createGemstone(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = gemstoneSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid gemstone data." };

  const data = parsed.data;
  const lk = data.market === "lk";
  const slug = await uniqueSlug(data.name, async (s) => !!(await prisma.gemstone.findUnique({ where: { slug: s } })));

  const gem = await prisma.gemstone.create({
    data: {
      slug,
      name: data.name,
      description: data.description || undefined,
      mineralId: data.mineralId,
      variety: data.variety || undefined,
      cutId: data.cutId,
      caratWeight: data.caratWeight,
      lengthMm: data.lengthMm,
      widthMm: data.widthMm,
      depthMm: data.depthMm,
      colorHue: data.colorHue,
      colorSaturation: data.colorSaturation,
      colorLightness: data.colorLightness,
      colorLabel: data.colorLabel || undefined,
      clarityGradeId: data.clarityGradeId,
      treatmentId: data.treatmentId,
      originId: data.originId,
      symmetryNotes: data.symmetryNotes || undefined,
      polishNotes: data.polishNotes || undefined,
      certLabId: data.certLabId || undefined,
      certReportNumber: data.certReportNumber || undefined,
      certFileUrl: data.certFileUrl || undefined,
      market: data.market,
      // A listing is priced in its own store's currency only: a Sri Lanka
      // listing carries rupee prices (retail mandatory) and no dollar ones, an
      // international listing the reverse. costPrice is in that same currency.
      price: lk ? undefined : data.price,
      showPrice: lk ? false : data.showPrice,
      retailPrice: lk ? undefined : data.retailPrice,
      costPrice: data.costPrice,
      lkrRetailPrice: lk ? data.lkrRetailPrice : undefined,
      lkrPrice: lk ? data.lkrPrice : undefined,
      stockStatus: data.stockStatus,
      isPublished: data.isPublished,
      isFeatured: data.isFeatured,
    },
  });

  revalidatePath("/admin/gems");
  redirect(`/admin/gems/${gem.id}`);
}

export async function updateGemstone(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const existing = await prisma.gemstone.findUnique({ where: { id }, select: { market: true } });
  if (!existing) return { ok: false, error: "Gemstone not found." };
  // The store is fixed when the listing is created, so it comes from the saved
  // row — never from the form (see StoreField).
  const parsed = gemstoneSchema.safeParse({ ...formToObject(formData), market: existing.market });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid gemstone data." };

  const data = parsed.data;
  const lk = data.market === "lk";
  await prisma.gemstone.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || undefined,
      mineralId: data.mineralId,
      variety: data.variety || undefined,
      cutId: data.cutId,
      caratWeight: data.caratWeight,
      lengthMm: data.lengthMm,
      widthMm: data.widthMm,
      depthMm: data.depthMm,
      colorHue: data.colorHue,
      colorSaturation: data.colorSaturation,
      colorLightness: data.colorLightness,
      colorLabel: data.colorLabel || undefined,
      clarityGradeId: data.clarityGradeId,
      treatmentId: data.treatmentId,
      originId: data.originId,
      symmetryNotes: data.symmetryNotes || undefined,
      polishNotes: data.polishNotes || undefined,
      // Unlike the other optional fields above, an empty selection here has
      // to actually clear a previously-set lab (picking "None" after having
      // picked a lab), so this uses `null` rather than `undefined` — Prisma
      // treats `undefined` as "leave the existing value alone".
      certLabId: data.certLabId || null,
      certReportNumber: data.certReportNumber || undefined,
      certFileUrl: data.certFileUrl || undefined,
      // Only the price fields of the listing's own store are used; the other
      // store's are cleared (null, not undefined, so they really clear).
      price: lk ? null : data.price,
      showPrice: lk ? false : data.showPrice,
      retailPrice: lk ? null : data.retailPrice,
      costPrice: data.costPrice,
      lkrRetailPrice: lk ? data.lkrRetailPrice : null,
      lkrPrice: lk ? data.lkrPrice : null,
      stockStatus: data.stockStatus,
      isPublished: data.isPublished,
      isFeatured: data.isFeatured,
    },
  });

  revalidatePath("/admin/gems");
  revalidatePath(`/admin/gems/${id}`);
  revalidatePath("/");
  revalidatePath("/lk");
  // Covers editing an already-featured item's name/price/photo/etc, or its
  // isFeatured flag directly via this form — not just the dedicated toggle.
  revalidateTag("home-featured", { expire: 0 });
  return { ok: true };
}

export async function deleteGemstone(id: string): Promise<ActionResult> {
  await requireAdmin();
  const gemstone = await prisma.gemstone.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true, quoteRequests: true, auctions: true } } },
  });
  if (!gemstone) return { ok: false, error: "Gemstone not found." };
  const { orderItems, quoteRequests, auctions } = gemstone._count;
  if (orderItems > 0 || quoteRequests > 0 || auctions > 0) {
    return { ok: false, error: "This gemstone has order, quote, or auction history and can't be deleted — unpublish it instead." };
  }

  await prisma.gemstone.delete({ where: { id } });
  revalidatePath("/admin/gems");
  revalidatePath("/");
  revalidatePath("/lk");
  revalidateTag("home-featured", { expire: 0 });
  return { ok: true };
}

// Quick per-row toggle on the admin gems list, so curating the homepage's
// Featured Gemstones section doesn't require opening the full edit form.
export async function toggleGemstoneFeatured(id: string, featured: boolean): Promise<ActionResult> {
  await requireAdmin();
  await prisma.gemstone.update({ where: { id }, data: { isFeatured: featured } });
  revalidatePath("/admin/gems");
  revalidatePath("/");
  revalidatePath("/lk");
  // The home page's own featured-items query is cached separately (see
  // app/page.tsx) — revalidatePath alone doesn't reach into that.
  // { expire: 0 }: this Next version's revalidateTag defaults to
  // stale-while-revalidate otherwise, and an admin toggling "featured"
  // expects to see it reflected immediately, not eventually.
  revalidateTag("home-featured", { expire: 0 });
  return { ok: true };
}

export async function uploadCertificateFile(gemstoneId: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "No file provided." };

  const gem = await prisma.gemstone.findUnique({ where: { id: gemstoneId }, select: { certFileUrl: true } });
  if (!gem) return { ok: false, error: "Gemstone not found." };

  try {
    const saved = await saveCertificateFile(file);
    await prisma.gemstone.update({ where: { id: gemstoneId }, data: { certFileUrl: saved.url } });

    // Replacing an existing attachment — clean up the old file in storage.
    if (gem.certFileUrl) await deleteUploadedFile(gem.certFileUrl).catch(() => {});

    revalidatePath(`/admin/gems/${gemstoneId}`);
    revalidatePath("/admin/gems");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Upload failed." };
  }
}

export async function removeCertificateFile(gemstoneId: string): Promise<ActionResult> {
  await requireAdmin();

  const gem = await prisma.gemstone.findUnique({ where: { id: gemstoneId }, select: { certFileUrl: true } });
  if (!gem) return { ok: false, error: "Gemstone not found." };

  await prisma.gemstone.update({ where: { id: gemstoneId }, data: { certFileUrl: null } });

  if (gem.certFileUrl) await deleteUploadedFile(gem.certFileUrl).catch(() => {});

  revalidatePath(`/admin/gems/${gemstoneId}`);
  revalidatePath("/admin/gems");
  return { ok: true };
}

export async function createJewelry(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = jewelrySchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid jewelry data." };

  const data = parsed.data;
  const lk = data.market === "lk";
  const slug = await uniqueSlug(data.name, async (s) => !!(await prisma.jewelryPiece.findUnique({ where: { slug: s } })));

  const piece = await prisma.jewelryPiece.create({
    data: {
      slug,
      name: data.name,
      description: data.description || undefined,
      pieceType: data.pieceType,
      metalType: data.metalType,
      metalPurity: data.metalPurity || undefined,
      metalWeightG: data.metalWeightG,
      ringSize: data.ringSize || undefined,
      styleTags: data.styleTags ? data.styleTags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      market: data.market,
      // A listing is priced in its own store's currency only: a Sri Lanka
      // listing carries rupee prices (retail mandatory) and no dollar ones, an
      // international listing the reverse. costPrice is in that same currency.
      price: lk ? undefined : data.price,
      showPrice: lk ? false : data.showPrice,
      retailPrice: lk ? undefined : data.retailPrice,
      costPrice: data.costPrice,
      lkrRetailPrice: lk ? data.lkrRetailPrice : undefined,
      lkrPrice: lk ? data.lkrPrice : undefined,
      stockStatus: data.stockStatus,
      isPublished: data.isPublished,
      isFeatured: data.isFeatured,
    },
  });

  revalidatePath("/admin/jewelry");
  redirect(`/admin/jewelry/${piece.id}`);
}

export async function updateJewelry(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const existing = await prisma.jewelryPiece.findUnique({ where: { id }, select: { market: true } });
  if (!existing) return { ok: false, error: "Jewelry piece not found." };
  const parsed = jewelrySchema.safeParse({ ...formToObject(formData), market: existing.market });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid jewelry data." };

  const data = parsed.data;
  const lk = data.market === "lk";
  await prisma.jewelryPiece.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || undefined,
      pieceType: data.pieceType,
      metalType: data.metalType,
      metalPurity: data.metalPurity || undefined,
      metalWeightG: data.metalWeightG,
      ringSize: data.ringSize || undefined,
      styleTags: data.styleTags ? data.styleTags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      price: lk ? null : data.price,
      showPrice: lk ? false : data.showPrice,
      retailPrice: lk ? null : data.retailPrice,
      costPrice: data.costPrice,
      lkrRetailPrice: lk ? data.lkrRetailPrice : null,
      lkrPrice: lk ? data.lkrPrice : null,
      stockStatus: data.stockStatus,
      isPublished: data.isPublished,
      isFeatured: data.isFeatured,
    },
  });

  revalidatePath("/admin/jewelry");
  revalidatePath(`/admin/jewelry/${id}`);
  revalidatePath("/");
  revalidatePath("/lk");
  revalidateTag("home-featured", { expire: 0 });
  return { ok: true };
}

export async function deleteJewelry(id: string): Promise<ActionResult> {
  await requireAdmin();
  const jewelry = await prisma.jewelryPiece.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true, quoteRequests: true, auctions: true } } },
  });
  if (!jewelry) return { ok: false, error: "Jewelry piece not found." };
  const { orderItems, quoteRequests, auctions } = jewelry._count;
  if (orderItems > 0 || quoteRequests > 0 || auctions > 0) {
    return { ok: false, error: "This piece has order, quote, or auction history and can't be deleted — unpublish it instead." };
  }

  await prisma.jewelryPiece.delete({ where: { id } });
  revalidatePath("/admin/jewelry");
  revalidatePath("/");
  revalidatePath("/lk");
  revalidateTag("home-featured", { expire: 0 });
  return { ok: true };
}

// Quick per-row toggle on the admin jewelry list, mirroring
// toggleGemstoneFeatured above.
export async function toggleJewelryFeatured(id: string, featured: boolean): Promise<ActionResult> {
  await requireAdmin();
  await prisma.jewelryPiece.update({ where: { id }, data: { isFeatured: featured } });
  revalidatePath("/admin/jewelry");
  revalidatePath("/");
  revalidatePath("/lk");
  revalidateTag("home-featured", { expire: 0 });
  return { ok: true };
}

export async function linkGemstoneToJewelry(jewelryId: string, gemstoneId: string | null, freeformDesc: string | null): Promise<ActionResult> {
  await requireAdmin();
  if (!gemstoneId && !freeformDesc) return { ok: false, error: "Provide a gemstone or a description." };

  await prisma.jewelryGemstoneLink.create({
    data: { jewelryId, gemstoneId: gemstoneId || undefined, freeformDesc: freeformDesc || undefined },
  });

  revalidatePath(`/admin/jewelry/${jewelryId}`);
  return { ok: true };
}

export async function unlinkGemstoneFromJewelry(linkId: string, jewelryId: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.jewelryGemstoneLink.delete({ where: { id: linkId } });
  revalidatePath(`/admin/jewelry/${jewelryId}`);
  return { ok: true };
}

export type CatalogKind = "gemstone" | "jewelry";

/**
 * Bulk-publish or bulk-hide a batch of catalog items at once — e.g.
 * clearing a run of newly-sold items off the storefront without opening
 * each one's edit form. Never touches stockStatus/isFeatured; those keep
 * their own dedicated per-item controls (StockBadge, ToggleFeaturedButton
 * respectively), this is purely about storefront visibility.
 */
export async function bulkSetCatalogPublished(kind: CatalogKind, ids: string[], isPublished: boolean): Promise<ActionResult> {
  await requireAdmin();
  if (ids.length === 0) return { ok: false, error: "Nothing selected." };

  if (kind === "gemstone") {
    await prisma.gemstone.updateMany({ where: { id: { in: ids } }, data: { isPublished } });
    revalidatePath("/admin/gems");
  } else {
    await prisma.jewelryPiece.updateMany({ where: { id: { in: ids } }, data: { isPublished } });
    revalidatePath("/admin/jewelry");
  }
  revalidatePath("/");
  revalidatePath("/lk");
  revalidateTag("home-featured", { expire: 0 });
  return { ok: true };
}
