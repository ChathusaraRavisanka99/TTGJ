import { formatPrice } from "@/lib/utils";
import type { ActivePromotion } from "@/lib/promotion-items";

interface ProductPriceProps {
  price: number | null;
  showPrice: boolean;
  /** The retail direct-purchase price — additive to price/showPrice, not a
   * replacement (see CardPrice's own doc comment for the full rationale).
   * Preferred for display whenever it's set. */
  retailPrice?: number | null;
  promotion: ActivePromotion | null;
}

// Same "price display is opt-in per item" rule the rest of the catalog
// follows: an active promotion always shows its own promoPrice (that's
// the point — it's what a customer would actually pay), but the regular
// price only appears struck through alongside it when the item has
// separately opted into public pricing (showPrice, or has a retailPrice)
// and that price is actually higher than the promo one.
export function ProductPrice({ price, showPrice, retailPrice, promotion }: ProductPriceProps) {
  const displayPrice = retailPrice ?? price;
  const displayable = retailPrice != null || showPrice;

  if (promotion) {
    const showRegular = displayable && displayPrice != null && displayPrice > promotion.promoPrice;
    return (
      <div className="mt-2 flex flex-wrap items-baseline gap-3">
        <p className="font-serif text-2xl text-gold">{formatPrice(promotion.promoPrice)}</p>
        {showRegular && <p className="text-lg text-charcoal/40 line-through">{formatPrice(displayPrice!)}</p>}
        <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gold">
          {promotion.themeLabel} Sale
        </span>
      </div>
    );
  }

  if (displayable && displayPrice != null) {
    return <p className="mt-2 font-serif text-2xl text-gold">{formatPrice(displayPrice)}</p>;
  }

  return null;
}
