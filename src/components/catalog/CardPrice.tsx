import { cn, formatPrice } from "@/lib/utils";

interface CardPriceProps {
  price?: number | null;
  showPrice?: boolean;
  /** Set only when this item is in the *currently live* promotional
   * collection — see getActivePromotionMaps. */
  promoPrice?: number | null;
  priceClassName: string;
  quoteClassName: string;
}

// Shared by GemCard and JewelryCard's grid/list variants so a promotional
// price reads identically everywhere on the catalog, not just on the
// item's own detail page — the promo price in gold, the regular price
// struck through beside it only when the item has actually opted into
// public pricing and that price is higher (nothing honest to compare
// against otherwise), falling back to the existing price/Request-a-Quote
// behaviour when there's no active promotion at all.
export function CardPrice({ price, showPrice, promoPrice, priceClassName, quoteClassName }: CardPriceProps) {
  if (promoPrice != null) {
    const showRegular = showPrice && price != null && price > promoPrice;
    return (
      <div className={cn("flex flex-wrap items-baseline gap-x-2", priceClassName)}>
        <span className="font-serif text-gold">{formatPrice(promoPrice)}</span>
        {showRegular && <span className="text-[0.85em] text-charcoal/40 line-through">{formatPrice(price!)}</span>}
      </div>
    );
  }

  if (showPrice && price != null) {
    return <p className={cn("font-serif text-charcoal", priceClassName)}>{formatPrice(price)}</p>;
  }

  return (
    <p className={cn("font-medium text-gold transition-colors group-hover:text-charcoal", quoteClassName)}>
      Request a Quote →
    </p>
  );
}

// Same gold pill PromotionItemCard already uses on /promotions/collection
// — kept as one shared definition so the "this is on sale" visual
// language can't drift between where it first shows up and everywhere
// else it appears.
export function PromotionBadge({ className }: { className?: string }) {
  return (
    <span className={cn("rounded-full bg-gold px-2.5 py-1 text-[11px] uppercase tracking-wide text-charcoal", className)}>
      Promotion
    </span>
  );
}
