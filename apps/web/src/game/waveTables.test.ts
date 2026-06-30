import { describe, expect, it } from 'vitest';
import { getWave } from './content';
import {
  authoredWaveSegments,
  buildWaveSpawnTracker,
  countWaveEnemies,
  spawnedWaveCount,
} from './waveTables';

describe('wave tables', () => {
  it('authors wave 1 for each area', () => {
    expect(authoredWaveSegments('a1', 1, 'normal')).not.toBeNull();
    expect(authoredWaveSegments('a2', 1, 'normal')).not.toBeNull();
    expect(authoredWaveSegments('a3', 1, 'normal')).not.toBeNull();
  });

  it('uses authored segments in area wave definitions', () => {
    const wave1 = getWave('a1', 'normal', 0);
    expect(wave1.segments[0]?.enemyId).toBe('scout');
    expect(countWaveEnemies(wave1.segments)).toBeGreaterThan(10);
  });

  it('tracks spawn progress through segments', () => {
    const segments = [
      { enemyId: 'scout' as const, count: 5 },
      { enemyId: 'trooper' as const, count: 3 },
    ];
    expect(spawnedWaveCount(segments, 0, 5)).toBe(0);
    expect(spawnedWaveCount(segments, 0, 2)).toBe(3);
    const tracker = buildWaveSpawnTracker(segments, 1, 3, 2, 4, () => 'Scout');
    expect(tracker.total).toBe(8);
    expect(tracker.spawned).toBe(5);
    expect(tracker.remaining).toBe(3);
    expect(tracker.killed).toBe(4);
  });
});
