"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A single horizontally-scrolling row (as opposed to a grid that wraps to
 * more rows) with arrow controls, scroll-snap, and touch/trackpad drag —
 * used for the homepage's Featured Gemstones/Jewelry. Each child is
 * expected to size itself (width + shrink-0 + snap-start) since how many
 * should show at once differs per breakpoint per caller.
 *
 * Arrows only render once there's actually somewhere to scroll to in that
 * direction — computed from real scroll position, not just child count,
 * so they update correctly as the user scrolls (including via touch/drag,
 * not just the arrows themselves).
 */
export function CardSlider({ children, className }: { children: React.ReactNode; className?: string }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollPrev(el.scrollLeft > 8);
    setCanScrollNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows]);

  function scrollByDirection(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    const firstCard = el.firstElementChild as HTMLElement | null;
    const step = firstCard ? firstCard.getBoundingClientRect().width + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: step * direction, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className={cn("scrollbar-hide flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth", className)}
      >
        {children}
      </div>

      {canScrollPrev && (
        <button
          type="button"
          onClick={() => scrollByDirection(-1)}
          aria-label="Scroll to previous items"
          className="absolute left-0 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border-subtle bg-surface p-2.5 text-charcoal shadow-md transition-transform hover:scale-105 sm:flex"
        >
          <ChevronLeft size={18} />
        </button>
      )}
      {canScrollNext && (
        <button
          type="button"
          onClick={() => scrollByDirection(1)}
          aria-label="Scroll to next items"
          className="absolute right-0 top-1/2 hidden translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border-subtle bg-surface p-2.5 text-charcoal shadow-md transition-transform hover:scale-105 sm:flex"
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}
