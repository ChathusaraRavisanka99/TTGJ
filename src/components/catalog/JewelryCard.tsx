import Link from "next/link";
import Image from "next/image";
import { Gem, ChevronRight } from "lucide-react";
import { StockBadge } from "@/components/ui/Badge";
import { CardPrice, PromotionBadge } from "@/components/catalog/CardPrice";
import { cn } from "@/lib/utils";

interface JewelryCardProps {
  slug: string;
  name: string;
  pieceType: string;
  metalType: string;
  stockStatus: string;
  primaryImageUrl?: string;
  /** Only rendered when the admin has opted this item into public pricing. */
  price?: number | null;
  showPrice?: boolean;
  /** Set only when this piece is in the currently *live* promotional
   * collection — see getActivePromotionMaps. */
  promoPrice?: number | null;
  /** "grid" (default): today's vertical card. "list": a compact row —
   * small thumbnail, details and price in one line — for scanning many
   * items at once rather than browsing by photo. */
  view?: "grid" | "list";
  /** True for the first row or so of a grid — skips native lazy-loading
   * for whichever of these ends up being the page's Largest Contentful
   * Paint element. Default false: everything below the fold should stay
   * lazy. */
  priority?: boolean;
}

const METAL_LABELS: Record<string, string> = {
  GOLD: "Gold",
  WHITE_GOLD: "White Gold",
  ROSE_GOLD: "Rose Gold",
  PLATINUM: "Platinum",
  SILVER: "Silver",
};

function Thumbnail({
  props,
  className,
  sizes,
  children,
}: {
  props: JewelryCardProps;
  className: string;
  /** How wide this thumbnail actually renders at each breakpoint — grid
   * and list callers pass very different values (a multi-column card vs a
   * small fixed-size row thumbnail), so this can't be one shared default. */
  sizes: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative shrink-0 overflow-hidden bg-ivory-soft", className)}>
      {props.primaryImageUrl ? (
        <Image
          src={props.primaryImageUrl}
          alt={props.name}
          fill
          sizes={sizes}
          priority={props.priority}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-charcoal/25">
          <Gem size={32} strokeWidth={1} />
        </div>
      )}
      {children}
    </div>
  );
}

function JewelryCardList(props: JewelryCardProps) {
  return (
    <Link
      href={`/jewelry/${props.slug}`}
      className="group flex items-center gap-5 rounded-xl border border-border-subtle bg-surface p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:bg-ivory-soft/40 hover:shadow-lg hover:shadow-charcoal/5 sm:p-5"
    >
      <Thumbnail props={props} className="h-24 w-24 rounded-lg ring-1 ring-inset ring-charcoal/5 sm:h-28 sm:w-28" sizes="(min-width: 640px) 112px, 96px" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-lg text-charcoal sm:text-xl">{props.name}</p>
        <p className="mt-1 text-xs uppercase tracking-wide text-charcoal/50">
          {props.pieceType.charAt(0) + props.pieceType.slice(1).toLowerCase()} · {METAL_LABELS[props.metalType]}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {props.promoPrice != null && <PromotionBadge />}
          <StockBadge status={props.stockStatus} />
        </div>
      </div>

      {/* Echoes the gold divider rule used elsewhere on the site (e.g. the
          About page's section kickers) — a quiet way to separate the
          details from the price rather than just relying on gap spacing. */}
      <div className="hidden h-14 w-px shrink-0 bg-border-subtle sm:block" />

      {/* Fixed width (not just shrink-0, which sizes to whatever this
          card's own content needs): "Request a Quote →" and a short price
          like "$5,400" are very different lengths, so without a shared
          width each card's divider — positioned immediately before this
          box — ends up at a different x position from one row to the
          next. sm:justify-end keeps the (shorter) price flush against the
          chevron/right edge instead of just left-aligned in the extra
          space. 208px (not the plain price's 176px) leaves room for a
          promo price plus its struck-through regular price side by side
          without wrapping in the common case; CardPrice itself still
          wraps gracefully if a wider one ever doesn't fit. */}
      <div className="flex shrink-0 items-center gap-3 pl-1 sm:w-[208px] sm:justify-end">
        <CardPrice
          price={props.price}
          showPrice={props.showPrice}
          promoPrice={props.promoPrice}
          priceClassName="justify-end text-right text-base sm:text-lg"
          quoteClassName="whitespace-nowrap text-right text-xs sm:text-sm"
        />
        <ChevronRight size={18} className="hidden shrink-0 text-charcoal/25 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-gold sm:block" />
      </div>
    </Link>
  );
}

function JewelryCardGrid(props: JewelryCardProps) {
  return (
    <Link
      href={`/jewelry/${props.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface transition-shadow hover:shadow-lg hover:shadow-charcoal/5"
    >
      <Thumbnail props={props} className="aspect-square" sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 23vw, (min-width: 640px) 30vw, 45vw">
        <div className="absolute right-3 top-3">
          <StockBadge status={props.stockStatus} />
        </div>
        {props.promoPrice != null && <PromotionBadge className="absolute left-3 top-3" />}
      </Thumbnail>
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 font-serif text-lg leading-snug text-charcoal">{props.name}</p>
        <p className="mt-1 text-xs uppercase tracking-wide text-charcoal/50">
          {props.pieceType.charAt(0) + props.pieceType.slice(1).toLowerCase()} · {METAL_LABELS[props.metalType]}
        </p>
        {/* mt-auto pins price/CTA to the card's bottom edge regardless of how
            many lines the name above wrapped to — combined with the root
            Link's h-full, this keeps every card in a row the same height. */}
        <CardPrice
          price={props.price}
          showPrice={props.showPrice}
          promoPrice={props.promoPrice}
          priceClassName="mt-auto pt-2 text-base"
          quoteClassName="mt-auto pt-3 text-xs"
        />
      </div>
    </Link>
  );
}

export function JewelryCard(props: JewelryCardProps) {
  return props.view === "list" ? <JewelryCardList {...props} /> : <JewelryCardGrid {...props} />;
}
