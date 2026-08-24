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

function radialFacetLines(points: Point[], center: Point, sampleEvery = 1): CutRenderData["facetLines"] {
  const lines: CutRenderData["facetLines"] = [];
  for (let i = 0; i < points.length; i += sampleEvery) {
    const [x, y] = points[i];
    lines.push({ x1: center[0], y1: center[1], x2: x, y2: y });
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
        facetLines: radialFacetLines(pts, CENTER, 4),
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
        facetLines: radialFacetLines(pts, CENTER, 4),
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
        facetLines: radialFacetLines(pts, CENTER, 4),
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
      const pts: Point[] = [
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
      const table = scaleToward(pts, CENTER, 0.4);
      return {
        style: "radial-table",
        outlinePath: toPath(pts),
        facetLines: radialFacetLines([...pts, ...midpoints], CENTER),
        tablePath: toPath(table),
        center: CENTER,
        boundingRadius: halfS * Math.SQRT2,
      };
    }
    case "pear": {
      const rx = baseR * 1.5;
      const ry = baseR * 1.9;
      const pts = pearPoints(cx, cy, rx, ry, 72);
      const table = scaleToward(pts, [cx, cy + ry * 0.18], 0.4);
      return {
        style: "radial-table",
        outlinePath: toPath(pts),
        facetLines: radialFacetLines(pts, [cx, cy + ry * 0.12], 6),
        tablePath: toPath(table),
        center: [cx, cy + ry * 0.12],
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
        facetLines: radialFacetLines(pts, CENTER, 6),
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
        facetLines: radialFacetLines(pts, CENTER),
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
      const table = scaleToward(pts, [cx, cy], 0.38);
      return {
        style: "radial-table",
        outlinePath: toPath(pts),
        facetLines: radialFacetLines(pts, [cx, cy], 6),
        tablePath: toPath(table),
        center: [cx, cy],
        boundingRadius: r,
      };
    }
    case "trillion": {
      const pts = trillionPoints(cx, cy, baseR * 1.1, baseR * 1.1, 0.14, 72);
      const table = scaleToward(pts, CENTER, 0.38);
      return {
        style: "radial-table",
        outlinePath: toPath(pts),
        facetLines: radialFacetLines(pts, CENTER, 6),
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
      const pts = ellipsePoints(cx, cy, baseR, baseR, 96);
      return {
        style: "rose",
        ellipse: { rx: baseR, ry: baseR },
        outlinePath: toPath(pts),
        facetLines: radialFacetLines(pts, CENTER, 3),
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
      return {
        style: "radial-table",
        ellipse: { rx: baseR, ry: baseR },
        outlinePath: toPath(pts),
        facetLines: radialFacetLines(pts, CENTER, 4),
        tablePath: toPath(scaleToward(pts, CENTER, 0.42)),
        center: CENTER,
        boundingRadius: baseR,
      };
    }
  }
}

export { centroid };
