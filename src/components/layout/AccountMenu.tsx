"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { User, ChevronDown } from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";

const MENU_LINKS = [
  { href: "/account", label: "My Account" },
  { href: "/account/retail-cart", label: "My Cart" },
  { href: "/account/orders", label: "My Orders" },
  { href: "/account/quotes", label: "My Quote Requests" },
  { href: "/account/sourcing", label: "My Sourcing Requests" },
];

export function AccountMenu({ user, transparent }: { user: { name?: string | null }; transparent: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 text-sm transition-colors duration-300",
          transparent ? "text-ivory/85 hover:text-ivory" : "text-charcoal/80 hover:text-charcoal",
        )}
      >
        <User size={16} />
        {user.name?.split(" ")[0] ?? "Account"}
        <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-border-subtle bg-surface py-1.5 shadow-lg">
          {MENU_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-charcoal/80 hover:bg-ivory-soft hover:text-charcoal"
            >
              {link.label}
            </Link>
          ))}
          <form action={signOutAction} className="border-t border-border-subtle mt-1 pt-1">
            <button type="submit" className="block w-full px-4 py-2 text-left text-sm text-charcoal/60 hover:bg-ivory-soft hover:text-charcoal">
              Sign Out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
