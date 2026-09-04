import { prisma } from "@/lib/prisma";

// Shared between the public /promotions page and the admin manager so
// the two can't drift out of sync with what a promoted item's card
// actually needs to render.
export const promotionItemInclude = {
  gemstone: { include: { media: { orderBy: { sortOrder: "asc" as const } } } },
  jewelry: { include: { media: { orderBy: { sortOrder: "asc" as const } } } },
} as const;

export async function getPromotionItems() {
  return prisma.promotionItem.findMany({
    orderBy: { sortOrder: "asc" },
    include: promotionItemInclude,
  });
}

export function promotionItemLabel(item: { gemstone: { name: string } | null; jewelry: { name: string } | null }): string {
  return item.gemstone?.name ?? item.jewelry?.name ?? "Promotional item";
}
