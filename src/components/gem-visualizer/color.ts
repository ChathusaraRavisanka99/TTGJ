// Maps a mineral's hue + the customer's darkness/tone slider to concrete HSL
// values used for the gem fill and its highlight/shadow gradient stops.

export interface GemColorStops {
  base: string;
  highlight: string;
  shadow: string;
  table: string;
}

// Rounds to 1 decimal place — division/multiplication chains below (e.g.
// darkness/100 * 68) routinely land on values like 62.87999999999995 that
// are harmless as CSS but look broken the moment one of these strings is
// shown to a human as a "colour code" (see the admin quote view).
const r1 = (n: number) => Math.round(n * 10) / 10;

/** darkness: 0 (lightest/pastel) - 100 (deepest/darkest tone). */
export function resolveGemColor(hue: number, darkness: number, saturation = 72): GemColorStops {
  const clampedDarkness = Math.min(100, Math.max(0, darkness));
  // Lightness runs from a pale ~86% down to a deep ~18%.
  const lightness = 86 - (clampedDarkness / 100) * 68;
  // Saturation peaks around the middle tones and eases at the extremes,
  // which reads more like a real gem than a flat linear ramp.
  const satAdjust = saturation - Math.abs(clampedDarkness - 55) * 0.25;
  const s = r1(Math.min(95, Math.max(35, satAdjust)));
  const l = r1(lightness);
  const h = r1(hue);

  const base = `hsl(${h}, ${s}%, ${l}%)`;
  const highlight = `hsl(${h}, ${r1(Math.max(20, s - 25))}%, ${r1(Math.min(96, l + 26))}%)`;
  const shadow = `hsl(${h}, ${r1(Math.min(100, s + 10))}%, ${r1(Math.max(6, l - 30))}%)`;
  const table = `hsl(${h}, ${s}%, ${r1(Math.min(94, l + 12))}%)`;

  return { base, highlight, shadow, table };
}

/**
 * Converts an "hsl(h, s%, l%)" string (as produced by `resolveGemColor`) to
 * a #RRGGBB hex code — for showing a plain, universally-recognized colour
 * code alongside the rendered swatch (e.g. on the admin quote view), since
 * HSL-the-string isn't what most people mean by "the colour code".
 */
export function hslStringToHex(hsl: string): string {
  const match = hsl.match(/hsl\(([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%\)/);
  if (!match) return "#000000";
  const h = Number(match[1]);
  const s = Number(match[2]) / 100;
  const l = Number(match[3]) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
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
