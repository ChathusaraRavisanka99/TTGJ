// Illustrative carat -> millimeter reference table. This is NOT a certified
// measurement: actual size for a given carat weight also depends on the
// mineral's density, which we deliberately simplify away here. The UI
// surfaces a disclaimer wherever this is used.

const REFERENCE_MM_AT_ONE_CARAT: Record<string, { length: number; width: number }> = {
  "round-brilliant": { length: 6.5, width: 6.5 },
  oval: { length: 7.7, width: 5.7 },
  cushion: { length: 6.5, width: 6.5 },
  "emerald-cut": { length: 7.0, width: 5.0 },
  princess: { length: 5.5, width: 5.5 },
  pear: { length: 8.0, width: 5.3 },
  marquise: { length: 10.0, width: 5.0 },
  radiant: { length: 6.5, width: 5.5 },
  asscher: { length: 5.8, width: 5.8 },
  heart: { length: 6.5, width: 6.5 },
  trillion: { length: 7.0, width: 7.0 },
  baguette: { length: 7.0, width: 3.5 },
  octagon: { length: 6.0, width: 6.0 },
  "rose-cut": { length: 6.5, width: 6.5 },
  "round-cabochon": { length: 6.5, width: 6.5 },
  "oval-cabochon": { length: 8.0, width: 6.0 },
  "sugarloaf-cabochon": { length: 6.5, width: 6.5 },
  "buff-top-cabochon": { length: 7.0, width: 6.0 },
};

export function estimateDimensionsMm(cutSlug: string, caratWeight: number): { lengthMm: number; widthMm: number } {
  const ref = REFERENCE_MM_AT_ONE_CARAT[cutSlug] ?? REFERENCE_MM_AT_ONE_CARAT["round-brilliant"];
  const scale = Math.cbrt(Math.max(caratWeight, 0.01));
  return {
    lengthMm: Math.round(ref.length * scale * 100) / 100,
    widthMm: Math.round(ref.width * scale * 100) / 100,
  };
}

const MIN_CARAT = 0.5;
const MAX_CARAT = 20;

/** Normalized 0..1 render scale, so the SVG stays legible across the range. */
export function caratToRenderScale(caratWeight: number): number {
  const clamped = Math.min(MAX_CARAT, Math.max(MIN_CARAT, caratWeight));
  const t = (clamped - MIN_CARAT) / (MAX_CARAT - MIN_CARAT);
  // Square-root easing so small stones aren't too tiny to read and large
  // stones don't blow out the viewport.
  return 0.42 + Math.sqrt(t) * 0.58;
}
