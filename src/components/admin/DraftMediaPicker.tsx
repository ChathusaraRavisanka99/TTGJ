"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Field";
import { MEDIA_ACCEPT, uploadProductFile } from "@/lib/client-media-upload";
import { SortableMediaGrid, type GalleryItem } from "@/components/admin/SortableMediaGrid";

/** Photos and videos for an item that doesn't exist yet. Each file goes
 * straight to storage as soon as it's chosen; what's arranged here (order, and
 * which one is first) is sent with the form as a hidden `mediaKeys` field and
 * attached in that order when the item is saved. */
export function DraftMediaPicker() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFiles() {
    const files = Array.from(fileInput.current?.files ?? []);
    if (files.length === 0) return;
    setError(null);
    setUploading(true);
    const failures: string[] = [];
    for (const [i, file] of files.entries()) {
      try {
        const { key, type } = await uploadProductFile(file, setStatus, files.length > 1 ? `(${i + 1}/${files.length})` : "");
        setItems((prev) => [...prev, { id: key, url: `/media/${key}`, type }]);
      } catch (e) {
        failures.push(e instanceof Error ? e.message : `${file.name}: upload failed.`);
      }
    }
    setUploading(false);
    setStatus(null);
    if (failures.length) setError(failures.join(" "));
    if (fileInput.current) fileInput.current.value = "";
  }

  function reorder(orderedIds: string[]) {
    setItems((prev) => orderedIds.map((id) => prev.find((i) => i.id === id)!).filter(Boolean));
  }

  return (
    <div>
      <input type="hidden" name="mediaKeys" value={JSON.stringify(items.map((i) => ({ key: i.id })))} />
      <SortableMediaGrid items={items} onReorder={reorder} onRemove={(id) => setItems((prev) => prev.filter((i) => i.id !== id))} disabled={uploading} />

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="draft-media-file">Add photos or videos</Label>
          <input id="draft-media-file" ref={fileInput} type="file" multiple accept={MEDIA_ACCEPT} onChange={handleFiles} disabled={uploading} className="text-sm" />
        </div>
        {uploading && <Button type="button" variant="outline" size="sm" disabled>Uploading...</Button>}
      </div>
      <p className="mt-2 text-xs text-charcoal/65">
        Choose several at once. Drag to arrange them, or use the arrows; the first one is the main photo shown on the catalog
        and the product page (use the star to make any photo first). Photos are resized automatically; videos can be up to 50MB.
        Wait for uploads to finish before saving.
      </p>
      {status && <p className="mt-2 text-xs text-charcoal/70">{status}</p>}
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
