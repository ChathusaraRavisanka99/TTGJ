"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Star, Trash2, Video } from "lucide-react";
import { requestProductMediaUpload, registerProductMedia, deleteProductMedia, setPrimaryMedia } from "@/actions/media";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { compressImage, putWithProgress } from "@/lib/client-image";
import { cn } from "@/lib/utils";

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

interface MediaItem {
  id: string;
  url: string;
  type: string;
  altText: string | null;
  isPrimary: boolean;
}

export function MediaManager({ media, gemstoneId, jewelryId }: { media: MediaItem[]; gemstoneId?: string; jewelryId?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const altInput = useRef<HTMLInputElement>(null);

  // One file at a time, straight from the browser to Storage (see
  // lib/media.ts) — a Server Action would cap each file at the action body
  // limit, which a phone photo or any video blows past. Every step's failure
  // is caught and shown; the old single-action version threw before it ever
  // reached its own error handling, so a too-big file just did nothing.
  async function uploadOne(file: File, altText: string, label: string) {
    const isVideo = VIDEO_TYPES.includes(file.type);
    if (!isVideo && !file.type.startsWith("image/")) {
      throw new Error(`${file.name}: unsupported file type. Use JPEG/PNG/WEBP images or MP4/WEBM/MOV videos.`);
    }

    setStatus(`${label} Preparing ${file.name}...`);
    const prepared = isVideo
      ? { blob: file as Blob, contentType: file.type }
      : await compressImage(file);

    const signed = await requestProductMediaUpload({ contentType: prepared.contentType, size: prepared.blob.size });
    if (!signed.ok) throw new Error(`${file.name}: ${signed.error}`);

    await putWithProgress(signed.uploadUrl, prepared.blob, prepared.contentType, (f) =>
      setStatus(`${label} Uploading ${file.name} — ${Math.round(f * 100)}%`),
    );

    const registered = await registerProductMedia({ key: signed.key, gemstoneId, jewelryId, altText });
    if (!registered.ok) throw new Error(`${file.name}: ${registered.error}`);
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
        await uploadOne(file, altText, files.length > 1 ? `(${i + 1}/${files.length})` : "");
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
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {media.map((item) => (
          <div key={item.id} className={cn("relative aspect-square overflow-hidden rounded-lg border-2", item.isPrimary ? "border-gold" : "border-border-subtle")}>
            {item.type === "VIDEO" ? (
              <div className="flex h-full w-full items-center justify-center bg-charcoal/5">
                <Video size={24} className="text-charcoal/50" />
              </div>
            ) : (
              <Image src={item.url} alt={item.altText ?? ""} fill sizes="(min-width: 640px) 25vw, 33vw" className="object-cover" />
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1">
              <button
                type="button"
                title="Set as primary"
                onClick={() => startTransition(async () => { await setPrimaryMedia(item.id); router.refresh(); })}
                className={cn("rounded p-1 text-white hover:bg-white/20", item.isPrimary && "text-gold")}
              >
                <Star size={14} fill={item.isPrimary ? "currentColor" : "none"} />
              </button>
              <button
                type="button"
                title="Delete"
                onClick={() => startTransition(async () => { await deleteProductMedia(item.id); router.refresh(); })}
                className="rounded p-1 text-white hover:bg-white/20"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="media-file">File</Label>
          <input id="media-file" ref={fileInput} type="file" multiple accept="image/*,video/mp4,video/webm,video/quicktime" className="text-sm" />
        </div>
        <div>
          <Label htmlFor="media-alt">Alt text</Label>
          <Input id="media-alt" ref={altInput} placeholder="Describe the image for screen readers" className="w-64" />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleUpload} disabled={pending || uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-charcoal/50">
        Select one or several photos and videos at once. Photos are resized automatically; videos can be up to 50MB (MP4, WEBM or MOV).
      </p>
      {status && <p className="mt-2 text-xs text-charcoal/70">{status}</p>}
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
