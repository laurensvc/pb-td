import type { Vec2 } from './types';

/** Orthogonal square grid in integer cell coordinates (q, r) stored as Vec2.x / Vec2.y. */
export const HEX_SQRT3 = 1;

/** World-space distance between centers of adjacent cells (used for ranges). */
export const HEX_NEIGHBOR_DIST = 1;

const ORTHO_NEIGHBORS: readonly Vec2[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
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
  return ORTHO_NEIGHBORS.map((d) => ({ x: q + d.x, y: r + d.y }));
}

export function hexAreAdjacent(a: Vec2, b: Vec2): boolean {
  return hexDistance(a.x, a.y, b.x, b.y) === 1;
}

export function hexDistance(q0: number, r0: number, q1: number, r1: number): number {
  return Math.abs(q0 - q1) + Math.abs(r0 - r1);
}

/** Continuous world position of a cell center (adjacent centers are 1 unit apart). */
export function hexWorldCenter(q: number, r: number): Vec2 {
  return { x: q + 0.5, y: r + 0.5 };
}

export function worldToHex(x: number, y: number): Vec2 {
  return { x: Math.floor(x), y: Math.floor(y) };
}

export function hexRound(q: number, r: number): Vec2 {
  return { x: Math.round(q), y: Math.round(r) };
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

/** Grid cells along a straight line between endpoints (Bresenham). */
export function hexLine(a: Vec2, b: Vec2): Vec2[] {
  let x0 = a.x;
  let y0 = a.y;
  const x1 = b.x;
  const y1 = b.y;
  const results: Vec2[] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    results.push({ x: x0, y: y0 });
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
  return results;
}

export function hexLineKeys(a: Vec2, b: Vec2): Set<string> {
  return new Set(hexLine(a, b).map((c) => hexKey(c.x, c.y)));
}

/** Pixel center for a square tile. */
export function hexPixelCenter(q: number, r: number, tileSize: number): Vec2 {
  return {
    x: (q + 0.5) * tileSize,
    y: (r + 0.5) * tileSize,
  };
}

/** Pixel outline corners for a square tile (4 points, closed loop). */
export function hexPixelCorners(q: number, r: number, tileSize: number): Vec2[] {
  const x0 = q * tileSize;
  const y0 = r * tileSize;
  return [
    { x: x0, y: y0 },
    { x: x0 + tileSize, y: y0 },
    { x: x0 + tileSize, y: y0 + tileSize },
    { x: x0, y: y0 + tileSize },
  ];
}

export function pixelToHex(px: number, py: number, tileSize: number): Vec2 {
  return {
    x: Math.floor(px / tileSize),
    y: Math.floor(py / tileSize),
  };
}

export function boardPixelBounds(
  boardW: number,
  boardH: number,
  tileSize: number,
): { width: number; height: number; padX: number; padY: number } {
  return {
    width: boardW * tileSize,
    height: boardH * tileSize,
    padX: 0,
    padY: 0,
  };
}

/** World units per pixel at a given tile size. */
export function worldPerPixel(tileSize: number): number {
  return 1 / tileSize;
}
