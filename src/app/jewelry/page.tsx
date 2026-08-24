import type { Metadata } from "next";
import { getJewelry } from "@/lib/catalog";
import { JewelryCard } from "@/components/catalog/JewelryCard";
import { JewelryFilterBar } from "@/components/catalog/JewelryFilterBar";

export const metadata: Metadata = { title: "Shop Jewelry" };

export default async function JewelryPage({ searchParams }: PageProps<"/jewelry">) {
  const sp = await searchParams;
  const get = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : undefined);

  const filters = {
    q: get("q"),
    pieceType: get("pieceType"),
    metalType: get("metalType"),
    inStockOnly: get("inStockOnly") === "1",
    sort: (get("sort") as "newest" | "az" | undefined) ?? "newest",
  };

  const pieces = await getJewelry(filters);

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
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
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {pieces.map((piece) => (
            <JewelryCard
              key={piece.id}
              slug={piece.slug}
              name={piece.name}
              pieceType={piece.pieceType}
              metalType={piece.metalType}
              stockStatus={piece.stockStatus}
              primaryImageUrl={piece.media.find((m) => m.isPrimary)?.url ?? piece.media[0]?.url}
            />
          ))}
        </div>
      )}
    </div>
  );
}
