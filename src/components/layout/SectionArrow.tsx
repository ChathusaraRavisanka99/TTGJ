"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A deliberately understated "scroll to the previous/next section" control —
 * near invisible at rest (low opacity, no background/border), brightening
 * on hover/focus so it's still discoverable and keyboard-usable. Positioned
 * absolutely by the caller's section (which needs `relative`).
 */
export function SectionArrow({
  target,
  direction = "down",
  tone = "light",
}: {
  target: string;
  direction?: "up" | "down";
  tone?: "light" | "dark";
}) {
  const Icon = direction === "up" ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      onClick={() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth" })}
      aria-label={direction === "up" ? "Scroll to previous section" : "Scroll to next section"}
      className={cn(
        "absolute inset-x-0 z-10 mx-auto flex h-9 w-9 items-center justify-center rounded-full opacity-25 transition-opacity duration-300 hover:opacity-80 focus-visible:opacity-80",
        direction === "up" ? "top-6 sm:top-8" : "bottom-6 sm:bottom-8",
        tone === "light" ? "text-ivory" : "text-charcoal"
      )}
    >
      <Icon size={22} strokeWidth={1.5} />
    </button>
  );
}
