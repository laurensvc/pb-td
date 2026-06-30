import type { TierId, WaveDefinition, WaveSegment } from '../types';
import { authoredWaveSegments } from '../waveTables';
import { TOTAL_WAVES } from './constants';

const waveCache = new Map<string, WaveDefinition>();

export function waveClearGoldBonus(waveNumber: number): number {
  return 8 + Math.floor(waveNumber * 1.5);
}

export function getWaveCount(): number {
  return TOTAL_WAVES;
}

export function getWave(areaId: string, tierId: TierId, waveIndex: number): WaveDefinition {
  const key = `${areaId}:${tierId}:${waveIndex}`;
  let wave = waveCache.get(key);
  if (!wave) {
    wave = buildWave(areaId, waveIndex + 1, tierId);
    waveCache.set(key, wave);
  }
  return wave;
}

function buildWave(areaId: string, waveNumber: number, tier: TierId): WaveDefinition {
  const isBoss = waveNumber === 6 || waveNumber === 12 || waveNumber === 24;
  const authored = authoredWaveSegments(areaId, waveNumber, tier);
  const segments = authored ?? composeWaveSegments(waveNumber, isBoss, tier);
  const spawnInterval = Math.max(0.06, 0.14 - waveNumber * 0.0015);
  return {
    id: `wave-${areaId}-${waveNumber}-${tier}`,
    segments,
    spawnInterval,
    isBoss,
    goldBonus: waveClearGoldBonus(waveNumber),
  };
}

function composeWaveSegments(waveNumber: number, isBoss: boolean, tier: TierId): WaveSegment[] {
  if (isBoss) {
    const bossId = waveNumber >= 24 ? 'dreadnought' : 'colossus';
    const escorts = waveNumber >= 12 ? 6 : 4;
    return [
      { enemyId: bossId, count: 1 },
      { enemyId: waveNumber >= 20 ? 'vanguard' : 'warden', count: escorts },
      { enemyId: 'striker', count: Math.floor(waveNumber / 2) },
    ];
  }

  const scale = 1 + (waveNumber - 1) * 0.08 + (tier === 'hard' ? 0.15 : 0);
  const baseCount = Math.max(4, Math.floor(6 + waveNumber * 0.55 * scale));
  const segments: WaveSegment[] = [];

  if (waveNumber <= 5) {
    segments.push({ enemyId: 'scout', count: Math.floor(baseCount * 0.7) });
    segments.push({ enemyId: 'trooper', count: Math.floor(baseCount * 0.3) });
  } else if (waveNumber <= 12) {
    segments.push({ enemyId: 'trooper', count: Math.floor(baseCount * 0.45) });
    segments.push({ enemyId: 'runner', count: Math.floor(baseCount * 0.3) });
    segments.push({ enemyId: 'bulwark', count: Math.floor(baseCount * 0.25) });
  } else if (waveNumber <= 22) {
    segments.push({ enemyId: 'striker', count: Math.floor(baseCount * 0.35) });
    segments.push({ enemyId: 'bulwark', count: Math.floor(baseCount * 0.25) });
    segments.push({ enemyId: 'shifter', count: Math.floor(baseCount * 0.2) });
    segments.push({ enemyId: 'runner', count: Math.floor(baseCount * 0.2) });
  } else if (waveNumber <= 28) {
    segments.push({ enemyId: 'brute', count: Math.floor(baseCount * 0.3) });
    segments.push({ enemyId: 'mystic', count: Math.floor(baseCount * 0.25) });
    segments.push({ enemyId: 'striker', count: Math.floor(baseCount * 0.25) });
    segments.push({ enemyId: 'shifter', count: Math.floor(baseCount * 0.2) });
  } else if (waveNumber <= 35) {
    segments.push({ enemyId: 'brute', count: Math.floor(baseCount * 0.25) });
    segments.push({ enemyId: 'mystic', count: Math.floor(baseCount * 0.25) });
    segments.push({ enemyId: 'striker', count: Math.floor(baseCount * 0.25) });
    segments.push({ enemyId: 'shifter', count: Math.floor(baseCount * 0.25) });
  } else {
    segments.push({ enemyId: 'vanguard', count: Math.floor(baseCount * 0.3) });
    segments.push({ enemyId: 'warden', count: Math.floor(baseCount * 0.25) });
    segments.push({ enemyId: 'brute', count: Math.floor(baseCount * 0.25) });
    segments.push({ enemyId: 'mystic', count: Math.floor(baseCount * 0.2) });
  }

  return segments.filter((segment) => segment.count > 0);
}
