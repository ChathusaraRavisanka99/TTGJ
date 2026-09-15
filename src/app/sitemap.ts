import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getPageVisibilities } from "@/lib/page-visibility";
import { SUBCULTURE_KEYS } from "@/lib/subculture-collections";

const BASE_URL = process.env.AUTH_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [gems, jewelry, collectionVisibilities] = await Promise.all([
    prisma.gemstone.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    prisma.jewelryPiece.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    getPageVisibilities([...SUBCULTURE_KEYS]),
  ]);

  // The five hidden subculture collections: never linked from nav, but —
  // unlike /promotions, which deliberately omits itself here — these
  // should be discoverable by search engines once an admin turns one on,
  // per the brief's explicit ask. Hidden ones stay out entirely, same
  // "doesn't exist publicly yet" rule the page itself enforces.
  const collectionRoutes: MetadataRoute.Sitemap = SUBCULTURE_KEYS.filter((key) => collectionVisibilities[key] === "LIVE").map((key) => ({
    url: `${BASE_URL}/collections/${key}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

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

  return [...staticRoutes, ...gemRoutes, ...jewelryRoutes, ...collectionRoutes];
}
