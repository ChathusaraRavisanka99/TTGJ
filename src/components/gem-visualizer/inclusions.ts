// Deterministic, low-opacity inclusion speckle so the same product/config
// always renders the same "fingerprint" rather than reshuffling every paint.

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return h;
}

const CLARITY_DENSITY: Record<string, { count: number; maxOpacity: number; maxRadius: number }> = {
  "loupe-clean": { count: 1, maxOpacity: 0.025, maxRadius: 1.2 },
  "eye-clean": { count: 3, maxOpacity: 0.05, maxRadius: 1.6 },
  "slightly-included": { count: 7, maxOpacity: 0.09, maxRadius: 2.4 },
  included: { count: 13, maxOpacity: 0.16, maxRadius: 3.4 },
};

export interface InclusionSpeck {
  cx: number;
  cy: number;
  r: number;
  opacity: number;
}

export interface InclusionSpeck3D {
  x: number;
  y: number;
  z: number;
  r: number;
  opacity: number;
}

/** Same deterministic density profile as generateInclusions, scaled for a unit-radius 3D gem mesh. */
export function generateInclusions3D(seedKey: string, claritySlug: string): InclusionSpeck3D[] {
  const profile = CLARITY_DENSITY[claritySlug] ?? CLARITY_DENSITY["eye-clean"];
  const rand = mulberry32(hashSeed(seedKey + claritySlug + "-3d"));
  const specks: InclusionSpeck3D[] = [];
  for (let i = 0; i < profile.count; i++) {
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    const dist = 0.15 + rand() * 0.45;
    specks.push({
      x: dist * Math.sin(phi) * Math.cos(theta),
      y: dist * Math.sin(phi) * Math.sin(theta),
      z: dist * Math.cos(phi) * 0.5,
      r: 0.015 + rand() * (profile.maxRadius / 60),
      opacity: Math.min(0.85, profile.maxOpacity * 6 * (0.5 + rand() * 0.5)),
    });
  }
  return specks;
}

export function generateInclusions(seedKey: string, claritySlug: string, cx: number, cy: number, radius: number): InclusionSpeck[] {
  const profile = CLARITY_DENSITY[claritySlug] ?? CLARITY_DENSITY["eye-clean"];
  const rand = mulberry32(hashSeed(seedKey + claritySlug));
  const specks: InclusionSpeck[] = [];
  for (let i = 0; i < profile.count; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = rand() * radius * 0.75;
    specks.push({
      cx: cx + Math.cos(angle) * dist,
      cy: cy + Math.sin(angle) * dist,
      r: 0.4 + rand() * profile.maxRadius,
      opacity: profile.maxOpacity * (0.4 + rand() * 0.6),
    });
  }
  return specks;
}
