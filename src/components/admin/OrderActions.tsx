"use client";

import { useRouter } from "next/navigation";
import { markOrderPaid, cancelOrderAsAdmin } from "@/actions/orders";
import { useAdminAction } from "@/lib/hooks/useAdminAction";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { Button } from "@/components/ui/Button";

// Shown only for a bank-transfer order still awaiting payment.
export function OrderActions({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const router = useRouter();
  const { pending, error, run } = useAdminAction();
  const confirm = useConfirm();

  async function handleClick(action: (id: string) => Promise<{ ok: true } | { ok: false; error: string }>, confirmText: string) {
    if (!(await confirm(confirmText))) return;
    run(() => action(orderId), () => router.refresh());
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="gold"
          disabled={pending}
          onClick={() => handleClick(markOrderPaid, `Confirm the bank transfer for ${orderNumber} has arrived? The items will be marked sold.`)}
        >
          Mark paid
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => handleClick(cancelOrderAsAdmin, `Cancel ${orderNumber}? Its held items go back on sale.`)}
        >
          Cancel
        </Button>
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
