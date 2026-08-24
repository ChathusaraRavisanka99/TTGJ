import * as THREE from "three";
import { type Point } from "./geometry";
import { getCutOutline, type CutOutline } from "./cutOutline";

function centered(outline: CutOutline): Point[] {
  return outline.points.map(([x, y]) => [x - outline.center[0], y - outline.center[1]]);
}

function pushRing(positions: number[], points: Point[], z: number, scale = 1) {
  for (const [x, y] of points) positions.push(x * scale, y * scale, z);
}

/** Faceted crown/pavilion solid — works for any cut outline (round, fancy, step-cut, etc). */
function buildFacetedGeometry(outline: CutOutline, opts: { pavilionPoint: boolean; crownHeight: number; pavilionHeight: number; tableScale: number }): THREE.BufferGeometry {
  const pts = centered(outline);
  const n = pts.length;
  const r = outline.boundingRadius || 1;
  const crownH = opts.crownHeight * r;
  const pavilionH = opts.pavilionHeight * r;

  const positions: number[] = [];
  pushRing(positions, pts, 0); // girdle: 0..n-1
  pushRing(positions, pts, crownH, opts.tableScale); // table ring: n..2n-1
  positions.push(0, 0, crownH); // table center: 2n
  const bottomIndex = 2 * n + 1;
  if (opts.pavilionPoint) {
    positions.push(0, 0, -pavilionH); // culet point: 2n+1
  } else {
    positions.push(0, 0, 0); // flat bottom center (rose cut style)
  }

  const indices: number[] = [];
  const tableCenter = 2 * n;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const g0 = i;
    const g1 = j;
    const t0 = n + i;
    const t1 = n + j;
    // Crown side quad (girdle -> table ring)
    indices.push(g0, g1, t1, g0, t1, t0);
    // Table cap fan
    indices.push(tableCenter, t0, t1);
    // Pavilion / bottom fan
    indices.push(bottomIndex, g1, g0);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Smooth polished dome for cabochon cuts, flat on the underside. */
function buildDomeGeometry(outline: CutOutline, domeHeightRatio: number, steps: number): THREE.BufferGeometry {
  const pts = centered(outline);
  const n = pts.length;
  const r = outline.boundingRadius || 1;
  const domeH = domeHeightRatio * r;

  const positions: number[] = [];
  const ringStartIndices: number[] = [];

  for (let s = 0; s <= steps; s++) {
    const t = (s / steps) * (Math.PI / 2);
    const scale = Math.cos(t);
    const z = Math.sin(t) * domeH;
    ringStartIndices.push(positions.length / 3);
    pushRing(positions, pts, z, scale);
  }
  const apexIndex = positions.length / 3;
  positions.push(0, 0, domeH);

  const bottomCenterIndex = apexIndex + 1;
  positions.push(0, 0, 0);

  const indices: number[] = [];
  for (let s = 0; s < steps; s++) {
    const ringA = ringStartIndices[s];
    const ringB = ringStartIndices[s + 1];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      indices.push(ringA + i, ringA + j, ringB + j, ringA + i, ringB + j, ringB + i);
    }
  }
  const lastRing = ringStartIndices[steps];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    indices.push(apexIndex, lastRing + i, lastRing + j);
  }
  const girdleRing = ringStartIndices[0];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    indices.push(bottomCenterIndex, girdleRing + j, girdleRing + i);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export interface GemMesh3D {
  geometry: THREE.BufferGeometry;
  smooth: boolean;
}

export function buildGemMesh(cutSlug: string): GemMesh3D {
  const outline = getCutOutline(cutSlug);

  switch (outline.style) {
    case "faceted":
      return {
        geometry: buildFacetedGeometry(outline, { pavilionPoint: true, crownHeight: 0.32, pavilionHeight: 0.58, tableScale: 0.55 }),
        smooth: false,
      };
    case "rose":
      return {
        geometry: buildFacetedGeometry(outline, { pavilionPoint: false, crownHeight: 0.55, pavilionHeight: 0, tableScale: 0.001 }),
        smooth: false,
      };
    case "cabochon":
      return { geometry: buildDomeGeometry(outline, 0.5, 5), smooth: true };
    case "cabochon-ridge":
      return { geometry: buildDomeGeometry(outline, 0.68, 4), smooth: true };
    default:
      return {
        geometry: buildFacetedGeometry(outline, { pavilionPoint: true, crownHeight: 0.32, pavilionHeight: 0.58, tableScale: 0.55 }),
        smooth: false,
      };
  }
}
