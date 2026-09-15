import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageVisibility, getPageVisibilities } from "@/lib/page-visibility";
import { getSubcultureContent } from "@/lib/subculture-content";
import { getCollectionItems, toCollectionCardData } from "@/lib/subculture-items";
import { SUBCULTURE_KEYS, SUBCULTURE_COLLECTIONS, isSubcultureKey, type SubcultureKey } from "@/lib/subculture-collections";
import { AlternativeCollectionPage } from "@/components/collections/AlternativeCollectionPage";

const BASE_URL = process.env.AUTH_URL ?? "http://localhost:3000";

export function generateStaticParams() {
  return SUBCULTURE_KEYS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (!isSubcultureKey(slug)) return {};
  const visibility = await getPageVisibility(slug);
  // Deliberately not indexed while Hidden — a direct visit still 404s
  // below, but this also keeps a stale cached metadata entry from ever
  // pointing search engines at a page that isn't there.
  if (visibility === "HIDDEN") return { robots: { index: false, follow: false } };

  const content = await getSubcultureContent(slug);
  const url = `${BASE_URL}/collections/${slug}`;
  return {
    title: content.seoTitle,
    description: content.seoDescription,
    alternates: { canonical: url },
    openGraph: {
      title: content.seoTitle,
      description: content.seoDescription,
      url,
      images: content.ogImage ? [{ url: content.ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: content.seoTitle,
      description: content.seoDescription,
      images: content.ogImage ? [content.ogImage] : undefined,
    },
  };
}

export default async function SubcultureCollectionPage({ params }: PageProps<"/collections/[slug]">) {
  const { slug } = await params;
  // Not one of the five (or future) registered keys at all — a plain 404,
  // same as any other unknown route.
  if (!isSubcultureKey(slug)) notFound();

  const visibility = await getPageVisibility(slug);
  // Hidden reads as though the route doesn't exist — same convention
  // /promotions and /auction already use (see getPageVisibility's own
  // doc comment: defaults to HIDDEN until an admin turns a page on).
  if (visibility === "HIDDEN") notFound();

  const [content, rows, visibilities] = await Promise.all([
    getSubcultureContent(slug),
    getCollectionItems(slug),
    getPageVisibilities([...SUBCULTURE_KEYS]),
  ]);

  const items = rows.map(toCollectionCardData).filter((item) => item !== null);
  const liveKeys = SUBCULTURE_KEYS.filter((key) => visibilities[key] === "LIVE") as SubcultureKey[];
  const theme = SUBCULTURE_COLLECTIONS[slug];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: content.seoTitle,
    description: content.seoDescription,
    url: `${BASE_URL}/collections/${slug}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.slice(0, 24).map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${BASE_URL}${item.href}`,
        name: item.name,
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AlternativeCollectionPage theme={theme} content={content} items={items} liveKeys={liveKeys} />
    </>
  );
}
