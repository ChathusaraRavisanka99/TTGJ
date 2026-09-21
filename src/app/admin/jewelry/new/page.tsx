import { JewelryForm } from "@/components/admin/JewelryForm";
import { BackLink } from "@/components/admin/BackLink";

export default async function NewJewelryPage({ searchParams }: PageProps<"/admin/jewelry/new">) {
  const defaultMarket = (await searchParams).market === "lk" ? "lk" : "intl";

  return (
    <div>
      <BackLink href="/admin/jewelry" label="Back to Jewelry" />
      <h1 className="font-serif text-3xl text-charcoal">Add {defaultMarket === "lk" ? "Sri Lanka " : ""}Jewelry Piece</h1>
      <div className="mt-6">
        <JewelryForm defaultMarket={defaultMarket} />
      </div>
    </div>
  );
}
