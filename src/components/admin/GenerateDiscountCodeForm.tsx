"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateDiscountCode } from "@/actions/discount-codes";
import { Input, Label, FieldError, FieldHint } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function GenerateDiscountCodeForm() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    setCreated(null);
    startTransition(async () => {
      const result = await generateDiscountCode(Number(amount), customCode);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCreated(result.code ?? null);
      setAmount("");
      setCustomCode("");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-5">
      <p className="font-serif text-lg text-charcoal">Generate a Code</p>
      <p className="mt-1 text-xs text-charcoal/50">Fixed amount off, single use — spent the moment a customer applies it to their cart.</p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="amountOff">Amount Off (USD)</Label>
          <Input
            id="amountOff"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="E.g. 50"
            className="w-32"
          />
        </div>
        <div>
          <Label htmlFor="customCode">Code (optional)</Label>
          <Input
            id="customCode"
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
            placeholder="Auto-generated if blank"
            className="w-48 font-mono uppercase"
          />
        </div>
        <Button type="button" variant="gold" size="sm" disabled={pending || !amount} onClick={handleGenerate}>
          {pending ? "Generating..." : "Generate"}
        </Button>
      </div>
      <FieldHint>Letters, numbers, and hyphens only, 3-20 characters — leave blank for a random one.</FieldHint>
      <FieldError>{error ?? undefined}</FieldError>
      {created && (
        <p className="mt-2 text-sm text-green-700">
          Created <span className="font-mono font-medium">{created}</span>.
        </p>
      )}
    </div>
  );
}
