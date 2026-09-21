import Link from "@/components/ui/MarketLink";
import Image from "next/image";
import type { SubcultureDef } from "@/lib/subculture-collections";
import type { CollectionCardData } from "@/lib/subculture-items";
import { formatPrice, cn } from "@/lib/utils";

/** One card style for both product types (gemstone or jewelry), themed
 * per collection via `theme` — the base photo/name sits still, and a
 * hover-reveal overlay (mirrors GemCard/JewelryCard's own spec tags, but
 * always visible on tap for touch devices via `group-focus-within`)
 * surfaces gemstone, carat, origin, cut, metal, and price, per the brief's
 * "reveal additional information on hover" card spec. */
export function CollectionProductCard({ item, theme, priority }: { item: CollectionCardData; theme: SubcultureDef; priority?: boolean }) {
  const specs = [
    item.mineralName,
    item.caratWeight != null ? `${item.caratWeight} ct` : undefined,
    item.cutName,
    item.originLabel,
    item.pieceTypeLabel,
    item.metalLabel,
  ].filter(Boolean) as string[];

  const displayPrice = item.retailPrice ?? item.price;
  const displayable = item.retailPrice != null || item.showPrice;

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-black/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1",
        theme.cardBorderClass,
        theme.cardGlowClass,
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-black/30">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 23vw, (min-width: 640px) 30vw, 45vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={cn("flex h-full w-full items-center justify-center font-serif text-sm opacity-40", theme.bodyClass)}>
            {theme.emoji}
          </div>
        )}

        {item.featured && (
          <span className={cn("absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] uppercase tracking-wide backdrop-blur-sm", theme.accentClass)}>
            Featured
          </span>
        )}

        {/* Hover/focus-reveal spec panel — group-focus-within keeps this
            reachable via keyboard/tap, not only a mouse hover. */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100",
          )}
        >
          <ul className="space-y-0.5 text-xs text-white/80">
            {specs.map((spec) => (
              <li key={spec}>{spec}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className={cn("line-clamp-2 font-serif text-base leading-snug", theme.headingClass)}>{item.name}</p>
        <p className={cn("mt-1 text-xs uppercase tracking-wide opacity-60", theme.bodyClass)}>{specs.slice(0, 2).join(" · ")}</p>
        <div className="mt-auto pt-3">
          {displayable && displayPrice != null ? (
            <p className={cn("font-serif text-sm", theme.headingClass)}>{formatPrice(displayPrice)}</p>
          ) : (
            <p className={cn("text-xs font-medium", theme.accentClass)}>Request a Quote →</p>
          )}
        </div>
      </div>
    </Link>
  );
}
