"use client";

import { useState, useTransition } from "react";
import { updateCartContent, updateLkPaymentsContent } from "@/actions/page-content";
import { Textarea, Label, FieldError, FieldHint } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

// "cart" is the wholesale cart's wire instructions; "lk" is the Sri Lanka
// store's bank-transfer instructions for retail orders (same shape, own key).
export function CartContentForm({ initialInstructions, variant = "cart" }: { initialInstructions: string; variant?: "cart" | "lk" }) {
  const [value, setValue] = useState(initialInstructions);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await (variant === "lk" ? updateLkPaymentsContent(value) : updateCartContent(value));
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-5">
      <p className="font-serif text-lg text-charcoal">{variant === "lk" ? "Sri Lanka Bank Transfer Instructions" : "Wire Transfer Instructions"}</p>
      <p className="mt-1 text-xs text-charcoal/50">
        {variant === "lk"
          ? "Shown to a Sri Lanka store customer right after they place a bank-transfer order, and on their orders page while it is unpaid."
          : "Shown to a customer once any of their carts is awaiting payment, and printed on the cart invoice."}
      </p>
      <div className="mt-4">
        <Label htmlFor={`wireInstructions-${variant}`}>Instructions</Label>
        <Textarea
          id={`wireInstructions-${variant}`}
          rows={5}
          value={value}
          onChange={(e) => { setValue(e.target.value); setSaved(false); }}
        />
        <FieldHint>Bank name, account details, reference format — whatever a customer needs to complete the transfer.</FieldHint>
        <FieldError>{error ?? undefined}</FieldError>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button type="button" variant="gold" size="sm" disabled={pending} onClick={handleSave}>
          {pending ? "Saving..." : "Save"}
        </Button>
        {saved && !error && <span className="text-sm text-green-700">Saved.</span>}
      </div>
    </div>
  );
}
