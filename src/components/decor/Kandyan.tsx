import { cn } from "@/lib/utils";

// Kandyan-style ornament for the Sri Lanka store (/lk), drawn in the same
// single-stroke language as the catalog's HeritageSideArt (lotus, the
// scrolling "liya vela" vine, the Sandakada Pahana moonstone) so the two
// read as one family. Both take their colour from `currentColor`.

// One repeating tile of a border band — a row of small diamonds joined by
// dots, a nod to the carved friezes on Kandyan temple and palace woodwork.
// Used as a CSS mask so the band takes its colour from the text colour and
// repeats to any width, instead of needing an SVG sized to the viewport.
const BAND_TILE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='28' height='10' viewBox='0 0 28 10'>" +
      "<path d='M14 1.2 L21 5 L14 8.8 L7 5 Z' fill='none' stroke='black' stroke-width='1.2' stroke-linejoin='round'/>" +
      "<circle cx='14' cy='5' r='1.3' fill='black'/>" +
      "<circle cx='1.5' cy='5' r='1' fill='black'/><circle cx='26.5' cy='5' r='1' fill='black'/>" +
      "</svg>",
  );

/** A thin repeating border band. Set its colour with a `text-*` class. */
export function KandyanBand({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("h-2.5 w-full bg-current", className)}
      style={{
        maskImage: `url("${BAND_TILE}")`,
        WebkitMaskImage: `url("${BAND_TILE}")`,
        maskRepeat: "repeat-x",
        WebkitMaskRepeat: "repeat-x",
        maskSize: "28px 10px",
        WebkitMaskSize: "28px 10px",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  );
}

/** A section divider: two hairlines meeting at a small eight-petal lotus. */
export function KandyanDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-center justify-center gap-4 text-gold", className)}>
      <span className="h-px w-16 bg-current opacity-50 sm:w-28" />
      <svg viewBox="-24 -24 48 48" className="h-8 w-8 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d="M0,0 C-6,-4 -6,-14 0,-19 C6,-14 6,-4 0,0 Z" transform={`rotate(${i * 45})`} />
        ))}
        <circle r="3" />
      </svg>
      <span className="h-px w-16 bg-current opacity-50 sm:w-28" />
    </div>
  );
}
