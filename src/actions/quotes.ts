"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { looksLikePriceOffer } from "@/lib/moderation";
import { saveUploadedMedia } from "@/lib/media";
import { customJewelryRequestSchema, quoteRequestSchema, sourcingRequestSchema, type ConfiguredSpec } from "@/lib/validation/quote";
import type { ActionResult } from "./auth";

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
