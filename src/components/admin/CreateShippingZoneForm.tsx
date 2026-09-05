"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createShippingZone } from "@/actions/shipping-zones";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function CreateShippingZoneForm() {
  const router = useRouter();
  const [isFallback, setIsFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createShippingZone(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setIsFallback(false);
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="rounded-xl border border-border-subtle bg-surface p-5">
      <p className="font-serif text-lg text-charcoal">Add a Shipping Zone</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-4 sm:items-end">
        <div>
          <Label htmlFor="new-label">Label</Label>
          <Input id="new-label" name="label" placeholder="e.g. Europe" required />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="new-countries">Countries (comma-separated)</Label>
          <Input id="new-countries" name="countries" disabled={isFallback} placeholder={isFallback ? "Matches any unlisted country" : "e.g. France, Germany"} />
        </div>
        <div>
          <Label htmlFor="new-rate">Rate (LKR)</Label>
          <Input id="new-rate" name="ratePerOrderLKR" type="number" step="0.01" min="0" placeholder="e.g. 6000" required />
        </div>
        <label className="flex items-center gap-2 text-sm text-charcoal/75">
          <input type="checkbox" checked={isFallback} onChange={(e) => setIsFallback(e.target.checked)} className="accent-gold" />
          Fallback zone (matches any country not listed elsewhere)
        </label>
        <input type="hidden" name="isFallback" value={isFallback ? "true" : "false"} />
        <Button type="submit" size="sm" variant="gold" disabled={pending}>
          {pending ? "Adding..." : "Add Zone"}
        </Button>
      </div>
      <FieldError>{error ?? undefined}</FieldError>
    </form>
  );
}
