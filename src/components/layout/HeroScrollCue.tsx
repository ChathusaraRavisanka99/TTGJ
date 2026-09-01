"use client";

/** Same look as the original static hero scroll hint, just made clickable. */
export function HeroScrollCue({ target }: { target: string | null }) {
  if (!target) return null;
  return (
    <button
      type="button"
      onClick={() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth" })}
      aria-label="Scroll to next section"
      className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 text-ivory/50 transition-colors hover:text-ivory/80"
    >
      <span className="text-[10px] uppercase tracking-[0.35em]">Scroll</span>
      <div className="h-9 w-px bg-ivory/30" />
      <div className="animate-scroll-cue h-1.5 w-1.5 rounded-full bg-gold" />
    </button>
  );
}
