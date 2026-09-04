import type { Metadata } from "next";
import { getJewelry } from "@/lib/catalog";
import { getActivePromotionMaps } from "@/lib/promotion-items";
import { JewelryFilterBar } from "@/components/catalog/JewelryFilterBar";
import { JewelryResults } from "@/components/catalog/JewelryResults";
import { Pagination } from "@/components/ui/Pagination";

export const metadata: Metadata = { title: "Shop Jewelry" };

export default async function JewelryPage({ searchParams }: PageProps<"/jewelry">) {
  const sp = await searchParams;
  const get = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : undefined);

  const filters = {
    q: get("q"),
    pieceType: get("pieceType"),
    metalType: get("metalType"),
    inStockOnly: get("inStockOnly") === "1",
    promotionalOnly: get("promotional") === "1",
    sort: (get("sort") as "newest" | "az" | undefined) ?? "newest",
    page: get("page") ? Number(get("page")) : undefined,
  };

  const [{ items: pieces, page, totalPages }, promotions] = await Promise.all([
    getJewelry(filters),
    // Fetched regardless of the filter above — every card needs to know
    // whether *it* is on promotion to show its badge/discounted price,
    // not just the subset a customer happens to have filtered down to.
    getActivePromotionMaps(),
  ]);

  return (
    <div className="mx-auto max-w-[120rem] px-5 py-12 sm:px-8 lg:px-12 xl:px-16">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest text-gold">Fine Jewelry</p>
        <h1 className="mt-2 font-serif text-4xl text-charcoal">Shop Jewelry</h1>
        <p className="mt-3 max-w-2xl text-charcoal/65">
          Rings, pendants, and earrings crafted around Ceylon gemstones. Request a quote for any piece, or ask us
          to set a gem you&apos;ve configured yourself.
        </p>
      </div>

      <div className="mb-10">
        <JewelryFilterBar current={sp as Record<string, string | undefined>} />
      </div>

      {pieces.length === 0 ? (
        <p className="py-20 text-center text-charcoal/50">No jewelry pieces match your filters yet.</p>
      ) : (
        <JewelryResults pieces={pieces.map((piece) => ({ ...piece, promoPrice: promotions.jewelryPrices.get(piece.id) ?? null }))} />
      )}

      <Pagination currentPage={page} totalPages={totalPages} searchParams={sp} />
    </div>
  );
}
