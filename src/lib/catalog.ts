import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
  sort?: "newest" | "carat" | "az";
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

  const orderBy: Prisma.GemstoneOrderByWithRelationInput =
    filters.sort === "carat" ? { caratWeight: "desc" } : filters.sort === "az" ? { name: "asc" } : { createdAt: "desc" };

  return prisma.gemstone.findMany({
    where,
    orderBy,
    include: {
      mineral: true,
      cut: true,
      clarityGrade: true,
      treatment: true,
      origin: true,
      media: { orderBy: { sortOrder: "asc" } },
    },
  });
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

export interface JewelryFilters {
  q?: string;
  pieceType?: string;
  metalType?: string;
  inStockOnly?: boolean;
  sort?: "newest" | "az";
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

  const orderBy: Prisma.JewelryPieceOrderByWithRelationInput = filters.sort === "az" ? { name: "asc" } : { createdAt: "desc" };

  return prisma.jewelryPiece.findMany({
    where,
    orderBy,
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      gemstones: { include: { gemstone: true } },
    },
  });
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
