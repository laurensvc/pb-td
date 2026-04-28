import { describe, expect, it } from 'vitest';
import { defaultMap } from './config';
import { buildOccupancy, canPlaceWithoutBlocking, findPath } from './pathfinding';
import type { TowerState } from './types';

function tower(id: number, x: number, y: number): TowerState {
  return {
    id,
    gemId: 'ruby-1',
    name: 'Ruby Shard',
    family: 'ruby',
    tier: 1,
    x,
    y,
    damage: 10,
    range: 3,
    cooldown: 1,
    cooldownLeft: 0,
    projectileSpeed: 5,
    color: '#e15c5c',
    splashRadius: 0,
    slow: 0,
    kills: 0,
  };
}

describe('pathfinding', () => {
  it('finds a route from entrance to exit', () => {
    const occupied = buildOccupancy(defaultMap, []);
    const path = findPath(defaultMap, occupied, defaultMap.entrance, defaultMap.exit);
    expect(path.length).toBeGreaterThan(0);
    expect(path[0]).toEqual(defaultMap.entrance);
    expect(path[path.length - 1]).toEqual(defaultMap.exit);
  });

  it('rejects placements that fully block the map', () => {
    const towers: TowerState[] = [];
    for (let y = 0; y < defaultMap.height; y++) {
      if (y === 5) continue;
      towers.push(tower(y + 1, 8, y));
    }
    const occupied = buildOccupancy(defaultMap, towers);
    expect(canPlaceWithoutBlocking(defaultMap, occupied, 8, 5, [])).toBe(false);
  });
});
