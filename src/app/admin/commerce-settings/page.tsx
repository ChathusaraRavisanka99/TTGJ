import Link from "next/link";
import { getCommerceSettings } from "@/lib/commerce-settings";
import { CommerceSettingsForm } from "@/components/admin/CommerceSettingsForm";
import { BackLink } from "@/components/admin/BackLink";

export default async function AdminCommerceSettingsPage() {
  const settings = await getCommerceSettings();

  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <h1 className="font-serif text-3xl text-charcoal">Commerce Settings</h1>
      <p className="mt-1 text-sm text-charcoal/60">
        Tax, shipping currency conversion, and handling fee inputs for the retail checkout — see also{" "}
        <Link href="/admin/shipping-zones" className="underline hover:text-charcoal">Shipping Zones</Link>.
      </p>

      <div className="mt-6">
        <CommerceSettingsForm settings={settings} />
      </div>
    </div>
  );
}
