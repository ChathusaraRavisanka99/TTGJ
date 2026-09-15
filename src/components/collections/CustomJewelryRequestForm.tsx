"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { CircleCheck, ImagePlus, X } from "lucide-react";
import type { SubcultureDef } from "@/lib/subculture-collections";
import { submitCustomJewelryRequest } from "@/actions/quotes";
import type { ActionResult } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 5;
const initialState: ActionResult = { ok: false, error: "" };

/** "Commission a Custom Piece" — the free-form design request section on
 * every subculture collection page (see AlternativeCollectionPage). Themed
 * off the same SubcultureDef every other section on the page uses, rather
 * than the light-surface ui/Field components, since this renders on the
 * page's dark background. */
export function CustomJewelryRequestForm({ theme, collectionLabel }: { theme: SubcultureDef; collectionLabel: string }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => submitCustomJewelryRequest(formData),
    initialState,
  );
  const [files, setFiles] = useState<File[]>([]);
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const fieldClass = cn(
    "w-full rounded-xl border bg-white/5 px-4 py-3 text-sm placeholder:opacity-40 focus:outline-none focus:ring-1 focus:ring-white/30",
    theme.cardBorderClass,
    theme.bodyClass,
  );

  if (state.ok) {
    return (
      <div className={cn("flex items-start gap-3 rounded-2xl border p-6", theme.cardBorderClass)}>
        <CircleCheck className={cn("mt-0.5 shrink-0", theme.accentClass)} size={20} />
        <div>
          <p className={cn("text-sm font-medium", theme.headingClass)}>Request sent</p>
          <p className={cn("mt-1 text-sm", theme.bodyClass)}>
            Our design team will review your idea and reach out by email with next steps.
          </p>
        </div>
      </div>
    );
  }

  function handleFiles(list: FileList | null) {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)].slice(0, MAX_IMAGES));
  }

  return (
    <form
      action={(formData) => {
        formData.delete("images");
        files.forEach((file) => formData.append("images", file));
        return formAction(formData);
      }}
      className="space-y-5"
    >
      <input type="hidden" name="collectionLabel" value={collectionLabel} />

      <div>
        <label htmlFor="custom-description" className={cn("mb-1.5 block text-xs uppercase tracking-[0.2em]", theme.kickerClass)}>
          Describe your idea
        </label>
        <textarea
          id="custom-description"
          name="description"
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          placeholder="A signet ring with a dark garnet centre stone, engraved initials, oxidized silver band..."
          className={cn(fieldClass, "resize-y")}
        />
      </div>

      <div>
        <p className={cn("mb-1.5 text-xs uppercase tracking-[0.2em]", theme.kickerClass)}>Reference images (optional)</p>
        <div className="flex flex-wrap gap-3">
          {files.map((file, i) => (
            <div key={i} className={cn("relative h-20 w-20 overflow-hidden rounded-lg border", theme.cardBorderClass)}>
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not an optimizable remote/static asset */}
              <img src={previews[i]} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                aria-label={`Remove image ${i + 1}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {files.length < MAX_IMAGES && (
            <label
              className={cn(
                "flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-[11px] opacity-70 transition-opacity hover:opacity-100",
                theme.cardBorderClass,
                theme.bodyClass,
              )}
            >
              <ImagePlus size={18} />
              Add
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
        <p className={cn("mt-1.5 text-xs opacity-60", theme.bodyClass)}>Up to {MAX_IMAGES} images, JPEG/PNG/WEBP.</p>
      </div>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}

      <Button type="submit" variant={theme.buttonVariant} size="lg" disabled={pending}>
        {pending ? "Sending..." : "Submit Custom Request"}
      </Button>
    </form>
  );
}
