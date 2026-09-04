import type { CSSProperties } from "react";
import type { SeasonalThemeDef } from "@/lib/seasonal-themes";

// A deterministic pseudo-random generator (mulberry32), not Math.random() —
// this renders from a Server Component with no client-side counterpart
// today, but a component that computes something different every render
// is a landmine for whoever touches this file next (see Footer's
// `new Date().getFullYear()` hydration bug earlier in this project's
// history: the exact same class of bug, just with time instead of
// randomness). The same seed always produces the same scattered layout.
function seededRandom(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** A full-bleed, decorative particle drift — falling leaves/snow, rising
 * petals/sparkles, whatever the active SeasonalThemeDef specifies. Pure
 * CSS animation (see globals.css's animate-particle-fall/rise), so this
 * costs nothing before hydration and needs no client JS at all. */
export function FallingParticles({ theme, seed = 0 }: { theme: SeasonalThemeDef; seed?: number }) {
  const { particles, particleCount, particleDirection, particleSizeRange, particleDurationRange } = theme;

  const items = Array.from({ length: particleCount }, (_, i) => {
    const r = (n: number) => seededRandom(seed + i * 11 + n);
    const size = particleSizeRange[0] + r(1) * (particleSizeRange[1] - particleSizeRange[0]);
    const duration = particleDurationRange[0] + r(2) * (particleDurationRange[1] - particleDurationRange[0]);
    return {
      left: r(0) * 100,
      size,
      duration,
      // A negative delay starts the animation already partway through its
      // cycle — without this, every particle begins at the same instant
      // the page loads and the scene reads as empty for the first several
      // seconds until the slowest ones finish their first lap.
      delay: -r(3) * duration,
      drift: (r(4) - 0.5) * 130,
      spin: 160 + r(5) * 380,
      opacity: 0.5 + r(6) * 0.4,
      char: particles[i % particles.length],
    };
  });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {items.map((p, i) => (
        <span
          key={i}
          className={
            particleDirection === "fall"
              ? "animate-particle-fall absolute top-0 select-none"
              : "animate-particle-rise absolute bottom-0 select-none"
          }
          style={
            {
              left: `${p.left}%`,
              fontSize: `${p.size}px`,
              lineHeight: 1,
              "--particle-duration": `${p.duration}s`,
              "--particle-delay": `${p.delay}s`,
              "--particle-drift": `${p.drift}px`,
              "--particle-spin": `${p.spin}deg`,
              "--particle-opacity": p.opacity,
            } as CSSProperties
          }
        >
          {p.char}
        </span>
      ))}
    </div>
  );
}
