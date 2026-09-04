"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Star, Trash2, Video } from "lucide-react";
import { uploadProductMedia, deleteProductMedia, setPrimaryMedia } from "@/actions/media";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

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
  const fileInput = useRef<HTMLInputElement>(null);
  const altInput = useRef<HTMLInputElement>(null);

  function handleUpload() {
    const file = fileInput.current?.files?.[0];
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("altText", altInput.current?.value ?? "");
    if (gemstoneId) formData.set("gemstoneId", gemstoneId);
    if (jewelryId) formData.set("jewelryId", jewelryId);
    startTransition(async () => {
      const result = await uploadProductMedia(formData);
      if (!result.ok) setError(result.error);
      if (fileInput.current) fileInput.current.value = "";
      if (altInput.current) altInput.current.value = "";
      router.refresh();
    });
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
          <input id="media-file" ref={fileInput} type="file" accept="image/*,video/*" className="text-sm" />
        </div>
        <div>
          <Label htmlFor="media-alt">Alt text</Label>
          <Input id="media-alt" ref={altInput} placeholder="Describe the image for screen readers" className="w-64" />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleUpload} disabled={pending}>
          {pending ? "Uploading..." : "Upload"}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
