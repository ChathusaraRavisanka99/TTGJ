"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmAuctionWinner, cancelAuction, deleteAuction } from "@/actions/auctions";
import type { AuctionDisplayState } from "@/lib/auctions";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/Field";

export function AuctionAdminControls({
  auctionId,
  state,
  hasBids,
}: {
  auctionId: string;
  state: AuctionDisplayState;
  hasBids: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      if (after) after();
      else router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-5">
      <p className="font-serif text-lg text-charcoal">Winner &amp; Status</p>

      {state === "AWAITING_CONFIRMATION" && (
        <p className="mt-2 text-sm text-charcoal/70">
          Bidding closed with the top bid at or above reserve. Confirm the highest bidder to add this to their cart —
          nothing is charged automatically, they still pay by wire transfer like every other cart item.
        </p>
      )}
      {state === "RESERVE_NOT_MET" && (
        <p className="mt-2 text-sm text-charcoal/70">Bidding closed without meeting the reserve — there&apos;s no winner to confirm.</p>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {state === "AWAITING_CONFIRMATION" && (
          <Button type="button" variant="gold" size="sm" disabled={pending} onClick={() => run(() => confirmAuctionWinner(auctionId))}>
            {pending ? "Confirming..." : "Confirm Winner"}
          </Button>
        )}
        {state !== "WON" && state !== "CANCELLED" && (
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => run(() => cancelAuction(auctionId))}>
            {pending ? "Saving..." : "Cancel Auction"}
          </Button>
        )}
        {state === "DRAFT" && !hasBids && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => run(() => deleteAuction(auctionId), () => router.push("/admin/auctions"))}
          >
            {pending ? "Deleting..." : "Delete Draft"}
          </Button>
        )}
      </div>
      <FieldError>{error ?? undefined}</FieldError>
    </div>
  );
}
