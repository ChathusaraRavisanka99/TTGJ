// Shared 2D outline generator for the 3D gem mesh builder. Mirrors the
// silhouettes used by render.ts (the 2D/SVG renderer) so the flat thumbnail
// and the rotatable 3D viewer read as the same stone, while staying
// independent so either renderer can evolve without risking the other.
import {
  type Point,
  centroid,
  regularPolygon,
  ellipsePoints,
  superellipsePoints,
  chamferedRect,
  pearPoints,
  heartPoints,
  marquisePoints,
  trillionPoints,
} from "./geometry";

export type CutFaceStyle = "faceted" | "rose" | "cabochon" | "cabochon-ridge";

export interface CutOutline {
  points: Point[];
  center: Point;
  boundingRadius: number;
  style: CutFaceStyle;
}

export function getCutOutline(cutSlug: string): CutOutline {
  const cx = 0;
  const cy = 0;
  const baseR = 1;

  const finish = (points: Point[], style: CutFaceStyle): CutOutline => {
    const center = centroid(points);
    const boundingRadius = points.reduce((max, [x, y]) => Math.max(max, Math.hypot(x - center[0], y - center[1])), 0);
    return { points, center, boundingRadius, style };
  };

  switch (cutSlug) {
    case "round-brilliant":
      return finish(ellipsePoints(cx, cy, baseR, baseR, 48), "faceted");
    case "oval":
      return finish(ellipsePoints(cx, cy, baseR * 1.32, baseR * 0.92, 48), "faceted");
    case "cushion":
      return finish(superellipsePoints(cx, cy, baseR * 1.05, baseR * 1.05, 2.4, 48), "faceted");
    case "emerald-cut": {
      const halfW = baseR * 0.75;
      const halfH = baseR * 1.05;
      return finish(chamferedRect(cx, cy, halfW, halfH, Math.min(halfW, halfH) * 0.32), "faceted");
    }
    case "princess": {
      const halfS = baseR * 0.82;
      return finish(
        [
          [cx - halfS, cy - halfS],
          [cx + halfS, cy - halfS],
          [cx + halfS, cy + halfS],
          [cx - halfS, cy + halfS],
        ],
        "faceted"
      );
    }
    case "pear":
      return finish(pearPoints(cx, cy, baseR * 1.5, baseR * 1.9, 48), "faceted");
    case "marquise":
      return finish(marquisePoints(cx, cy, baseR * 1.75, baseR * 0.85, 48), "faceted");
    case "radiant": {
      const halfW = baseR * 0.82;
      const halfH = baseR * 1.0;
      return finish(chamferedRect(cx, cy, halfW, halfH, Math.min(halfW, halfH) * 0.28), "faceted");
    }
    case "asscher": {
      const half = baseR * 0.88;
      return finish(chamferedRect(cx, cy, half, half, half * 0.35), "faceted");
    }
    case "heart":
      return finish(heartPoints(cx, cy - baseR * 0.13, baseR * 1.15, baseR * 1.15, 56), "faceted");
    case "trillion":
      return finish(trillionPoints(cx, cy, baseR * 1.1, baseR * 1.1, 0.14, 48), "faceted");
    case "baguette": {
      const halfW = baseR * 0.42;
      const halfH = baseR * 1.15;
      return finish(chamferedRect(cx, cy, halfW, halfH, Math.min(halfW, halfH) * 0.25), "faceted");
    }
    case "octagon":
      return finish(regularPolygon(cx, cy, baseR, baseR, 8, -90 - 22.5), "faceted");
    case "rose-cut":
      return finish(ellipsePoints(cx, cy, baseR, baseR, 40), "rose");
    case "round-cabochon":
      return finish(ellipsePoints(cx, cy, baseR, baseR, 40), "cabochon");
    case "oval-cabochon":
      return finish(ellipsePoints(cx, cy, baseR * 1.28, baseR * 0.95, 40), "cabochon");
    case "sugarloaf-cabochon": {
      const pts = superellipsePoints(cx, cy, baseR, baseR, 2.1, 40).map(([x, y]) => {
        const angle = Math.PI / 4;
        return [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)] as Point;
      });
      return finish(pts, "cabochon-ridge");
    }
    case "buff-top-cabochon":
      return finish(superellipsePoints(cx, cy, baseR * 1.08, baseR * 0.92, 2.6, 40), "cabochon");
    default:
      return finish(ellipsePoints(cx, cy, baseR, baseR, 48), "faceted");
  }
}
