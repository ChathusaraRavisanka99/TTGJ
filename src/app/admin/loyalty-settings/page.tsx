import { getLoyaltySettings } from "@/lib/loyalty-settings";
import { LoyaltySettingsForm } from "@/components/admin/LoyaltySettingsForm";
import { BackLink } from "@/components/admin/BackLink";

export default async function AdminLoyaltySettingsPage() {
  const settings = await getLoyaltySettings();
  return (
    <div>
      <BackLink href="/admin" label="Back to Dashboard" />
      <h1 className="font-serif text-3xl text-charcoal">Loyalty & Referral Settings</h1>
      <p className="mt-1 text-sm text-charcoal/60">Controls how customers earn and redeem rewards points, and what a referral pays out.</p>
      <div className="mt-6">
        <LoyaltySettingsForm settings={settings} />
      </div>
    </div>
  );
}
