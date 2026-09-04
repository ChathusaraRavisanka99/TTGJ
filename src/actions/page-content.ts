"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/rbac";
import { saveUploadedMedia } from "@/lib/media";
import { getPageContent, savePageContent, getSeasonalContent, DEFAULT_HOME_CONTENT } from "@/lib/page-content";
import { aboutRowsSchema, type AboutRow } from "@/lib/about-blocks";
import { SEASONAL_THEME_KEYS, type SeasonalThemeKey } from "@/lib/seasonal-themes";
import type { ActionResult } from "./auth";

function obj(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

async function saveImageField<T extends object>(
  page: string,
  defaults: T,
  field: keyof T,
  file: File | null,
): Promise<ActionResult> {
  await requireAdmin();
  if (!file || file.size === 0) return { ok: false, error: "No file provided." };
  try {
    const saved = await saveUploadedMedia(file);
    if (saved.type !== "IMAGE") return { ok: false, error: "Please upload an image file." };
    const current = await getPageContent(page, defaults);
    await savePageContent(page, { ...current, [field]: saved.url });
    revalidatePath(page === "home" ? "/" : `/${page}`);
    revalidatePath(`/admin/content/${page}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Upload failed." };
  }
}

// ---------- Home ----------

const homeTextSchema = z.object({
  heroKicker: z.string().max(200),
  heroHeadingLine1: z.string().max(200),
  heroHeadingLine2: z.string().max(200),
  heroHeadingHighlight: z.string().max(200),
  heroSubtext: z.string().max(1000),
  heritageKicker: z.string().max(100),
  heritageHeading: z.string().max(300),
  heritageBody: z.string().max(2000),
  sourcingKicker: z.string().max(100),
  sourcingHeading: z.string().max(300),
  sourcingBody: z.string().max(2000),
  editorialQuote: z.string().max(500),
  editorialQuoteHighlight: z.string().max(200),
  editorialAttribution: z.string().max(200),
  closingKicker: z.string().max(200),
  closingHeading: z.string().max(300),
  closingBody: z.string().max(1000),
  showFeaturedGems: z.coerce.boolean().default(false),
  showFeaturedJewelry: z.coerce.boolean().default(false),
});

export async function updateHomeText(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = homeTextSchema.safeParse(obj(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid content." };

  const current = await getPageContent("home", DEFAULT_HOME_CONTENT);
  await savePageContent("home", { ...current, ...parsed.data });
  revalidatePath("/");
  revalidatePath("/admin/content/home");
  return { ok: true };
}

export async function setHomeImage(field: "heritageImage" | "sourcingImage", formData: FormData): Promise<ActionResult> {
  return saveImageField("home", DEFAULT_HOME_CONTENT, field, formData.get("file") as File | null);
}

export async function addHeroSlide(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const file = formData.get("file") as File | null;
  const alt = ((formData.get("alt") as string | null) ?? "").slice(0, 200);
  if (!file || file.size === 0) return { ok: false, error: "No file provided." };

  try {
    const saved = await saveUploadedMedia(file);
    if (saved.type !== "IMAGE") return { ok: false, error: "Please upload an image file." };
    const current = await getPageContent("home", DEFAULT_HOME_CONTENT);
    const heroSlides = [...current.heroSlides, { src: saved.url, alt }];
    await savePageContent("home", { ...current, heroSlides });
    revalidatePath("/");
    revalidatePath("/admin/content/home");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Upload failed." };
  }
}

export async function replaceHeroSlideImage(index: number, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "No file provided." };

  try {
    const saved = await saveUploadedMedia(file);
    if (saved.type !== "IMAGE") return { ok: false, error: "Please upload an image file." };
    const current = await getPageContent("home", DEFAULT_HOME_CONTENT);
    if (index < 0 || index >= current.heroSlides.length) return { ok: false, error: "Slide not found." };
    const heroSlides = current.heroSlides.map((s, i) => (i === index ? { ...s, src: saved.url } : s));
    await savePageContent("home", { ...current, heroSlides });
    revalidatePath("/");
    revalidatePath("/admin/content/home");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Upload failed." };
  }
}

export async function updateHeroSlideAlt(index: number, alt: string): Promise<ActionResult> {
  await requireAdmin();
  const current = await getPageContent("home", DEFAULT_HOME_CONTENT);
  if (index < 0 || index >= current.heroSlides.length) return { ok: false, error: "Slide not found." };
  const heroSlides = current.heroSlides.map((s, i) => (i === index ? { ...s, alt: alt.slice(0, 200) } : s));
  await savePageContent("home", { ...current, heroSlides });
  revalidatePath("/");
  return { ok: true };
}

export async function updateHeroSlideFocus(index: number, focusX: number): Promise<ActionResult> {
  await requireAdmin();
  const current = await getPageContent("home", DEFAULT_HOME_CONTENT);
  if (index < 0 || index >= current.heroSlides.length) return { ok: false, error: "Slide not found." };
  const clamped = Math.min(100, Math.max(0, Math.round(focusX)));
  const heroSlides = current.heroSlides.map((s, i) => (i === index ? { ...s, focusX: clamped } : s));
  await savePageContent("home", { ...current, heroSlides });
  revalidatePath("/");
  return { ok: true };
}

export async function removeHeroSlide(index: number): Promise<ActionResult> {
  await requireAdmin();
  const current = await getPageContent("home", DEFAULT_HOME_CONTENT);
  if (current.heroSlides.length <= 1) return { ok: false, error: "Keep at least one hero slide." };
  if (index < 0 || index >= current.heroSlides.length) return { ok: false, error: "Slide not found." };
  const heroSlides = current.heroSlides.filter((_, i) => i !== index);
  await savePageContent("home", { ...current, heroSlides });
  revalidatePath("/");
  revalidatePath("/admin/content/home");
  return { ok: true };
}

// ---------- About (block-based page builder) ----------

export async function updateAboutRows(rows: AboutRow[]): Promise<ActionResult> {
  await requireAdmin();
  const parsed = aboutRowsSchema.safeParse(rows);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid content." };

  await savePageContent("about", { rows: parsed.data } satisfies { rows: AboutRow[] });
  revalidatePath("/about");
  revalidatePath("/admin/content/about");
  return { ok: true };
}

export async function uploadAboutBlockImage(formData: FormData): Promise<ActionResult & { url?: string }> {
  await requireAdmin();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "No file provided." };
  try {
    const saved = await saveUploadedMedia(file);
    if (saved.type !== "IMAGE") return { ok: false, error: "Please upload an image file." };
    return { ok: true, url: saved.url };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Upload failed." };
  }
}

// ---------- Cart (wire transfer instructions) ----------

export async function updateCartContent(wireTransferInstructions: string): Promise<ActionResult> {
  await requireAdmin();
  const trimmed = wireTransferInstructions.trim();
  if (!trimmed) return { ok: false, error: "Instructions can't be empty." };
  if (trimmed.length > 2000) return { ok: false, error: "Keep it under 2000 characters." };

  await savePageContent("cart", { wireTransferInstructions: trimmed });
  revalidatePath("/account/cart");
  revalidatePath("/admin/carts");
  return { ok: true };
}

// ---------- Seasonal promotions page ----------

const seasonalThemeCopySchema = z.object({
  kicker: z.string().max(100),
  heading: z.string().max(200),
  body: z.string().max(1000),
  ctaLabel: z.string().max(50),
  ctaHref: z.string().max(300),
});

// Each theme is saved independently — an admin editing Winter's copy
// shouldn't need to also resubmit Spring's, and a stale form for one
// theme can't clobber another's already-saved edits the way one big
// "all 5 themes" form would if two admins (or two tabs) saved at once.
export async function updateSeasonalThemeCopy(theme: SeasonalThemeKey, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  if (!SEASONAL_THEME_KEYS.includes(theme)) return { ok: false, error: "Unknown theme." };
  const parsed = seasonalThemeCopySchema.safeParse(obj(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid content." };

  const current = await getSeasonalContent();
  await savePageContent("seasonal", { ...current, themes: { ...current.themes, [theme]: parsed.data } });
  revalidatePath("/promotions");
  revalidatePath("/admin/promotions");
  return { ok: true };
}

// Which of the 5 predefined themes is currently showing on the live
// page — distinct from editing a theme's copy above, same as picking
// which slide is active versus editing a slide.
export async function setActiveSeasonalTheme(theme: SeasonalThemeKey): Promise<ActionResult> {
  await requireAdmin();
  if (!SEASONAL_THEME_KEYS.includes(theme)) return { ok: false, error: "Unknown theme." };

  const current = await getSeasonalContent();
  await savePageContent("seasonal", { ...current, activeTheme: theme });
  revalidatePath("/promotions");
  revalidatePath("/admin/promotions");
  return { ok: true };
}
