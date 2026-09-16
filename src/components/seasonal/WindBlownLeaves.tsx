import type { CSSProperties } from "react";

// Same deterministic generator FallingParticles uses — see its own comment
// for why this can't be Math.random() in a Server Component.
function seededRandom(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const LEAVES = ["🍂", "🍁", "🍃"];

/** Autumn's own particle motion, standing in for FallingParticles: a gust
 * blows leaves mostly sideways first, then they drop once the gust passes
 * (see the leaf-blow-drop keyframe) — a distinct two-phase motion from
 * every other season's constant-rate straight fall/rise, per the brief's
 * specific "wind blows, then leaves start dropping" request. */
export function WindBlownLeaves({ seed = 0, count = 24 }: { seed?: number; count?: number }) {
  const items = Array.from({ length: count }, (_, i) => {
    const r = (n: number) => seededRandom(seed + i * 11 + n);
    const size = 16 + r(1) * 14;
    const duration = 7 + r(2) * 6;
    return {
      // Leaves enter staggered down the left/top edge rather than all
      // from one point, so the gust reads as sweeping across a width of
      // sky rather than firing from a single source.
      top: r(0) * 55,
      size,
      duration,
      delay: -r(3) * duration,
      drift: 65 + r(4) * 35, // vw traveled during the drop phase
      spin: 360 + r(5) * 360,
      opacity: 0.55 + r(6) * 0.35,
      char: LEAVES[i % LEAVES.length],
    };
  });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {items.map((leaf, i) => (
        <span
          key={i}
          className="animate-leaf-blow-drop absolute left-0 select-none"
          style={
            {
              top: `${leaf.top}%`,
              fontSize: `${leaf.size}px`,
              lineHeight: 1,
              "--particle-duration": `${leaf.duration}s`,
              "--particle-delay": `${leaf.delay}s`,
              "--particle-drift": `${leaf.drift}vw`,
              "--particle-spin": `${leaf.spin}deg`,
              "--particle-opacity": leaf.opacity,
            } as CSSProperties
          }
        >
          {leaf.char}
        </span>
      ))}
    </div>
  );
}
