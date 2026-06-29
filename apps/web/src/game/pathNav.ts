import { cellsAlongPath, cellKey } from './pathBuild';
import { hexKey, hexNeighbors, hexWorldCenter } from './hexGrid';
import type { PathNavData, Vec2 } from './types';

export const LEAK_EPSILON = 0.15;

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
  let best: Vec2 | undefined;
  let bestDist = Infinity;
  for (const key of pathCells) {
    const [cx, cy] = key.split(',').map(Number);
    const center = hexWorldCenter(cx, cy);
    const dist = Math.hypot(center.x - x, center.y - y);
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
  enemy: { x: number; y: number; pathProgress: number; speed: number },
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
  for (const neighbor of hexNeighbors(cell.x, cell.y)) {
    const neighborKey = hexKey(neighbor.x, neighbor.y);
    if (!nav.pathCells.has(neighborKey)) continue;
    const neighborDist = nav.distanceToGoal.get(neighborKey) ?? Infinity;
    if (neighborDist < bestDist) {
      bestDist = neighborDist;
      nextCell = neighbor;
    }
  }

  const nextCenter = hexWorldCenter(nextCell.x, nextCell.y);
  const dx = nextCenter.x - enemy.x;
  const dy = nextCenter.y - enemy.y;
  const segmentLength = Math.hypot(dx, dy) || 0.001;
  const travel = enemy.speed * dt;

  if (travel >= segmentLength) {
    enemy.x = nextCenter.x;
    enemy.y = nextCenter.y;
  } else {
    enemy.x += (dx / segmentLength) * travel;
    enemy.y += (dy / segmentLength) * travel;
  }

  const updatedCell = nearestPathCell(enemy.x, enemy.y, nav.pathCells);
  const updatedDist = nav.distanceToGoal.get(cellKey(updatedCell.x, updatedCell.y)) ?? distToGoal;
  enemy.pathProgress = nav.maxProgress - updatedDist;

  const goalCenter = hexWorldCenter(nav.goalCell.x, nav.goalCell.y);
  if (updatedDist === 0 && Math.hypot(enemy.x - goalCenter.x, enemy.y - goalCenter.y) <= LEAK_EPSILON) {
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

    for (const neighbor of hexNeighbors(current.x, current.y)) {
      const neighborKey = hexKey(neighbor.x, neighbor.y);
      if (!pathCells.has(neighborKey) || distances.has(neighborKey)) continue;
      distances.set(neighborKey, currentDist + 1);
      queue.push(neighbor);
    }
  }

  return distances;
}
