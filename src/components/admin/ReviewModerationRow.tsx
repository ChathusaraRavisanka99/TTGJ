"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveReview, rejectReview } from "@/actions/reviews";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { Button } from "@/components/ui/Button";

export function ReviewModerationRow({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const confirm = useConfirm();

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      await approveReview(id);
      router.refresh();
    });
  }

  async function handleReject() {
    const notes = window.prompt("Reason for rejecting this review (optional, internal only):", "") ?? "";
    if (!(await confirm("Reject this review? It will never be shown publicly.", { confirmLabel: "Reject", danger: true }))) return;
    setError(null);
    startTransition(async () => {
      await rejectReview(id, notes);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="gold" size="sm" disabled={pending} onClick={handleApprove}>
        Approve
      </Button>
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={handleReject}>
        Reject
      </Button>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  );
}
