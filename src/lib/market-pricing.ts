import type { Market } from "@/lib/market-shared";

// The Sri Lanka store has its own rupee price per item (Gemstone /
// JewelryPiece .lkrRetailPrice and .lkrPrice) — nothing is converted from
// the USD fields. Rather than teach every card, price block and cart row
// about two sets of columns, the data layer swaps them once: on /lk an item
// comes back with `price`/`retailPrice` holding the rupee values (or null
// when the admin hasn't priced it for Sri Lanka, which every component
// already renders as "Request a Quote" with no Buy Now). Everything
// downstream then works unchanged and only has to know the currency symbol.

export interface MarketPriced {
  price: number | null;
  retailPrice: number | null;
  lkrPrice: number | null;
  lkrRetailPrice: number | null;
}

export function priceForMarket<T extends MarketPriced>(item: T, market: Market): T {
  if (market !== "lk") return item;
  return { ...item, price: item.lkrPrice, retailPrice: item.lkrRetailPrice };
}

export function pricesForMarket<T extends MarketPriced>(items: T[], market: Market): T[] {
  return market === "lk" ? items.map((item) => priceForMarket(item, market)) : items;
}

/** Prisma column names to filter/sort on for a market's two prices. */
export function priceColumns(market: Market): { retail: "retailPrice" | "lkrRetailPrice"; quote: "price" | "lkrPrice" } {
  return market === "lk" ? { retail: "lkrRetailPrice", quote: "lkrPrice" } : { retail: "retailPrice", quote: "price" };
}
