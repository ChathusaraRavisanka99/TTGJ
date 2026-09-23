"use client";

import { useRouter } from "next/navigation";
import { clearShippingToBeArranged } from "@/actions/orders";
import { useAdminAction } from "@/lib/hooks/useAdminAction";
import { Button } from "@/components/ui/Button";

/** Once an admin has actually sorted out shipping with the customer for
 * an order with a quoteShipping item (typically via the order's own chat
 * thread), this clears the "Shipping TBD" flag. */
export function ClearShippingToBeArrangedButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { pending, error, run } = useAdminAction();

  return (
    <div>
      <p className="text-xs text-amber-800">This order needs shipping arranged with the customer.</p>
      <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => run(() => clearShippingToBeArranged(orderId), () => router.refresh())} className="mt-1.5">
        {pending ? "Saving..." : "Mark shipping arranged"}
      </Button>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
