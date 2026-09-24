import { prisma } from "@/lib/prisma";
import { getPageContent, savePageContent } from "@/lib/page-content";

// Short "about this origin" editorial copy shown on a gemstone's product
// page (e.g. "About Ratnapura" for a Sri Lankan mining region) — plays to
// this business's real provenance advantage the way a competitor's
// blockchain-traceability storytelling plays to theirs. One PageContent
// row per Origin, keyed `origin:<id>`, same convention as subculture-
// content.ts's `collection:<key>` — an origin with no content written yet
// (headline empty) simply doesn't render the block, same graceful-empty
// convention as SubcultureContent's optional images.
export interface OriginContent {
  headline: string;
  body: string;
  image: string;
  imageAlt: string;
}

export const DEFAULT_ORIGIN_CONTENT: OriginContent = {
  headline: "",
  body: "",
  image: "",
  imageAlt: "",
};

function contentKey(originId: string): string {
  return `origin:${originId}`;
}

export async function getOriginContent(originId: string): Promise<OriginContent> {
  return getPageContent<OriginContent>(contentKey(originId), DEFAULT_ORIGIN_CONTENT);
}

// One batched query instead of N separate getOriginContent calls — used by
// the admin origins list to show which rows already have content written.
export async function getAllOriginContent(originIds: string[]): Promise<Map<string, OriginContent>> {
  if (originIds.length === 0) return new Map();
  const rows = await prisma.pageContent.findMany({ where: { page: { in: originIds.map(contentKey) } } });
  const byKey = new Map(rows.map((row) => [row.page, row.data]));
  const result = new Map<string, OriginContent>();
  for (const id of originIds) {
    const data = byKey.get(contentKey(id));
    result.set(id, data && typeof data === "object" ? { ...DEFAULT_ORIGIN_CONTENT, ...(data as Partial<OriginContent>) } : DEFAULT_ORIGIN_CONTENT);
  }
  return result;
}

export async function saveOriginContent(originId: string, data: Partial<OriginContent>): Promise<void> {
  const current = await getOriginContent(originId);
  await savePageContent(contentKey(originId), { ...current, ...data });
}
