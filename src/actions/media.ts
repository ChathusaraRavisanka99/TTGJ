"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireStaffArea, requireMarketAccess } from "@/lib/rbac";
import { deleteUploadedFile, createDirectUpload, inspectDirectUpload } from "@/lib/media";
import type { ActionResult } from "./auth";

// Step 1 of a product photo/video upload: hands back a short-lived signed
// URL the browser PUTs the file to directly — see lib/media.ts's
// "Direct-to-storage uploads" comment for why the file itself doesn't go
// through a Server Action.
export async function requestProductMediaUpload(input: {
  contentType: string;
  size: number;
}): Promise<{ ok: true; key: string; uploadUrl: string } | { ok: false; error: string }> {
  await requireStaffArea("catalog");
  try {
    const { key, uploadUrl } = await createDirectUpload(input.contentType, input.size);
    return { ok: true, key, uploadUrl };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not start the upload." };
  }
}

// Step 2: after the browser's PUT succeeds, verify the object exists and
// attach it to the product.
export async function registerProductMedia(input: {
  key: string;
  gemstoneId?: string;
  jewelryId?: string;
  altText?: string;
}): Promise<ActionResult> {
  const user = await requireStaffArea("catalog");

  const { gemstoneId, jewelryId } = input;
  const altText = (input.altText ?? "").slice(0, 200);
  if (!gemstoneId && !jewelryId) return { ok: false, error: "Missing product reference." };

  const target = gemstoneId
    ? await prisma.gemstone.findUnique({ where: { id: gemstoneId }, select: { market: true } })
    : await prisma.jewelryPiece.findUnique({ where: { id: jewelryId! }, select: { market: true } });
  if (!target) return { ok: false, error: "Product not found." };
  await requireMarketAccess(user, target.market);

  try {
    const saved = await inspectDirectUpload(input.key);

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
  const user = await requireStaffArea("catalog");

  const media = await prisma.mediaAsset.findUnique({
    where: { id: mediaId },
    include: { gemstone: { select: { market: true } }, jewelry: { select: { market: true } } },
  });
  if (!media) return { ok: false, error: "Media not found." };
  const market = media.gemstone?.market ?? media.jewelry?.market;
  if (!market) return { ok: false, error: "Media not found." };
  await requireMarketAccess(user, market);

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
