"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { registerProductMedia, deleteProductMedia, reorderProductMedia } from "@/actions/media";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { MEDIA_ACCEPT, uploadProductFile } from "@/lib/client-media-upload";
import { SortableMediaGrid } from "@/components/admin/SortableMediaGrid";

interface MediaItem {
  id: string;
  url: string;
  type: string;
  altText: string | null;
  isPrimary: boolean;
}

/** The photos and videos of a saved gem or piece: upload more, drag (or use
 * the arrows) to arrange them, and make any one the first image — the one
 * shown on the catalog and as the product's main photo. */
export function MediaManager({ media, gemstoneId, jewelryId, canDelete = true }: { media: MediaItem[]; gemstoneId?: string; jewelryId?: string; canDelete?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const altInput = useRef<HTMLInputElement>(null);

  // The order the admin just arranged, shown at once while it saves. It is
  // only trusted for the exact set of images it was made against, so the
  // moment fresh data arrives from the server (a different order, or files
  // added or removed) it stops applying by itself.
  const signature = media.map((m) => m.id).join(",");
  const [arranged, setArranged] = useState<{ signature: string; ids: string[] } | null>(null);
  const byId = new Map(media.map((m) => [m.id, m]));
  const shown = arranged && arranged.signature === signature ? arranged.ids.map((id) => byId.get(id)).filter((m): m is MediaItem => !!m) : media;

  async function handleReorder(orderedIds: string[]) {
    setError(null);
    setArranged({ signature, ids: orderedIds });
    setSaving(true);
    const result = await reorderProductMedia({ gemstoneId, jewelryId, orderedIds });
    setSaving(false);
    if (!result.ok) {
      setArranged(null);
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleRemove(id: string) {
    setError(null);
    setSaving(true);
    const result = await deleteProductMedia(id);
    setSaving(false);
    if (!result.ok) setError(result.error);
    router.refresh();
  }

  async function handleUpload() {
    const files = Array.from(fileInput.current?.files ?? []);
    if (files.length === 0) return;
    setError(null);
    setUploading(true);
    const altText = altInput.current?.value ?? "";
    const failures: string[] = [];
    for (const [i, file] of files.entries()) {
      try {
        const { key } = await uploadProductFile(file, setStatus, files.length > 1 ? `(${i + 1}/${files.length})` : "");
        const registered = await registerProductMedia({ key, gemstoneId, jewelryId, altText });
        if (!registered.ok) throw new Error(`${file.name}: ${registered.error}`);
      } catch (e) {
        failures.push(e instanceof Error ? e.message : `${file.name}: upload failed.`);
      }
    }
    setUploading(false);
    setStatus(null);
    if (failures.length) setError(failures.join(" "));
    if (fileInput.current) fileInput.current.value = "";
    if (altInput.current) altInput.current.value = "";
    router.refresh();
  }

  return (
    <div>
      <SortableMediaGrid items={shown} onReorder={handleReorder} onRemove={canDelete ? handleRemove : undefined} disabled={saving || uploading} />

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="media-file">Add photos or videos</Label>
          <input id="media-file" ref={fileInput} type="file" multiple accept={MEDIA_ACCEPT} className="text-sm" />
        </div>
        <div>
          <Label htmlFor="media-alt">Alt text</Label>
          <Input id="media-alt" ref={altInput} placeholder="Describe the image for screen readers" className="w-64" />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleUpload} disabled={saving || uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-charcoal/65">
        Drag photos to arrange them, or use the arrows; the star makes a photo the first one, which is the main image on the
        catalog and the product page. Select one or several photos and videos at once. Photos are resized automatically; videos
        can be up to 50MB (MP4, WEBM or MOV). For a video, a slow, steady rotation of the actual piece works best — customers use
        it to check color and inclusions match the photos.
      </p>
      {status && <p className="mt-2 text-xs text-charcoal/70">{status}</p>}
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
