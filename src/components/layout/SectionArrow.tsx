"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A deliberately understated "scroll to the next section" control — near
 * invisible at rest (low opacity, no background/border), brightening on
 * hover/focus so it's still discoverable and keyboard-usable. Positioned
 * absolutely by the caller's section (which needs `relative`).
 */
export function SectionArrow({ target, tone = "light" }: { target: string; tone?: "light" | "dark" }) {
  return (
    <button
      type="button"
      onClick={() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth" })}
      aria-label="Scroll to next section"
      className={cn(
        "absolute inset-x-0 bottom-6 z-10 mx-auto flex h-9 w-9 items-center justify-center rounded-full opacity-25 transition-opacity duration-300 hover:opacity-80 focus-visible:opacity-80 sm:bottom-8",
        tone === "light" ? "text-ivory" : "text-charcoal"
      )}
    >
      <ChevronDown size={22} strokeWidth={1.5} />
    </button>
  );
}
