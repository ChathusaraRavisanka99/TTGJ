"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { addHeroSlide, replaceHeroSlideImage, removeHeroSlide, updateHeroSlideAlt } from "@/actions/page-content";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Field";
import type { HeroSlide } from "@/lib/page-content";

function SlideRow({ slide, index }: { slide: HeroSlide; index: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [alt, setAlt] = useState(slide.alt);
  const fileInput = useRef<HTMLInputElement>(null);

  function handleReplace() {
    const file = fileInput.current?.files?.[0];
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const result = await replaceHeroSlideImage(index, formData);
      if (!result.ok) setError(result.error);
      if (fileInput.current) fileInput.current.value = "";
      router.refresh();
    });
  }

  function handleAltBlur() {
    if (alt === slide.alt) return;
    startTransition(async () => {
      await updateHeroSlideAlt(index, alt);
      router.refresh();
    });
  }

  function handleRemove() {
    if (!confirm("Remove this hero slide?")) return;
    startTransition(async () => {
      const result = await removeHeroSlide(index);
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-4 sm:flex-row sm:items-center">
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-md bg-ivory-soft sm:w-48">
        <Image src={slide.src} alt="" fill className="object-cover" />
      </div>
      <div className="flex-1">
        <Label htmlFor={`slide-alt-${index}`}>Alt text</Label>
        <Input
          id={`slide-alt-${index}`}
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          onBlur={handleAltBlur}
          placeholder="Describe the image for screen readers"
        />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input ref={fileInput} type="file" accept="image/*" className="text-xs" />
          <Button type="button" variant="outline" size="sm" onClick={handleReplace} disabled={pending}>
            Replace
          </Button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={pending}
            className="ml-auto flex items-center gap-1 text-xs text-red-700 hover:underline"
          >
            <Trash2 size={13} /> Remove
          </button>
        </div>
        <FieldError>{error ?? undefined}</FieldError>
      </div>
    </div>
  );
}

export function HeroSlidesManager({ slides }: { slides: HeroSlide[] }) {
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
      const result = await addHeroSlide(formData);
      if (!result.ok) setError(result.error);
      if (fileInput.current) fileInput.current.value = "";
      if (altInput.current) altInput.current.value = "";
      router.refresh();
    });
  }

  return (
    <div>
      <div className="space-y-3">
        {slides.map((slide, i) => (
          <SlideRow key={`${slide.src}-${i}`} slide={slide} index={i} />
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-dashed border-border-subtle p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-charcoal/50">Add a slide</p>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="new-slide-file">Image</Label>
            <input id="new-slide-file" ref={fileInput} type="file" accept="image/*" className="text-sm" />
          </div>
          <div>
            <Label htmlFor="new-slide-alt">Alt text</Label>
            <Input id="new-slide-alt" ref={altInput} placeholder="Describe the image" className="w-64" />
          </div>
          <Button type="button" variant="gold" size="sm" onClick={handleAdd} disabled={pending}>
            {pending ? "Adding..." : "Add Slide"}
          </Button>
        </div>
        <FieldError>{error ?? undefined}</FieldError>
      </div>
    </div>
  );
}
