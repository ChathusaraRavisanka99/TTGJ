import type { CSSProperties } from "react";
import type { SubcultureDef } from "@/lib/subculture-collections";

// Same technique as src/components/seasonal/FallingParticles.tsx (seeded
// PRNG, pure CSS drift) but decoupled from that feature's theme shape and
// deliberately restricted to plain glyphs (✦ ·), never emoji — see
// SubcultureDef.particles' own doc comment for why: emoji read as a
// costume-shop motif, a bare glyph in the theme's own color reads as dust,
// embers, or stars.
function seededRandom(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function DriftParticles({ config, seed = 0 }: { config: SubcultureDef["particles"]; seed?: number }) {
  const { char, colorClassName, count, direction, sizeRange, durationRange, opacity } = config;

  const items = Array.from({ length: count }, (_, i) => {
    const r = (n: number) => seededRandom(seed + i * 11 + n);
    const size = sizeRange[0] + r(1) * (sizeRange[1] - sizeRange[0]);
    const duration = durationRange[0] + r(2) * (durationRange[1] - durationRange[0]);
    return {
      left: r(0) * 100,
      size,
      duration,
      delay: -r(3) * duration,
      drift: (r(4) - 0.5) * 110,
    };
  });

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${colorClassName}`} aria-hidden>
      {items.map((p, i) => (
        <span
          key={i}
          className={direction === "fall" ? "animate-particle-fall absolute top-0 select-none" : "animate-particle-rise absolute bottom-0 select-none"}
          style={
            {
              left: `${p.left}%`,
              fontSize: `${p.size}px`,
              lineHeight: 1,
              "--particle-duration": `${p.duration}s`,
              "--particle-delay": `${p.delay}s`,
              "--particle-drift": `${p.drift}px`,
              "--particle-spin": "0deg",
              "--particle-opacity": opacity,
            } as CSSProperties
          }
        >
          {char}
        </span>
      ))}
    </div>
  );
}
