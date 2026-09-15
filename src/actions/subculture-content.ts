"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/rbac";
import { saveUploadedMedia } from "@/lib/media";
import {
  getSubcultureContent,
  getAllSubcultureContent,
  saveSubcultureContent,
  subcultureLabel,
  SLUG_PATTERN,
  type SubcultureContent,
  type SubcultureImage,
} from "@/lib/subculture-content";
import { SUBCULTURE_KEYS, isSubcultureKey, type SubcultureKey } from "@/lib/subculture-collections";
import type { ActionResult } from "./auth";

function obj(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

// Revalidates whatever URL this collection is *currently* reachable at
// (its saved urlSlug, not the fixed internal key — see SubcultureContent.
// urlSlug's own doc comment) — always re-read fresh rather than trusted
// from a caller's stale copy, so a save right after a slug rename still
// invalidates the correct, current path.
async function revalidateCollection(key: SubcultureKey) {
  const content = await getSubcultureContent(key);
  revalidatePath(`/collections/${content.urlSlug}`);
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
  await revalidateCollection(key);
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
    await revalidateCollection(key);
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
    await revalidateCollection(key);
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
  await revalidateCollection(key);
  return { ok: true };
}

// ---------- Public URL slug ----------

export async function updateSubcultureSlug(key: SubcultureKey, rawSlug: string): Promise<ActionResult> {
  await requireAdmin();
  if (!isSubcultureKey(key)) return { ok: false, error: "Unknown collection." };

  const slug = rawSlug.trim().toLowerCase();
  if (slug.length === 0) return { ok: false, error: "The URL slug can't be empty." };
  if (slug.length > 80) return { ok: false, error: "Keep the URL slug under 80 characters." };
  if (!SLUG_PATTERN.test(slug)) return { ok: false, error: "Use only lowercase letters, numbers, and hyphens (e.g. goth-dark-romantic)." };

  const all = await getAllSubcultureContent();
  const takenBy = SUBCULTURE_KEYS.find((other) => other !== key && all[other].urlSlug === slug);
  if (takenBy) return { ok: false, error: `That URL is already used by ${subcultureLabel(takenBy)}.` };

  const oldSlug = all[key].urlSlug;
  await saveSubcultureContent(key, { urlSlug: slug });

  // The rename takes effect immediately — the route resolves whichever
  // collection currently owns a slug on every request (see
  // resolveCollectionKeyBySlug), so revalidating here is about cache
  // freshness, not correctness. Both the old (now 404ing) and new path
  // need invalidating, plus the sitemap, which lists live collections by
  // their current slug.
  revalidatePath(`/collections/${oldSlug}`);
  revalidatePath(`/collections/${slug}`);
  revalidatePath("/admin/alt-collections");
  revalidatePath("/sitemap.xml");
  return { ok: true };
}
