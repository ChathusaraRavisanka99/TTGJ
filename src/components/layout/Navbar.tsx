"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/gems", label: "Gems" },
  { href: "/jewelry", label: "Jewelry" },
  { href: "/configurator", label: "Design Your Gem" },
  { href: "/sourcing", label: "Sourcing" },
  { href: "/about", label: "Our Story" },
];

export function Navbar({ user }: { user: { name?: string | null; email?: string | null } | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isHome = pathname === "/";
  const transparent = isHome && !scrolled && !open;

  useEffect(() => {
    if (!isHome) {
      setScrolled(true);
      return;
    }
    setScrolled(window.scrollY > window.innerHeight * 0.7);
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.7);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-colors duration-500",
        transparent ? "border-b border-transparent bg-transparent" : "border-b border-border-subtle bg-ivory/90 backdrop-blur-sm"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link
          href="/"
          className={cn(
            "font-serif text-2xl tracking-wide transition-colors duration-500",
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
                "relative text-sm tracking-wide transition-colors duration-500 after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-gold after:transition-all after:duration-300 hover:after:w-full",
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
              "flex items-center gap-2 text-sm transition-colors duration-500",
              transparent ? "text-ivory/85 hover:text-ivory" : "text-charcoal/80 hover:text-charcoal"
            )}
          >
            <User size={16} />
            {user ? user.name?.split(" ")[0] ?? "Account" : "Sign in"}
          </Link>
        </div>

        <button
          className={cn("md:hidden transition-colors duration-500", transparent ? "text-ivory" : "text-charcoal")}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-border-subtle bg-ivory px-5 py-4 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="py-2 text-sm text-charcoal/80" onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link href={user ? "/account" : "/account/login"} className="py-2 text-sm text-charcoal/80" onClick={() => setOpen(false)}>
            {user ? "My Account" : "Sign in"}
          </Link>
        </nav>
      )}
    </header>
  );
}
