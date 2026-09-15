"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { setSubcultureImage } from "@/actions/subculture-content";
import { Button } from "@/components/ui/Button";
import { FieldError, Label } from "@/components/ui/Field";
import type { SubcultureKey } from "@/lib/subculture-collections";

// Same single-image "replace" pattern as ContentImageField.tsx (used for
// HomeContent's heritage/sourcing images), parameterized by collection key
// + field so one component covers all four single-image slots (hero,
// mobile hero, background, OG) across all five collections instead of
// five near-duplicate components.
export function SubcultureImageField({
  collection,
  field,
  label,
  currentSrc,
  aspect = "aspect-video",
}: {
  collection: SubcultureKey;
  field: "heroImage" | "heroImageMobile" | "backgroundImage" | "ogImage";
  label: string;
  currentSrc: string;
  aspect?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function handleUpload() {
    const file = fileInput.current?.files?.[0];
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const result = await setSubcultureImage(collection, field, formData);
      if (!result.ok) setError(result.error);
      if (fileInput.current) fileInput.current.value = "";
      router.refresh();
    });
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className={`relative ${aspect} w-full max-w-sm overflow-hidden rounded-lg border border-border-subtle bg-ivory-soft`}>
        {currentSrc ? (
          <Image src={currentSrc} alt="" fill sizes="384px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-charcoal/40">No image set</div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <input ref={fileInput} type="file" accept="image/*" className="text-sm" />
        <Button type="button" variant="outline" size="sm" onClick={handleUpload} disabled={pending}>
          {pending ? "Uploading..." : currentSrc ? "Replace Image" : "Upload Image"}
        </Button>
      </div>
      <FieldError>{error ?? undefined}</FieldError>
    </div>
  );
}
