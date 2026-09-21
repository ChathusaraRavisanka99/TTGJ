"use client";

import { createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import { MARKETS, stripMarket, type Market } from "@/lib/market-shared";

const MarketContext = createContext<Market>("intl");

// Read once in RootLayout (server) and handed down, so client components —
// MarketLink, the navbar, the market switcher — know which storefront
// they're in without parsing the URL themselves.
export function MarketProvider({ market, children }: { market: Market; children: React.ReactNode }) {
  return <MarketContext.Provider value={market}>{children}</MarketContext.Provider>;
}

export function useMarket(): Market {
  return useContext(MarketContext);
}

/** "USD" on the international site, "LKR" on /lk — feeds formatPrice. */
export function useCurrency(): "USD" | "LKR" {
  return MARKETS[useContext(MarketContext)].currency;
}

/**
 * usePathname() with the market prefix removed, so route checks written
 * against the international paths ("/", "/gems", "/collections/…") keep
 * working unchanged on /lk. Handles both possibilities for what the client
 * router reports after proxy.ts's rewrite (the browser's "/lk/gems" or the
 * rewritten "/gems") — stripMarket is a no-op on an unprefixed path.
 */
export function useAppPathname(): string {
  return stripMarket(usePathname());
}
