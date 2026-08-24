import { getMasterData } from "@/lib/catalog";
import { GemstoneForm } from "@/components/admin/GemstoneForm";

export default async function NewGemstonePage() {
  const { minerals, cuts, clarityGrades, treatments, origins } = await getMasterData();

  return (
    <div>
      <h1 className="font-serif text-3xl text-charcoal">Add Gemstone</h1>
      <div className="mt-6">
        <GemstoneForm minerals={minerals} cuts={cuts} clarityGrades={clarityGrades} treatments={treatments} origins={origins} />
      </div>
    </div>
  );
}
