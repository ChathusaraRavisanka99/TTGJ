"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { getCommerceSettings } from "@/lib/commerce-settings";
import type { ActionResult } from "./auth";

export async function updateCommerceSettings(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  await getCommerceSettings(); // ensure the singleton row exists before updating it

  const num = (key: string) => {
    const v = Number(formData.get(key));
    return Number.isFinite(v) ? v : null;
  };
  const vatPercent = num("vatPercent");
  const gatewayCommissionPercent = num("gatewayCommissionPercent");
  const handlingFeeMarginPercent = num("handlingFeeMarginPercent");
  const birthdayDiscountPercent = num("birthdayDiscountPercent");
  const usdToLkrRate = num("usdToLkrRate");

  if (
    vatPercent == null || vatPercent < 0 ||
    gatewayCommissionPercent == null || gatewayCommissionPercent < 0 ||
    handlingFeeMarginPercent == null || handlingFeeMarginPercent < 0 ||
    birthdayDiscountPercent == null || birthdayDiscountPercent < 0 ||
    usdToLkrRate == null || usdToLkrRate <= 0
  ) {
    return { ok: false, error: "Enter valid, non-negative numbers (the exchange rate must be greater than 0)." };
  }

  await prisma.commerceSettings.update({
    where: { id: "singleton" },
    data: {
      vatPercent,
      applyVatToInternational: formData.get("applyVatToInternational") === "true",
      gatewayCommissionPercent,
      handlingFeeMarginPercent,
      birthdayDiscountPercent,
      usdToLkrRate,
    },
  });

  revalidatePath("/admin/commerce-settings");
  return { ok: true };
}
