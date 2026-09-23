"use client";

import { useRouter } from "next/navigation";
import { markOrderDeliveredByAdmin } from "@/actions/orders";
import { useAdminAction } from "@/lib/hooks/useAdminAction";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { Button } from "@/components/ui/Button";

// The fallback for when no 17track webhook has (or ever will) mark this
// order delivered automatically — see lib/orders.ts's markOrderDelivered.
export function MarkDeliveredButton({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const router = useRouter();
  const { pending, error, run } = useAdminAction();
  const confirm = useConfirm();

  async function handleClick() {
    if (!(await confirm(`Mark ${orderNumber} delivered?`))) return;
    run(() => markOrderDeliveredByAdmin(orderId), () => router.refresh());
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
