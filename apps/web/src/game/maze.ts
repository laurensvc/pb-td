import { cellKey } from './pathBuild';
import { hexKey, hexNeighbors, isOnBoard as hexIsOnBoard } from './hexGrid';
import type { PathNavData, Vec2 } from './types';

export interface MazeLayout {
  boardW: number;
  boardH: number;
  spawnCell: Vec2;
  goalCell: Vec2;
  rocks: ReadonlySet<string>;
  blockedTowerCells: ReadonlySet<string>;
}

export function createMazeLayout(
  boardW: number,
  boardH: number,
  spawnCell: Vec2,
  goalCell: Vec2,
  rocks: Iterable<Vec2> = [],
  blockedTowerCells: Iterable<Vec2> = [],
): MazeLayout {
  return {
    boardW,
    boardH,
    spawnCell: { ...spawnCell },
    goalCell: { ...goalCell },
    rocks: new Set([...rocks].map((c) => cellKey(c.x, c.y))),
    blockedTowerCells: new Set([...blockedTowerCells].map((c) => cellKey(c.x, c.y))),
  };
}

export function isWalkableCell(layout: MazeLayout, q: number, r: number): boolean {
  if (!hexIsOnBoard(q, r, layout.boardW, layout.boardH)) return false;
  const key = cellKey(q, r);
  if (key === cellKey(layout.spawnCell.x, layout.spawnCell.y)) return true;
  if (key === cellKey(layout.goalCell.x, layout.goalCell.y)) return true;
  if (layout.rocks.has(key)) return false;
  if (layout.blockedTowerCells.has(key)) return false;
  return true;
}

export function hasValidPath(layout: MazeLayout): boolean {
  return buildMazePathNav(layout).pathCells.size > 0;
}

export function buildMazePathNav(layout: MazeLayout): PathNavData {
  const pathCells = new Set<string>();
  const distanceToGoal = bfsDistanceToGoal(layout);
  for (const key of distanceToGoal.keys()) {
    pathCells.add(key);
  }

  let maxProgress = 0;
  for (const dist of distanceToGoal.values()) {
    maxProgress = Math.max(maxProgress, dist);
  }

  return {
    pathCells,
    distanceToGoal,
    maxProgress,
    goalCell: { ...layout.goalCell },
    spawnCell: { ...layout.spawnCell },
  };
}

export function canPlaceRock(layout: MazeLayout, q: number, r: number): boolean {
  const key = cellKey(q, r);
  if (layout.rocks.has(key)) return false;
  if (key === cellKey(layout.spawnCell.x, layout.spawnCell.y)) return false;
  if (key === cellKey(layout.goalCell.x, layout.goalCell.y)) return false;

  const trial = createMazeLayout(
    layout.boardW,
    layout.boardH,
    layout.spawnCell,
    layout.goalCell,
    [...keysToVec2(layout.rocks), { x: q, y: r }],
    keysToVec2(layout.blockedTowerCells),
  );
  return hasValidPath(trial);
}

export function rockRefundPercent(rocksPlaced: number): number {
  const table = [1, 0.85, 0.7, 0.55, 0.4];
  if (rocksPlaced < table.length) return table[rocksPlaced]!;
  return 0.25;
}

function bfsDistanceToGoal(layout: MazeLayout): Map<string, number> {
  const distances = new Map<string, number>();
  const goalKey = cellKey(layout.goalCell.x, layout.goalCell.y);
  if (!isWalkableCell(layout, layout.goalCell.x, layout.goalCell.y)) return distances;

  const queue: Vec2[] = [{ ...layout.goalCell }];
  distances.set(goalKey, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentKey = cellKey(current.x, current.y);
    const currentDist = distances.get(currentKey) ?? 0;

    for (const neighbor of hexNeighbors(current.x, current.y)) {
      const nq = neighbor.x;
      const nr = neighbor.y;
      if (!isWalkableCell(layout, nq, nr)) continue;
      const neighborKey = hexKey(nq, nr);
      if (distances.has(neighborKey)) continue;
      distances.set(neighborKey, currentDist + 1);
      queue.push({ x: nq, y: nr });
    }
  }

  const spawnKey = cellKey(layout.spawnCell.x, layout.spawnCell.y);
  if (!distances.has(spawnKey)) return new Map();

  return distances;
}

function keysToVec2(keys: ReadonlySet<string>): Vec2[] {
  return [...keys].map((key) => {
    const [q, r] = key.split(',').map(Number);
    return { x: q, y: r };
  });
}
