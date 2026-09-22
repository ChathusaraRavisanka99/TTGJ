"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markOrderDeliveredByAdmin } from "@/actions/orders";
import { Button } from "@/components/ui/Button";

// The fallback for when no 17track webhook has (or ever will) mark this
// order delivered automatically — see lib/orders.ts's markOrderDelivered.
export function MarkDeliveredButton({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(`Mark ${orderNumber} delivered?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await markOrderDeliveredByAdmin(orderId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" size="sm" variant="gold" disabled={pending} onClick={handleClick}>
        {pending ? "Saving..." : "Mark delivered"}
      </Button>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
