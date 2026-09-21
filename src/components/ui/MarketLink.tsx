"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { useMarket } from "@/components/providers/MarketProvider";
import { withMarket } from "@/lib/market-shared";

/**
 * Drop-in replacement for next/link that keeps a visitor inside their
 * storefront: on the Sri Lanka store every internal href gains the `/lk`
 * prefix (see withMarket for what is deliberately left alone — external
 * URLs, anchors, /api, /media, /admin). Imported as `Link` across the
 * storefront so no call site needs to know about markets.
 */
export default function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const market = useMarket();
  const resolved =
    typeof href === "string"
      ? withMarket(href, market)
      : { ...href, pathname: typeof href.pathname === "string" ? withMarket(href.pathname, market) : href.pathname };
  return <NextLink href={resolved} {...props} />;
}
