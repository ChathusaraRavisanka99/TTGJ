// Pure market helpers — safe to import from client components (the
// server-only piece, getMarket(), lives in market.ts because it reads
// request headers).
//
// The site has two storefronts served by one codebase: the international
// site at `/…` and the Sri Lanka store at `/lk/…`. proxy.ts strips the `/lk`
// prefix and rewrites to the same route, stamping the request with an
// `x-market` header; everything downstream reads the market from that
// header (server) or MarketProvider (client) rather than from the URL.

export type Market = "intl" | "lk";

export const MARKET_HEADER = "x-market";
export const LK_PREFIX = "/lk";

export const MARKETS: Record<Market, { label: string; currency: "USD" | "LKR"; prefix: string; defaultLocale: string }> = {
  intl: { label: "International", currency: "USD", prefix: "", defaultLocale: "en" },
  lk: { label: "Sri Lanka", currency: "LKR", prefix: LK_PREFIX, defaultLocale: "en" },
};

export function isLkPath(pathname: string): boolean {
  return pathname === LK_PREFIX || pathname.startsWith(`${LK_PREFIX}/`);
}

// Root-relative targets that are never market-prefixed: API routes, uploaded
// media, static public assets, Next internals, and the admin portal (admin
// is one shared back office, not part of either storefront).
const UNPREFIXED = /^\/(api|media|images|_next|admin)(\/|\?|#|$)/;

/**
 * Prefixes a root-relative path with the market's URL prefix. Anything that
 * isn't a plain internal path (external URLs, `#anchors`, `mailto:`,
 * protocol-relative `//host`) or is already prefixed is returned unchanged,
 * so this is safe to apply to any href.
 */
export function withMarket(path: string, market: Market): string {
  if (market !== "lk") return path;
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  const alreadyPrefixed = isLkPath(path.split(/[?#]/)[0]);
  if (!alreadyPrefixed && !UNPREFIXED.test(path)) {
    if (path === "/") return withCallback(LK_PREFIX, market);
    // "/?x=1" and "/#top" -> "/lk?x=1" and "/lk#top"
    path = path.startsWith("/?") || path.startsWith("/#") ? LK_PREFIX + path.slice(1) : LK_PREFIX + path;
  }
  return withCallback(path, market);
}

// Login/redirect links carry the page to return to as a query param
// (`/account/login?callbackUrl=/account/retail-cart`). The link's own path
// gets the market prefix above, but this value would otherwise still point
// at the international site — a Sri Lankan customer would sign in and be
// bounced out of their storefront. Rewritten with the same rules.
function withCallback(path: string, market: Market): string {
  if (!path.includes("callbackUrl=")) return path;
  const url = new URL(path, "http://market.local");
  const callback = url.searchParams.get("callbackUrl");
  if (!callback?.startsWith("/")) return path;
  url.searchParams.set("callbackUrl", withMarket(callback, market));
  return url.pathname + url.search + url.hash;
}

/** The inverse: "/lk/gems" -> "/gems", "/lk" -> "/". Non-/lk paths pass through. */
export function stripMarket(pathname: string): string {
  if (pathname === LK_PREFIX) return "/";
  if (pathname.startsWith(`${LK_PREFIX}/`)) return pathname.slice(LK_PREFIX.length);
  return pathname;
}

/** PageContent / PageVisibility key for a market: "home" stays "home"; on /lk it's "lk:home". */
export function marketKey(key: string, market: Market): string {
  return market === "lk" ? `lk:${key}` : key;
}
