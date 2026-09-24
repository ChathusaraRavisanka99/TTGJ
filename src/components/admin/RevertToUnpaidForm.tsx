"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { revertOrderToUnpaidAction } from "@/actions/orders";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { Textarea, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

/** Reverts a PAID order back to unpaid — a flag for review, not an
 * automatic reversal of what already happened (item sold, points earned,
 * discount code redeemed). See revertOrderToUnpaid's own doc comment.
 * Only ever rendered for an order that's currently PAID.
 *
 * A plain onClick, not a <form action>: awaiting useConfirm() inside a form
 * action deadlocks — React treats the action as a transition, and the
 * confirm dialog's own state update never commits until that transition
 * settles, which it can't since it's waiting on the (unrendered) dialog. */
export function RevertToUnpaidForm({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  async function handleConfirmRevert() {
    setError(null);
    if (!reason.trim()) {
      setError("A reason is required.");
      return;
    }
    if (!(await confirm(`Revert ${orderNumber} to unpaid? The item stays marked sold and nothing already earned/redeemed is undone — this only flags the order and messages the customer.`, { confirmLabel: "Revert to Unpaid", danger: true }))) {
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set("reason", reason);
      const result = await revertOrderToUnpaidAction(orderId, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setReason("");
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Revert to Unpaid
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-red-200 bg-red-50/50 p-3">
      <div>
        <Label htmlFor={`revert-reason-${orderId}`}>Reason (shown to the customer)</Label>
        <Textarea
          id={`revert-reason-${orderId}`}
          name="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="E.g. the bank transfer we confirmed didn't actually land — we're looking into it."
          required
        />
      </div>
      <FieldError>{error ?? undefined}</FieldError>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" disabled={pending} className="border-red-300 text-red-700 hover:bg-red-100" onClick={handleConfirmRevert}>
          {pending ? "Reverting..." : "Confirm Revert"}
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
