import type { Metadata } from "next";
import Link from "next/link";
import { getGemstones, getJewelry } from "@/lib/catalog";
import { getActivePromotionMaps } from "@/lib/promotion-items";
import { GemResults } from "@/components/catalog/GemResults";
import { JewelryResults } from "@/components/catalog/JewelryResults";

export const metadata: Metadata = { title: "Search" };

// A shopper typing into the new header search (see HeaderSearch.tsx) has no
// way to know up front whether what they're after is a loose stone or a
// finished piece, so this queries both catalogs at once with the same term
// rather than making them pick a catalog first. Reuses getGemstones/getJewelry
// exactly as /gems and /jewelry do, just without any of their other filters.
export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  if (!q) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center sm:px-8">
        <p className="text-xs uppercase tracking-widest text-gold">Search</p>
        <h1 className="mt-2 font-serif text-3xl text-charcoal">What are you looking for?</h1>
        <p className="mt-3 text-charcoal/60">Try a mineral, a piece type, or a style — &ldquo;sapphire,&rdquo; &ldquo;ring,&rdquo; &ldquo;pear cut.&rdquo;</p>
      </div>
    );
  }

  const [{ items: gems, total: gemTotal }, { items: pieces, total: jewelryTotal }, promotions] = await Promise.all([
    getGemstones({ q, sort: "newest" }),
    getJewelry({ q, sort: "newest" }),
    getActivePromotionMaps(),
  ]);

  const noResults = gemTotal === 0 && jewelryTotal === 0;

  return (
    <div className="mx-auto max-w-[120rem] px-5 py-12 sm:px-8 lg:px-12 xl:px-16">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest text-gold">Search Results</p>
        <h1 className="mt-2 font-serif text-4xl text-charcoal">&ldquo;{q}&rdquo;</h1>
        {!noResults && (
          <p className="mt-3 text-charcoal/65">
            {gemTotal} gemstone{gemTotal === 1 ? "" : "s"}, {jewelryTotal} jewelry piece{jewelryTotal === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {noResults ? (
        <p className="py-20 text-center text-charcoal/50">
          Nothing matches &ldquo;{q}&rdquo; yet. Try a broader term, or browse{" "}
          <Link href="/gems" className="text-gold underline underline-offset-2 hover:text-charcoal">gemstones</Link> and{" "}
          <Link href="/jewelry" className="text-gold underline underline-offset-2 hover:text-charcoal">jewelry</Link> directly.
        </p>
      ) : (
        <div className="space-y-16">
          {gems.length > 0 && (
            <section>
              <h2 className="mb-6 font-serif text-2xl text-charcoal">Gemstones</h2>
              <GemResults gems={gems.map((gem) => ({ ...gem, promoPrice: promotions.gemstonePrices.get(gem.id) ?? null }))} />
            </section>
          )}
          {pieces.length > 0 && (
            <section>
              <h2 className="mb-6 font-serif text-2xl text-charcoal">Jewelry</h2>
              <JewelryResults pieces={pieces.map((piece) => ({ ...piece, promoPrice: promotions.jewelryPrices.get(piece.id) ?? null }))} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
