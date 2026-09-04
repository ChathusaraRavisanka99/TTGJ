"use client";

/** Same look as the original static hero scroll hint, just made clickable. */
export function HeroScrollCue({ target }: { target: string | null }) {
  if (!target) return null;
  return (
    <button
      type="button"
      onClick={() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth" })}
      aria-label="Scroll to next section"
      // Hidden below sm: on a narrow/short mobile viewport the hero's own
      // heading/subtext/CTA stack can run tall enough to reach this
      // bottom-8 band, and since this button is full-width (inset-x-0) for
      // an easy tap target on desktop, its invisible edges then sit on top
      // of the CTA buttons and intercept taps meant for them. Not worth
      // fighting for on mobile anyway — it's a desktop-only nicety, and
      // every mobile browser already makes "you can scroll" obvious.
      className="absolute inset-x-0 bottom-8 hidden flex-col items-center gap-3 text-ivory/50 transition-colors hover:text-ivory/80 sm:flex"
    >
      <span className="text-[10px] uppercase tracking-[0.35em]">Scroll</span>
      <div className="h-9 w-px bg-ivory/30" />
      <div className="animate-scroll-cue h-1.5 w-1.5 rounded-full bg-gold" />
    </button>
  );
}
