"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resolveRefundRequestAction, denyRefundRequestAction } from "@/actions/refunds";
import { useAdminAction } from "@/lib/hooks/useAdminAction";
import { Select, Input, Textarea, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

const REASON_LABELS: Record<string, string> = {
  DAMAGED: "Item arrived damaged",
  NOT_AS_DESCRIBED: "Not as described",
  CHANGED_MIND: "Changed my mind",
  WRONG_ITEM: "Wrong item received",
  OTHER: "Other",
};

interface RefundRequest {
  id: string;
  reason: string;
  reasonNotes: string | null;
  status: string;
  resolution: string | null;
  refundAmount: number | null;
  restocked: boolean;
  adminNotes: string | null;
}

export function RefundResolutionPanel({ orderId, refund, currency }: { orderId: string; refund: RefundRequest; currency: "USD" | "LKR" }) {
  const router = useRouter();
  const { pending, error, run } = useAdminAction();
  const [resolution, setResolution] = useState<"FULL" | "MINUS_SHIPPING" | "PARTIAL">("FULL");
  const [denying, setDenying] = useState(false);
  const [denyNotes, setDenyNotes] = useState("");

  function handleResolve(formData: FormData) {
    run(() => resolveRefundRequestAction(refund.id, orderId, formData), () => router.refresh());
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-5">
      <p className="font-serif text-lg text-charcoal">Refund Request</p>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-charcoal/60">Reason</dt>
          <dd className="text-charcoal">{REASON_LABELS[refund.reason] ?? refund.reason}</dd>
        </div>
        {refund.reasonNotes && <p className="text-charcoal/70">&ldquo;{refund.reasonNotes}&rdquo;</p>}
      </dl>

      {refund.status === "REQUESTED" ? (
        <div className="mt-4 space-y-4 border-t border-border-subtle pt-4">
          <p className="text-xs text-charcoal/60">Discuss it in the messages below, then finalize an outcome here.</p>

          <form action={handleResolve} className="space-y-3">
            <div>
              <Label htmlFor="resolution">Resolution</Label>
              <Select id="resolution" name="resolution" value={resolution} onChange={(e) => setResolution(e.target.value as typeof resolution)}>
                <option value="FULL">Full refund</option>
                <option value="MINUS_SHIPPING">Refund minus shipping</option>
                <option value="PARTIAL">Partial refund</option>
              </Select>
            </div>
            {resolution === "PARTIAL" && (
              <div>
                <Label htmlFor="customAmount">Refund amount ({currency})</Label>
                <Input id="customAmount" name="customAmount" type="number" step="0.01" min="0" required />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm text-charcoal/75">
              <input type="hidden" name="restock" value="false" />
              <input type="checkbox" name="restock" value="true" defaultChecked className="accent-gold" />
              Release the item(s) back to stock
            </label>
            <div>
              <Label htmlFor="adminNotes">Notes (internal)</Label>
              <Textarea id="adminNotes" name="adminNotes" />
            </div>
            <Button type="submit" variant="gold" size="sm" disabled={pending}>
              {pending ? "Saving..." : "Approve & Refund"}
            </Button>
          </form>

          {!denying ? (
            <button type="button" className="text-xs text-red-700 underline" disabled={pending} onClick={() => setDenying(true)}>
              Deny this request instead
            </button>
          ) : (
            <div className="space-y-2 rounded-lg border border-border-subtle bg-ivory-soft p-3">
              <Label htmlFor="denyNotes">Reason for denying (shown to the customer indirectly, kept internal here)</Label>
              <Textarea id="denyNotes" value={denyNotes} onChange={(e) => setDenyNotes(e.target.value)} />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={pending}
                  onClick={() => run(() => denyRefundRequestAction(refund.id, orderId, denyNotes), () => router.refresh())}
                >
                  {pending ? "Saving..." : "Confirm Deny"}
                </Button>
                <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => setDenying(false)}>Cancel</Button>
              </div>
            </div>
          )}
          <FieldError>{error ?? undefined}</FieldError>
        </div>
      ) : (
        <div className="mt-4 border-t border-border-subtle pt-4 text-sm">
          {refund.status === "REFUNDED" && (
            <p className="text-emerald-700">
              Approved — {refund.refundAmount != null && formatPrice(refund.refundAmount, currency)} refunded
              {refund.resolution === "MINUS_SHIPPING" ? " (minus shipping)" : refund.resolution === "PARTIAL" ? " (partial)" : ""}.
              {refund.restocked && " Item released back to stock."}
            </p>
          )}
          {refund.status === "DENIED" && <p className="text-red-700">Denied.</p>}
          {refund.adminNotes && <p className="mt-1 text-charcoal/60">Notes: {refund.adminNotes}</p>}
        </div>
      )}
    </div>
  );
}
