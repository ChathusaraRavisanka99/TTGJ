"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAuction, updateAuction } from "@/actions/auctions";
import { Input, Select, Label, FieldError, FieldHint } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

interface Option {
  id: string;
  name: string;
}

interface AuctionFormProps {
  gemstones: Option[];
  jewelry: Option[];
  initial?: {
    id: string;
    itemLabel: string;
    startingPrice: number;
    reservePrice: number;
    bidIncrement: number;
    startsAt: string; // ISO
    endsAt: string; // ISO
    status: "DRAFT" | "ACTIVE" | "CANCELLED";
  };
}

// "yyyy-MM-ddTHH:mm" for a datetime-local input's value — Date's own
// toISOString gives UTC, which would silently shift what an admin typed
// by their timezone offset, so this builds the local wall-clock string
// by hand instead.
function toDateTimeLocalValue(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AuctionForm({ gemstones, jewelry, initial }: AuctionFormProps) {
  const router = useRouter();
  const isEdit = !!initial;

  const [itemType, setItemType] = useState<"gemstone" | "jewelry">("gemstone");
  const [itemId, setItemId] = useState("");
  const [startingPrice, setStartingPrice] = useState(initial ? String(initial.startingPrice) : "");
  const [reservePrice, setReservePrice] = useState(initial ? String(initial.reservePrice) : "");
  const [bidIncrement, setBidIncrement] = useState(initial ? String(initial.bidIncrement) : "50");
  const [startsAt, setStartsAt] = useState(toDateTimeLocalValue(initial?.startsAt));
  const [endsAt, setEndsAt] = useState(toDateTimeLocalValue(initial?.endsAt));
  const [status, setStatus] = useState(initial?.status ?? "DRAFT");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const shared = {
        startingPrice: Number(startingPrice),
        reservePrice: Number(reservePrice),
        bidIncrement: Number(bidIncrement),
        startsAt,
        endsAt,
      };
      const result = isEdit
        ? await updateAuction(initial.id, { ...shared, status: status as "DRAFT" | "ACTIVE" | "CANCELLED" })
        : await createAuction({
            ...shared,
            gemstoneId: itemType === "gemstone" ? itemId || null : null,
            jewelryId: itemType === "jewelry" ? itemId || null : null,
            status: status as "DRAFT" | "ACTIVE",
          });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (isEdit) {
        router.refresh();
      } else {
        router.push("/admin/auctions");
      }
    });
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-5">
      {isEdit ? (
        <div>
          <Label>Item</Label>
          <p className="text-sm text-charcoal">{initial.itemLabel}</p>
          <FieldHint>The item an auction is for can&apos;t be changed after it&apos;s created — cancel this one and create a new one instead.</FieldHint>
        </div>
      ) : (
        <div>
          <Label htmlFor="itemType">Item Type</Label>
          <Select
            id="itemType"
            value={itemType}
            onChange={(e) => {
              setItemType(e.target.value as "gemstone" | "jewelry");
              setItemId("");
            }}
            className="w-48"
          >
            <option value="gemstone">Gemstone</option>
            <option value="jewelry">Jewelry</option>
          </Select>

          <div className="mt-4">
            <Label htmlFor="item">Item</Label>
            <Select id="item" value={itemId} onChange={(e) => setItemId(e.target.value)}>
              <option value="">Select {itemType === "gemstone" ? "a gemstone" : "a jewelry piece"}...</option>
              {(itemType === "gemstone" ? gemstones : jewelry).map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </Select>
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="startingPrice">Starting Price (USD)</Label>
          <Input id="startingPrice" type="number" step="0.01" min="0.01" value={startingPrice} onChange={(e) => setStartingPrice(e.target.value)} placeholder="E.g. 1000" />
        </div>
        <div>
          <Label htmlFor="reservePrice">Reserve Price (USD)</Label>
          <Input id="reservePrice" type="number" step="0.01" min="0.01" value={reservePrice} onChange={(e) => setReservePrice(e.target.value)} placeholder="E.g. 1800" />
        </div>
        <div>
          <Label htmlFor="bidIncrement">Bid Increment (USD)</Label>
          <Input id="bidIncrement" type="number" step="0.01" min="0.01" value={bidIncrement} onChange={(e) => setBidIncrement(e.target.value)} />
        </div>
      </div>
      <FieldHint>The reserve is never shown to bidders — an auction that closes below it has no winner, even with bids.</FieldHint>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="startsAt">Starts</Label>
          <Input id="startsAt" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="endsAt">Ends</Label>
          <Input id="endsAt" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </div>
      </div>

      <div className="mt-4">
        <Label htmlFor="status">Status</Label>
        <Select id="status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="w-48">
          <option value="DRAFT">Draft — not visible publicly</option>
          <option value="ACTIVE">Active</option>
          {isEdit && initial.status !== "DRAFT" && <option value="CANCELLED">Cancelled</option>}
        </Select>
        <FieldHint>
          Draft never appears on the public /auction page, regardless of dates. Active follows Starts/Ends automatically —
          nothing else to flip once bidding should open or close.
        </FieldHint>
      </div>

      <Button className="mt-5" variant="gold" disabled={pending} onClick={handleSave}>
        {pending ? "Saving..." : isEdit ? "Save Changes" : "Create Auction"}
      </Button>
      <FieldError>{error ?? undefined}</FieldError>
    </div>
  );
}
