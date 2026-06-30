import type { GameContent } from '@facet/content';
import type { PathCache } from '../pathfinding/path-cache.js';
import type { SeededRng } from '../rng/seeded-rng.js';
import type { TowerEntity } from '../round/types.js';
import { type FlyingPath } from './flying-path.js';
import { type WaveSpawnerState } from './wave-spawner.js';
import type { CombatEvent, CombatSnapshot, CreepEntity } from './types.js';
export interface CombatSessionConfig {
    content: GameContent;
    level: number;
    routeId: string;
    pathCache: PathCache | null;
    towers: TowerEntity[];
    rng: SeededRng;
    existingCreeps?: CreepEntity[];
    onLeak?: (creep: CreepEntity) => void;
}
export interface CombatTickResult {
    events: CombatEvent[];
    snapshot: CombatSnapshot;
    waveCleared: boolean;
}
export declare class CombatSession {
    readonly content: GameContent;
    readonly level: number;
    readonly routeId: string;
    readonly pathCache: PathCache | null;
    readonly flyingPath: FlyingPath;
    readonly rng: SeededRng;
    creeps: CreepEntity[];
    towers: TowerEntity[];
    private readonly spawner;
    private readonly towerRuntime;
    private readonly mvpStacks;
    private tickCount;
    private leaksThisWave;
    private killsThisWave;
    private waveCleared;
    private readonly onLeak?;
    constructor(config: CombatSessionConfig);
    get spawnerState(): WaveSpawnerState;
    tick(dt: number, combatActive: boolean): CombatTickResult;
    private handleCreepResolved;
    private buildSnapshot;
}
export declare function createCombatSession(config: CombatSessionConfig): CombatSession;
//# sourceMappingURL=combat-session.d.ts.map