import { prisma } from "@/lib/prisma";
import type { Market } from "@/lib/market-shared";

export interface BundleItemDisplay {
  kind: "gemstone" | "jewelry";
  id: string;
  slug: string;
  name: string;
  imageUrl: string | undefined;
  price: number | null;
}

export interface BundleDisplay {
  id: string;
  name: string;
  price: number;
  items: BundleItemDisplay[];
}

// Every active bundle that includes this item, on this store — a product
// page uses it to show "Complete the Look" alongside the other piece(s) in
// the set. A gemstone/jewelry piece could in principle sit in more than one
// bundle; all of them are returned rather than picking one arbitrarily.
export async function getBundlesForItem(itemId: string, market: Market): Promise<BundleDisplay[]> {
  const bundles = await prisma.bundle.findMany({
    where: {
      market,
      active: true,
      items: { some: { OR: [{ gemstoneId: itemId }, { jewelryId: itemId }] } },
    },
    include: {
      items: {
        include: {
          gemstone: { select: { id: true, slug: true, name: true, retailPrice: true, lkrRetailPrice: true, media: { orderBy: { sortOrder: "asc" }, take: 1 } } },
          jewelry: { select: { id: true, slug: true, name: true, retailPrice: true, lkrRetailPrice: true, media: { orderBy: { sortOrder: "asc" }, take: 1 } } },
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const lk = market === "lk";
  return bundles.map((bundle) => ({
    id: bundle.id,
    name: bundle.name,
    price: bundle.price,
    items: bundle.items
      .map((bi): BundleItemDisplay | null => {
        if (bi.gemstone) {
          return {
            kind: "gemstone",
            id: bi.gemstone.id,
            slug: bi.gemstone.slug,
            name: bi.gemstone.name,
            imageUrl: bi.gemstone.media[0]?.url,
            price: lk ? bi.gemstone.lkrRetailPrice : bi.gemstone.retailPrice,
          };
        }
        if (bi.jewelry) {
          return {
            kind: "jewelry",
            id: bi.jewelry.id,
            slug: bi.jewelry.slug,
            name: bi.jewelry.name,
            imageUrl: bi.jewelry.media[0]?.url,
            price: lk ? bi.jewelry.lkrRetailPrice : bi.jewelry.retailPrice,
          };
        }
        return null; // the linked item was deleted since — skip it
      })
      .filter((i): i is BundleItemDisplay => i != null),
  }));
}
