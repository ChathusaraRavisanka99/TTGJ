"use client";

import { JewelryCard } from "@/components/catalog/JewelryCard";
import { ViewToggle } from "@/components/catalog/ViewToggle";
import { RevealGroup, RevealItem } from "@/components/layout/Reveal";
import { useCatalogView } from "@/lib/useCatalogView";
import { cn } from "@/lib/utils";

export interface JewelryResultItem {
  id: string;
  slug: string;
  name: string;
  pieceType: string;
  metalType: string;
  stockStatus: string;
  media: { isPrimary: boolean; url: string }[];
  price: number | null;
  showPrice: boolean;
  /** Set only when this piece is in the currently *live* promotional
   * collection — see getActivePromotionMaps. */
  promoPrice?: number | null;
}

export function JewelryResults({ pieces }: { pieces: JewelryResultItem[] }) {
  const [view, setView] = useCatalogView();

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <ViewToggle view={view} onChange={setView} />
      </div>

      <RevealGroup className={cn(view === "grid" ? "grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "flex flex-col gap-3")}>
        {pieces.map((piece, i) => (
          <RevealItem key={piece.id}>
            <JewelryCard
              view={view}
              // First row (up to xl's 5 columns) loads eagerly rather than
              // lazily — Next.js was flagging one of these as the page's
              // Largest Contentful Paint element and recommending exactly
              // this. Below the fold, lazy (the Image default) is correct.
              priority={i < 5}
              slug={piece.slug}
              name={piece.name}
              pieceType={piece.pieceType}
              metalType={piece.metalType}
              stockStatus={piece.stockStatus}
              primaryImageUrl={piece.media.find((m) => m.isPrimary)?.url ?? piece.media[0]?.url}
              price={piece.price}
              showPrice={piece.showPrice}
              promoPrice={piece.promoPrice}
            />
          </RevealItem>
        ))}
      </RevealGroup>
    </div>
  );
}
