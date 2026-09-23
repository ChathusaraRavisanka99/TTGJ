"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { confirmAuctionWinner, cancelAuction, deleteAuction } from "@/actions/auctions";
import type { AuctionDisplayState } from "@/lib/auctions";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/Field";

export function AuctionAdminControls({
  auctionId,
  state,
  hasBids,
  order,
}: {
  auctionId: string;
  state: AuctionDisplayState;
  hasBids: boolean;
  order?: { id: string; orderNumber: string } | null;
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
          Bidding closed with the top bid at or above reserve. Confirm the highest bidder to create their order —
          nothing is charged automatically; they pay by wire transfer within 24 hours or the item releases back to stock.
        </p>
      )}
      {state === "RESERVE_NOT_MET" && (
        <p className="mt-2 text-sm text-charcoal/70">Bidding closed without meeting the reserve — there&apos;s no winner to confirm.</p>
      )}
      {state === "EXPIRED" && (
        <p className="mt-2 text-sm text-charcoal/70">The winner didn&apos;t pay within the 24-hour window — their order was cancelled and the item released back to stock.</p>
      )}
      {order && (
        <Link href={`/admin/orders/${order.id}`} className="mt-2 inline-block text-sm text-gold-deep underline">
          View order {order.orderNumber}
        </Link>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {state === "AWAITING_CONFIRMATION" && (
          <Button type="button" variant="gold" size="sm" disabled={pending} onClick={() => run(() => confirmAuctionWinner(auctionId))}>
            {pending ? "Confirming..." : "Confirm Winner"}
          </Button>
        )}
        {state !== "WON" && state !== "CANCELLED" && state !== "EXPIRED" && (
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
