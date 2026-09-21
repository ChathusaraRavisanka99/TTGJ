import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MARKET_HEADER, withMarket, type Market } from "@/lib/market-shared";

export * from "@/lib/market-shared";

/**
 * The market of the current request. proxy.ts sets `x-market` on EVERY page
 * request (overwriting anything the client sent), so this can't be spoofed
 * by a caller-supplied header; a missing header — e.g. a route the proxy
 * matcher deliberately skips — means the international site.
 */
export async function getMarket(): Promise<Market> {
  const h = await headers();
  return h.get(MARKET_HEADER) === "lk" ? "lk" : "intl";
}

/** redirect() that keeps the visitor inside their storefront (/lk stays /lk). */
export async function redirectInMarket(path: string): Promise<never> {
  redirect(withMarket(path, await getMarket()));
}
