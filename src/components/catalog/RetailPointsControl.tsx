"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyRetailPoints, removeRetailPoints } from "@/actions/retail-cart";
import { Input, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

// Same shape as RetailDiscountCodeControl, pointed at the rewards-points
// apply/remove actions instead — the amount actually honored is always
// re-clamped at checkout (see resolvePointsRedemption), this just stages
// a number.
export function RetailPointsControl({ balance, staged }: { balance: number; staged: number }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (balance <= 0 && staged <= 0) return null;

  function handleApply() {
    setError(null);
    startTransition(async () => {
      const result = await applyRetailPoints(value);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setValue("");
      router.refresh();
    });
  }

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      const result = await removeRetailPoints();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (staged > 0) {
    return (
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="text-charcoal/70">
          Redeeming <span className="font-medium text-charcoal">{staged.toLocaleString()}</span> rewards points
        </p>
        <button type="button" onClick={handleRemove} disabled={pending} className="text-xs text-charcoal/65 underline hover:text-charcoal disabled:opacity-50">
          {pending ? "Removing..." : "Remove"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-charcoal/70">You have {balance.toLocaleString()} rewards points.</p>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Points to use"
          inputMode="numeric"
          className="max-w-[140px]"
        />
        <Button type="button" variant="outline" size="sm" disabled={pending || !value.trim()} onClick={handleApply}>
          {pending ? "Applying..." : "Apply"}
        </Button>
      </div>
      <FieldError>{error ?? undefined}</FieldError>
    </div>
  );
}
