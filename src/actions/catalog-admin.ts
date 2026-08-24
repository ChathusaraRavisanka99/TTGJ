"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { slugify } from "@/lib/utils";
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
      certLab: data.certLab || undefined,
      certReportNumber: data.certReportNumber || undefined,
      certFileUrl: data.certFileUrl || undefined,
      stockStatus: data.stockStatus,
      isPublished: data.isPublished,
    },
  });

  revalidatePath("/admin/gems");
  redirect(`/admin/gems/${gem.id}`);
}

export async function updateGemstone(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = gemstoneSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid gemstone data." };

  const data = parsed.data;
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
      certLab: data.certLab || undefined,
      certReportNumber: data.certReportNumber || undefined,
      certFileUrl: data.certFileUrl || undefined,
      stockStatus: data.stockStatus,
      isPublished: data.isPublished,
    },
  });

  revalidatePath("/admin/gems");
  revalidatePath(`/admin/gems/${id}`);
  return { ok: true };
}

export async function deleteGemstone(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.gemstone.delete({ where: { id } });
  revalidatePath("/admin/gems");
  return { ok: true };
}

export async function createJewelry(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = jewelrySchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid jewelry data." };

  const data = parsed.data;
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
      stockStatus: data.stockStatus,
      isPublished: data.isPublished,
    },
  });

  revalidatePath("/admin/jewelry");
  redirect(`/admin/jewelry/${piece.id}`);
}

export async function updateJewelry(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = jewelrySchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid jewelry data." };

  const data = parsed.data;
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
      stockStatus: data.stockStatus,
      isPublished: data.isPublished,
    },
  });

  revalidatePath("/admin/jewelry");
  revalidatePath(`/admin/jewelry/${id}`);
  return { ok: true };
}

export async function deleteJewelry(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.jewelryPiece.delete({ where: { id } });
  revalidatePath("/admin/jewelry");
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
