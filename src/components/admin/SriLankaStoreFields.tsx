import { Input, Label } from "@/components/ui/Field";

interface SriLankaStoreFieldsProps {
  initial?: {
    lkrRetailPrice: number | null;
    lkrPrice: number | null;
    isFeaturedLk: boolean;
  };
  /** "gemstone" / "piece" — only used in the helper copy. */
  noun: string;
  featuredSection: string;
}

// The Sri Lanka store's (/lk) own pricing and curation, shared by the gem
// and jewelry forms. Rupee prices are entered by hand per item — nothing is
// converted from the USD fields — and a blank price is genuinely "not
// priced for Sri Lanka" (see validation/catalog.ts's optionalMoney), which
// the store shows as "Request a Quote" with no Buy Now.
export function SriLankaStoreFields({ initial, noun, featuredSection }: SriLankaStoreFieldsProps) {
  return (
    <section className="space-y-5 rounded-xl border border-gold/40 bg-gold/5 p-5">
      <div>
        <p className="font-serif text-lg text-charcoal">Sri Lanka Store (/lk)</p>
        <p className="mt-1 text-xs text-charcoal/55">
          Rupee prices for the Sri Lanka storefront. Leave both blank and this {noun} shows as &ldquo;Request a
          Quote&rdquo; there (it can&apos;t be bought online in rupees).
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="lkrRetailPrice">Retail Price (LKR)</Label>
          <Input
            id="lkrRetailPrice"
            name="lkrRetailPrice"
            type="number"
            step="1"
            min="0"
            defaultValue={initial?.lkrRetailPrice ?? ""}
            placeholder="E.g. 1450000"
          />
          <p className="mt-1 text-xs text-charcoal/45">
            Once set, Sri Lanka customers see this price and can buy the {noun} outright (bank transfer).
          </p>
        </div>
        <div>
          <Label htmlFor="lkrPrice">Reference Price (LKR)</Label>
          <Input id="lkrPrice" name="lkrPrice" type="number" step="1" min="0" defaultValue={initial?.lkrPrice ?? ""} placeholder="E.g. 1500000" />
          <p className="mt-1 text-xs text-charcoal/45">
            Shown on the Sri Lanka store only when &ldquo;Show price publicly&rdquo; is on and there&apos;s no retail
            price — the rupee twin of the USD reference price.
          </p>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-charcoal/75">
        <input type="hidden" name="isFeaturedLk" value="false" />
        <input type="checkbox" name="isFeaturedLk" value="true" defaultChecked={initial?.isFeaturedLk ?? false} className="accent-gold" />
        Featured on the Sri Lanka home page ({featuredSection})
      </label>
    </section>
  );
}
