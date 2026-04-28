import { describe, expect, it } from 'vitest';
import { defaultMap } from './config';
import {
  buildOccupancy,
  canPlaceWithoutBlocking,
  findCheckpointPaths,
  flattenCheckpointPaths,
} from './pathfinding';
import type { TowerState } from './types';

function tower(id: number, x: number, y: number): TowerState {
  return {
    id,
    gemId: 'ruby-1',
    name: 'Ruby/R1',
    family: 'ruby',
    tier: 1,
    classification: 'gem',
    x,
    y,
    damage: 10,
    range: 5,
    cooldown: 1,
    cooldownLeft: 0,
    projectileSpeed: 8,
    color: '#e15c5c',
    damageType: 'physical',
    effects: [],
    kills: 0,
    roundDamage: 0,
    totalDamage: 0,
    mvpAwards: 0,
    stopped: false,
    targetId: null,
    targetMode: 'first',
    buffUntil: 0,
    attackSpeedBuff: 0,
    rangeBuff: 0,
    critBuff: 0,
    critMultiplier: 1,
  };
}

describe('pathfinding', () => {
  it('finds a route through all checkpoints', () => {
    const occupied = buildOccupancy(defaultMap, []);
    const paths = findCheckpointPaths(defaultMap, occupied);
    const flattened = flattenCheckpointPaths(paths);
    expect(paths.length).toBeGreaterThanOrEqual(defaultMap.checkpoints.length);
    expect(flattened[0]).toEqual(defaultMap.entrance);
    expect(flattened[flattened.length - 1]).toEqual(defaultMap.exit);
  });

  it('rejects placements that fully block the checkpoint route', () => {
    const towers: TowerState[] = [];
    for (let y = 0; y < defaultMap.height; y++) {
      if (y === 5) continue;
      towers.push(tower(y + 1, 8, y));
    }
    const occupied = buildOccupancy(defaultMap, towers);
    expect(canPlaceWithoutBlocking(defaultMap, occupied, 8, 5, [])).toBe(false);
  });
});
