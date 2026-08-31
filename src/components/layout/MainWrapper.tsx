"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * The Navbar is fixed (not sticky) so it can float transparently over the
 * homepage's full-bleed hero. Every other page needs top padding to clear
 * it, since fixed elements are pulled out of document flow.
 */
export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  return <main className={cn("flex-1", !isHome && "pt-24")}>{children}</main>;
}
