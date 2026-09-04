"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { saveUploadedMedia, deleteUploadedFile } from "@/lib/media";
import type { ActionResult } from "./auth";

export async function uploadProductMedia(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const file = formData.get("file") as File | null;
  const gemstoneId = formData.get("gemstoneId") as string | null;
  const jewelryId = formData.get("jewelryId") as string | null;
  const altText = (formData.get("altText") as string | null) ?? "";

  if (!file || file.size === 0) return { ok: false, error: "No file provided." };
  if (!gemstoneId && !jewelryId) return { ok: false, error: "Missing product reference." };

  try {
    const saved = await saveUploadedMedia(file);

    const existingCount = await prisma.mediaAsset.count({
      where: gemstoneId ? { gemstoneId } : { jewelryId },
    });

    await prisma.mediaAsset.create({
      data: {
        url: saved.url,
        type: saved.type,
        altText: altText || undefined,
        isPrimary: existingCount === 0,
        sortOrder: existingCount,
        gemstoneId: gemstoneId || undefined,
        jewelryId: jewelryId || undefined,
      },
    });

    revalidatePath("/admin/media");
    if (gemstoneId) revalidatePath(`/admin/gems/${gemstoneId}`);
    if (jewelryId) revalidatePath(`/admin/jewelry/${jewelryId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Upload failed." };
  }
}

export async function deleteProductMedia(mediaId: string): Promise<ActionResult> {
  await requireAdmin();

  const media = await prisma.mediaAsset.findUnique({ where: { id: mediaId } });
  if (!media) return { ok: false, error: "Media not found." };

  await prisma.mediaAsset.delete({ where: { id: mediaId } });

  // Best-effort: some MediaAsset rows point at seeded /images/... static
  // assets rather than an uploaded file, so there's nothing to remove from
  // the bucket for those — deleteUploadedFile no-ops harmlessly either way.
  await deleteUploadedFile(media.url).catch(() => {});

  revalidatePath("/admin/media");
  return { ok: true };
}

export async function setPrimaryMedia(mediaId: string): Promise<ActionResult> {
  await requireAdmin();

  const media = await prisma.mediaAsset.findUnique({ where: { id: mediaId } });
  if (!media) return { ok: false, error: "Media not found." };

  await prisma.$transaction([
    prisma.mediaAsset.updateMany({
      where: media.gemstoneId ? { gemstoneId: media.gemstoneId } : { jewelryId: media.jewelryId },
      data: { isPrimary: false },
    }),
    prisma.mediaAsset.update({ where: { id: mediaId }, data: { isPrimary: true } }),
  ]);

  revalidatePath("/admin/media");
  return { ok: true };
}
