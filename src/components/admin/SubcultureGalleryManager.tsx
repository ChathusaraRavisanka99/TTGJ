"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { addSubcultureGalleryImage, removeSubcultureGalleryImage } from "@/actions/subculture-content";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Field";
import type { SubcultureKey } from "@/lib/subculture-collections";
import type { SubcultureImage } from "@/lib/subculture-content";

// Multi-image gallery manager for a collection's banner/lifestyle image
// slots — same add/remove shape as HeroSlidesManager.tsx, generalized by
// collection key + field so it covers both galleries across all five
// collections instead of duplicating the component per gallery.
export function SubcultureGalleryManager({
  collection,
  field,
  images,
}: {
  collection: SubcultureKey;
  field: "bannerImages" | "lifestyleImages";
  images: SubcultureImage[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const altInput = useRef<HTMLInputElement>(null);

  function handleAdd() {
    const file = fileInput.current?.files?.[0];
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("alt", altInput.current?.value ?? "");
    startTransition(async () => {
      const result = await addSubcultureGalleryImage(collection, field, formData);
      if (!result.ok) setError(result.error);
      if (fileInput.current) fileInput.current.value = "";
      if (altInput.current) altInput.current.value = "";
      router.refresh();
    });
  }

  function handleRemove(index: number) {
    if (!confirm("Remove this image?")) return;
    startTransition(async () => {
      await removeSubcultureGalleryImage(collection, field, index);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((img, i) => (
          <div key={`${img.src}-${i}`} className="group relative aspect-square overflow-hidden rounded-lg border border-border-subtle bg-ivory-soft">
            <Image src={img.src} alt={img.alt} fill sizes="200px" className="object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(i)}
              disabled={pending}
              className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remove image"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {images.length === 0 && <p className="col-span-full text-sm text-charcoal/50">No images yet.</p>}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-border-subtle p-4">
        <div>
          <Label htmlFor={`${field}-file`}>Image</Label>
          <input id={`${field}-file`} ref={fileInput} type="file" accept="image/*" className="text-sm" />
        </div>
        <div>
          <Label htmlFor={`${field}-alt`}>Alt text</Label>
          <Input id={`${field}-alt`} ref={altInput} placeholder="Describe the image" className="w-56" />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd} disabled={pending}>
          {pending ? "Adding..." : "Add Image"}
        </Button>
      </div>
      <FieldError>{error ?? undefined}</FieldError>
    </div>
  );
}
