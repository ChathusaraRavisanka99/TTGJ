"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markCartPaid, markCartAwaitingPayment, generateCartInvoice } from "@/actions/cart";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/Field";

export function CartPaymentControls({ cartId, paymentStatus, hasInvoice }: { cartId: string; paymentStatus: string; hasInvoice: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-5">
      <p className="font-serif text-lg text-charcoal">Payment &amp; Invoice</p>
      <div className="mt-4 flex flex-col gap-2">
        {!hasInvoice ? (
          <Button type="button" variant="gold" size="sm" disabled={pending} onClick={() => run(() => generateCartInvoice(cartId))}>
            {pending ? "Generating..." : "Generate Invoice"}
          </Button>
        ) : paymentStatus === "AWAITING_PAYMENT" ? (
          <Button type="button" variant="gold" size="sm" disabled={pending} onClick={() => run(() => markCartPaid(cartId))}>
            {pending ? "Saving..." : "Mark Paid"}
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => run(() => markCartAwaitingPayment(cartId))}>
            {pending ? "Saving..." : "Undo — Mark Awaiting Payment"}
          </Button>
        )}
      </div>
      <FieldError>{error ?? undefined}</FieldError>
    </div>
  );
}
