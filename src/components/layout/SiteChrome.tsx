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
  children,
}: {
  user: SiteChromeUser | null;
  /** Computed once on the server (RootLayout) and threaded through as a
   * plain prop — see Footer.tsx for why this can't just call
   * `new Date().getFullYear()` itself. */
  year: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <IntroLoader />
      <Navbar user={user} />
      {children}
      <Footer year={year} />
    </>
  );
}
