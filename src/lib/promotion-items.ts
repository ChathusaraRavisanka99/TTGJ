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

/**
 * Called from a product's own detail page to check whether it's part of
 * the *currently live* promotional collection — not just any theme's
 * collection, only the one a customer could actually be sent to right
 * now. Requires the seasonal page itself to be Live (Hidden or Coming
 * Soon means nothing is really "on sale" yet, even if an admin has
 * already staged items into a collection behind the scenes), and the
 * item to be in that specific active theme's collection.
 */
export async function getActivePromotion(input: { gemstoneId?: string; jewelryId?: string }): Promise<ActivePromotion | null> {
  const visibility = await getPageVisibility("seasonal");
  if (visibility !== "LIVE") return null;

  const content = await getSeasonalContent();
  const item = await prisma.promotionItem.findFirst({
    where: input.gemstoneId
      ? { theme: content.activeTheme, gemstoneId: input.gemstoneId }
      : { theme: content.activeTheme, jewelryId: input.jewelryId },
    select: { promoPrice: true },
  });
  if (!item) return null;

  return { promoPrice: item.promoPrice, themeLabel: SEASONAL_THEMES[content.activeTheme].label };
}
