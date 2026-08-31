import {
  type Point,
  toPath,
  centroid,
  scaleToward,
  regularPolygon,
  ellipsePoints,
  superellipsePoints,
  chamferedRect,
  pearPoints,
  heartPoints,
  marquisePoints,
  trillionPoints,
} from "./geometry";

export type FacetStyle = "radial-table" | "radial-no-table" | "step" | "rose" | "dome" | "dome-ridge";

export interface CutRenderData {
  style: FacetStyle;
  /** Native ellipse/circle render instead of a path, when applicable. */
  ellipse?: { rx: number; ry: number };
  outlinePath: string;
  facetLines: { x1: number; y1: number; x2: number; y2: number }[];
  tablePath?: string;
  stepPaths?: string[];
  center: Point;
  /** Largest radius, used to scale the inclusion overlay. */
  boundingRadius: number;
}

const CENTER: Point = [150, 150];

type Lines = CutRenderData["facetLines"];

function line(a: Point, b: Point): Lines[number] {
  return { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
}

/** Facets radiating from a single point (dead centre) to the outline — correct for cuts that genuinely converge there, like rose cut. */
function radialFacetLines(points: Point[], center: Point, sampleEvery = 1): Lines {
  const lines: Lines = [];
  for (let i = 0; i < points.length; i += sampleEvery) {
    lines.push(line(center, points[i]));
  }
  return lines;
}

/**
 * "Main" crown facets connecting the table edge to the girdle — the large
 * kite/bezel facets that dominate a brilliant-style cut. `outline` and
 * `table` must be angularly aligned (same length, table[i] is outline[i]
 * scaled toward the centre), which is true for every shape built via
 * `scaleToward`.
 */
function mainFacetLines(outline: Point[], table: Point[], sampleEvery = 1): Lines {
  const lines: Lines = [];
  for (let i = 0; i < outline.length; i += sampleEvery) {
    lines.push(line(table[i], outline[i]));
  }
  return lines;
}

/**
 * Small "star" facets interleaved between the main facets — from the table
 * edge out to a mid-ring, at angular positions offset from the main facets.
 * This is what gives round/oval brilliants their characteristic two-tier
 * zigzag crown pattern instead of a plain wagon-wheel of identical spokes.
 */
function starFacetLines(outline: Point[], table: Point[], sampleEvery: number, offset: number, midRingFactor = 0.72): Lines {
  const n = outline.length;
  const mid = scaleToward(outline, centroid(outline), midRingFactor);
  const lines: Lines = [];
  for (let i = offset; i < n; i += sampleEvery) {
    lines.push(line(table[i], mid[i]));
  }
  return lines;
}

export function renderCut(cutSlug: string, scale: number): CutRenderData {
  const [cx, cy] = CENTER;
  const baseR = 95 * scale;

  switch (cutSlug) {
    case "round-brilliant": {
      const pts = ellipsePoints(cx, cy, baseR, baseR, 64);
      const table = scaleToward(pts, CENTER, 0.42);
      return {
        style: "radial-table",
        ellipse: { rx: baseR, ry: baseR },
        outlinePath: toPath(pts),
        // 8 main (bezel) facets + 8 interleaved star facets — a simplified
        // but recognisable version of a real round brilliant's two-tier
        // crown (8 main + 8 star + 16 upper-girdle in reality).
        facetLines: [...mainFacetLines(pts, table, 8), ...starFacetLines(pts, table, 8, 4)],
        tablePath: toPath(table),
        center: CENTER,
        boundingRadius: baseR,
      };
    }
    case "oval": {
      const rx = baseR * 1.32;
      const ry = baseR * 0.92;
      const pts = ellipsePoints(cx, cy, rx, ry, 64);
      const table = scaleToward(pts, CENTER, 0.45);
      return {
        style: "radial-table",
        ellipse: { rx, ry },
        outlinePath: toPath(pts),
        facetLines: [...mainFacetLines(pts, table, 8), ...starFacetLines(pts, table, 8, 4)],
        tablePath: toPath(table),
        center: CENTER,
        boundingRadius: Math.max(rx, ry),
      };
    }
    case "cushion": {
      const pts = superellipsePoints(cx, cy, baseR * 1.05, baseR * 1.05, 2.4, 64);
      const table = scaleToward(pts, CENTER, 0.4);
      return {
        style: "radial-table",
        outlinePath: toPath(pts),
        facetLines: mainFacetLines(pts, table, 4),
        tablePath: toPath(table),
        center: CENTER,
        boundingRadius: baseR * 1.05,
      };
    }
    case "emerald-cut": {
      const halfW = baseR * 0.75;
      const halfH = baseR * 1.05;
      const pts = chamferedRect(cx, cy, halfW, halfH, Math.min(halfW, halfH) * 0.32);
      const step1 = scaleToward(pts, CENTER, 0.78);
      const step2 = scaleToward(pts, CENTER, 0.52);
      return {
        style: "step",
        outlinePath: toPath(pts),
        facetLines: [],
        stepPaths: [toPath(step1), toPath(step2)],
        center: CENTER,
        boundingRadius: Math.max(halfW, halfH),
      };
    }
    case "princess": {
      const halfS = baseR * 0.82;
      const corners: Point[] = [
        [cx - halfS, cy - halfS],
        [cx + halfS, cy - halfS],
        [cx + halfS, cy + halfS],
        [cx - halfS, cy + halfS],
      ];
      const midpoints: Point[] = [
        [cx, cy - halfS],
        [cx + halfS, cy],
        [cx, cy + halfS],
        [cx - halfS, cy],
      ];
      const table = scaleToward(corners, CENTER, 0.4);
      const midInner = scaleToward(midpoints, CENTER, 0.55);
      return {
        style: "radial-table",
        outlinePath: toPath(corners),
        // The corner-to-corner X is a genuine, defining feature of a
        // princess cut's top-down look; the shorter edge-midpoint
        // (chevron) facets sit nearer the girdle, not the centre.
        facetLines: [...radialFacetLines(corners, CENTER), ...mainFacetLines(midpoints, midInner)],
        tablePath: toPath(table),
        center: CENTER,
        boundingRadius: halfS * Math.SQRT2,
      };
    }
    case "pear": {
      const rx = baseR * 1.5;
      const ry = baseR * 1.9;
      const pts = pearPoints(cx, cy, rx, ry, 72);
      const table = scaleToward(pts, CENTER, 0.42);
      return {
        style: "radial-table",
        outlinePath: toPath(pts),
        facetLines: mainFacetLines(pts, table, 5),
        tablePath: toPath(table),
        center: CENTER,
        boundingRadius: Math.max(rx, ry),
      };
    }
    case "marquise": {
      const rx = baseR * 1.75;
      const ry = baseR * 0.85;
      const pts = marquisePoints(cx, cy, rx, ry, 72);
      const table = scaleToward(pts, CENTER, 0.4);
      return {
        style: "radial-table",
        outlinePath: toPath(pts),
        facetLines: mainFacetLines(pts, table, 5),
        tablePath: toPath(table),
        center: CENTER,
        boundingRadius: Math.max(rx, ry),
      };
    }
    case "radiant": {
      const halfW = baseR * 0.82;
      const halfH = baseR * 1.0;
      const pts = chamferedRect(cx, cy, halfW, halfH, Math.min(halfW, halfH) * 0.28);
      const table = scaleToward(pts, CENTER, 0.42);
      return {
        style: "radial-table",
        outlinePath: toPath(pts),
        facetLines: mainFacetLines(pts, table),
        tablePath: toPath(table),
        center: CENTER,
        boundingRadius: Math.max(halfW, halfH),
      };
    }
    case "asscher": {
      const half = baseR * 0.88;
      const pts = chamferedRect(cx, cy, half, half, half * 0.35);
      const step1 = scaleToward(pts, CENTER, 0.76);
      const step2 = scaleToward(pts, CENTER, 0.5);
      return {
        style: "step",
        outlinePath: toPath(pts),
        facetLines: [],
        stepPaths: [toPath(step1), toPath(step2)],
        center: CENTER,
        boundingRadius: half,
      };
    }
    case "heart": {
      const r = baseR * 1.15;
      const pts = heartPoints(cx, cy - r * 0.12, r, r, 80);
      const heartCenter = centroid(pts);
      const table = scaleToward(pts, heartCenter, 0.4);
      return {
        style: "radial-table",
        outlinePath: toPath(pts),
        facetLines: mainFacetLines(pts, table, 5),
        tablePath: toPath(table),
        center: heartCenter,
        boundingRadius: r,
      };
    }
    case "trillion": {
      const pts = trillionPoints(cx, cy, baseR * 1.1, baseR * 1.1, 0.14, 72);
      const table = scaleToward(pts, CENTER, 0.4);
      return {
        style: "radial-table",
        outlinePath: toPath(pts),
        facetLines: mainFacetLines(pts, table, 6),
        tablePath: toPath(table),
        center: CENTER,
        boundingRadius: baseR * 1.1,
      };
    }
    case "baguette": {
      const halfW = baseR * 0.42;
      const halfH = baseR * 1.15;
      const pts = chamferedRect(cx, cy, halfW, halfH, Math.min(halfW, halfH) * 0.25);
      const step1 = scaleToward(pts, CENTER, 0.7);
      return {
        style: "step",
        outlinePath: toPath(pts),
        facetLines: [],
        stepPaths: [toPath(step1)],
        center: CENTER,
        boundingRadius: Math.max(halfW, halfH),
      };
    }
    case "octagon": {
      const pts = regularPolygon(cx, cy, baseR, baseR, 8, -90 - 22.5);
      const step1 = scaleToward(pts, CENTER, 0.72);
      const step2 = scaleToward(pts, CENTER, 0.46);
      return {
        style: "step",
        outlinePath: toPath(pts),
        facetLines: [],
        stepPaths: [toPath(step1), toPath(step2)],
        center: CENTER,
        boundingRadius: baseR,
      };
    }
    case "rose-cut": {
      // Rose cuts genuinely have no table — their facets converge toward a
      // point near the crown's apex, so radiating from the centre (unlike
      // every other faceted cut above) is the accurate choice here. A
      // classic "full Dutch rose" has 24 facets.
      const pts = ellipsePoints(cx, cy, baseR, baseR, 96);
      return {
        style: "rose",
        ellipse: { rx: baseR, ry: baseR },
        outlinePath: toPath(pts),
        facetLines: radialFacetLines(pts, CENTER, 4),
        center: CENTER,
        boundingRadius: baseR,
      };
    }
    case "round-cabochon": {
      return {
        style: "dome",
        ellipse: { rx: baseR, ry: baseR },
        outlinePath: toPath(ellipsePoints(cx, cy, baseR, baseR, 48)),
        facetLines: [],
        center: CENTER,
        boundingRadius: baseR,
      };
    }
    case "oval-cabochon": {
      const rx = baseR * 1.28;
      const ry = baseR * 0.95;
      return {
        style: "dome",
        ellipse: { rx, ry },
        outlinePath: toPath(ellipsePoints(cx, cy, rx, ry, 48)),
        facetLines: [],
        center: CENTER,
        boundingRadius: Math.max(rx, ry),
      };
    }
    case "sugarloaf-cabochon": {
      const pts = superellipsePoints(cx, cy, baseR, baseR, 2.1, 48).map(([x, y]) => {
        // rotate 45deg to read as a rounded rhombus
        const dx = x - cx;
        const dy = y - cy;
        const angle = Math.PI / 4;
        return [cx + dx * Math.cos(angle) - dy * Math.sin(angle), cy + dx * Math.sin(angle) + dy * Math.cos(angle)] as Point;
      });
      return {
        style: "dome-ridge",
        outlinePath: toPath(pts),
        facetLines: [
          { x1: cx, y1: cy - baseR, x2: cx, y2: cy + baseR },
          { x1: cx - baseR, y1: cy, x2: cx + baseR, y2: cy },
        ],
        center: CENTER,
        boundingRadius: baseR,
      };
    }
    case "buff-top-cabochon": {
      const pts = superellipsePoints(cx, cy, baseR * 1.08, baseR * 0.92, 2.6, 48);
      return {
        style: "dome",
        outlinePath: toPath(pts),
        facetLines: [],
        center: CENTER,
        boundingRadius: baseR * 1.08,
      };
    }
    default: {
      const pts = ellipsePoints(cx, cy, baseR, baseR, 64);
      const table = scaleToward(pts, CENTER, 0.42);
      return {
        style: "radial-table",
        ellipse: { rx: baseR, ry: baseR },
        outlinePath: toPath(pts),
        facetLines: mainFacetLines(pts, table, 4),
        tablePath: toPath(table),
        center: CENTER,
        boundingRadius: baseR,
      };
    }
  }
}

export { centroid };
