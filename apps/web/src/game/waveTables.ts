import type { EnemyId, TierId, WaveSegment } from './types';

/** Authored wave segments keyed by area → wave number. Blends with procedural filler. */
const AREA_WAVE_OVERRIDES: Record<string, Partial<Record<number, WaveSegment[]>>> = {
  a1: {
    1: [
      { enemyId: 'scout', count: 10 },
      { enemyId: 'trooper', count: 4 },
    ],
    5: [
      { enemyId: 'runner', count: 8 },
      { enemyId: 'trooper', count: 6 },
    ],
    10: [
      { enemyId: 'colossus', count: 1 },
      { enemyId: 'bulwark', count: 5 },
      { enemyId: 'striker', count: 8 },
    ],
    20: [
      { enemyId: 'colossus', count: 1 },
      { enemyId: 'mystic', count: 6 },
      { enemyId: 'brute', count: 5 },
    ],
    30: [
      { enemyId: 'dreadnought', count: 1 },
      { enemyId: 'vanguard', count: 6 },
      { enemyId: 'striker', count: 10 },
    ],
    40: [
      { enemyId: 'dreadnought', count: 1 },
      { enemyId: 'warden', count: 8 },
      { enemyId: 'mystic', count: 8 },
    ],
    50: [
      { enemyId: 'dreadnought', count: 1 },
      { enemyId: 'vanguard', count: 10 },
      { enemyId: 'warden', count: 8 },
      { enemyId: 'brute', count: 6 },
    ],
  },
  a2: {
    1: [
      { enemyId: 'scout', count: 8 },
      { enemyId: 'runner', count: 6 },
    ],
    10: [
      { enemyId: 'colossus', count: 1 },
      { enemyId: 'runner', count: 10 },
      { enemyId: 'shifter', count: 4 },
    ],
    25: [
      { enemyId: 'colossus', count: 1 },
      { enemyId: 'mystic', count: 8 },
      { enemyId: 'shifter', count: 6 },
    ],
    50: [
      { enemyId: 'dreadnought', count: 1 },
      { enemyId: 'vanguard', count: 8 },
      { enemyId: 'mystic', count: 10 },
    ],
  },
  a3: {
    1: [
      { enemyId: 'trooper', count: 10 },
      { enemyId: 'bulwark', count: 4 },
    ],
    10: [
      { enemyId: 'colossus', count: 1 },
      { enemyId: 'brute', count: 6 },
      { enemyId: 'striker', count: 8 },
    ],
    35: [
      { enemyId: 'dreadnought', count: 1 },
      { enemyId: 'warden', count: 10 },
      { enemyId: 'mystic', count: 8 },
    ],
    50: [
      { enemyId: 'dreadnought', count: 1 },
      { enemyId: 'vanguard', count: 12 },
      { enemyId: 'warden', count: 10 },
    ],
  },
};

export function authoredWaveSegments(
  areaId: string,
  waveNumber: number,
  tier: TierId,
): WaveSegment[] | null {
  const override = AREA_WAVE_OVERRIDES[areaId]?.[waveNumber];
  if (!override) return null;
  if (tier === 'hard') {
    return override.map((segment) => ({
      ...segment,
      count: Math.max(1, Math.ceil(segment.count * 1.12)),
    }));
  }
  return override.map((segment) => ({ ...segment }));
}

export function countWaveEnemies(segments: readonly WaveSegment[]): number {
  return segments.reduce((sum, segment) => sum + segment.count, 0);
}

export function remainingWaveSpawns(
  segments: readonly WaveSegment[],
  segmentIndex: number,
  enemiesToSpawn: number,
): number {
  let remaining = enemiesToSpawn;
  for (let i = segmentIndex + 1; i < segments.length; i++) {
    remaining += segments[i]!.count;
  }
  return remaining;
}

export function spawnedWaveCount(
  segments: readonly WaveSegment[],
  segmentIndex: number,
  enemiesToSpawn: number,
): number {
  const total = countWaveEnemies(segments);
  return total - remainingWaveSpawns(segments, segmentIndex, enemiesToSpawn);
}

export type WaveSpawnTracker = {
  total: number;
  spawned: number;
  remaining: number;
  alive: number;
  killed: number;
  currentSegment: { enemyId: EnemyId; name: string } | null;
};

export function buildWaveSpawnTracker(
  segments: readonly WaveSegment[],
  segmentIndex: number,
  enemiesToSpawn: number,
  aliveEnemies: number,
  killedThisWave: number,
  enemyName: (id: EnemyId) => string,
): WaveSpawnTracker {
  const total = countWaveEnemies(segments);
  const remaining = remainingWaveSpawns(segments, segmentIndex, enemiesToSpawn);
  const spawned = spawnedWaveCount(segments, segmentIndex, enemiesToSpawn);
  const segment = segments[segmentIndex];
  return {
    total,
    spawned,
    remaining,
    alive: aliveEnemies,
    killed: killedThisWave,
    currentSegment: segment
      ? { enemyId: segment.enemyId, name: enemyName(segment.enemyId) }
      : null,
  };
}
