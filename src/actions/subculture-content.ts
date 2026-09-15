"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/rbac";
import { saveUploadedMedia } from "@/lib/media";
import { getSubcultureContent, saveSubcultureContent, type SubcultureContent, type SubcultureImage } from "@/lib/subculture-content";
import { isSubcultureKey, type SubcultureKey } from "@/lib/subculture-collections";
import type { ActionResult } from "./auth";

function obj(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function revalidateCollection(key: SubcultureKey) {
  revalidatePath(`/collections/${key}`);
  revalidatePath("/admin/alt-collections");
}

const textSchema = z.object({
  heroKicker: z.string().max(100),
  heroHeading: z.string().max(200),
  heroSubtext: z.string().max(600),
  heroCtaLabel: z.string().max(50),
  introKicker: z.string().max(100),
  introHeading: z.string().max(200),
  introBody: z.string().max(2000),
  crossLinkBlurb: z.string().max(200),
  seoTitle: z.string().max(200),
  seoDescription: z.string().max(400),
});

export async function updateSubcultureText(key: SubcultureKey, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  if (!isSubcultureKey(key)) return { ok: false, error: "Unknown collection." };
  const parsed = textSchema.safeParse(obj(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid content." };

  await saveSubcultureContent(key, parsed.data);
  revalidateCollection(key);
  return { ok: true };
}

const SINGLE_IMAGE_FIELDS = ["heroImage", "heroImageMobile", "backgroundImage", "ogImage"] as const;
type SingleImageField = (typeof SINGLE_IMAGE_FIELDS)[number];

export async function setSubcultureImage(key: SubcultureKey, field: SingleImageField, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  if (!isSubcultureKey(key)) return { ok: false, error: "Unknown collection." };
  if (!SINGLE_IMAGE_FIELDS.includes(field)) return { ok: false, error: "Unknown image field." };
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "No file provided." };

  try {
    const saved = await saveUploadedMedia(file);
    if (saved.type !== "IMAGE") return { ok: false, error: "Please upload an image file." };
    await saveSubcultureContent(key, { [field]: saved.url } as Partial<SubcultureContent>);
    revalidateCollection(key);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Upload failed." };
  }
}

const GALLERY_FIELDS = ["bannerImages", "lifestyleImages"] as const;
type GalleryField = (typeof GALLERY_FIELDS)[number];

export async function addSubcultureGalleryImage(key: SubcultureKey, field: GalleryField, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  if (!isSubcultureKey(key)) return { ok: false, error: "Unknown collection." };
  if (!GALLERY_FIELDS.includes(field)) return { ok: false, error: "Unknown gallery." };
  const file = formData.get("file") as File | null;
  const alt = ((formData.get("alt") as string | null) ?? "").slice(0, 200);
  if (!file || file.size === 0) return { ok: false, error: "No file provided." };

  try {
    const saved = await saveUploadedMedia(file);
    if (saved.type !== "IMAGE") return { ok: false, error: "Please upload an image file." };
    const current = await getSubcultureContent(key);
    const gallery: SubcultureImage[] = [...current[field], { src: saved.url, alt }];
    await saveSubcultureContent(key, { [field]: gallery } as Partial<SubcultureContent>);
    revalidateCollection(key);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Upload failed." };
  }
}

export async function removeSubcultureGalleryImage(key: SubcultureKey, field: GalleryField, index: number): Promise<ActionResult> {
  await requireAdmin();
  if (!isSubcultureKey(key)) return { ok: false, error: "Unknown collection." };
  if (!GALLERY_FIELDS.includes(field)) return { ok: false, error: "Unknown gallery." };

  const current = await getSubcultureContent(key);
  const gallery = current[field];
  if (index < 0 || index >= gallery.length) return { ok: false, error: "Image not found." };
  await saveSubcultureContent(key, { [field]: gallery.filter((_, i) => i !== index) } as Partial<SubcultureContent>);
  revalidateCollection(key);
  return { ok: true };
}
