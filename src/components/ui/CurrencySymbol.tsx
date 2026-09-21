"use client";

import { useCurrency } from "@/components/providers/MarketProvider";

/** "$" on the international site, "Rs" on the Sri Lanka store — for labels
 * like "Price ($)" inside Server Components, which can't read the market
 * context themselves. */
export function CurrencySymbol() {
  return <>{useCurrency() === "LKR" ? "Rs" : "$"}</>;
}
