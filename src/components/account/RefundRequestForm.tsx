"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestRefundAction } from "@/actions/refunds";
import { Select, Textarea, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const REASONS = [
  { value: "DAMAGED", label: "Item arrived damaged" },
  { value: "NOT_AS_DESCRIBED", label: "Not as described" },
  { value: "CHANGED_MIND", label: "Changed my mind" },
  { value: "WRONG_ITEM", label: "Wrong item received" },
  { value: "OTHER", label: "Other" },
];

/** Starts a refund/return on a paid order — see lib/refunds.ts. The actual
 * conversation about it happens in this order's own message thread below;
 * this just records the request and its reason for an admin to resolve. */
export function RefundRequestForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      const result = await requestRefundAction(orderId, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Start a Refund
      </Button>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="reason">Reason</Label>
        <Select id="reason" name="reason" defaultValue="DAMAGED">
          {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </Select>
      </div>
      <div>
        <Label htmlFor="reasonNotes">Tell us more (optional)</Label>
        <Textarea id="reasonNotes" name="reasonNotes" placeholder="Any details that will help us sort this out quickly" />
      </div>
      <FieldError>{error ?? undefined}</FieldError>
      <div className="flex gap-2">
        <Button type="submit" variant="gold" size="sm" disabled={pending}>
          {pending ? "Submitting..." : "Submit Request"}
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
