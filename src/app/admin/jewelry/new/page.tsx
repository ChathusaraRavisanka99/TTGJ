import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasStaffArea, marketFilterFor } from "@/lib/rbac";
import { JewelryForm } from "@/components/admin/JewelryForm";
import { getActiveShippingWeightTiers } from "@/lib/shipping";
import { BackLink } from "@/components/admin/BackLink";

export default async function NewJewelryPage({ searchParams }: PageProps<"/admin/jewelry/new">) {
  const user = (await auth())?.user;
  if (!user || !hasStaffArea(user, "catalog")) notFound();
  const scopedMarket = marketFilterFor(user);
  const [sp, shippingWeightTiers] = await Promise.all([searchParams, getActiveShippingWeightTiers()]);
  const defaultMarket = scopedMarket ?? (sp.market === "lk" ? "lk" : "intl");

  return (
    <div>
      <BackLink href="/admin/jewelry" label="Back to Jewelry" />
      <h1 className="font-serif text-3xl text-charcoal">Add {defaultMarket === "lk" ? "Sri Lanka " : ""}Jewelry Piece</h1>
      <div className="mt-6">
        <JewelryForm defaultMarket={defaultMarket} shippingWeightTiers={shippingWeightTiers} staff={user.role === "STAFF"} lockMarket={!!scopedMarket} />
      </div>
    </div>
  );
}
