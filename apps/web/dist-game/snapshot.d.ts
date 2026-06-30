import type { GameState, Snapshot } from './types';
export declare function buildCurrentWaveSpawnTracker(state: GameState): Snapshot['waveSpawnTracker'];
export declare function createSnapshot(state: GameState): Snapshot;
