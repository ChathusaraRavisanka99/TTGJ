"use client";

import { Select, Label } from "@/components/ui/Field";

export type ListingMarket = "intl" | "lk";

export const LISTING_MARKET_LABELS: Record<ListingMarket, string> = { intl: "International", lk: "Sri Lanka" };

// Which storefront a listing belongs to. A listing lives on exactly one — the
// international and Sri Lanka catalogs never overlap — so it's chosen when the
// listing is created and then fixed: an existing listing shows it read-only
// (moving one would strand its promotions, collections and carts on the other
// storefront). To list the same stone on both, add it once per store.
export function StoreField({
  market,
  onChange,
  locked,
  noun,
}: {
  market: ListingMarket;
  onChange: (next: ListingMarket) => void;
  locked: boolean;
  noun: string;
}) {
  return (
    <section className="rounded-xl border border-border-subtle bg-ivory-soft p-4">
      <Label htmlFor="market">Store</Label>
      {locked ? (
        <>
          <input type="hidden" name="market" value={market} />
          <p className="mt-1 text-sm font-medium text-charcoal">{LISTING_MARKET_LABELS[market]}</p>
          <p className="mt-1 text-xs text-charcoal/50">
            A {noun} belongs to one store and can&apos;t be moved. To sell the same {noun} on the other store, add it
            there as its own listing.
          </p>
        </>
      ) : (
        <>
          <Select id="market" name="market" value={market} onChange={(e) => onChange(e.target.value as ListingMarket)} className="max-w-xs">
            <option value="intl">International (USD)</option>
            <option value="lk">Sri Lanka (LKR)</option>
          </Select>
          <p className="mt-1 text-xs text-charcoal/50">
            Which storefront lists this {noun}. Each {noun} appears on one store only — the international and Sri
            Lanka catalogs are separate. A Sri Lanka listing needs a retail price in rupees.
          </p>
        </>
      )}
    </section>
  );
}
