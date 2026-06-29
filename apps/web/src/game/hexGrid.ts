import type { Vec2 } from './types';

/** Flat-top hex grid in axial coordinates (q, r) stored as Vec2.x / Vec2.y. */
export const HEX_SQRT3 = Math.sqrt(3);

/** World-space distance between centers of adjacent hexes (used for ranges). */
export const HEX_NEIGHBOR_DIST = 1;

const AXIAL_NEIGHBORS: readonly Vec2[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
  { x: 1, y: -1 },
  { x: -1, y: 1 },
];

export function hexKey(q: number, r: number): string {
  return `${q},${r}`;
}

export function parseHexKey(key: string): Vec2 {
  const [q, r] = key.split(',').map(Number);
  return { x: q, y: r };
}

export function isOnBoard(q: number, r: number, boardW: number, boardH: number): boolean {
  return q >= 0 && r >= 0 && q < boardW && r < boardH;
}

export function hexNeighbors(q: number, r: number): Vec2[] {
  return AXIAL_NEIGHBORS.map((d) => ({ x: q + d.x, y: r + d.y }));
}

export function hexAreAdjacent(a: Vec2, b: Vec2): boolean {
  return hexDistance(a.x, a.y, b.x, b.y) === 1;
}

export function hexDistance(q0: number, r0: number, q1: number, r1: number): number {
  return (Math.abs(q0 - q1) + Math.abs(q0 + r0 - q1 - r1) + Math.abs(r0 - r1)) / 2;
}

/** Continuous world position of a hex center (adjacent centers are 1 unit apart). */
export function hexWorldCenter(q: number, r: number): Vec2 {
  return { x: q + r * 0.5, y: (r * HEX_SQRT3) / 2 };
}

export function worldToHex(x: number, y: number): Vec2 {
  const r = (2 * y) / HEX_SQRT3;
  const q = x - r / 2;
  return hexRound(q, r);
}

export function hexRound(q: number, r: number): Vec2 {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);
  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return { x: rq, y: rr };
}

export function allBoardCells(boardW: number, boardH: number): Vec2[] {
  const cells: Vec2[] = [];
  for (let r = 0; r < boardH; r++) {
    for (let q = 0; q < boardW; q++) {
      cells.push({ x: q, y: r });
    }
  }
  return cells;
}

/** Hex cells along a straight line in axial space (for spawn/goal corridors). */
export function hexLine(a: Vec2, b: Vec2): Vec2[] {
  const n = hexDistance(a.x, a.y, b.x, b.y);
  if (n === 0) return [{ x: a.x, y: a.y }];
  const results: Vec2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const q = a.x + (b.x - a.x) * t;
    const r = a.y + (b.y - a.y) * t;
    results.push(hexRound(q, r));
  }
  return results;
}

export function hexLineKeys(a: Vec2, b: Vec2): Set<string> {
  return new Set(hexLine(a, b).map((c) => hexKey(c.x, c.y)));
}

/** Pixel center for flat-top hex with given outer radius (center to vertex). */
export function hexPixelCenter(q: number, r: number, radius: number): Vec2 {
  return {
    x: radius * HEX_SQRT3 * (q + r / 2),
    y: radius * 1.5 * r,
  };
}

/** Pixel outline vertices for a flat-top hex (6 points, closed loop). */
export function hexPixelCorners(q: number, r: number, radius: number): Vec2[] {
  const center = hexPixelCenter(q, r, radius);
  const corners: Vec2[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    corners.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    });
  }
  return corners;
}

export function pixelToHex(px: number, py: number, radius: number): Vec2 {
  const q = ((HEX_SQRT3 / 3) * px - (1 / 3) * py) / radius;
  const r = ((2 / 3) * py) / radius;
  return hexRound(q, r);
}

export function boardPixelBounds(
  boardW: number,
  boardH: number,
  radius: number,
): { width: number; height: number; padX: number; padY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let r = 0; r < boardH; r++) {
    for (let q = 0; q < boardW; q++) {
      for (const corner of hexPixelCorners(q, r, radius)) {
        minX = Math.min(minX, corner.x);
        minY = Math.min(minY, corner.y);
        maxX = Math.max(maxX, corner.x);
        maxY = Math.max(maxY, corner.y);
      }
    }
  }
  return {
    width: maxX - minX,
    height: maxY - minY,
    padX: -minX,
    padY: -minY,
  };
}

/** World units per pixel at a given hex radius. */
export function worldPerPixel(radius: number): number {
  return 1 / (radius * HEX_SQRT3);
}
