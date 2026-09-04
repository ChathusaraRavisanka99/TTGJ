import { prisma } from "@/lib/prisma";

// Every page gated by this mechanism, one place — a page picks its own
// key and this is the only spot that needs updating to register a new
// one. Not DB-enforced (PageVisibility.key is a plain string), just a
// safety net against a typo'd key silently doing nothing.
export const PAGE_VISIBILITY_KEYS = ["seasonal", "auction"] as const;
export type PageVisibilityKey = (typeof PAGE_VISIBILITY_KEYS)[number];

export type PageVisibilityState = "HIDDEN" | "COMING_SOON" | "LIVE";

/** Defaults to HIDDEN — a page nobody has touched in the admin yet
 * doesn't exist publicly, rather than accidentally shipping live. */
export async function getPageVisibility(key: PageVisibilityKey): Promise<PageVisibilityState> {
  const row = await prisma.pageVisibility.findUnique({ where: { key } });
  return row?.state ?? "HIDDEN";
}

/** Batch form for layouts that need several keys at once (e.g. the
 * Navbar deciding which of several teaser links to show) without a
 * request per key. */
export async function getPageVisibilities(keys: PageVisibilityKey[]): Promise<Record<string, PageVisibilityState>> {
  const rows = await prisma.pageVisibility.findMany({ where: { key: { in: keys } } });
  const result: Record<string, PageVisibilityState> = {};
  for (const key of keys) result[key] = "HIDDEN";
  for (const row of rows) result[row.key] = row.state;
  return result;
}
