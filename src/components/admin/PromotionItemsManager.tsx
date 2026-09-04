"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addPromotionItem, updatePromotionItemPrice, removePromotionItem } from "@/actions/promotion-items";
import { Input, Select, Label, FieldError, FieldHint } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

interface Option {
  id: string;
  name: string;
  specs: string;
  price: number | null;
  showPrice: boolean;
}

interface PromotedItem {
  id: string;
  label: string;
  promoPrice: number;
  regularPrice: number | null;
}

// The line an admin sees for whichever item is currently selected in the
// picker, before they've typed a promotional price — specs and the
// current price, exactly what they'd otherwise have to open the item's
// own edit page to check.
function CurrentPriceAndSpecs({ item }: { item: Option }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-ivory-soft px-4 py-3 text-sm">
      <p className="text-charcoal">{item.specs}</p>
      <p className="mt-0.5 text-charcoal/60">
        Current price:{" "}
        {item.price == null
          ? "not set"
          : item.showPrice
            ? <span className="text-charcoal">{formatPrice(item.price)} (shown publicly)</span>
            : <span>{formatPrice(item.price)} (internal reference only — not shown publicly)</span>}
      </p>
    </div>
  );
}

export function PromotionItemsManager({ gemstones, jewelry, items }: { gemstones: Option[]; jewelry: Option[]; items: PromotedItem[] }) {
  const router = useRouter();
  const [itemType, setItemType] = useState<"gemstone" | "jewelry">("gemstone");
  const [itemId, setItemId] = useState("");
  const [promoPrice, setPromoPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const options = itemType === "gemstone" ? gemstones : jewelry;
  const selected = useMemo(() => options.find((o) => o.id === itemId) ?? null, [options, itemId]);
  const promoPriceNumber = Number(promoPrice);
  const showsHigherOrEqualWarning =
    selected?.price != null && promoPrice !== "" && Number.isFinite(promoPriceNumber) && promoPriceNumber >= selected.price;

  function handleAdd() {
    setError(null);
    startTransition(async () => {
      const result = await addPromotionItem({
        gemstoneId: itemType === "gemstone" ? itemId || null : null,
        jewelryId: itemType === "jewelry" ? itemId || null : null,
        promoPrice: promoPriceNumber,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setItemId("");
      setPromoPrice("");
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="promoItemType">Item Type</Label>
          <Select
            id="promoItemType"
            value={itemType}
            onChange={(e) => {
              setItemType(e.target.value as "gemstone" | "jewelry");
              setItemId("");
            }}
            className="w-40"
          >
            <option value="gemstone">Gemstone</option>
            <option value="jewelry">Jewelry</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="promoItem">Item</Label>
          <Select id="promoItem" value={itemId} onChange={(e) => setItemId(e.target.value)} className="w-64">
            <option value="">Select {itemType === "gemstone" ? "a gemstone" : "a jewelry piece"}...</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Specs + current price for whatever's picked above — shown before
          the promotional price field so there's something to price
          against, rather than typing a number blind. */}
      {selected && (
        <div className="mt-3 max-w-md">
          <CurrentPriceAndSpecs item={selected} />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="promoPrice">Promotional Price (USD)</Label>
          <Input
            id="promoPrice"
            type="number"
            step="0.01"
            min="0.01"
            value={promoPrice}
            onChange={(e) => setPromoPrice(e.target.value)}
            placeholder="E.g. 950"
            className="w-40"
          />
        </div>
        <Button type="button" variant="gold" size="sm" disabled={pending || !itemId || !promoPrice} onClick={handleAdd}>
          {pending ? "Adding..." : "Add to Collection"}
        </Button>
      </div>
      {showsHigherOrEqualWarning && (
        <FieldHint>
          That&apos;s not below the current price ({formatPrice(selected!.price!)}) — double-check before adding.
        </FieldHint>
      )}
      <FieldError>{error ?? undefined}</FieldError>

      <div className="mt-4 divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface">
        {items.map((item) => <PromotionItemRow key={item.id} item={item} />)}
        {items.length === 0 && <p className="p-4 text-sm text-charcoal/50">No promotional items yet.</p>}
      </div>
    </div>
  );
}

function PromotionItemRow({ item }: { item: PromotedItem }) {
  const router = useRouter();
  const [price, setPrice] = useState(String(item.promoPrice));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updatePromotionItemPrice(item.id, Number(price));
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  function handleRemove() {
    if (!confirm(`Remove "${item.label}" from the promotional collection?`)) return;
    startTransition(async () => {
      await removePromotionItem(item.id);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4">
      <div className="min-w-0">
        <p className="truncate text-charcoal">{item.label}</p>
        {item.regularPrice != null && (
          <p className="text-xs text-charcoal/45 line-through">{formatPrice(item.regularPrice)}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input type="number" step="0.01" min="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-28" />
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={handleSave}>Save</Button>
        <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={handleRemove}>Remove</Button>
      </div>
      <FieldError>{error ?? undefined}</FieldError>
    </div>
  );
}
