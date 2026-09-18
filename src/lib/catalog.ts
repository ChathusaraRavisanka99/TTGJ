import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getActivePromotionMaps } from "@/lib/promotion-items";

const GEMS_PAGE_SIZE = 24;
const JEWELRY_PAGE_SIZE = 24;

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface GemFilters {
  q?: string;
  mineral?: string;
  cut?: string;
  clarity?: string;
  treatment?: string;
  origin?: string;
  minCarat?: number;
  maxCarat?: number;
  inStockOnly?: boolean;
  /** Only items in the currently *live* promotional collection — see
   * getActivePromotionMaps. Off (or nothing live right now) means no
   * filtering by this at all, same as every other optional filter here. */
  promotionalOnly?: boolean;
  sort?: "newest" | "carat" | "az";
  page?: number;
}

export async function getGemstones(filters: GemFilters) {
  const where: Prisma.GemstoneWhereInput = { isPublished: true };

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
      { variety: { contains: filters.q, mode: "insensitive" } },
      { mineral: { name: { contains: filters.q, mode: "insensitive" } } },
    ];
  }
  if (filters.mineral) where.mineral = { slug: filters.mineral };
  if (filters.cut) where.cut = { slug: filters.cut };
  if (filters.clarity) where.clarityGrade = { slug: filters.clarity };
  if (filters.treatment) where.treatment = { slug: filters.treatment };
  if (filters.origin) where.origin = { slug: filters.origin };
  if (filters.minCarat || filters.maxCarat) {
    where.caratWeight = {
      gte: filters.minCarat ?? undefined,
      lte: filters.maxCarat ?? undefined,
    };
  }
  if (filters.inStockOnly) where.stockStatus = "AVAILABLE";
  if (filters.promotionalOnly) {
    const { gemstonePrices } = await getActivePromotionMaps();
    // `in: []` correctly matches nothing rather than being ignored, so
    // this still filters down to zero results when nothing's live —
    // same as any other filter that happens to match nothing.
    where.id = { in: [...gemstonePrices.keys()] };
  }

  const orderBy: Prisma.GemstoneOrderByWithRelationInput =
    filters.sort === "carat" ? { caratWeight: "desc" } : filters.sort === "az" ? { name: "asc" } : { createdAt: "desc" };

  const page = Math.max(1, filters.page ?? 1);

  const [items, total] = await Promise.all([
    prisma.gemstone.findMany({
      where,
      orderBy,
      skip: (page - 1) * GEMS_PAGE_SIZE,
      take: GEMS_PAGE_SIZE,
      include: {
        mineral: true,
        cut: true,
        clarityGrade: true,
        treatment: true,
        origin: true,
        media: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.gemstone.count({ where }),
  ]);

  return { items, page, pageSize: GEMS_PAGE_SIZE, total, totalPages: Math.max(1, Math.ceil(total / GEMS_PAGE_SIZE)) };
}

export async function getGemstoneBySlug(slug: string) {
  return prisma.gemstone.findUnique({
    where: { slug },
    include: {
      mineral: true,
      cut: true,
      clarityGrade: true,
      treatment: true,
      origin: true,
      certLab: true,
      media: { orderBy: { sortOrder: "asc" } },
    },
  });
}

// "You May Also Like" on a gem's own detail page — same mineral first
// (a shopper looking at a sapphire is shown other sapphires, not a
// disconnected ruby), topped up with other recent published gems if that
// mineral alone doesn't have enough in stock to fill the row. Excludes the
// gem itself either way.
export async function getRelatedGemstones(gem: { id: string; mineralId: string }, take = 4) {
  const sameVariety = await prisma.gemstone.findMany({
    where: { isPublished: true, id: { not: gem.id }, mineralId: gem.mineralId },
    orderBy: { createdAt: "desc" },
    take,
    include: { mineral: true, cut: true, clarityGrade: true, treatment: true, origin: true, media: { orderBy: { sortOrder: "asc" } } },
  });
  if (sameVariety.length >= take) return sameVariety;

  const fallback = await prisma.gemstone.findMany({
    where: { isPublished: true, id: { notIn: [gem.id, ...sameVariety.map((g) => g.id)] } },
    orderBy: { createdAt: "desc" },
    take: take - sameVariety.length,
    include: { mineral: true, cut: true, clarityGrade: true, treatment: true, origin: true, media: { orderBy: { sortOrder: "asc" } } },
  });
  return [...sameVariety, ...fallback];
}

export interface JewelryFilters {
  q?: string;
  pieceType?: string;
  metalType?: string;
  inStockOnly?: boolean;
  /** See GemFilters.promotionalOnly — same rule, the jewelry side. */
  promotionalOnly?: boolean;
  sort?: "newest" | "az";
  page?: number;
}

export async function getJewelry(filters: JewelryFilters) {
  const where: Prisma.JewelryPieceWhereInput = { isPublished: true };

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.pieceType) where.pieceType = filters.pieceType as never;
  if (filters.metalType) where.metalType = filters.metalType as never;
  if (filters.inStockOnly) where.stockStatus = "AVAILABLE";
  if (filters.promotionalOnly) {
    const { jewelryPrices } = await getActivePromotionMaps();
    where.id = { in: [...jewelryPrices.keys()] };
  }

  const orderBy: Prisma.JewelryPieceOrderByWithRelationInput = filters.sort === "az" ? { name: "asc" } : { createdAt: "desc" };

  const page = Math.max(1, filters.page ?? 1);

  const [items, total] = await Promise.all([
    prisma.jewelryPiece.findMany({
      where,
      orderBy,
      skip: (page - 1) * JEWELRY_PAGE_SIZE,
      take: JEWELRY_PAGE_SIZE,
      include: {
        media: { orderBy: { sortOrder: "asc" } },
        gemstones: { include: { gemstone: true } },
      },
    }),
    prisma.jewelryPiece.count({ where }),
  ]);

  return { items, page, pageSize: JEWELRY_PAGE_SIZE, total, totalPages: Math.max(1, Math.ceil(total / JEWELRY_PAGE_SIZE)) };
}

export async function getJewelryBySlug(slug: string) {
  return prisma.jewelryPiece.findUnique({
    where: { slug },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      gemstones: { include: { gemstone: true } },
    },
  });
}

// Same idea as getRelatedGemstones, for a jewelry piece's own detail page —
// same piece type first (a shopper looking at a ring is shown other rings),
// topped up with other recent published pieces if needed.
export async function getRelatedJewelry(piece: { id: string; pieceType: string }, take = 4) {
  const samePieceType = await prisma.jewelryPiece.findMany({
    where: { isPublished: true, id: { not: piece.id }, pieceType: piece.pieceType as never },
    orderBy: { createdAt: "desc" },
    take,
    include: { media: { orderBy: { sortOrder: "asc" } } },
  });
  if (samePieceType.length >= take) return samePieceType;

  const fallback = await prisma.jewelryPiece.findMany({
    where: { isPublished: true, id: { notIn: [piece.id, ...samePieceType.map((p) => p.id)] } },
    orderBy: { createdAt: "desc" },
    take: take - samePieceType.length,
    include: { media: { orderBy: { sortOrder: "asc" } } },
  });
  return [...samePieceType, ...fallback];
}

export async function getMasterData() {
  const [minerals, cuts, clarityGrades, treatments, origins, certificationLabs] = await Promise.all([
    prisma.mineral.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.cut.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.clarityGrade.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.treatment.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.origin.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.certificationLab.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  return { minerals, cuts, clarityGrades, treatments, origins, certificationLabs };
}
