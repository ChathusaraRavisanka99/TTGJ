"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Every competitor site reviewed (Blue Nile, Brilliant Earth, thenaturalgem.com)
 * puts search directly in the header — this site's search previously only
 * existed inside each catalog's own filter bar, meaning a shopper on any
 * other page (home, about, a product detail page) had no way to search at
 * all without first navigating to /gems or /jewelry. Submits to /search,
 * which queries both catalogs at once (see src/app/search/page.tsx) since a
 * shopper typing "necklace" shouldn't have to guess which one to search.
 */
export function HeaderSearch({ transparent }: { transparent: boolean }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setOpen(false);
    setValue("");
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className={cn(
          "transition-colors duration-300",
          transparent ? "text-ivory/85 hover:text-ivory" : "text-charcoal/80 hover:text-charcoal",
        )}
      >
        <Search size={19} />
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-1.5">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        onBlur={() => {
          if (!value) setOpen(false);
        }}
        placeholder="Search gems, jewelry..."
        className={cn(
          "w-36 border-b bg-transparent pb-0.5 text-sm outline-none transition-colors sm:w-52",
          transparent
            ? "border-ivory/40 text-ivory placeholder:text-ivory/50"
            : "border-charcoal/25 text-charcoal placeholder:text-charcoal/40",
        )}
      />
      {/* An explicit submit control (not just relying on Enter's implicit
          form submission, which some browsers only honor when one already
          exists) so both Enter and a tap/click reliably navigate. */}
      <button
        type="submit"
        aria-label="Submit search"
        className={cn("transition-colors duration-300", transparent ? "text-ivory/70 hover:text-ivory" : "text-charcoal/60 hover:text-charcoal")}
      >
        <Search size={15} />
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Close search"
        className={cn("transition-colors duration-300", transparent ? "text-ivory/70 hover:text-ivory" : "text-charcoal/60 hover:text-charcoal")}
      >
        <X size={16} />
      </button>
    </form>
  );
}
