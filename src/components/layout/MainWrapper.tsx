"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Routes whose own first section is a full-bleed hero starting at the very
// top of the page (same idea as the homepage hero) — these must NOT get the
// pt-24 nav-clearance padding below, or a strip of bare background shows up
// between the fixed Navbar and the top of their hero image.
const FULL_BLEED_HERO_ROUTES = ["/", "/about", "/sourcing"];

/**
 * The Navbar is fixed (not sticky) so it can float transparently over the
 * homepage's full-bleed hero. Every other storefront page needs top padding
 * to clear it, since fixed elements are pulled out of document flow. Admin
 * routes render their own chrome (see SiteChrome) and never show the public
 * Navbar at all, so they need neither the home treatment nor the padding.
 */
export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hasFullBleedHero = FULL_BLEED_HERO_ROUTES.includes(pathname);
  const isAdmin = pathname.startsWith("/admin");
  return <main className={cn("flex-1", !hasFullBleedHero && !isAdmin && "pt-24")}>{children}</main>;
}
