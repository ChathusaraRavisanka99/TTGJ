import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Plain server-rendered wayfinding trail for deep catalog pages (gem/jewelry
 * detail) — competitor research (Blue Nile, Brilliant Earth) consistently
 * uses this to let a shopper jump back to a category without the browser
 * back button, which loses filter state on this site's plain GET-form
 * filter bars. The last item is always the current page (no link, `aria-current`).
 */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-charcoal/65">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={12} className="shrink-0 text-charcoal/25" aria-hidden />}
          {item.href ? (
            <Link href={item.href} className="hover:text-charcoal hover:underline">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="text-charcoal/70">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
