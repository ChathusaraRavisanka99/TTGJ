import { prisma } from "@/lib/prisma";
import type { SubcultureKey } from "@/lib/subculture-collections";

// Shared between the public /collections/[slug] page and the admin
// manager, same reasoning as promotionItemInclude in promotion-items.ts —
// the two can't drift out of sync with what a card actually needs to render.
export const subcultureItemInclude = {
  gemstone: {
    include: {
      media: { orderBy: { sortOrder: "asc" as const } },
      mineral: true,
      cut: true,
      origin: true,
    },
  },
  jewelry: {
    include: {
      media: { orderBy: { sortOrder: "asc" as const } },
      gemstones: { include: { gemstone: { include: { mineral: true } } } },
    },
  },
} as const;

// Admin page: every collection at once (all five stay small — cheaper to
// fetch once and slice per tab client-side than round-trip on every tab
// switch, same reasoning getPromotionItems' own doc comment gives).
// Public page: just the one collection being viewed.
export async function getCollectionItems(collection?: SubcultureKey) {
  return prisma.subcultureCollectionItem.findMany({
    where: collection ? { collection } : undefined,
    orderBy: { sortOrder: "asc" },
    include: subcultureItemInclude,
  });
}

/** Cheaper than getCollectionItems when a caller (e.g. the cross-collection
 * footer) only needs to know whether a collection has anything to show. */
export async function countCollectionItems(collection: SubcultureKey): Promise<number> {
  return prisma.subcultureCollectionItem.count({ where: { collection } });
}

export async function countAllCollectionItems(): Promise<Record<SubcultureKey, number>> {
  const rows = await prisma.subcultureCollectionItem.groupBy({ by: ["collection"], _count: { _all: true } });
  const counts = Object.fromEntries(rows.map((r) => [r.collection, r._count._all])) as Record<string, number>;
  return counts as Record<SubcultureKey, number>;
}

export function collectionItemLabel(item: { gemstone: { name: string } | null; jewelry: { name: string } | null }): string {
  return item.gemstone?.name ?? item.jewelry?.name ?? "Collection item";
}

export interface CollectionCardData {
  id: string;
  name: string;
  href: string;
  imageUrl?: string;
  mineralName?: string;
  caratWeight?: number;
  originLabel?: string;
  cutName?: string;
  metalLabel?: string;
  pieceTypeLabel?: string;
  stockStatus: string;
  price: number | null;
  showPrice: boolean;
  retailPrice: number | null;
  featured: boolean;
}

function pieceTypeLabel(pieceType: string): string {
  return pieceType.charAt(0) + pieceType.slice(1).toLowerCase();
}

function metalLabel(metalType: string): string {
  return metalType
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Normalizes a SubcultureCollectionItem (which wraps exactly one of
 * Gemstone/JewelryPiece) into the flat shape CollectionProductCard
 * renders — the one place the two product types' differing fields get
 * reconciled into a single card. */
export function toCollectionCardData(item: {
  id: string;
  featured: boolean;
  gemstone:
    | ({
        id: string;
        slug: string;
        name: string;
        caratWeight: number;
        price: number | null;
        showPrice: boolean;
        retailPrice: number | null;
        stockStatus: string;
        mineral: { name: string };
        cut: { name: string };
        origin: { name: string };
        media: { url: string }[];
      })
    | null;
  jewelry:
    | ({
        id: string;
        slug: string;
        name: string;
        pieceType: string;
        metalType: string;
        price: number | null;
        showPrice: boolean;
        retailPrice: number | null;
        stockStatus: string;
        media: { url: string }[];
        gemstones: { gemstone: { mineral: { name: string } } | null }[];
      })
    | null;
}): CollectionCardData | null {
  if (item.gemstone) {
    const g = item.gemstone;
    return {
      id: item.id,
      name: g.name,
      href: `/gems/${g.slug}`,
      imageUrl: g.media[0]?.url,
      mineralName: g.mineral.name,
      caratWeight: g.caratWeight,
      originLabel: g.origin.name,
      cutName: g.cut.name,
      stockStatus: g.stockStatus,
      price: g.price,
      showPrice: g.showPrice,
      retailPrice: g.retailPrice,
      featured: item.featured,
    };
  }
  if (item.jewelry) {
    const j = item.jewelry;
    return {
      id: item.id,
      name: j.name,
      href: `/jewelry/${j.slug}`,
      imageUrl: j.media[0]?.url,
      mineralName: j.gemstones.find((g) => g.gemstone)?.gemstone?.mineral.name,
      metalLabel: metalLabel(j.metalType),
      pieceTypeLabel: pieceTypeLabel(j.pieceType),
      stockStatus: j.stockStatus,
      price: j.price,
      showPrice: j.showPrice,
      retailPrice: j.retailPrice,
      featured: item.featured,
    };
  }
  return null;
}

/** The mineral name used to bucket an item into a ThematicSection
 * (src/lib/subculture-collections.ts) — a gemstone's own mineral, or (for
 * jewelry) its first linked gemstone's mineral, if any. */
export function collectionItemMineralName(item: {
  gemstone: { mineral: { name: string } } | null;
  jewelry: { gemstones: { gemstone: { mineral: { name: string } } | null }[] } | null;
}): string | null {
  if (item.gemstone) return item.gemstone.mineral.name;
  const firstLinked = item.jewelry?.gemstones.find((g) => g.gemstone)?.gemstone;
  return firstLinked?.mineral.name ?? null;
}
