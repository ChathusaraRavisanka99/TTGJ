"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireStaffArea, requireMarketAccess } from "@/lib/rbac";
import { deleteUploadedFile, createDirectUpload, inspectDirectUpload } from "@/lib/media";
import { applyMediaOrder, normalizeMediaOrder, isCompleteOrder } from "@/lib/media-gallery";
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
  // Closes the gap, and if it was the first image the next one takes over.
  const owner = media.gemstoneId ? { gemstoneId: media.gemstoneId } : media.jewelryId ? { jewelryId: media.jewelryId } : null;
  if (owner) await normalizeMediaOrder(owner);

  // Best-effort: some MediaAsset rows point at seeded /images/... static
  // assets rather than an uploaded file, so there's nothing to remove from
  // the bucket for those — deleteUploadedFile no-ops harmlessly either way.
  await deleteUploadedFile(media.url).catch(() => {});

  revalidatePath("/admin/media");
  return { ok: true };
}

// Which product a media asset belongs to, and the store that product is in —
// the caller's market scope is checked against the product, never a client value.
async function loadOwner(user: { role: string; staffMarketScope: string | null }, owner: { gemstoneId?: string; jewelryId?: string }) {
  if (!owner.gemstoneId === !owner.jewelryId) return { ok: false as const, error: "Missing product reference." };
  const product = owner.gemstoneId
    ? await prisma.gemstone.findUnique({ where: { id: owner.gemstoneId }, select: { market: true } })
    : await prisma.jewelryPiece.findUnique({ where: { id: owner.jewelryId! }, select: { market: true } });
  if (!product) return { ok: false as const, error: "Product not found." };
  await requireMarketAccess(user, product.market);
  return { ok: true as const, where: owner.gemstoneId ? { gemstoneId: owner.gemstoneId } : { jewelryId: owner.jewelryId! } };
}

function revalidateGallery(owner: { gemstoneId?: string; jewelryId?: string }) {
  revalidatePath("/admin/media");
  if (owner.gemstoneId) revalidatePath(`/admin/gems/${owner.gemstoneId}`);
  if (owner.jewelryId) revalidatePath(`/admin/jewelry/${owner.jewelryId}`);
  revalidatePath("/gems", "layout");
  revalidatePath("/jewelry", "layout");
  revalidatePath("/");
  revalidatePath("/lk");
}

/** Sets the whole gallery order. `orderedIds` must be exactly the product's
 * current media (a permutation) — the first becomes the primary image. */
export async function reorderProductMedia(input: { gemstoneId?: string; jewelryId?: string; orderedIds: string[] }): Promise<ActionResult> {
  const user = await requireStaffArea("catalog");
  const found = await loadOwner(user, input);
  if (!found.ok) return found;

  const existing = await prisma.mediaAsset.findMany({ where: found.where, select: { id: true } });
  if (!isCompleteOrder(input.orderedIds, existing.map((m) => m.id))) {
    return { ok: false, error: "The gallery changed while you were arranging it — reload and try again." };
  }

  await applyMediaOrder(input.orderedIds);
  revalidateGallery(input);
  return { ok: true };
}

/** Makes one image the first (primary) one, keeping the rest in their order. */
export async function setPrimaryMedia(mediaId: string): Promise<ActionResult> {
  const user = await requireStaffArea("catalog");

  const media = await prisma.mediaAsset.findUnique({ where: { id: mediaId }, select: { gemstoneId: true, jewelryId: true } });
  if (!media) return { ok: false, error: "Media not found." };
  const found = await loadOwner(user, { gemstoneId: media.gemstoneId ?? undefined, jewelryId: media.jewelryId ?? undefined });
  if (!found.ok) return found;

  const siblings = await prisma.mediaAsset.findMany({ where: found.where, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true } });
  await applyMediaOrder([mediaId, ...siblings.map((m) => m.id).filter((id) => id !== mediaId)]);

  revalidateGallery({ gemstoneId: media.gemstoneId ?? undefined, jewelryId: media.jewelryId ?? undefined });
  return { ok: true };
}
