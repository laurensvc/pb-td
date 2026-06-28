import { defaultBoard } from '@facet/content';
import { cellKey, NEIGHBORS } from './rng';
import type { PathNavData, RockState, TowerState, Vec2 } from './types';

const board = defaultBoard;
const blockedSet = new Set(board.blocked.map(([x, y]) => cellKey(x, y)));

export function isBuildable(x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= board.width || y >= board.height) return false;
  const key = cellKey(x, y);
  if (key === cellKey(board.spawn.x, board.spawn.y)) return false;
  if (key === cellKey(board.exit.x, board.exit.y)) return false;
  if (blockedSet.has(key)) return false;
  return true;
}

export function isWalkable(
  x: number,
  y: number,
  rocks: readonly RockState[],
  towers: readonly TowerState[],
): boolean {
  const key = cellKey(x, y);
  if (key === cellKey(board.spawn.x, board.spawn.y)) return true;
  if (key === cellKey(board.exit.x, board.exit.y)) return true;
  if (!isBuildable(x, y) && !blockedSet.has(key)) return false;
  if (blockedSet.has(key)) return false;
  if (rocks.some((r) => r.x === x && r.y === y)) return false;
  if (towers.some((t) => t.x === x && t.y === y)) return false;
  return isBuildable(x, y) || key === cellKey(board.exit.x, board.exit.y);
}

export function buildPathNav(
  rocks: readonly RockState[],
  towers: readonly TowerState[],
): PathNavData {
  const distanceToGoal = new Map<string, number>();
  const goalKey = cellKey(board.exit.x, board.exit.y);
  const queue: Vec2[] = [{ ...board.exit }];
  distanceToGoal.set(goalKey, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentKey = cellKey(current.x, current.y);
    const currentDist = distanceToGoal.get(currentKey) ?? 0;

    for (const [dx, dy] of NEIGHBORS) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      if (!isWalkable(nx, ny, rocks, towers)) continue;
      const nk = cellKey(nx, ny);
      if (distanceToGoal.has(nk)) continue;
      distanceToGoal.set(nk, currentDist + 1);
      queue.push({ x: nx, y: ny });
    }
  }

  const pathCells = new Set(distanceToGoal.keys());
  let maxProgress = 0;
  for (const d of distanceToGoal.values()) maxProgress = Math.max(maxProgress, d);

  const spawnKey = cellKey(board.spawn.x, board.spawn.y);
  if (!distanceToGoal.has(spawnKey)) {
    return {
      pathCells: new Set(),
      distanceToGoal: new Map(),
      maxProgress: 0,
      spawnCell: { ...board.spawn },
      goalCell: { ...board.exit },
    };
  }

  return {
    pathCells,
    distanceToGoal,
    maxProgress,
    spawnCell: { ...board.spawn },
    goalCell: { ...board.exit },
  };
}

export function canPlaceRock(
  x: number,
  y: number,
  rocks: readonly RockState[],
  towers: readonly TowerState[],
): boolean {
  if (!isBuildable(x, y)) return false;
  if (rocks.some((r) => r.x === x && r.y === y)) return false;
  if (towers.some((t) => t.x === x && t.y === y)) return false;
  const trial = [...rocks, { x, y }];
  return buildPathNav(trial, towers).pathCells.has(cellKey(board.spawn.x, board.spawn.y));
}

export function canPlaceTower(
  x: number,
  y: number,
  rocks: readonly RockState[],
  towers: readonly TowerState[],
): boolean {
  return canPlaceRock(
    x,
    y,
    rocks.filter((r) => !(r.x === x && r.y === y)),
    towers,
  );
}

export { board as facetBoard };
