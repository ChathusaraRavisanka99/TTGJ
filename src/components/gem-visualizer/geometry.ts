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

/**
 * Pear/teardrop outline: a circular "bulb" (the rounded end) with two
 * straight tangent lines converging to a sharp point (the tip). This is the
 * standard construction for a teardrop shape — a plain cardioid (the
 * previous approach here) looks similar at a glance but actually has a
 * slight concave "dimple" near the cusp, so the topmost point of the curve
 * isn't the tip at all. The tangent-line construction has none of that: the
 * point is genuinely the shape's extremity, with clean shoulders leading
 * into the round bulb.
 */
export function pearPoints(cx: number, cy: number, rx: number, ry: number, count = 72): Point[] {
  const bulbR = 1;
  const tipDist = 2.5; // distance from bulb centre to tip, in bulb radii — larger = sharper point
  const alpha = Math.acos(bulbR / tipDist);

  const tip: Point = [0, -tipDist];
  const rightTangent: Point = [bulbR * Math.sin(alpha), -bulbR * Math.cos(alpha)];
  const leftTangent: Point = [-bulbR * Math.sin(alpha), -bulbR * Math.cos(alpha)];

  const shoulderCount = Math.max(3, Math.round(count * 0.1));
  const arcCount = Math.max(8, count - shoulderCount * 2);

  const raw: Point[] = [];
  for (let i = 0; i < shoulderCount; i++) {
    const t = i / shoulderCount;
    raw.push([tip[0] + (rightTangent[0] - tip[0]) * t, tip[1] + (rightTangent[1] - tip[1]) * t]);
  }
  const startAngle = Math.atan2(rightTangent[1], rightTangent[0]);
  let endAngle = Math.atan2(leftTangent[1], leftTangent[0]);
  if (endAngle < startAngle) endAngle += Math.PI * 2; // sweep the long way, through the bulb's bottom
  for (let i = 0; i <= arcCount; i++) {
    const a = startAngle + ((endAngle - startAngle) * i) / arcCount;
    raw.push([bulbR * Math.cos(a), bulbR * Math.sin(a)]);
  }
  for (let i = 1; i <= shoulderCount; i++) {
    const t = i / shoulderCount;
    raw.push([leftTangent[0] + (tip[0] - leftTangent[0]) * t, leftTangent[1] + (tip[1] - leftTangent[1]) * t]);
  }

  // Normalize so the shape's own bounding box maps exactly onto (rx, ry),
  // centred at (cx, cy).
  const xs = raw.map(([x]) => x);
  const ys = raw.map(([, y]) => y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const midY = (minY + maxY) / 2;
  const halfHeight = (maxY - minY) / 2;
  const halfWidth = Math.max(...xs.map(Math.abs));

  return raw.map(([x, y]) => [cx + (x / halfWidth) * rx, cy + ((y - midY) / halfHeight) * ry]);
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

/**
 * Marquise (pointed lens): an elliptical "waist" with straight tangent
 * shoulders converging to a sharp point at each end.
 *
 * A circle pinned through the tip and the target half-width (the previous
 * approach here) overshoots partway along the curve — for an elongated
 * marquise, that single circle's own natural apex lands off to one side,
 * not at the shape's true centre — so the rendered outline actually pinches
 * inward at x=0 instead of being widest there. This builds the round part
 * from the ellipse's own parametrization instead, which by construction is
 * always widest exactly at the centre.
 */
export function marquisePoints(cx: number, cy: number, rx: number, ry: number, count = 72): Point[] {
  const a = rx * 0.62; // ellipse semi-axis along x; the remaining length is the pointed shoulder
  const b = ry;
  const scale = b / a;
  const tipDistCircularized = rx * scale;
  const alpha = Math.acos(b / tipDistCircularized);
  const theta = Math.PI / 2 - alpha; // ellipse-parameter angle of the tangent point

  const tangentTop: Point = [a * Math.cos(theta), b * Math.sin(theta)];

  const shoulderCount = Math.max(3, Math.round(count * 0.08));
  const arcCount = Math.max(10, Math.floor(count / 2) - shoulderCount);

  const top: Point[] = [];
  for (let i = 0; i < shoulderCount; i++) {
    const t = i / shoulderCount;
    top.push([rx + (tangentTop[0] - rx) * t, tangentTop[1] * t]);
  }
  for (let i = 0; i <= arcCount; i++) {
    const angle = theta + ((Math.PI - 2 * theta) * i) / arcCount;
    top.push([a * Math.cos(angle), b * Math.sin(angle)]);
  }
  for (let i = 1; i <= shoulderCount; i++) {
    const t = i / shoulderCount;
    top.push([-tangentTop[0] + (-rx - -tangentTop[0]) * t, tangentTop[1] * (1 - t)]);
  }

  const bottom = top
    .slice(1, -1)
    .reverse()
    .map(([x, y]) => [x, -y] as Point);

  return [...top, ...bottom].map(([x, y]) => [cx + x, cy + y]);
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
