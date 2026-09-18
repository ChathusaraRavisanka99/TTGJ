"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Menu, X, User, ShoppingBag, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccountMenu, ACCOUNT_MENU_LINKS } from "@/components/layout/AccountMenu";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { signOutAction } from "@/actions/auth";
import type { AppLocale } from "@/i18n/request";

// `key` looks up the label in messages/*.json's "nav" namespace (see
// useTranslations("nav") below) — kept separate from `href` since a route
// path is never itself translated, only the link text is.
const BASE_NAV_LINKS = [
  { href: "/gems", key: "gems" },
  { href: "/jewelry", key: "jewelry" },
  { href: "/configurator", key: "configurator" },
  { href: "/sourcing", key: "sourcing" },
  { href: "/about", key: "about" },
] as const;

const PROMOTIONS_LINK = { href: "/promotions", key: "promotions" } as const;
const AUCTION_LINK = { href: "/auction", key: "auctions" } as const;

// Solidify almost as soon as the page moves, on the home page specifically
// — its hero's own headline sits well within the first ~150px, so a
// threshold based on viewport height (e.g. "70% scrolled") leaves a wide
// window where that text scrolls up underneath the still-transparent nav
// and visibly collides with it.
const SOLID_THRESHOLD_PX = 24;

// Every other route that gets the transparent-over-hero treatment has a
// full min-h-dvh hero (see AlternativeCollectionPage and the promotions
// pages) rather than home's short one, so solidifying at the same tiny
// pixel offset would turn the nav solid while most of that hero image is
// still on screen below it. This instead waits until the hero itself is
// nearly scrolled past — clamped so a very short viewport (landscape
// phone) still gets a sane minimum.
function solidThresholdFor(isHome: boolean): number {
  return isHome ? SOLID_THRESHOLD_PX : Math.max(200, window.innerHeight - 120);
}

// Routes whose own first section is a full-bleed hero — same list
// MainWrapper uses for its own "no top padding" treatment (see its own
// comment), reused here since a transparent-until-scrolled nav only makes
// sense over that same hero. Deliberately narrower than MainWrapper's own
// list: /about and /sourcing use a *light* hero image, where light
// ivory nav text wouldn't stay legible the way it does over these
// pages' dark ones. /promotions and /promotions/collection are handled
// separately below — their hero's darkness depends on the active
// seasonal theme (see promotionsThemeIsDark).
const TRANSPARENT_NAV_ROUTES = ["/"];
const PROMOTIONS_ROUTES = ["/promotions", "/promotions/collection"];

