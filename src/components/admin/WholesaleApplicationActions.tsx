"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveWholesaleApplication, rejectWholesaleApplication } from "@/actions/wholesale";
import { Button } from "@/components/ui/Button";

export function WholesaleApplicationActions({ userId }: { userId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function approve() {
    startTransition(async () => {
      await approveWholesaleApplication(userId);
      router.refresh();
    });
  }

  function reject() {
    if (!confirm("Reject this wholesale application?")) return;
    startTransition(async () => {
      await rejectWholesaleApplication(userId);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <Button type="button" variant="gold" size="sm" disabled={pending} onClick={approve}>
        Approve
      </Button>
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={reject}>
        Reject
      </Button>
    </div>
  );
}
