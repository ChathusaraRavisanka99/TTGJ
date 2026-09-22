"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { looksLikePriceOffer } from "@/lib/moderation";
import { saveUploadedMedia } from "@/lib/media";
import { customJewelryRequestSchema, quoteRequestSchema, sourcingRequestSchema, type ConfiguredSpec } from "@/lib/validation/quote";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ActionResult } from "./auth";

// Shared per-user cap across all three submission kinds below — a scripted
// flood through any one of them is equally unwanted, and the custom-design
// form's file uploads make it also a storage-flood vector specifically.
async function checkSubmissionRateLimit(userId: string): Promise<ActionResult | null> {
  const limit = await checkRateLimit(`submit-request:${userId}`, { limit: 10, windowSeconds: 60 * 60 });
  if (limit.allowed) return null;
  return { ok: false, error: "You've submitted a lot of requests recently — please wait a while before submitting another." };
}

const MAX_CUSTOM_REQUEST_IMAGES = 5;

export async function submitQuoteRequest(input: {
  gemstoneId?: string;
  jewelryId?: string;
  configuredSpec?: ConfiguredSpec;
  quantity?: number;
  note?: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: "Please sign in to request a quote." };
  }
  const limited = await checkSubmissionRateLimit(session.user.id);
  if (limited) return limited;

  const parsed = quoteRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid quote request" };
  }

  const { gemstoneId, jewelryId, configuredSpec, quantity, note } = parsed.data;

  await prisma.quoteRequest.create({
    data: {
      userId: session.user.id,
      gemstoneId: gemstoneId || undefined,
      jewelryId: jewelryId || undefined,
      productType: gemstoneId ? "GEMSTONE" : jewelryId ? "JEWELRY" : undefined,
      configuredSpec: configuredSpec ? JSON.parse(JSON.stringify(configuredSpec)) : undefined,
      quantity: quantity ?? 1,
      note: note || undefined,
      noteFlaggedForPrice: looksLikePriceOffer(note),
    },
  });

  revalidatePath("/account/quotes");
  return { ok: true };
}

// Free-form "commission a custom piece" request from a subculture
// collection page (src/components/collections/CustomJewelryRequestForm.tsx)
// — no existing catalog item or configurator spec, just a description plus
// optional reference photos. Reuses QuoteRequest (productType CUSTOM)
// rather than a separate model so it flows through the exact same admin
// review / chat / accept-into-cart pipeline every other quote already
// does; see QuoteRequest.referenceImages in the schema.
export async function submitCustomJewelryRequest(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: "Please sign in to submit a custom design request." };
  }
  const limited = await checkSubmissionRateLimit(session.user.id);
  if (limited) return limited;

  const parsed = customJewelryRequestSchema.safeParse({
    description: formData.get("description"),
    collectionLabel: formData.get("collectionLabel") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" };
  }

  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_CUSTOM_REQUEST_IMAGES) {
    return { ok: false, error: `Please attach at most ${MAX_CUSTOM_REQUEST_IMAGES} images.` };
  }

  let referenceImages: string[] = [];
  try {
    const uploaded = await Promise.all(files.map((file) => saveUploadedMedia(file)));
    referenceImages = uploaded.map((u) => u.url);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not upload one of the images." };
  }

  const { description, collectionLabel } = parsed.data;
  const note = collectionLabel ? `Inspired by the ${collectionLabel} collection.\n\n${description}` : description;

  await prisma.quoteRequest.create({
    data: {
      userId: session.user.id,
      productType: "CUSTOM",
      note,
      noteFlaggedForPrice: looksLikePriceOffer(description),
      referenceImages: referenceImages.length ? referenceImages : undefined,
    },
  });

  revalidatePath("/account/quotes");
  return { ok: true };
}

export async function submitSourcingRequest(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: "Please sign in to submit a sourcing request." };
  }
  const limited = await checkSubmissionRateLimit(session.user.id);
  if (limited) return limited;

  const raw = {
    mineralDescription: formData.get("mineralDescription"),
    approxSize: formData.get("approxSize") ?? "",
    approxCut: formData.get("approxCut") ?? "",
    approxColor: formData.get("approxColor") ?? "",
    notes: formData.get("notes") ?? "",
  };

  const parsed = sourcingRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid sourcing request" };
  }

  const { mineralDescription, approxSize, approxCut, approxColor, notes } = parsed.data;

  await prisma.sourcingRequest.create({
    data: {
      userId: session.user.id,
      mineralDescription,
      approxSize: approxSize || undefined,
      approxCut: approxCut || undefined,
      approxColor: approxColor || undefined,
      notes: notes || undefined,
      noteFlaggedForPrice: looksLikePriceOffer(notes),
    },
  });

  revalidatePath("/account/sourcing");
  return { ok: true };
}
