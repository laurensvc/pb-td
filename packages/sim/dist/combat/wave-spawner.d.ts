import type { GameContent, WaveDefinition } from '@facet/content';
import type { PathCache } from '../pathfinding/path-cache.js';
import type { FlyingPath } from './flying-path.js';
import type { CreepEntity } from './types.js';
interface SpawnQueueEntry {
    enemyId: string;
    hpMultiplier: number;
    speedMultiplier: number;
}
export interface WaveSpawnerState {
    wave: WaveDefinition;
    waveNumber: number;
    queue: SpawnQueueEntry[];
    spawnIntervalSec: number;
    groupDelaySec: number;
    concurrent: boolean;
    elapsed: number;
    timeSinceLastSpawn: number;
    spawnComplete: boolean;
    spawnedCount: number;
    resolvedCount: number;
}
export declare function createWaveSpawner(content: GameContent, waveNumber: number): WaveSpawnerState;
export interface SpawnTickResult {
    spawned: CreepEntity[];
    spawnJustCompleted: boolean;
}
export declare function tickWaveSpawner(spawner: WaveSpawnerState, content: GameContent, dt: number, pathCache: PathCache | null, flyingPath: FlyingPath | null): SpawnTickResult;
export declare function registerCreepResolved(spawner: WaveSpawnerState): void;
export declare function isWaveCleared(spawner: WaveSpawnerState): boolean;
export declare function canStartConcurrentWave(spawner: WaveSpawnerState, activeCreepsFromOtherWaves: number): boolean;
export {};
//# sourceMappingURL=wave-spawner.d.ts.map