"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCommerceSettings } from "@/actions/commerce-settings";
import { Input, Label, FieldError, FieldHint } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

interface Settings {
  vatPercent: number;
  applyVatToInternational: boolean;
  gatewayCommissionPercent: number;
  handlingFeeMarginPercent: number;
  birthdayDiscountPercent: number;
  usdToLkrRate: number;
}

export function CommerceSettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateCommerceSettings(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="max-w-2xl space-y-6 rounded-xl border border-border-subtle bg-surface p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="vatPercent">VAT Rate (%)</Label>
          <Input id="vatPercent" name="vatPercent" type="number" step="0.1" min="0" defaultValue={settings.vatPercent} />
          <FieldHint>Sri Lanka&apos;s standard VAT rate. Applied to domestic (Sri Lanka shipping) retail orders.</FieldHint>
        </div>
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-charcoal/75">
          <input type="hidden" name="applyVatToInternational" value="false" />
          <input type="checkbox" name="applyVatToInternational" value="true" defaultChecked={settings.applyVatToInternational} className="accent-gold" />
          Also charge VAT on international orders (exports are zero-rated by default)
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="gatewayCommissionPercent">Payment Gateway Commission (%)</Label>
          <Input id="gatewayCommissionPercent" name="gatewayCommissionPercent" type="number" step="0.01" min="0" defaultValue={settings.gatewayCommissionPercent} />
          <FieldHint>PayHere&apos;s actual negotiated rate — update once known.</FieldHint>
        </div>
        <div>
          <Label htmlFor="handlingFeeMarginPercent">Handling Fee Margin (%)</Label>
          <Input id="handlingFeeMarginPercent" name="handlingFeeMarginPercent" type="number" step="0.01" min="0" defaultValue={settings.handlingFeeMarginPercent} />
          <FieldHint>Added on top of the gateway commission — the total handling fee is the sum of both.</FieldHint>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="birthdayDiscountPercent">Birthday Discount (% of profit)</Label>
          <Input id="birthdayDiscountPercent" name="birthdayDiscountPercent" type="number" step="0.1" min="0" defaultValue={settings.birthdayDiscountPercent} />
          <FieldHint>Off (Retail Price − Cost Price), during the customer&apos;s birth month, once per year.</FieldHint>
        </div>
        <div>
          <Label htmlFor="usdToLkrRate">USD → LKR Exchange Rate</Label>
          <Input id="usdToLkrRate" name="usdToLkrRate" type="number" step="0.01" min="0.01" defaultValue={settings.usdToLkrRate} />
          <FieldHint>
            Orders are always charged in USD through PayHere — a Sri Lankan customer&apos;s card converts it to LKR at
            their bank&apos;s own rate. This setting only converts EMS&apos;s LKR-denominated shipping rates into USD.
          </FieldHint>
        </div>
      </div>

      <FieldError>{error ?? undefined}</FieldError>
      {saved && <p className="text-sm text-green-700">Saved.</p>}
      <Button type="submit" variant="gold" disabled={pending}>
        {pending ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}
