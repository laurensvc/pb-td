import { describe, expect, it } from 'vitest';
import { cellKey } from './pathBuild';
import { hexWorldCenter } from './hexGrid';
import { buildPathNav, stepEnemyOnPath } from './pathNav';

describe('pathNav hex', () => {
  const path = [
    { x: 0, y: 5 },
    { x: 10, y: 5 },
    { x: 10, y: 8 },
    { x: 15, y: 8 },
  ];
  const nav = buildPathNav(path);

  it('builds nav data for a hex corridor', () => {
    expect(nav.pathCells.size).toBeGreaterThan(10);
    expect(nav.distanceToGoal.get(cellKey(nav.goalCell.x, nav.goalCell.y))).toBe(0);
    expect(nav.distanceToGoal.get(cellKey(nav.spawnCell.x, nav.spawnCell.y))).toBeGreaterThan(0);
  });

  it('steps enemies along the hex path', () => {
    const start = hexWorldCenter(nav.spawnCell.x, nav.spawnCell.y);
    const enemy = { x: start.x, y: start.y, pathProgress: 0, speed: 1.5 };
    const result = stepEnemyOnPath(enemy, nav, 1);
    expect(result).toBe('moving');
    expect(Math.hypot(enemy.x - start.x, enemy.y - start.y)).toBeGreaterThan(0);
  });
});
