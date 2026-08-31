"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * The Navbar is fixed (not sticky) so it can float transparently over the
 * homepage's full-bleed hero. Every other storefront page needs top padding
 * to clear it, since fixed elements are pulled out of document flow. Admin
 * routes render their own chrome (see SiteChrome) and never show the public
 * Navbar at all, so they need neither the home treatment nor the padding.
 */
export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isAdmin = pathname.startsWith("/admin");
  return <main className={cn("flex-1", !isHome && !isAdmin && "pt-24")}>{children}</main>;
}
