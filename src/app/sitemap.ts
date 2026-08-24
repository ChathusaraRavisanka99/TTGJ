import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.AUTH_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [gems, jewelry] = await Promise.all([
    prisma.gemstone.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    prisma.jewelryPiece.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/gems`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/jewelry`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/configurator`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/sourcing`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const gemRoutes: MetadataRoute.Sitemap = gems.map((g) => ({
    url: `${BASE_URL}/gems/${g.slug}`,
    lastModified: g.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const jewelryRoutes: MetadataRoute.Sitemap = jewelry.map((j) => ({
    url: `${BASE_URL}/jewelry/${j.slug}`,
    lastModified: j.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...gemRoutes, ...jewelryRoutes];
}
