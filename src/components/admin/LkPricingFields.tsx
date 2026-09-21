import { Input, Label } from "@/components/ui/Field";

interface LkPricingFieldsProps {
  initial?: {
    lkrRetailPrice: number | null;
    lkrPrice: number | null;
    costPrice: number | null;
  };
  /** "gemstone" / "piece" — only used in the helper copy. */
  noun: string;
}

// Pricing for a Sri Lanka listing: everything in rupees, entered by hand.
// Replaces the dollar price fields, which a Sri Lanka listing doesn't use. The
// retail price is mandatory — every Sri Lanka listing is buyable at a shown
// price (the server enforces this too, see validation/catalog.ts).
export function LkPricingFields({ initial, noun }: LkPricingFieldsProps) {
  return (
    <section className="space-y-5 rounded-xl border border-gold/40 bg-gold/5 p-5">
      <div>
        <p className="font-serif text-lg text-charcoal">Sri Lanka store pricing (LKR)</p>
        <p className="mt-1 text-xs text-charcoal/55">All amounts are in Sri Lankan rupees — nothing is converted from dollars.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="lkrRetailPrice">Retail Price (LKR) — required</Label>
          <Input
            id="lkrRetailPrice"
            name="lkrRetailPrice"
            type="number"
            step="1"
            min="1"
            required
            defaultValue={initial?.lkrRetailPrice ?? ""}
            placeholder="E.g. 1450000"
          />
          <p className="mt-1 text-xs text-charcoal/45">
            Always shown, and customers can buy the {noun} outright by bank transfer.
          </p>
        </div>
        <div>
          <Label htmlFor="lkrPrice">Reference Price (LKR) — optional</Label>
          <Input id="lkrPrice" name="lkrPrice" type="number" step="1" min="0" defaultValue={initial?.lkrPrice ?? ""} placeholder="E.g. 1500000" />
          <p className="mt-1 text-xs text-charcoal/45">Internal quoting reference; not shown to customers.</p>
        </div>
        <div>
          <Label htmlFor="costPrice">Cost Price (LKR) — optional</Label>
          <Input id="costPrice" name="costPrice" type="number" step="1" min="0" defaultValue={initial?.costPrice ?? ""} placeholder="E.g. 900000" />
          <p className="mt-1 text-xs text-charcoal/45">
            Internal only. Used for the birthday promotion&apos;s 10%-off-profit discount (Retail Price − Cost Price) —
            left blank, this {noun} never gets that discount.
          </p>
        </div>
      </div>
    </section>
  );
}
