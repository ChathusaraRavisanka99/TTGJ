"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Menu, X, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/gems", label: "Gems" },
  { href: "/jewelry", label: "Jewelry" },
  { href: "/configurator", label: "Design Your Gem" },
  { href: "/sourcing", label: "Sourcing" },
  { href: "/about", label: "Our Story" },
];

// Solidify almost as soon as the page moves — the hero's own headline sits
// well within the first ~150px, so a threshold based on viewport height
// (e.g. "70% scrolled") leaves a wide window where that text scrolls up
// underneath the still-transparent nav and visibly collides with it.
const SOLID_THRESHOLD_PX = 24;

export function Navbar({ user }: { user: { name?: string | null; email?: string | null } | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isHome = pathname === "/";
  // `pathname` is stable across the server/client render (Next.js resolves
  // it before hydration), so this initial value never mismatches — only the
  // home page's actual scroll position is genuinely client-only.
  const [scrolled, setScrolled] = useState(!isHome);

  const transparent = isHome && !scrolled && !open;

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > SOLID_THRESHOLD_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  return (
    <motion.header
      initial={false}
      animate={{
        backgroundColor: transparent ? "rgba(33,29,26,0)" : "rgba(250,247,241,0.92)",
        boxShadow: transparent ? "0 1px 0 rgba(255,255,255,0)" : "0 1px 0 rgba(33,29,26,0.08)",
      }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      className={cn("fixed top-0 z-50 w-full backdrop-blur-sm", transparent && "backdrop-blur-0")}
    >
      <div className="mx-auto flex max-w-[120rem] items-center justify-between px-5 py-5 sm:px-8 lg:px-12 xl:px-16">
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
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative text-sm tracking-wide transition-colors duration-300 after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-gold after:transition-all after:duration-300 hover:after:w-full",
                transparent ? "text-ivory/85 hover:text-ivory" : "text-charcoal/75 hover:text-charcoal",
                pathname.startsWith(link.href) && (transparent ? "text-ivory after:w-full" : "text-charcoal font-medium after:w-full")
              )}
            >
              {link.label}
            </Link>
          ))}
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
        <nav className="flex flex-col gap-1 border-t border-border-subtle bg-ivory px-5 py-4 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="py-3 text-sm text-charcoal/80" onClick={() => setOpen(false)}>
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
