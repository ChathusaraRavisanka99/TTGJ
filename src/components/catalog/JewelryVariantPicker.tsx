"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AddToCartButton } from "@/components/catalog/AddToCartButton";
import { useCurrency, useMarket } from "@/components/providers/MarketProvider";
import { formatPrice, cn } from "@/lib/utils";

interface Variant {
  id: string;
  label: string;
  retailPrice: number | null;
  lkrRetailPrice: number | null;
  stockStatus: string;
}

/** Shown instead of a plain AddToCartButton once a jewelry piece has any
 * variants — a customer has to pick one (size, style, ...) before adding
 * to cart; the selected variant's own price override, if it has one,
 * replaces the piece's base price shown alongside each option. */
export function JewelryVariantPicker({ jewelryId, variants, basePrice }: { jewelryId: string; variants: Variant[]; basePrice: number | null }) {
  const t = useTranslations("product");
  const market = useMarket();
  const currency = useCurrency();
  const lk = market === "lk";
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const price = (lk ? v.lkrRetailPrice : v.retailPrice) ?? basePrice;
          const available = v.stockStatus === "AVAILABLE";
          const selected = selectedId === v.id;
          return (
            <button
              key={v.id}
              type="button"
              disabled={!available}
              onClick={() => setSelectedId(v.id)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                !available && "cursor-not-allowed border-border-subtle bg-charcoal/[0.03] text-charcoal/65 line-through",
                available && selected && "border-gold bg-gold/10 text-charcoal",
                available && !selected && "border-border-subtle text-charcoal/80 hover:border-gold",
              )}
            >
              <span className="block font-medium">{v.label}</span>
              {price != null && <span className="block text-xs text-charcoal/60">{formatPrice(price, currency)}</span>}
              {!available && <span className="block text-xs">{t(v.stockStatus === "SOLD" ? "variantSold" : "variantReserved")}</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {selectedId ? (
          <AddToCartButton jewelryId={jewelryId} jewelryVariantId={selectedId} />
        ) : (
          <p className="text-sm text-charcoal/60">{t("chooseOption")}</p>
        )}
      </div>
    </div>
  );
}
