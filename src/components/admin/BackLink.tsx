import Link from "@/components/ui/MarketLink";
import { ArrowLeft } from "lucide-react";

/** Consistent "back to the list this page was reached from" link — sits just
 * above the page's own <h1>. Despite living under components/admin, this is
 * also the account hub's back link (quotes/sourcing/orders detail pages);
 * the app's market-aware Link is a no-op for /admin/... hrefs (excluded in
 * withMarket) but correctly keeps an /account/... href inside /lk when
 * viewed from there. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-1.5 text-sm text-charcoal/55 transition-colors hover:text-charcoal"
    >
      <ArrowLeft size={14} /> {label}
    </Link>
  );
}
