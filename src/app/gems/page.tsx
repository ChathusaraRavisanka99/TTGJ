import type { Metadata } from "next";
import { getGemstones, getMasterData } from "@/lib/catalog";
import { getActivePromotionMaps } from "@/lib/promotion-items";
import { GemFilterBar } from "@/components/catalog/GemFilterBar";
import { GemResults } from "@/components/catalog/GemResults";
import { Pagination } from "@/components/ui/Pagination";

export const metadata: Metadata = { title: "Shop Gemstones" };

export default async function GemsPage({ searchParams }: PageProps<"/gems">) {
  const sp = await searchParams;
  const get = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : undefined);

  const filters = {
    q: get("q"),
    mineral: get("mineral"),
    cut: get("cut"),
    clarity: get("clarity"),
    treatment: get("treatment"),
    origin: get("origin"),
    minCarat: get("minCarat") ? Number(get("minCarat")) : undefined,
    maxCarat: get("maxCarat") ? Number(get("maxCarat")) : undefined,
    inStockOnly: get("inStockOnly") === "1",
    promotionalOnly: get("promotional") === "1",
    sort: (get("sort") as "newest" | "carat" | "az" | undefined) ?? "newest",
    page: get("page") ? Number(get("page")) : undefined,
  };

  const [{ items: gems, page, totalPages }, masterData, promotions] = await Promise.all([
    getGemstones(filters),
    getMasterData(),
    // Fetched regardless of the filter above — every card needs to know
    // whether *it* is on promotion to show its badge/discounted price,
    // not just the subset a customer happens to have filtered down to.
    getActivePromotionMaps(),
  ]);

  return (
    <div className="mx-auto max-w-[120rem] px-5 py-12 sm:px-8 lg:px-12 xl:px-16">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest text-gold">Loose Gemstones</p>
        <h1 className="mt-2 font-serif text-4xl text-charcoal">Shop Ceylon Gemstones</h1>
        <p className="mt-3 max-w-2xl text-charcoal/65">
          Each stone is listed with its full specification — cut, colour, tone, and clarity. Browse freely; request
          a quote when something catches your eye.
        </p>
      </div>

      <div className="mb-10">
        <GemFilterBar
          minerals={masterData.minerals}
          cuts={masterData.cuts}
          clarityGrades={masterData.clarityGrades}
          treatments={masterData.treatments}
          origins={masterData.origins}
          current={sp as Record<string, string | undefined>}
        />
      </div>

      {gems.length === 0 ? (
        <p className="py-20 text-center text-charcoal/50">No gemstones match your filters yet.</p>
      ) : (
        <GemResults gems={gems.map((gem) => ({ ...gem, promoPrice: promotions.gemstonePrices.get(gem.id) ?? null }))} />
      )}

      <Pagination currentPage={page} totalPages={totalPages} searchParams={sp} />
    </div>
  );
}