export function Navbar({
  user,
  showPromotions,
  showAuction,
  cartItemCount,
  promotionsThemeIsDark,
  locale,
}: {
  user: { name?: string | null; email?: string | null } | null;
  /** True when the seasonal promotions page is Coming Soon or Live (see
   * PageVisibility, key "seasonal") — Hidden means no link at all,
   * matching the page itself not existing publicly. */
  showPromotions: boolean;
  /** Same idea as showPromotions, for the /auction page (PageVisibility
   * key "auction"). */
  showAuction: boolean;
  /** Retail (shopping) cart item count — 0 when signed out, in which
   * case the icon itself is still shown (it just links to sign in). */
  cartItemCount: number;
  /** Whether the currently-active seasonal theme's hero is dark (see
   * SeasonalThemeDef.isDark) — only then is transparent ivory nav text
   * legible over /promotions and /promotions/collection. Halloween is
   * dark; Spring/Summer/Autumn/Winter are light. */
  promotionsThemeIsDark: boolean;
  /** The active UI language — see SiteChrome's own comment. */
  locale: AppLocale;
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navLinks = [
    ...BASE_NAV_LINKS.slice(0, 4),
    ...(showAuction ? [AUCTION_LINK] : []),
    ...(showPromotions ? [PROMOTIONS_LINK] : []),
    ...BASE_NAV_LINKS.slice(4),
  ];
  const isHome = pathname === "/";
  const isTransparentRoute =
    TRANSPARENT_NAV_ROUTES.includes(pathname) ||
    pathname.startsWith("/collections/") ||
    (promotionsThemeIsDark && PROMOTIONS_ROUTES.includes(pathname));
  // `pathname` is stable across the server/client render (Next.js resolves
  // it before hydration), so this initial value never mismatches — only the
  // actual scroll position is genuinely client-only.
  const [scrolled, setScrolled] = useState(!isTransparentRoute);
  // Close on navigation (covers back/forward too, not just link clicks —
  // those already call setOpen(false) directly). Adjusted during render
  // (React's documented pattern for "reset state when a prop changes")
  // rather than in an effect, which would set state synchronously right
  // after the first render and trigger an extra one.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (open) setOpen(false);
    // Navbar persists across navigations (it lives outside MainWrapper's
    // per-route remount), so without this, arriving at a fresh
    // full-bleed-hero page could inherit whatever `scrolled` the
    // *previous* page's scroll position had left behind, rather than
    // starting transparent the way a real first paint of that page would.
    setScrolled(!isTransparentRoute);
  }

  const transparent = isTransparentRoute && !scrolled && !open;

  useEffect(() => {
    if (!isTransparentRoute) return;
    const onScroll = () => setScrolled(window.scrollY > solidThresholdFor(isHome));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isTransparentRoute, isHome]);

  // The open menu is a full-screen takeover (below), so background
  // content must not scroll underneath it — otherwise a swipe against the
  // menu can scroll the page behind it (most noticeable as iOS Safari
  // rubber-banding), and the CTA buttons peeking out from under a
  // non-full-screen menu would otherwise stay tappable through it.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <motion.header
      initial={false}
      animate={{
        backgroundColor: transparent ? "rgba(33,29,26,0)" : "rgba(250,247,241,0.92)",
        boxShadow: transparent ? "0 1px 0 rgba(255,255,255,0)" : "0 1px 0 rgba(33,29,26,0.08)",
      }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "fixed top-0 z-50 w-full backdrop-blur-sm",
        transparent && !open && "backdrop-blur-0",
        // Full-viewport-height flex column while open, so the dropdown
        // below can fill "the rest of the screen" (flex-1) without a
        // hardcoded height that would need to match the row's own height
        // by hand.
        open && "flex h-dvh flex-col overflow-hidden bg-ivory",
      )}
    >
      <div className="mx-auto flex w-full max-w-[120rem] shrink-0 items-center justify-between px-5 py-5 sm:px-8 lg:px-12 xl:px-16">
        <Link
          href="/"
          className={cn(
            "font-serif text-2xl tracking-wide transition-colors duration-300",
            transparent ? "text-ivory" : "text-charcoal"
          )}
        >
          Ratnavue
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative pb-1 text-sm tracking-wide transition-colors duration-300 after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-gold after:transition-all after:duration-300 hover:after:w-full",
                  transparent ? "text-ivory/85 hover:text-ivory" : "text-charcoal/75 hover:text-charcoal",
                  active && (transparent ? "text-ivory" : "text-charcoal font-medium")
                )}
              >
                {t(link.key)}
                {/* Shared layoutId — Framer Motion tracks this element's
                    identity across renders and animates it from wherever it
                    was (under the previously active link) to wherever it now
                    is, instead of the underline just snapping from link to
                    link the way the hover-only `after:` pseudo-element does. */}
                {active && (
                  <motion.span
                    layoutId="navbar-active-indicator"
                    className={cn("absolute -bottom-1 left-0 h-px w-full", transparent ? "bg-ivory" : "bg-gold")}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <HeaderSearch transparent={transparent} />
          <Link
            href={user ? "/account/retail-cart" : "/account/login?callbackUrl=%2Faccount%2Fretail-cart"}
            aria-label={t("cart")}
            className={cn(
              "relative transition-colors duration-300",
              transparent ? "text-ivory/85 hover:text-ivory" : "text-charcoal/80 hover:text-charcoal"
            )}
          >
            <ShoppingBag size={19} />
            {cartItemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-medium text-charcoal">
                {cartItemCount > 99 ? "99+" : cartItemCount}
              </span>
            )}
          </Link>
          {user && <NotificationBell transparent={transparent} />}
          {user ? (
            <AccountMenu user={user} transparent={transparent} />
          ) : (
            <Link
              href="/account/login"
              className={cn(
                "flex items-center gap-2 text-sm transition-colors duration-300",
                transparent ? "text-ivory/85 hover:text-ivory" : "text-charcoal/80 hover:text-charcoal"
              )}
            >
              <User size={16} />
              {t("signIn")}
            </Link>
          )}
          <LocaleSwitcher locale={locale} transparent={transparent} />
        </div>

        <div className="flex items-center gap-4 md:hidden">
          <Link
            href={user ? "/account/retail-cart" : "/account/login?callbackUrl=%2Faccount%2Fretail-cart"}
            aria-label={t("cart")}
            className={cn("relative transition-colors duration-300", transparent ? "text-ivory" : "text-charcoal")}
          >
            <ShoppingBag size={21} />
            {cartItemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-medium text-charcoal">
                {cartItemCount > 99 ? "99+" : cartItemCount}
              </span>
            )}
          </Link>
          {user && <NotificationBell transparent={transparent} size={21} />}
          <LocaleSwitcher locale={locale} transparent={transparent} />
          <button
            className={cn("transition-colors duration-300", transparent ? "text-ivory" : "text-charcoal")}
            onClick={() => setOpen((v) => !v)}
            aria-label={t("toggleMenu")}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto border-t border-border-subtle bg-ivory px-5 py-4 md:hidden">
          <form action="/search" method="get" className="mb-2 flex items-center gap-2 border-b border-border-subtle pb-3">
            <Search size={16} className="shrink-0 text-charcoal/40" />
            <input
              name="q"
              placeholder="Search gems, jewelry..."
              className="w-full bg-transparent text-sm text-charcoal outline-none placeholder:text-charcoal/40"
            />
          </form>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "py-3 text-sm text-charcoal/80",
                pathname.startsWith(link.href) && "font-medium text-charcoal"
              )}
              onClick={() => setOpen(false)}
            >
              {t(link.key)}
            </Link>
          ))}
          {user ? (
            <>
              <div className="mt-2 border-t border-border-subtle pt-2">
                {ACCOUNT_MENU_LINKS.map((link) => {
                  const active = pathname === link.href;
                  // Same "already here, so show it rather than link it"
                  // treatment as the desktop AccountMenu dropdown — see
                  // its own comment for the reasoning.
                  if (active) {
                    return (
                      <span key={link.href} aria-current="page" className="block cursor-default py-3 text-sm font-medium text-charcoal">
                        {link.label}
                      </span>
                    );
                  }
                  return (
                    <Link key={link.href} href={link.href} className="block py-3 text-sm text-charcoal/80" onClick={() => setOpen(false)}>
                      {link.label}
                    </Link>
                  );
                })}
              </div>
              {/* No onClick={() => setOpen(false)} here (unlike the Links
                  above) — closing the menu is a state update that
                  unmounts this very form mid-click, which raced with and
                  silently swallowed the submit before signOutAction ever
                  ran (verified live: the session cookie survived the
                  click). signOutAction's own redirectTo navigates away
                  once it actually completes, which closes this menu by
                  replacing the whole page — no manual close needed. */}
              <form action={signOutAction}>
                <button type="submit" className="py-3 text-left text-sm text-charcoal/60">
                  {t("signOut")}
                </button>
              </form>
            </>
          ) : (
            <Link href="/account/login" className="py-3 text-sm text-charcoal/80" onClick={() => setOpen(false)}>
              {t("signIn")}
            </Link>
          )}
        </nav>
      )}
    </motion.header>
  );
}
