import { prisma } from "@/lib/prisma";
import { getPageVisibility } from "@/lib/page-visibility";
import { getSeasonalContent } from "@/lib/page-content";
import { SEASONAL_THEMES, type SeasonalThemeKey } from "@/lib/seasonal-themes";

// Shared between the public /promotions page and the admin manager so
// the two can't drift out of sync with what a promoted item's card
// actually needs to render.
export const promotionItemInclude = {
  gemstone: { include: { media: { orderBy: { sortOrder: "asc" as const } } } },
  jewelry: { include: { media: { orderBy: { sortOrder: "asc" as const } } } },
} as const;

// Public page: only the one theme currently being shown. Admin page:
// every theme at once (all 5 collections are small — cheaper to fetch
// once and slice per tab client-side than round-trip on every tab
// switch), same reasoning the per-theme copy already follows.
export async function getPromotionItems(theme?: SeasonalThemeKey) {
  return prisma.promotionItem.findMany({
    where: theme ? { theme } : undefined,
    orderBy: { sortOrder: "asc" },
    include: promotionItemInclude,
  });
}

export function promotionItemLabel(item: { gemstone: { name: string } | null; jewelry: { name: string } | null }): string {
  return item.gemstone?.name ?? item.jewelry?.name ?? "Promotional item";
}

// Cheaper than getPromotionItems(theme) when all the hero needs to know
// is whether its "shop the collection" button has anywhere real to send
// someone — no media/product includes required just to count rows.
export async function countPromotionItems(theme: SeasonalThemeKey): Promise<number> {
  return prisma.promotionItem.count({ where: { theme } });
}

export interface ActivePromotion {
  promoPrice: number;
  themeLabel: string;
}

export interface ActivePromotionMaps {
  /** null when nothing is actually live right now (Hidden/Coming Soon) —
   * distinct from "Live, but this particular theme's collection happens
   * to be empty," which is a live promotion with empty maps. */
  themeLabel: string | null;
  gemstonePrices: Map<string, number>;
  jewelryPrices: Map<string, number>;
}

/**
 * The one place that decides "what's actually on promotion right now" —
 * used for the catalog's "Promotional" filter, for badging/pricing
 * individual catalog cards, and (via getActivePromotion below) a single
 * product's own detail page. Requires the seasonal page itself to be
 * Live (Hidden or Coming Soon means nothing is really "on sale" yet,
 * even if an admin has already staged items into some theme's
 * collection behind the scenes) and only ever reflects the *active*
 * theme's collection — never a different theme's, even if that one also
 * happens to include the same item.
 */
export async function getActivePromotionMaps(): Promise<ActivePromotionMaps> {
  const visibility = await getPageVisibility("seasonal");
  if (visibility !== "LIVE") return { themeLabel: null, gemstonePrices: new Map(), jewelryPrices: new Map() };

  const content = await getSeasonalContent();
  const items = await prisma.promotionItem.findMany({
    where: { theme: content.activeTheme },
    select: { gemstoneId: true, jewelryId: true, promoPrice: true },
  });

  const gemstonePrices = new Map<string, number>();
  const jewelryPrices = new Map<string, number>();
  for (const item of items) {
    if (item.gemstoneId) gemstonePrices.set(item.gemstoneId, item.promoPrice);
    if (item.jewelryId) jewelryPrices.set(item.jewelryId, item.promoPrice);
  }
  return { themeLabel: SEASONAL_THEMES[content.activeTheme]?.label ?? null, gemstonePrices, jewelryPrices };
}

/** Called from a single product's own detail page — see
 * getActivePromotionMaps for what "active" actually means here. */
export async function getActivePromotion(input: { gemstoneId?: string; jewelryId?: string }): Promise<ActivePromotion | null> {
  const maps = await getActivePromotionMaps();
  if (!maps.themeLabel) return null;

  const promoPrice = input.gemstoneId ? maps.gemstonePrices.get(input.gemstoneId) : maps.jewelryPrices.get(input.jewelryId!);
  if (promoPrice == null) return null;

  return { promoPrice, themeLabel: maps.themeLabel };
}
