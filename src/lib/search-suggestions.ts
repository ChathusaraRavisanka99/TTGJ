import { prisma } from "@/lib/prisma";
import { pricesForMarket } from "@/lib/market-pricing";
import type { Market } from "@/lib/market-shared";

const SUGGESTION_LIMIT = 5;

export interface SearchSuggestion {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  price: number | null;
  currency: "USD" | "LKR";
}

export interface SearchSuggestions {
  gems: SearchSuggestion[];
  jewelry: SearchSuggestion[];
}

/**
 * A fast, minimal-select counterpart to getGemstones/getJewelry — those
 * fetch a full page (24 rows, every filter facet's relations included)
 * meant for a results page, which is far more than a type-ahead dropdown
 * needs and, given this environment's real DB round-trip latency, would
 * make every keystroke feel sluggish. Five of each, id/slug/name/one
 * thumbnail/price only.
 */
export async function getQuickSearchSuggestions(q: string, market: Market): Promise<SearchSuggestions> {
  const trimmed = q.trim();
  if (trimmed.length < 2) return { gems: [], jewelry: [] };

  const searchFilter = { contains: trimmed, mode: "insensitive" as const };

  const [gems, jewelry] = await Promise.all([
    prisma.gemstone.findMany({
      where: { isPublished: true, market, OR: [{ name: searchFilter }, { mineral: { name: searchFilter } }] },
      take: SUGGESTION_LIMIT,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        name: true,
        retailPrice: true,
        lkrRetailPrice: true,
        price: true,
        lkrPrice: true,
        showPrice: true,
        media: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
      },
    }),
    prisma.jewelryPiece.findMany({
      where: { isPublished: true, market, name: searchFilter },
      take: SUGGESTION_LIMIT,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        name: true,
        retailPrice: true,
        lkrRetailPrice: true,
        price: true,
        lkrPrice: true,
        showPrice: true,
        media: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
      },
    }),
  ]);

  const currency = market === "lk" ? "LKR" : "USD";
  const toSuggestion = (item: (typeof gems)[number]): SearchSuggestion => {
    const priced = pricesForMarket([item], market)[0];
    const price = priced.retailPrice ?? (priced.showPrice ? priced.price : null);
    return { id: item.id, slug: item.slug, name: item.name, imageUrl: item.media[0]?.url ?? null, price, currency };
  };

  return { gems: gems.map(toSuggestion), jewelry: jewelry.map(toSuggestion) };
}
