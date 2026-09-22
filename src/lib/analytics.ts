export interface SoldItemForProfit {
  quantity: number;
  lineTotal: number;
  order: { market: string };
  gemstone: { costPrice: number | null } | null;
  jewelry: { costPrice: number | null } | null;
}

export interface ProfitStats {
  revenue: number;
  profit: number;
  /** Sold items with no costPrice recorded on their catalog listing —
   * excluded from the cost side of the calculation entirely (never
   * guessed at), so this count is the honest caveat on how complete the
   * profit figure actually is. */
  uncostedCount: number;
}

/**
 * Profit from what actually sold (PAID orders' line items) in one
 * market, never from raw catalog inventory — an unsold item's cost/
 * retail spread is a listed margin, not profit. Currency is implicit:
 * "intl" items are USD, "lk" items are LKR, and the two are never
 * summed (same discipline as every other revenue figure in this app).
 */
export function computeProfit(items: SoldItemForProfit[], market: "intl" | "lk"): ProfitStats {
  const inMarket = items.filter((i) => (market === "lk" ? i.order.market === "lk" : i.order.market !== "lk"));

  let revenue = 0;
  let cost = 0;
  let uncostedCount = 0;
  for (const item of inMarket) {
    revenue += item.lineTotal;
    const unitCost = item.gemstone?.costPrice ?? item.jewelry?.costPrice ?? null;
    if (unitCost == null) {
      uncostedCount++;
      continue;
    }
    cost += unitCost * item.quantity;
  }
  return { revenue, profit: revenue - cost, uncostedCount };
}
