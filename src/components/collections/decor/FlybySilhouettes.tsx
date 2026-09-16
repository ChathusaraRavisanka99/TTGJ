/** Small silhouette shapes for each subculture theme's ThemeFlyby moment.
 * Plain SVG/CSS shapes in the theme's own accent colour (currentColor),
 * matching the rest of collections/decor's "shape and glow, not literal
 * costume-shop iconography" visual language — a wing/bolt/star silhouette
 * reads as atmosphere at the size and opacity these render at, the same
 * way GothOrnamentalFrame's corner brackets or WitchyCelestialRing's
 * diagram do. */

/** One winged-creature silhouette shared by Goth (raven) and Vampire
 * (bat) — at the size/opacity a background flyby actually renders at,
 * species-specific wing shape doesn't read; the theme's own accent
 * colour is what tells the two apart. */
export function WingedSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 40" fill="currentColor" className={className} aria-hidden>
      <path d="M50 18C41 6 22 2 0 10c14 2 24 8 29 16-12-3-22 1-26 9 14 4 25-1 31-9 2 6 8 10 16 10s14-4 16-10c6 8 17 13 31 9-4-8-14-12-26-9 5-8 15-14 29-16C78 2 59 6 50 18Z" />
    </svg>
  );
}

/** Metal/Rock's flyby: a single jagged lightning-bolt streak, standing in
 * for a spark off the stage lights rather than any literal instrument. */
export function LightningBolt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 64" fill="currentColor" className={className} aria-hidden>
      <path d="M18 0 3 34h11l-6 30 21-38H17Z" />
    </svg>
  );
}

/** Dark Academia's flyby: a single drifting feather (quill, not bird) —
 * slower and gentler than the other themes' flybys, matching its
 * "understated" brief. */
export function FeatherGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 80" fill="currentColor" className={className} aria-hidden>
      <path d="M14 0c7 16 7 48 0 80-2-4-3-9-3-14 3-24 3-46 0-62 1-1 2-3 3-4Z" opacity="0.9" />
      <path
        d="M14 8c-4 3-9 7-11 14M14 22c-4 2-9 6-11 12M14 36c-3 2-8 5-9 10M14 50c-3 2-7 4-8 8"
        stroke="currentColor"
        strokeWidth="0.75"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}

/** Witchy/Occult's flyby: a shooting star — a fading comet trail ending in
 * a bright point, celestial-diagram in spirit like WitchyCelestialRing
 * rather than a literal broomstick. */
export function ShootingStar({ className }: { className?: string }) {
  return (
    <span className={className} aria-hidden>
      <span className="relative block h-2 w-20">
        <span className="absolute inset-y-0 left-0 right-2 rounded-full bg-gradient-to-r from-transparent to-current opacity-70" />
        <span className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
      </span>
    </span>
  );
}
