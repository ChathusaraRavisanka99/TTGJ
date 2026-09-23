"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createShippingWeightTier } from "@/actions/shipping-weight-tiers";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function CreateShippingWeightTierForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createShippingWeightTier(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="rounded-xl border border-border-subtle bg-surface p-5">
      <p className="font-serif text-lg text-charcoal">Add a Weight Tier</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3 sm:items-end">
        <div>
          <Label htmlFor="wt-label">Label</Label>
          <Input id="wt-label" name="label" placeholder="e.g. Up to 100g" required />
        </div>
        <div>
          <Label htmlFor="wt-rate">Rate (LKR)</Label>
          <Input id="wt-rate" name="ratePerOrderLKR" type="number" step="0.01" min="0" placeholder="e.g. 1500" required />
        </div>
        <Button type="submit" size="sm" variant="gold" disabled={pending}>
          {pending ? "Adding..." : "Add Tier"}
        </Button>
      </div>
      <FieldError>{error ?? undefined}</FieldError>
    </form>
  );
}
