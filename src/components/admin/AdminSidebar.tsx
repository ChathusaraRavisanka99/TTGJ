"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/gems", label: "Gemstones" },
  { href: "/admin/jewelry", label: "Jewelry" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/quotes", label: "Quote Requests" },
  { href: "/admin/sourcing", label: "Sourcing Requests" },
  { href: "/admin/carts", label: "Submitted Carts" },
  { href: "/admin/discount-codes", label: "Discount Codes" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/customers", label: "Customers" },
];

const MASTER_DATA = [
  { href: "/admin/master-data/minerals", label: "Minerals" },
  { href: "/admin/master-data/cuts", label: "Cuts" },
  { href: "/admin/master-data/clarity", label: "Clarity Scale" },
  { href: "/admin/master-data/treatments", label: "Treatments" },
  { href: "/admin/master-data/origins", label: "Origins" },
  { href: "/admin/master-data/certification-labs", label: "Certification Labs" },
];

const PAGE_CONTENT = [
  { href: "/admin/content/home", label: "Home Page" },
  { href: "/admin/content/about", label: "About Page" },
  { href: "/admin/promotions", label: "Seasonal Promotions" },
];

// Shared by both the always-visible desktop sidebar and the mobile
// full-screen drawer, so the two link lists can't drift apart.
function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  function section(items: typeof NAV) {
    return items.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "block rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/10 hover:text-ivory",
          isActive(item.href, item.exact) && "bg-white/10 text-ivory"
        )}
      >
        {item.label}
      </Link>
    ));
  }

  return (
    <>
      <div className="space-y-1">{section(NAV)}</div>

      <p className="mt-8 px-3 text-xs uppercase tracking-wide text-ivory/40">Master Data</p>
      <div className="mt-2 space-y-1">{section(MASTER_DATA)}</div>

      <p className="mt-8 px-3 text-xs uppercase tracking-wide text-ivory/40">CMS</p>
      <div className="mt-2 space-y-1">{section(PAGE_CONTENT)}</div>

      <Link href="/" onClick={onNavigate} className="mt-8 block px-3 text-xs text-ivory/40 hover:text-ivory/70">
        ← Back to storefront
      </Link>

      {/* Admin had no sign-out affordance anywhere in /admin/* before this —
          the only way out was to already know to go to /account first. */}
      <form action={signOutAction} className="mt-2">
        <button
          type="submit"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-ivory/40 transition-colors hover:text-ivory/70"
        >
          <LogOut size={13} /> Sign Out
        </button>
      </form>
    </>
  );
}

function Logo({ children }: { children: ReactNode }) {
  return (
    <Link href="/admin" className="block px-2 font-serif text-xl text-ivory">
      {children}
    </Link>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the drawer on navigation. Adjusted during render (React's
  // documented pattern for "reset state when a prop changes") rather than
  // in an effect, which would set state synchronously right after the
  // first render and trigger an extra one.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      {/* Mobile top bar: the permanent 240px desktop sidebar has no room on
          a phone screen — it used to render unconditionally and squeeze
          every admin page's real content into a ~130px sliver. Below lg,
          navigation instead lives behind this bar's toggle. */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-charcoal px-4 py-3 print:hidden lg:hidden">
        <Logo>Ratnavue Admin</Logo>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle admin menu"
          className="text-ivory"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-charcoal px-4 py-8 text-ivory/80 lg:hidden">
          <div className="flex items-center justify-between px-2">
            <Logo>Ratnavue Admin</Logo>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="text-ivory">
              <X size={22} />
            </button>
          </div>
          <div className="mt-8">
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar — unchanged from before, just now gated to lg+
          instead of always rendering. */}
      <nav className="hidden w-60 shrink-0 border-r border-white/10 bg-charcoal px-4 py-8 text-ivory/80 print:hidden lg:block">
        <Logo>Ratnavue Admin</Logo>
        <div className="mt-8">
          <NavLinks pathname={pathname} />
        </div>
      </nav>
    </>
  );
}
