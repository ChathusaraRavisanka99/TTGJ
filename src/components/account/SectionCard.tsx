import type { ReactNode } from "react";
import Link from "@/components/ui/MarketLink";
import { cn } from "@/lib/utils";

/** A titled panel with an optional "View all →" link — the building block of the
 * account overview. */
export function SectionCard({
  title,
  href,
  hrefLabel = "View all",
  children,
  className,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0 rounded-xl border border-border-subtle bg-surface", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5">
        <h2 className="font-serif text-xl text-charcoal">{title}</h2>
        {href && (
          <Link href={href} className="text-xs text-gold-deep underline-offset-4 hover:underline">
            {hrefLabel} →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="px-5 py-8 text-center text-sm text-charcoal/60">{children}</p>;
}
