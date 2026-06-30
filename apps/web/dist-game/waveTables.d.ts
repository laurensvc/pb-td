import type { EnemyId, TierId, WaveSegment } from './types';
export declare function authoredWaveSegments(areaId: string, waveNumber: number, tier: TierId): WaveSegment[] | null;
export declare function countWaveEnemies(segments: readonly WaveSegment[]): number;
export declare function remainingWaveSpawns(segments: readonly WaveSegment[], segmentIndex: number, enemiesToSpawn: number): number;
export declare function spawnedWaveCount(segments: readonly WaveSegment[], segmentIndex: number, enemiesToSpawn: number): number;
export type WaveSpawnTracker = {
    total: number;
    spawned: number;
    remaining: number;
    alive: number;
    killed: number;
    currentSegment: {
        enemyId: EnemyId;
        name: string;
    } | null;
};
export declare function buildWaveSpawnTracker(segments: readonly WaveSegment[], segmentIndex: number, enemiesToSpawn: number, aliveEnemies: number, killedThisWave: number, enemyName: (id: EnemyId) => string): WaveSpawnTracker;
