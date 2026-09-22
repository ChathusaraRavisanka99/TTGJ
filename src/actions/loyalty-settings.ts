"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { getLoyaltySettings } from "@/lib/loyalty-settings";
import type { ActionResult } from "./auth";

export async function updateLoyaltySettings(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  await getLoyaltySettings(); // ensure the singleton row exists before updating it

  const num = (key: string) => {
    const v = Number(formData.get(key));
    return Number.isFinite(v) ? v : null;
  };
  const pointsPerCurrencyUnit = num("pointsPerCurrencyUnit");
  const pointsRedemptionValue = num("pointsRedemptionValue");
  const minRedeemPoints = num("minRedeemPoints");
  const maxRedeemPercentOfOrder = num("maxRedeemPercentOfOrder");
  const referralMinOrderValue = num("referralMinOrderValue");
  const referralReferrerBonusPoints = num("referralReferrerBonusPoints");
  const referralRefereeBonusPoints = num("referralRefereeBonusPoints");

  if (
    pointsPerCurrencyUnit == null || pointsPerCurrencyUnit < 0 ||
    pointsRedemptionValue == null || pointsRedemptionValue < 0 ||
    minRedeemPoints == null || minRedeemPoints < 0 ||
    maxRedeemPercentOfOrder == null || maxRedeemPercentOfOrder < 0 || maxRedeemPercentOfOrder > 100 ||
    referralMinOrderValue == null || referralMinOrderValue < 0 ||
    referralReferrerBonusPoints == null || referralReferrerBonusPoints < 0 ||
    referralRefereeBonusPoints == null || referralRefereeBonusPoints < 0
  ) {
    return { ok: false, error: "Enter valid, non-negative numbers (the redemption cap must be between 0 and 100)." };
  }

  await prisma.loyaltySettings.update({
    where: { id: "singleton" },
    data: {
      pointsPerCurrencyUnit,
      pointsRedemptionValue,
      minRedeemPoints,
      maxRedeemPercentOfOrder,
      referralMinOrderValue,
      referralReferrerBonusPoints,
      referralRefereeBonusPoints,
    },
  });

  revalidatePath("/admin/loyalty-settings");
  return { ok: true };
}
