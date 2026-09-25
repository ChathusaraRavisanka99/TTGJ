import { prisma } from "@/lib/prisma";
import { inspectDirectUpload } from "@/lib/media";

// A product's gallery is an ordered list; "the first image" is simply
// position 0. The storefront cards read the isPrimary flag and the product
// page reads the sort order, so every write here keeps the two in step:
// isPrimary is true on exactly the item at sortOrder 0.

export type MediaOwner = { gemstoneId: string } | { jewelryId: string };

export interface DraftMediaItem {
  key: string;
  altText?: string;
}

/** Writes an explicit order: index becomes sortOrder, index 0 becomes primary. */
export async function applyMediaOrder(orderedIds: string[]): Promise<void> {
  await prisma.$transaction(orderedIds.map((id, index) => prisma.mediaAsset.update({ where: { id }, data: { sortOrder: index, isPrimary: index === 0 } })));
}

/** Re-sequences whatever is there (after a delete, say) so there are no gaps
 * and the first item is primary. */
export async function normalizeMediaOrder(owner: MediaOwner): Promise<void> {
  const items = await prisma.mediaAsset.findMany({ where: owner, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true } });
  await applyMediaOrder(items.map((i) => i.id));
}

/** True when `orderedIds` is exactly the same set as `existingIds` (no
 * missing, extra or repeated ids) — a client can't drop or inject an asset by
 * sending a partial or foreign list. */
export function isCompleteOrder(orderedIds: string[], existingIds: string[]): boolean {
  if (orderedIds.length !== existingIds.length) return false;
  const existing = new Set(existingIds);
  const seen = new Set<string>();
  for (const id of orderedIds) {
    if (!existing.has(id) || seen.has(id)) return false;
    seen.add(id);
  }
  return true;
}

/** Reads the create forms' `mediaKeys` field: a JSON list of files already
 * uploaded straight to storage, in the order the admin arranged them. Anything
 * malformed is ignored rather than failing the whole save. */
export function parseDraftMedia(raw: unknown): DraftMediaItem[] {
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is { key: string; altText?: unknown } => !!x && typeof x === "object" && typeof (x as { key?: unknown }).key === "string")
      .slice(0, 30)
      .map((x) => ({ key: x.key.slice(0, 200), altText: typeof x.altText === "string" ? x.altText.slice(0, 200) : undefined }));
  } catch {
    return [];
  }
}

/** Attaches files that were uploaded before the item existed, in order, as its
 * first gallery. A file that fails its storage check is skipped (the item is
 * already saved; the rest still attach and the first one that does is primary). */
export async function attachDraftMedia(owner: MediaOwner, items: DraftMediaItem[], defaultAlt: string): Promise<number> {
  let index = 0;
  for (const item of items) {
    try {
      const saved = await inspectDirectUpload(item.key);
      await prisma.mediaAsset.create({
        data: { url: saved.url, type: saved.type, altText: (item.altText || defaultAlt).slice(0, 200), isPrimary: index === 0, sortOrder: index, ...owner },
      });
      index += 1;
    } catch {
      // skip a file that never finished uploading
    }
  }
  return index;
}
