import { getMasterData } from "@/lib/catalog";
import { getActiveShippingWeightTiers } from "@/lib/shipping";
import { GemstoneForm } from "@/components/admin/GemstoneForm";
import { BackLink } from "@/components/admin/BackLink";

export default async function NewGemstonePage({ searchParams }: PageProps<"/admin/gems/new">) {
  const [{ minerals, cuts, clarityGrades, treatments, origins, certificationLabs }, shippingWeightTiers] = await Promise.all([
    getMasterData(),
    getActiveShippingWeightTiers(),
  ]);
  const defaultMarket = (await searchParams).market === "lk" ? "lk" : "intl";

  return (
    <div>
      <BackLink href="/admin/gems" label="Back to Gemstones" />
      <h1 className="font-serif text-3xl text-charcoal">Add {defaultMarket === "lk" ? "Sri Lanka " : ""}Gemstone</h1>
      <div className="mt-6">
        <GemstoneForm
          minerals={minerals}
          cuts={cuts}
          clarityGrades={clarityGrades}
          treatments={treatments}
          origins={origins}
          certificationLabs={certificationLabs}
          shippingWeightTiers={shippingWeightTiers}
          defaultMarket={defaultMarket}
        />
      </div>
      <p className="mt-4 text-xs text-charcoal/50">
        Save the gemstone first, then attach a certificate file and photos from its edit page.
      </p>
    </div>
  );
}
