"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyDiscountCode, removeDiscountCode } from "@/actions/discount-codes";
import { Input, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

// Two very different renders depending on whether a code is already
// applied — a small "have a code?" input beforehand, a plain "remove"
// control once one's attached (re-entering a code makes no sense at that
// point; applyDiscountCode itself refuses a second code anyway).
export function DiscountCodeControl({ appliedCode }: { appliedCode: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleApply() {
    setError(null);
    startTransition(async () => {
      const result = await applyDiscountCode(value);
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
      const result = await removeDiscountCode();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="text-charcoal/70">
          Code <span className="font-mono font-medium text-charcoal">{appliedCode}</span> applied
        </p>
        <button type="button" onClick={handleRemove} disabled={pending} className="text-xs text-charcoal/50 underline hover:text-charcoal disabled:opacity-50">
          {pending ? "Removing..." : "Remove"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Discount code"
          className="max-w-[180px] font-mono uppercase"
        />
        <Button type="button" variant="outline" size="sm" disabled={pending || !value.trim()} onClick={handleApply}>
          {pending ? "Applying..." : "Apply"}
        </Button>
      </div>
      <FieldError>{error ?? undefined}</FieldError>
    </div>
  );
}
