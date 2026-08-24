// Pure geometry helpers for the procedural gem cut renderer. Everything here
// works in plain SVG user-space coordinates — no React, no product data —
// so this module stays reusable if the visualizer is ever swapped for a
// WebGL/Three.js implementation.

export type Point = [number, number];

export function toPath(points: Point[], close = true): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  const d = [`M ${first[0].toFixed(2)} ${first[1].toFixed(2)}`, ...rest.map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`)];
  if (close) d.push("Z");
  return d.join(" ");
}

export function centroid(points: Point[]): Point {
  const [sx, sy] = points.reduce(([ax, ay], [x, y]) => [ax + x, ay + y], [0, 0]);
  return [sx / points.length, sy / points.length];
}

export function scaleToward(points: Point[], center: Point, factor: number): Point[] {
  return points.map(([x, y]) => [center[0] + (x - center[0]) * factor, center[1] + (y - center[1]) * factor]);
}

export function regularPolygon(cx: number, cy: number, rx: number, ry: number, sides: number, rotationDeg = -90): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = ((rotationDeg + (360 / sides) * i) * Math.PI) / 180;
    points.push([cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)]);
  }
  return points;
}

export function ellipsePoints(cx: number, cy: number, rx: number, ry: number, count = 64): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (360 / count) * i * (Math.PI / 180);
    points.push([cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)]);
  }
  return points;
}

export function superellipsePoints(cx: number, cy: number, rx: number, ry: number, n = 2.5, count = 64): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (360 / count) * i * (Math.PI / 180);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = Math.sign(cos) * Math.abs(cos) ** (2 / n);
    const y = Math.sign(sin) * Math.abs(sin) ** (2 / n);
    points.push([cx + rx * x, cy + ry * y]);
  }
  return points;
}

/** Rectangle with chamfered (cut) corners — an octagon derived from a rect. */
export function chamferedRect(cx: number, cy: number, halfW: number, halfH: number, chamfer: number): Point[] {
  const c = Math.min(chamfer, Math.min(halfW, halfH) * 0.95);
  return [
    [cx - halfW + c, cy - halfH],
    [cx + halfW - c, cy - halfH],
    [cx + halfW, cy - halfH + c],
    [cx + halfW, cy + halfH - c],
    [cx + halfW - c, cy + halfH],
    [cx - halfW + c, cy + halfH],
    [cx - halfW, cy + halfH - c],
    [cx - halfW, cy - halfH + c],
  ];
}

/** Cardioid-based teardrop/pear outline: a natural point-to-round taper. */
export function pearPoints(cx: number, cy: number, rx: number, ry: number, count = 72): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    const t = (360 / count) * i * (Math.PI / 180);
    const r = 1 - Math.cos(t);
    const x = r * Math.sin(t);
    const y = -r * Math.cos(t);
    points.push([cx + x * (rx / 2), cy + y * (ry / 2) + ry * 0.15]);
  }
  return points;
}

/** Classic parametric heart curve, normalized to fit within [-1, 1]. */
export function heartPoints(cx: number, cy: number, rx: number, ry: number, count = 72): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    const t = (360 / count) * i * (Math.PI / 180);
    const x = 16 * Math.sin(t) ** 3;
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    points.push([cx + (x / 17) * rx, cy + (y / 17) * ry]);
  }
  return points;
}

/** Marquise (pointed lens) built from two mirrored circular arcs. */
export function marquisePoints(cx: number, cy: number, rx: number, ry: number, count = 72): Point[] {
  const R = (rx * rx + ry * ry) / (2 * rx);
  const c2x = rx - R; // right arc center
  const phi = Math.atan2(ry, R - rx > 0 ? R - rx : -(rx - R));
  const points: Point[] = [];
  const half = Math.floor(count / 2);
  for (let i = 0; i <= half; i++) {
    const angle = -phi + (2 * phi * i) / half;
    points.push([cx + c2x + R * Math.cos(angle), cy + R * Math.sin(angle)]);
  }
  for (let i = 1; i < half; i++) {
    const angle = phi - (2 * phi * i) / half;
    points.push([cx - c2x - R * Math.cos(angle), cy + R * Math.sin(angle)]);
  }
  return points;
}

/** Equilateral triangle with gently convex (bulged outward) sides. */
export function trillionPoints(cx: number, cy: number, rx: number, ry: number, bulge = 0.12, count = 72): Point[] {
  const corners = regularPolygon(cx, cy, rx, ry, 3, -90);
  const points: Point[] = [];
  const perSide = Math.floor(count / 3);
  for (let s = 0; s < 3; s++) {
    const a = corners[s];
    const b = corners[(s + 1) % 3];
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    const outX = mx - cx;
    const outY = my - cy;
    const len = Math.sqrt(outX * outX + outY * outY) || 1;
    const bulgeX = mx + (outX / len) * rx * bulge;
    const bulgeY = my + (outY / len) * ry * bulge;
    for (let i = 0; i < perSide; i++) {
      const t = i / perSide;
      // Quadratic Bezier from a -> bulge control -> b
      const u = 1 - t;
      const x = u * u * a[0] + 2 * u * t * bulgeX + t * t * b[0];
      const y = u * u * a[1] + 2 * u * t * bulgeY + t * t * b[1];
      points.push([x, y]);
    }
  }
  return points;
}
