"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { saveUploadedMedia } from "@/lib/media";
import { saveOriginContent } from "@/lib/origin-content";
import type { ActionResult } from "./auth";

const originContentTextSchema = z.object({
  headline: z.string().max(200),
  body: z.string().max(2000),
  imageAlt: z.string().max(200),
});

function revalidateOrigin(originId: string) {
  revalidatePath(`/admin/master-data/origins/${originId}`);
  // Cheap and safe to revalidate broadly rather than tracking exactly
  // which product pages reference this origin — the same trade-off
  // page-content.ts's own revalidateHome makes.
  revalidatePath("/gems", "layout");
}

export async function updateOriginContentText(originId: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  await prisma.origin.findUniqueOrThrow({ where: { id: originId } });

  const parsed = originContentTextSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid content." };

  await saveOriginContent(originId, parsed.data);
  revalidateOrigin(originId);
  return { ok: true };
}

export async function setOriginContentImage(originId: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  await prisma.origin.findUniqueOrThrow({ where: { id: originId } });

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "No file provided." };

  try {
    const saved = await saveUploadedMedia(file);
    if (saved.type !== "IMAGE") return { ok: false, error: "Please upload an image file." };
    await saveOriginContent(originId, { image: saved.url });
    revalidateOrigin(originId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Upload failed." };
  }
}
