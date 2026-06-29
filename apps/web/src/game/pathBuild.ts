import type { Vec2 } from './types';

export const BUILD_ZONE_RADIUS = 2.0;

export const cellKey = (x: number, y: number): string => `${x},${y}`;

/** Integer grid cells whose centers lie on an axis-aligned polyline between waypoints. */
export function cellsAlongPath(path: readonly Vec2[]): Set<string> {
  const cells = new Set<string>();
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    if (a.x === b.x) {
      const x = a.x;
      const y0 = Math.min(a.y, b.y);
      const y1 = Math.max(a.y, b.y);
      for (let y = y0; y <= y1; y++) cells.add(cellKey(x, y));
    } else if (a.y === b.y) {
      const y = a.y;
      const x0 = Math.min(a.x, b.x);
      const x1 = Math.max(a.x, b.x);
      for (let x = x0; x <= x1; x++) cells.add(cellKey(x, y));
    }
  }
  return cells;
}

export function isOnPath(x: number, y: number, pathCells: ReadonlySet<string>): boolean {
  return pathCells.has(cellKey(Math.floor(x), Math.floor(y)));
}

export function isInBuildZone(
  x: number,
  y: number,
  pathCells: ReadonlySet<string>,
  boardW: number,
  boardH: number,
  radius = BUILD_ZONE_RADIUS,
): boolean {
  if (x < 0 || y < 0 || x >= boardW || y >= boardH) return false;
  if (isOnPath(x, y, pathCells)) return false;
  return minDistanceToPath(x, y, pathCells) <= radius;
}

/** Cells whose centers are in the build zone, sorted by (y, x). */
export function buildZoneCells(
  pathCells: ReadonlySet<string>,
  boardW: number,
  boardH: number,
  radius = BUILD_ZONE_RADIUS,
): Vec2[] {
  const cells: Vec2[] = [];
  for (let y = 0; y < boardH; y++) {
    for (let x = 0; x < boardW; x++) {
      if (isInBuildZone(x + 0.5, y + 0.5, pathCells, boardW, boardH, radius)) {
        cells.push({ x, y });
      }
    }
  }
  cells.sort((a, b) => a.y - b.y || a.x - b.x);
  return cells;
}

function minDistanceToPath(x: number, y: number, pathCells: ReadonlySet<string>): number {
  let min = Infinity;
  for (const key of pathCells) {
    const [cx, cy] = key.split(',').map(Number);
    const dist = Math.hypot(cx - x, cy - y);
    if (dist < min) min = dist;
  }
  return min;
}
