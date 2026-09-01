"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A deliberately understated "scroll to the previous/next section" control —
 * near invisible at rest (low opacity, no background/border), brightening
 * on hover/focus so it's still discoverable and keyboard-usable. Positioned
 * absolutely by the caller's section (which needs `relative`).
 *
 * Sits a bit further in from the section edge than you'd expect (top-14 /
 * bottom-14, not top-6 / bottom-6) deliberately: scroll-snap here is
 * `proximity`, which doesn't guarantee landing pixel-exact at a section's
 * edge the way `mandatory` would — and `mandatory` was tried and reverted
 * because it trapped the scroll position at the last snap point and made
 * the footer unreachable. The extra clearance is what actually keeps the
 * arrow in view after `proximity`'s slightly-off landing, without that
 * much worse trade-off.
 */
export function SectionArrow({
  target,
  direction = "down",
  tone = "light",
}: {
  // Nullable so callers computing a dynamic chain of optional sections
  // (see the homepage's sectionChain) can pass "no neighbor in this
  // direction" without a separate conditional at each call site.
  target: string | null;
  direction?: "up" | "down";
  tone?: "light" | "dark";
}) {
  if (!target) return null;
  const Icon = direction === "up" ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      onClick={() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth" })}
      aria-label={direction === "up" ? "Scroll to previous section" : "Scroll to next section"}
      className={cn(
        "absolute inset-x-0 z-10 mx-auto flex h-9 w-9 items-center justify-center rounded-full opacity-25 transition-opacity duration-300 hover:opacity-80 focus-visible:opacity-80",
        direction === "up" ? "top-14 sm:top-16" : "bottom-14 sm:bottom-16",
        tone === "light" ? "text-ivory" : "text-charcoal"
      )}
    >
      <Icon size={22} strokeWidth={1.5} />
    </button>
  );
}
