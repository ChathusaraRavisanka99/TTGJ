import { describe, it, expect } from "vitest";
import { computeProfit, type SoldItemForProfit } from "@/lib/analytics";

const intlSold = (lineTotal: number, quantity: number, costPrice: number | null): SoldItemForProfit => ({
  quantity,
  lineTotal,
  order: { market: "intl" },
  gemstone: { costPrice },
  jewelry: null,
});

describe("computeProfit", () => {
  it("computes revenue minus cost for items with a cost basis", () => {
    const items = [intlSold(1000, 1, 600)];
    expect(computeProfit(items, "intl")).toEqual({ revenue: 1000, profit: 400, uncostedCount: 0 });
  });

  it("multiplies unit cost by quantity, not treating it as a flat cost", () => {
    const items = [intlSold(300, 3, 50)]; // 3 units at $100 each, $50 cost each
    expect(computeProfit(items, "intl")).toEqual({ revenue: 300, profit: 150, uncostedCount: 0 });
  });

  it("excludes an item with no cost price from the cost side, but still counts its revenue — never guesses a cost", () => {
    const items = [intlSold(1000, 1, 600), intlSold(500, 1, null)];
    const result = computeProfit(items, "intl");
    expect(result.revenue).toBe(1500);
    // The costed item's real $400 margin, plus the uncosted item's full
    // $500 revenue counted with zero cost subtracted (never guessed) —
    // uncostedCount is what flags that this figure is incomplete.
    expect(result.profit).toBe(900);
    expect(result.uncostedCount).toBe(1);
  });

  it("never mixes markets — an lk item never counts toward intl profit or vice versa", () => {
    const items = [intlSold(1000, 1, 600), { ...intlSold(500000, 1, 300000), order: { market: "lk" } }];
    expect(computeProfit(items, "intl")).toEqual({ revenue: 1000, profit: 400, uncostedCount: 0 });
    expect(computeProfit(items, "lk")).toEqual({ revenue: 500000, profit: 200000, uncostedCount: 0 });
  });

  it("falls back to jewelry's costPrice when the item isn't a gemstone", () => {
    const items: SoldItemForProfit[] = [{ quantity: 1, lineTotal: 1000, order: { market: "intl" }, gemstone: null, jewelry: { costPrice: 700 } }];
    expect(computeProfit(items, "intl")).toEqual({ revenue: 1000, profit: 300, uncostedCount: 0 });
  });
});
