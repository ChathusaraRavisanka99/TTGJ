"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cancelMyWireOrder } from "@/actions/orders";

export function CancelWireOrderButton({ orderId }: { orderId: string }) {
  const t = useTranslations("checkout.wire");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await cancelMyWireOrder(orderId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="text-sm text-charcoal/65 underline underline-offset-4 hover:text-charcoal disabled:opacity-50"
      >
        {t("cancelOrder")}
      </button>
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}
