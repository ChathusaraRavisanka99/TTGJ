"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { IntroLoader } from "./IntroLoader";

interface SiteChromeUser {
  name?: string | null;
  email?: string | null;
}

/**
 * The public Navbar/Footer/IntroLoader wrap every route by default, but the
 * admin panel has its own self-contained shell (AdminSidebar + dark theme,
 * see admin/layout.tsx) — without this check, admin pages were rendering
 * sandwiched between the storefront's fixed nav and footer as well.
 */
export function SiteChrome({
  user,
  year,
  showPromotions,
  showAuction,
  cartItemCount,
  children,
}: {
  user: SiteChromeUser | null;
  /** Computed once on the server (RootLayout) and threaded through as a
   * plain prop — see Footer.tsx for why this can't just call
   * `new Date().getFullYear()` itself. */
  year: number;
  /** Whether the seasonal promotions page is Coming Soon or Live —
   * fetched once server-side in RootLayout (see PageVisibility) rather
   * than Navbar querying it itself, same "compute where it's cheap,
   * thread down as a plain prop" reasoning as `year`. */
  showPromotions: boolean;
  /** Same idea as showPromotions, for the /auction page's visibility. */
  showAuction: boolean;
  /** Retail (shopping) cart item count for the nav's cart badge — 0 when
   * signed out. Same "compute where it's cheap" reasoning as `year`. */
  cartItemCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <IntroLoader />
      <Navbar user={user} showPromotions={showPromotions} showAuction={showAuction} cartItemCount={cartItemCount} />
      {children}
      <Footer year={year} />
    </>
  );
}
