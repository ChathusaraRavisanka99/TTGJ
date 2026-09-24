"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { updateOriginContentText, setOriginContentImage } from "@/actions/origin-content";
import { Input, Textarea, Label, FieldError, FieldHint } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { OriginContent } from "@/lib/origin-content";

export function OriginContentForm({ originId, content }: { originId: string; content: OriginContent }) {
  const router = useRouter();
  const [textError, setTextError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [textPending, startTextTransition] = useTransition();
  const [imagePending, startImageTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  function handleTextSubmit(formData: FormData) {
    setTextError(null);
    setSaved(false);
    startTextTransition(async () => {
      const result = await updateOriginContentText(originId, formData);
      if (!result.ok) {
        setTextError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  function handleImageUpload() {
    const file = fileInput.current?.files?.[0];
    if (!file) return;
    setImageError(null);
    const formData = new FormData();
    formData.set("file", file);
    startImageTransition(async () => {
      const result = await setOriginContentImage(originId, formData);
      if (!result.ok) setImageError(result.error);
      if (fileInput.current) fileInput.current.value = "";
      router.refresh();
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <form action={handleTextSubmit} className="space-y-5 rounded-xl border border-border-subtle bg-surface p-6">
        <div>
          <Label htmlFor="headline">Headline</Label>
          <Input id="headline" name="headline" defaultValue={content.headline} placeholder="E.g. The Sapphire Capital" />
          <FieldHint>Left blank, this origin shows no &ldquo;about&rdquo; block on its gemstones&apos; product pages.</FieldHint>
        </div>
        <div>
          <Label htmlFor="body">Body</Label>
          <Textarea id="body" name="body" rows={5} defaultValue={content.body} placeholder="A short paragraph about this mining region — history, character, what makes stones from here distinctive." />
        </div>
        <div>
          <Label htmlFor="imageAlt">Image Alt Text</Label>
          <Input id="imageAlt" name="imageAlt" defaultValue={content.imageAlt} placeholder="Descriptive alt text for the image below" />
        </div>
        <FieldError>{textError ?? undefined}</FieldError>
        {saved && <p className="text-sm text-green-700">Saved.</p>}
        <Button type="submit" variant="gold" disabled={textPending}>
          {textPending ? "Saving..." : "Save Content"}
        </Button>
      </form>

      <div className="rounded-xl border border-border-subtle bg-surface p-6">
        <Label>Image</Label>
        <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border border-border-subtle bg-ivory-soft">
          {content.image ? (
            <Image src={content.image} alt="" fill sizes="384px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-charcoal/40">No image set</div>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input ref={fileInput} type="file" accept="image/*" className="text-sm" />
          <Button type="button" variant="outline" size="sm" onClick={handleImageUpload} disabled={imagePending}>
            {imagePending ? "Uploading..." : content.image ? "Replace Image" : "Upload Image"}
          </Button>
        </div>
        <FieldError>{imageError ?? undefined}</FieldError>
      </div>
    </div>
  );
}
