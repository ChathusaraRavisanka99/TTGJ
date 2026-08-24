"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/gems", label: "Gemstones" },
  { href: "/admin/jewelry", label: "Jewelry" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/quotes", label: "Quote Requests" },
  { href: "/admin/sourcing", label: "Sourcing Requests" },
  { href: "/admin/customers", label: "Customers" },
];

const MASTER_DATA = [
  { href: "/admin/master-data/minerals", label: "Minerals" },
  { href: "/admin/master-data/cuts", label: "Cuts" },
  { href: "/admin/master-data/clarity", label: "Clarity Scale" },
  { href: "/admin/master-data/treatments", label: "Treatments" },
  { href: "/admin/master-data/origins", label: "Origins" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  return (
    <nav className="w-60 shrink-0 border-r border-white/10 bg-charcoal px-4 py-8 text-ivory/80">
      <Link href="/admin" className="block px-2 font-serif text-xl text-ivory">
        Ratnavue Admin
      </Link>

      <div className="mt-8 space-y-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/10 hover:text-ivory",
              isActive(item.href, item.exact) && "bg-white/10 text-ivory"
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <p className="mt-8 px-3 text-xs uppercase tracking-wide text-ivory/40">Master Data</p>
      <div className="mt-2 space-y-1">
        {MASTER_DATA.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/10 hover:text-ivory",
              isActive(item.href) && "bg-white/10 text-ivory"
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <Link href="/" className="mt-8 block px-3 text-xs text-ivory/40 hover:text-ivory/70">
        ← Back to storefront
      </Link>
    </nav>
  );
}
