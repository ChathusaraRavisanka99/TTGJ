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

// A gem's colour is stored as free-form HSL (colorHue/colorSaturation/
// colorLightness — the same fields GemVisualizer renders from), not a
// discrete category, so "filter by colour" needs a bucketing scheme.
// Approximate by nature (colour is a spectrum), but close enough for
// "show me the green stones" browsing. Brown is the one family that isn't
// a hue range at all — it's a desaturated, darker orange/red rather than
// its own point on the wheel, so it layers saturation/lightness caps on
// top of an orange-ish hue instead.
export const GEM_COLOR_FAMILIES = [
  { key: "red", label: "Red" },
  { key: "orange", label: "Orange" },
  { key: "yellow", label: "Yellow" },
  { key: "green", label: "Green" },
  { key: "blue", label: "Blue" },
  { key: "violet", label: "Violet" },
  { key: "pink", label: "Pink" },
  { key: "brown", label: "Brown" },
] as const;

export type GemColorFamily = (typeof GEM_COLOR_FAMILIES)[number]["key"];

function colorFamilyWhere(family: GemColorFamily): Prisma.GemstoneWhereInput {
  switch (family) {
    case "red":
      return { OR: [{ colorHue: { gte: 350 } }, { colorHue: { lte: 10 } }] };
    case "orange":
      return { colorHue: { gt: 10, lte: 40 } };
    case "yellow":
      return { colorHue: { gt: 40, lte: 65 } };
    case "green":
      return { colorHue: { gt: 65, lte: 170 } };
    case "blue":
      return { colorHue: { gt: 170, lte: 250 } };
    case "violet":
      return { colorHue: { gt: 250, lte: 290 } };
    case "pink":
      return { colorHue: { gt: 290, lte: 350 } };
    case "brown":
      return { colorHue: { gt: 10, lte: 50 }, colorSaturation: { lte: 45 }, colorLightness: { lte: 45 } };
  }
}

export interface GemFilters {
  q?: string;
  mineral?: string[];
  cut?: string[];
  clarity?: string[];
  treatment?: string[];
  origin?: string[];
  color?: GemColorFamily[];
  minCarat?: number;
  maxCarat?: number;
  /** Matches whichever price is actually shown for an item — retailPrice
   * when set, else the quote-reference price when showPrice is on — same
   * precedence CardPrice/ProductPrice use for display. An item with
   * neither never matches a price filter, same as it never shows a price
   * on its card. */
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  /** Only items in the currently *live* promotional collection — see
   * getActivePromotionMaps. Off (or nothing live right now) means no
   * filtering by this at all, same as every other optional filter here. */
  promotionalOnly?: boolean;
  sort?: "newest" | "carat" | "az" | "price-low" | "price-high";
  page?: number;
}

export async function getGemstones(filters: GemFilters) {
  const where: Prisma.GemstoneWhereInput = { isPublished: true };
  // Separate from `where`'s own top-level fields: several of these filters
  // (search, colour, price) are themselves OR-blocks, and Prisma ANDs a
  // where object's own keys together with its `AND` array rather than
  // merging OR blocks into one, so each has to stay its own array entry
  // instead of overwriting a single `where.OR`.
  const andConditions: Prisma.GemstoneWhereInput[] = [];

  if (filters.q) {
    andConditions.push({
      OR: [
        { name: { contains: filters.q, mode: "insensitive" } },
        { description: { contains: filters.q, mode: "insensitive" } },
        { variety: { contains: filters.q, mode: "insensitive" } },
        { mineral: { name: { contains: filters.q, mode: "insensitive" } } },
      ],
    });
  }
  if (filters.mineral?.length) where.mineral = { slug: { in: filters.mineral } };
  if (filters.cut?.length) where.cut = { slug: { in: filters.cut } };
  if (filters.clarity?.length) where.clarityGrade = { slug: { in: filters.clarity } };
  if (filters.treatment?.length) where.treatment = { slug: { in: filters.treatment } };
  if (filters.origin?.length) where.origin = { slug: { in: filters.origin } };
  if (filters.color?.length) andConditions.push({ OR: filters.color.map(colorFamilyWhere) });
  if (filters.minCarat || filters.maxCarat) {
    where.caratWeight = {
      gte: filters.minCarat ?? undefined,
      lte: filters.maxCarat ?? undefined,
    };
  }
  if (filters.minPrice != null || filters.maxPrice != null) {
    const range = { gte: filters.minPrice ?? undefined, lte: filters.maxPrice ?? undefined };
    andConditions.push({
      OR: [{ retailPrice: range }, { AND: [{ retailPrice: null }, { showPrice: true }, { price: range }] }],
    });
  }
  if (filters.inStockOnly) where.stockStatus = "AVAILABLE";
  if (filters.promotionalOnly) {
    const { gemstonePrices } = await getActivePromotionMaps();
    // `in: []` correctly matches nothing rather than being ignored, so
    // this still filters down to zero results when nothing's live —
    // same as any other filter that happens to match nothing.
    where.id = { in: [...gemstonePrices.keys()] };
  }
  if (andConditions.length) where.AND = andConditions;

  const orderBy: Prisma.GemstoneOrderByWithRelationInput =
    filters.sort === "carat" ? { caratWeight: "desc" }
    : filters.sort === "az" ? { name: "asc" }
    : filters.sort === "price-low" ? { retailPrice: "asc" }
    : filters.sort === "price-high" ? { retailPrice: "desc" }
    : { createdAt: "desc" };

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
  pieceType?: string[];
  metalType?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  /** See GemFilters.promotionalOnly — same rule, the jewelry side. */
  promotionalOnly?: boolean;
  sort?: "newest" | "az" | "price-low" | "price-high";
  page?: number;
}

export async function getJewelry(filters: JewelryFilters) {
  const where: Prisma.JewelryPieceWhereInput = { isPublished: true };
  // See GemFilters' own getGemstones for why search/price live in their
  // own AND entries rather than directly on `where`.
  const andConditions: Prisma.JewelryPieceWhereInput[] = [];

  if (filters.q) {
    andConditions.push({
      OR: [
        { name: { contains: filters.q, mode: "insensitive" } },
        { description: { contains: filters.q, mode: "insensitive" } },
      ],
    });
  }
  if (filters.pieceType?.length) where.pieceType = { in: filters.pieceType as never[] };
  if (filters.metalType?.length) where.metalType = { in: filters.metalType as never[] };
  if (filters.minPrice != null || filters.maxPrice != null) {
    const range = { gte: filters.minPrice ?? undefined, lte: filters.maxPrice ?? undefined };
    andConditions.push({
      OR: [{ retailPrice: range }, { AND: [{ retailPrice: null }, { showPrice: true }, { price: range }] }],
    });
  }
  if (filters.inStockOnly) where.stockStatus = "AVAILABLE";
  if (filters.promotionalOnly) {
    const { jewelryPrices } = await getActivePromotionMaps();
    where.id = { in: [...jewelryPrices.keys()] };
  }
  if (andConditions.length) where.AND = andConditions;

  const orderBy: Prisma.JewelryPieceOrderByWithRelationInput =
    filters.sort === "az" ? { name: "asc" }
    : filters.sort === "price-low" ? { retailPrice: "asc" }
    : filters.sort === "price-high" ? { retailPrice: "desc" }
    : { createdAt: "desc" };

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
