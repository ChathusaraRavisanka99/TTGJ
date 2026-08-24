"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-ivory/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="font-serif text-2xl tracking-wide text-charcoal">
          Ratnavue
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm tracking-wide text-charcoal/75 transition-colors hover:text-charcoal",
                pathname.startsWith(link.href) && "text-charcoal font-medium"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href={user ? "/account" : "/account/login"}
            className="flex items-center gap-2 text-sm text-charcoal/80 hover:text-charcoal"
          >
            <User size={16} />
            {user ? user.name?.split(" ")[0] ?? "Account" : "Sign in"}
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
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
