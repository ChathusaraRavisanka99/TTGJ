import { prisma } from "@/lib/prisma";
import type { SeasonalThemeKey } from "@/lib/seasonal-themes";

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
