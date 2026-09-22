"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLoyaltySettings } from "@/actions/loyalty-settings";
import { Input, Label, FieldError, FieldHint } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

interface Settings {
  pointsPerCurrencyUnit: number;
  pointsRedemptionValue: number;
  minRedeemPoints: number;
  maxRedeemPercentOfOrder: number;
  referralMinOrderValue: number;
  referralReferrerBonusPoints: number;
  referralRefereeBonusPoints: number;
}

export function LoyaltySettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateLoyaltySettings(formData);
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
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-charcoal/65">Earning & redemption</p>
        <div className="mt-3 grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="pointsPerCurrencyUnit">Points per $1 spent</Label>
            <Input id="pointsPerCurrencyUnit" name="pointsPerCurrencyUnit" type="number" step="0.1" min="0" defaultValue={settings.pointsPerCurrencyUnit} />
            <FieldHint>Applied to an order&apos;s subtotal (before tax/shipping). LKR orders convert through the USD → LKR rate on Commerce Settings.</FieldHint>
          </div>
          <div>
            <Label htmlFor="pointsRedemptionValue">Value of 1 point ($)</Label>
            <Input id="pointsRedemptionValue" name="pointsRedemptionValue" type="number" step="0.001" min="0" defaultValue={settings.pointsRedemptionValue} />
            <FieldHint>e.g. 0.01 means 100 points redeem for $1 off.</FieldHint>
          </div>
          <div>
            <Label htmlFor="minRedeemPoints">Minimum points to redeem</Label>
            <Input id="minRedeemPoints" name="minRedeemPoints" type="number" step="1" min="0" defaultValue={settings.minRedeemPoints} />
          </div>
          <div>
            <Label htmlFor="maxRedeemPercentOfOrder">Max redemption (% of order)</Label>
            <Input id="maxRedeemPercentOfOrder" name="maxRedeemPercentOfOrder" type="number" step="1" min="0" max="100" defaultValue={settings.maxRedeemPercentOfOrder} />
            <FieldHint>Caps how much of a single order points can cover.</FieldHint>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-charcoal/65">Referrals</p>
        <div className="mt-3 grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="referralMinOrderValue">Minimum qualifying order ($)</Label>
            <Input id="referralMinOrderValue" name="referralMinOrderValue" type="number" step="1" min="0" defaultValue={settings.referralMinOrderValue} />
            <FieldHint>A referred friend&apos;s first order must reach this amount before either side is paid.</FieldHint>
          </div>
          <div />
          <div>
            <Label htmlFor="referralReferrerBonusPoints">Bonus to the referrer</Label>
            <Input id="referralReferrerBonusPoints" name="referralReferrerBonusPoints" type="number" step="1" min="0" defaultValue={settings.referralReferrerBonusPoints} />
          </div>
          <div>
            <Label htmlFor="referralRefereeBonusPoints">Bonus to the new customer</Label>
            <Input id="referralRefereeBonusPoints" name="referralRefereeBonusPoints" type="number" step="1" min="0" defaultValue={settings.referralRefereeBonusPoints} />
          </div>
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
