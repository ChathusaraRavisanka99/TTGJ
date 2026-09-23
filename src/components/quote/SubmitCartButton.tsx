"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitCart } from "@/actions/cart";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/Field";

export function SubmitCartButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const confirm = useConfirm();

  async function handleSubmit() {
    if (!(await confirm("Submit this cart? Ratnavue will review it and follow up with wire transfer details."))) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await submitCart();
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.refresh();
      } catch {
        setError("Something went wrong. Please try again.");
      }
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
