"use client";

import { useRouter } from "next/navigation";
import { clearPointsApproval } from "@/actions/orders";
import { useAdminAction } from "@/lib/hooks/useAdminAction";
import { Button } from "@/components/ui/Button";

/** Shown when this order's points redemption covered more than its own
 * profit margin — a review flag, not a hold: the order already completed
 * normally. Clears once an admin has looked it over. */
export function ClearPointsApprovalButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { pending, error, run } = useAdminAction();

  return (
    <div>
      <p className="text-xs text-amber-800">This order&apos;s points redemption exceeded its profit margin — review it.</p>
      <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => run(() => clearPointsApproval(orderId), () => router.refresh())} className="mt-1.5">
        {pending ? "Saving..." : "Approve points redemption"}
      </Button>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
