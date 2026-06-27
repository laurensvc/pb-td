import { describe, expect, it } from 'vitest';
import { buildPathNav, nearestPathCell, pathProgressAt, stepEnemyOnPath } from './pathNav';
import type { EnemyState } from './types';

const lPath = [
  { x: 0, y: 1 },
  { x: 2, y: 1 },
  { x: 2, y: 3 },
];

describe('buildPathNav', () => {
  it('assigns zero distance at the goal cell', () => {
    const nav = buildPathNav(lPath);
    const goalKey = `${nav.goalCell.x},${nav.goalCell.y}`;
    expect(nav.distanceToGoal.get(goalKey)).toBe(0);
    expect(nav.maxProgress).toBeGreaterThan(0);
  });

  it('increases path progress toward the goal', () => {
    const nav = buildPathNav(lPath);
    const spawnProgress = pathProgressAt(nav, nav.spawnCell.x, nav.spawnCell.y);
    const goalProgress = pathProgressAt(nav, nav.goalCell.x, nav.goalCell.y);
    expect(goalProgress).toBeGreaterThan(spawnProgress);
  });
});

describe('stepEnemyOnPath', () => {
  it('moves an enemy closer to the goal over time', () => {
    const nav = buildPathNav(lPath);
    const enemy: EnemyState = {
      id: 1,
      definitionId: 'scout',
      name: 'Scout',
      x: nav.spawnCell.x,
      y: nav.spawnCell.y,
      pathProgress: pathProgressAt(nav, nav.spawnCell.x, nav.spawnCell.y),
      hp: 10,
      maxHp: 10,
      shield: 0,
      maxShield: 0,
      speed: 4,
      rewardStars: 1,
      rewardGold: 1,
      color: '#fff',
      alive: true,
      leaked: false,
      poisonDps: 0,
      poisonUntil: 0,
      slowUntil: 0,
      slowFactor: 1,
      armorReduction: 0,
    };
    const startProgress = enemy.pathProgress;
    for (let i = 0; i < 20; i++) {
      stepEnemyOnPath(enemy, nav, 0.05);
    }
    expect(enemy.pathProgress).toBeGreaterThan(startProgress);
  });

  it('leaks when the enemy reaches the goal cell', () => {
    const nav = buildPathNav(lPath);
    const enemy: EnemyState = {
      id: 1,
      definitionId: 'scout',
      name: 'Scout',
      x: nav.goalCell.x,
      y: nav.goalCell.y,
      pathProgress: nav.maxProgress,
      hp: 10,
      maxHp: 10,
      shield: 0,
      maxShield: 0,
      speed: 1,
      rewardStars: 1,
      rewardGold: 1,
      color: '#fff',
      alive: true,
      leaked: false,
      poisonDps: 0,
      poisonUntil: 0,
      slowUntil: 0,
      slowFactor: 1,
      armorReduction: 0,
    };
    expect(stepEnemyOnPath(enemy, nav, 0.05)).toBe('leaked');
  });
});

describe('nearestPathCell', () => {
  it('snaps to the closest corridor cell', () => {
    const nav = buildPathNav(lPath);
    const cell = nearestPathCell(1.2, 1.1, nav.pathCells);
    expect(nav.pathCells.has(`${cell.x},${cell.y}`)).toBe(true);
  });
});
