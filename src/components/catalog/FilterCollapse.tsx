"use client";

import { useState } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * On a phone the full filter panel (six checkbox groups, price, carat,
 * sort, toggles) is several screens tall, pushing every result below the
 * fold. Below `lg` this collapses everything but the search box behind a
 * "Filters" button; at `lg` and up it's always shown, exactly as before.
 *
 * The collapsed content is hidden with CSS (`hidden`), not unmounted, so
 * its inputs still submit with the surrounding GET form — a customer who
 * collapses the panel after choosing filters and then hits "Filter"
 * doesn't silently lose them.
 */
export function FilterCollapse({ activeCount, children }: { activeCount: number; children: React.ReactNode }) {
  const t = useTranslations("catalog.filters");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-md border border-border-subtle px-3.5 py-2.5 text-sm font-medium text-charcoal lg:hidden"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal size={15} />
          {t("filtersButton")}
          {activeCount > 0 && (
            <span className="rounded-full bg-gold/20 px-1.5 py-0.5 text-[10px] text-charcoal">{activeCount}</span>
          )}
        </span>
        <ChevronDown size={15} className={cn("transition-transform", open && "rotate-180")} />
      </button>
      <div className={cn("mt-4 lg:mt-0 lg:block", open ? "block" : "hidden")}>{children}</div>
    </>
  );
}
