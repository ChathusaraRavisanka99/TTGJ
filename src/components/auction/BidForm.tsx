"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { placeBid } from "@/actions/auctions";
import { Input, Label, FieldError, FieldHint } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

export function BidForm({
  auctionId,
  minimumBid,
  isSignedIn,
}: {
  auctionId: string;
  minimumBid: number;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(minimumBid));
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!isSignedIn) {
    return (
      <div className="rounded-xl border border-border-subtle bg-surface p-5 text-center">
        <p className="text-sm text-charcoal/70">Sign in to place a bid.</p>
        <Link href="/account/login" className="mt-3 inline-block text-sm text-gold underline">
          Sign in
        </Link>
      </div>
    );
  }

  function handleBid() {
    setError(null);
    setPlaced(false);
    startTransition(async () => {
      const result = await placeBid(auctionId, Number(amount));
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPlaced(true);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-5">
      <Label htmlFor="bidAmount">Your Bid (USD)</Label>
      <div className="flex items-end gap-3">
        <Input
          id="bidAmount"
          type="number"
          step="0.01"
          min={minimumBid}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="max-w-40"
        />
        <Button type="button" variant="gold" size="sm" disabled={pending} onClick={handleBid}>
          {pending ? "Placing..." : "Place Bid"}
        </Button>
      </div>
      <FieldHint>Minimum bid right now: {formatPrice(minimumBid)}.</FieldHint>
      <FieldError>{error ?? undefined}</FieldError>
      {placed && <p className="mt-2 text-sm text-green-700">Bid placed — you&apos;re the current high bidder.</p>}
    </div>
  );
}
