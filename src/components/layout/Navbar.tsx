"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Menu, X, User } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_NAV_LINKS = [
  { href: "/gems", label: "Gems" },
  { href: "/jewelry", label: "Jewelry" },
  { href: "/configurator", label: "Design Your Gem" },
  { href: "/sourcing", label: "Sourcing" },
  { href: "/about", label: "Our Story" },
];

const PROMOTIONS_LINK = { href: "/promotions", label: "Promotions" };

// Solidify almost as soon as the page moves — the hero's own headline sits
// well within the first ~150px, so a threshold based on viewport height
// (e.g. "70% scrolled") leaves a wide window where that text scrolls up
// underneath the still-transparent nav and visibly collides with it.
const SOLID_THRESHOLD_PX = 24;

export function Navbar({
  user,
  showPromotions,
}: {
  user: { name?: string | null; email?: string | null } | null;
  /** True when the seasonal promotions page is Coming Soon or Live (see
   * PageVisibility, key "seasonal") — Hidden means no link at all,
   * matching the page itself not existing publicly. */
  showPromotions: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navLinks = showPromotions
    ? [...BASE_NAV_LINKS.slice(0, 4), PROMOTIONS_LINK, ...BASE_NAV_LINKS.slice(4)]
    : BASE_NAV_LINKS;
  const isHome = pathname === "/";
  // `pathname` is stable across the server/client render (Next.js resolves
  // it before hydration), so this initial value never mismatches — only the
  // home page's actual scroll position is genuinely client-only.
  const [scrolled, setScrolled] = useState(!isHome);
  // Close on navigation (covers back/forward too, not just link clicks —
  // those already call setOpen(false) directly). Adjusted during render
  // (React's documented pattern for "reset state when a prop changes")
  // rather than in an effect, which would set state synchronously right
  // after the first render and trigger an extra one.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (open) setOpen(false);
  }

  const transparent = isHome && !scrolled && !open;

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > SOLID_THRESHOLD_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

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
                {link.label}
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

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href={user ? "/account" : "/account/login"}
            className={cn(
              "flex items-center gap-2 text-sm transition-colors duration-300",
              transparent ? "text-ivory/85 hover:text-ivory" : "text-charcoal/80 hover:text-charcoal"
            )}
          >
            <User size={16} />
            {user ? user.name?.split(" ")[0] ?? "Account" : "Sign in"}
          </Link>
        </div>

        <button
          className={cn("md:hidden transition-colors duration-300", transparent ? "text-ivory" : "text-charcoal")}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto border-t border-border-subtle bg-ivory px-5 py-4 md:hidden">
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
              {link.label}
            </Link>
          ))}
          <Link href={user ? "/account" : "/account/login"} className="py-3 text-sm text-charcoal/80" onClick={() => setOpen(false)}>
            {user ? "My Account" : "Sign in"}
          </Link>
        </nav>
      )}
    </motion.header>
  );
}
