import { cellsAlongPath, cellKey } from './pathBuild';
import type { EnemyState, PathNavData, Vec2 } from './types';

export const LEAK_EPSILON = 0.15;

const NEIGHBORS: readonly [number, number][] = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
];

export function buildPathNav(path: readonly Vec2[]): PathNavData {
  const pathCells = cellsAlongPath(path);
  const goalCell = nearestPathCell(path[path.length - 1].x, path[path.length - 1].y, pathCells);
  const spawnCell = nearestPathCell(path[0].x, path[0].y, pathCells);
  const distanceToGoal = bfsDistanceToGoal(pathCells, goalCell);
  let maxDist = 0;
  for (const dist of distanceToGoal.values()) {
    maxDist = Math.max(maxDist, dist);
  }
  return {
    pathCells,
    distanceToGoal,
    maxProgress: maxDist,
    goalCell,
    spawnCell,
  };
}

export function nearestPathCell(x: number, y: number, pathCells: ReadonlySet<string>): Vec2 {
  const candidates: Vec2[] = [
    { x: Math.floor(x), y: Math.floor(y) },
    { x: Math.ceil(x), y: Math.floor(y) },
    { x: Math.floor(x), y: Math.ceil(y) },
    { x: Math.ceil(x), y: Math.ceil(y) },
  ];
  let best: Vec2 | undefined;
  let bestDist = Infinity;
  for (const candidate of candidates) {
    if (!pathCells.has(cellKey(candidate.x, candidate.y))) continue;
    const dist = Math.hypot(candidate.x - x, candidate.y - y);
    if (dist < bestDist) {
      bestDist = dist;
      best = candidate;
    }
  }
  if (best) return best;
  for (const key of pathCells) {
    const [cx, cy] = key.split(',').map(Number);
    const dist = Math.hypot(cx - x, cy - y);
    if (dist < bestDist) {
      bestDist = dist;
      best = { x: cx, y: cy };
    }
  }
  return best ?? { x: 0, y: 0 };
}

export function pathProgressAt(nav: PathNavData, x: number, y: number): number {
  const cell = nearestPathCell(x, y, nav.pathCells);
  const dist = nav.distanceToGoal.get(cellKey(cell.x, cell.y)) ?? nav.maxProgress;
  return nav.maxProgress - dist;
}

export function stepEnemyOnPath(
  enemy: EnemyState,
  nav: PathNavData,
  dt: number,
): 'moving' | 'leaked' {
  const cell = nearestPathCell(enemy.x, enemy.y, nav.pathCells);
  const currentKey = cellKey(cell.x, cell.y);
  const distToGoal = nav.distanceToGoal.get(currentKey) ?? Infinity;

  if (distToGoal === 0) {
    return 'leaked';
  }

  let nextCell = cell;
  let bestDist = distToGoal;
  for (const [dx, dy] of NEIGHBORS) {
    const nx = cell.x + dx;
    const ny = cell.y + dy;
    const neighborKey = cellKey(nx, ny);
    if (!nav.pathCells.has(neighborKey)) continue;
    const neighborDist = nav.distanceToGoal.get(neighborKey) ?? Infinity;
    if (neighborDist < bestDist) {
      bestDist = neighborDist;
      nextCell = { x: nx, y: ny };
    }
  }

  const dx = nextCell.x - enemy.x;
  const dy = nextCell.y - enemy.y;
  const segmentLength = Math.hypot(dx, dy) || 0.001;
  const travel = enemy.speed * dt;

  if (travel >= segmentLength) {
    enemy.x = nextCell.x;
    enemy.y = nextCell.y;
  } else {
    enemy.x += (dx / segmentLength) * travel;
    enemy.y += (dy / segmentLength) * travel;
  }

  const updatedCell = nearestPathCell(enemy.x, enemy.y, nav.pathCells);
  const updatedDist = nav.distanceToGoal.get(cellKey(updatedCell.x, updatedCell.y)) ?? distToGoal;
  enemy.pathProgress = nav.maxProgress - updatedDist;

  if (
    updatedDist === 0 &&
    Math.hypot(enemy.x - nav.goalCell.x, enemy.y - nav.goalCell.y) <= LEAK_EPSILON
  ) {
    return 'leaked';
  }

  return 'moving';
}

function bfsDistanceToGoal(pathCells: ReadonlySet<string>, goalCell: Vec2): Map<string, number> {
  const distances = new Map<string, number>();
  const goalKey = cellKey(goalCell.x, goalCell.y);
  if (!pathCells.has(goalKey)) return distances;

  const queue: Vec2[] = [goalCell];
  distances.set(goalKey, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentKey = cellKey(current.x, current.y);
    const currentDist = distances.get(currentKey) ?? 0;

    for (const [dx, dy] of NEIGHBORS) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const neighborKey = cellKey(nx, ny);
      if (!pathCells.has(neighborKey) || distances.has(neighborKey)) continue;
      distances.set(neighborKey, currentDist + 1);
      queue.push({ x: nx, y: ny });
    }
  }

  return distances;
}
