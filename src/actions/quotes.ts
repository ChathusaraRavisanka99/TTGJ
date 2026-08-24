"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { looksLikePriceOffer } from "@/lib/moderation";
import { quoteRequestSchema, sourcingRequestSchema, type ConfiguredSpec } from "@/lib/validation/quote";
import type { ActionResult } from "./auth";

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
