import type { DraftCandidate, GridPoint, MapDefinition, TowerState } from './types';

const DIRECTIONS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
] as const;

export function toIndex(x: number, y: number, width: number): number {
  return y * width + x;
}

export function isInside(map: MapDefinition, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < map.width && y < map.height;
}

export function buildOccupancy(
  map: MapDefinition,
  towers: readonly TowerState[],
  stones: readonly GridPoint[] = [],
  draft: readonly DraftCandidate[] = [],
): Int16Array {
  const occupied = new Int16Array(map.width * map.height);
  for (let i = 0; i < map.blocked.length; i++) {
    occupied[toIndex(map.blocked[i].x, map.blocked[i].y, map.width)] = -1;
  }
  for (let i = 0; i < stones.length; i++) {
    occupied[toIndex(stones[i].x, stones[i].y, map.width)] = -2;
  }
  for (let i = 0; i < draft.length; i++) {
    occupied[toIndex(draft[i].x, draft[i].y, map.width)] = -3;
  }
  for (let i = 0; i < towers.length; i++) {
    occupied[toIndex(towers[i].x, towers[i].y, map.width)] = towers[i].id;
  }
  return occupied;
}

export function isBuildable(
  map: MapDefinition,
  occupied: Int16Array,
  x: number,
  y: number,
): boolean {
  if (!isInside(map, x, y)) return false;
  if (x === map.entrance.x && y === map.entrance.y) return false;
  if (x === map.exit.x && y === map.exit.y) return false;
  return occupied[toIndex(x, y, map.width)] === 0;
}

export function isWalkable(
  map: MapDefinition,
  occupied: Int16Array,
  x: number,
  y: number,
): boolean {
  if (!isInside(map, x, y)) return false;
  if (x === map.entrance.x && y === map.entrance.y) return true;
  if (x === map.exit.x && y === map.exit.y) return true;
  return occupied[toIndex(x, y, map.width)] === 0;
}

export function findPath(
  map: MapDefinition,
  occupied: Int16Array,
  start: GridPoint,
  end: GridPoint,
): GridPoint[] {
  const total = map.width * map.height;
  const queue = new Int16Array(total);
  const previous = new Int16Array(total);
  const visited = new Uint8Array(total);
  for (let i = 0; i < total; i++) previous[i] = -1;

  const startIndex = toIndex(start.x, start.y, map.width);
  const endIndex = toIndex(end.x, end.y, map.width);
  let read = 0;
  let write = 0;
  queue[write++] = startIndex;
  visited[startIndex] = 1;

  while (read < write) {
    const current = queue[read++];
    if (current === endIndex) break;
    const cx = current % map.width;
    const cy = Math.floor(current / map.width);

    for (let i = 0; i < DIRECTIONS.length; i++) {
      const nx = cx + DIRECTIONS[i].x;
      const ny = cy + DIRECTIONS[i].y;
      if (!isWalkable(map, occupied, nx, ny)) continue;
      const nextIndex = toIndex(nx, ny, map.width);
      if (visited[nextIndex] === 1) continue;
      visited[nextIndex] = 1;
      previous[nextIndex] = current;
      queue[write++] = nextIndex;
    }
  }

  if (visited[endIndex] === 0) return [];

  const reverse: GridPoint[] = [];
  let cursor = endIndex;
  while (cursor !== -1) {
    reverse.push({ x: cursor % map.width, y: Math.floor(cursor / map.width) });
    if (cursor === startIndex) break;
    cursor = previous[cursor];
  }

  const path: GridPoint[] = [];
  for (let i = reverse.length - 1; i >= 0; i--) path.push(reverse[i]);
  return path;
}

export function canPlaceWithoutBlocking(
  map: MapDefinition,
  occupied: Int16Array,
  x: number,
  y: number,
  enemyCells: readonly GridPoint[],
): boolean {
  if (!isBuildable(map, occupied, x, y)) return false;
  const index = toIndex(x, y, map.width);
  occupied[index] = -2;
  const mainPath = findPath(map, occupied, map.entrance, map.exit);
  if (mainPath.length === 0) {
    occupied[index] = 0;
    return false;
  }
  for (let i = 0; i < enemyCells.length; i++) {
    const cell = enemyCells[i];
    if (cell.x === x && cell.y === y) {
      occupied[index] = 0;
      return false;
    }
    if (findPath(map, occupied, cell, map.exit).length === 0) {
      occupied[index] = 0;
      return false;
    }
  }
  occupied[index] = 0;
  return true;
}
