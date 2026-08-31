import type { Metadata } from "next";
import { getGemstones, getMasterData } from "@/lib/catalog";
import { GemCard } from "@/components/catalog/GemCard";
import { GemFilterBar } from "@/components/catalog/GemFilterBar";
import { RevealGroup, RevealItem } from "@/components/layout/Reveal";

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
    sort: (get("sort") as "newest" | "carat" | "az" | undefined) ?? "newest",
  };

  const [gems, masterData] = await Promise.all([getGemstones(filters), getMasterData()]);

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
        <RevealGroup className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {gems.map((gem) => (
            <RevealItem key={gem.id}>
              <GemCard
                slug={gem.slug}
                name={gem.name}
                mineralName={gem.mineral.name}
                cutSlug={gem.cut.slug}
                cutName={gem.cut.name}
                caratWeight={gem.caratWeight}
                colorHue={gem.colorHue}
                colorLightness={gem.colorLightness}
                claritySlug={gem.clarityGrade.slug}
                clarityName={gem.clarityGrade.name}
                treatmentName={gem.treatment.name}
                isCeylon={gem.origin.isCeylon}
                stockStatus={gem.stockStatus}
                primaryImageUrl={gem.media.find((m) => m.isPrimary)?.url ?? gem.media[0]?.url}
                price={gem.price}
                showPrice={gem.showPrice}
              />
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </div>
  );
}
