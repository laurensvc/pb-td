import type { Vec2 } from './types';

const cellKey = (x: number, y: number): string => `${x},${y}`;

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

const NEIGHBORS: readonly [number, number][] = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
];

/** In-bounds cells not on the path that share an edge with a path cell, sorted by (y, x). */
export function borderBuildSlots(path: readonly Vec2[], boardW: number, boardH: number): Vec2[] {
  const pathCells = cellsAlongPath(path);
  const slots: Vec2[] = [];
  for (let y = 0; y < boardH; y++) {
    for (let x = 0; x < boardW; x++) {
      if (pathCells.has(cellKey(x, y))) continue;
      let touchesPath = false;
      for (const [dx, dy] of NEIGHBORS) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= boardW || ny < 0 || ny >= boardH) continue;
        if (pathCells.has(cellKey(nx, ny))) {
          touchesPath = true;
          break;
        }
      }
      if (touchesPath) slots.push({ x, y });
    }
  }
  slots.sort((p, q) => p.y - q.y || p.x - q.x);
  return slots;
}
