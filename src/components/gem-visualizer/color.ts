// Maps a mineral's hue + the customer's darkness/tone slider to concrete HSL
// values used for the gem fill and its highlight/shadow gradient stops.

export interface GemColorStops {
  base: string;
  highlight: string;
  shadow: string;
  table: string;
}

/** darkness: 0 (lightest/pastel) - 100 (deepest/darkest tone). */
export function resolveGemColor(hue: number, darkness: number, saturation = 72): GemColorStops {
  const clampedDarkness = Math.min(100, Math.max(0, darkness));
  // Lightness runs from a pale ~86% down to a deep ~18%.
  const lightness = 86 - (clampedDarkness / 100) * 68;
  // Saturation peaks around the middle tones and eases at the extremes,
  // which reads more like a real gem than a flat linear ramp.
  const satAdjust = saturation - Math.abs(clampedDarkness - 55) * 0.25;
  const s = Math.min(95, Math.max(35, satAdjust));

  const base = `hsl(${hue}, ${s}%, ${lightness}%)`;
  const highlight = `hsl(${hue}, ${Math.max(20, s - 25)}%, ${Math.min(96, lightness + 26)}%)`;
  const shadow = `hsl(${hue}, ${Math.min(100, s + 10)}%, ${Math.max(6, lightness - 30)}%)`;
  const table = `hsl(${hue}, ${s}%, ${Math.min(94, lightness + 12)}%)`;

  return { base, highlight, shadow, table };
}

/** Normalizes a hue that may wrap past 360 (e.g. Ruby: 345-10) into [0,360). */
export function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360;
}

/** Degrees spanned by a (possibly wrapping) mineral hue range. */
export function hueRangeSpan(hueMin: number, hueMax: number): number {
  return hueMin <= hueMax ? hueMax - hueMin : 360 - hueMin + hueMax;
}

/** Maps a 0-100 slider position to a concrete hue within a mineral's range. */
export function hueAtPercent(hueMin: number, hueMax: number, percent: number): number {
  const span = hueRangeSpan(hueMin, hueMax);
  return normalizeHue(hueMin + (span * Math.min(100, Math.max(0, percent))) / 100);
}

/** Inverse of hueAtPercent, for initializing a slider from a stored hue. */
export function percentAtHue(hueMin: number, hueMax: number, hue: number): number {
  const span = hueRangeSpan(hueMin, hueMax) || 1;
  const h = normalizeHue(hue);
  const offset = h >= hueMin ? h - hueMin : 360 - hueMin + h;
  return Math.min(100, Math.max(0, (offset / span) * 100));
}

export function clampHueToMineralRange(hue: number, hueMin: number, hueMax: number): number {
  const h = normalizeHue(hue);
  if (hueMin <= hueMax) {
    return Math.min(hueMax, Math.max(hueMin, h));
  }
  // Wrapping range (e.g. 345 -> 10 through 360/0).
  if (h >= hueMin || h <= hueMax) return h;
  // Outside the wrapping range: clamp to nearest edge.
  const distToMin = Math.min(Math.abs(h - hueMin), 360 - Math.abs(h - hueMin));
  const distToMax = Math.min(Math.abs(h - hueMax), 360 - Math.abs(h - hueMax));
  return distToMin <= distToMax ? hueMin : hueMax;
}
