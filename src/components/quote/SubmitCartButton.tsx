"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitCart } from "@/actions/cart";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/Field";

export function SubmitCartButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    if (!confirm("Submit this cart? Ratnavue will review it and follow up with wire transfer details.")) return;
    setError(null);
    startTransition(async () => {
      const result = await submitCart();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <Button type="button" variant="gold" size="lg" disabled={pending} onClick={handleSubmit}>
        {pending ? "Submitting..." : "Submit Cart"}
      </Button>
      <FieldError>{error ?? undefined}</FieldError>
    </div>
  );
}
