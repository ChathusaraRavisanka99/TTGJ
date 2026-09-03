import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Consistent "back to the list this page was reached from" link, for
 * every admin detail/edit/new page — sits just above the page's own <h1>. */
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
