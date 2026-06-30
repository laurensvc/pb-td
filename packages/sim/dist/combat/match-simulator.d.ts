import type { GameContent } from '@facet/content';
import type { RoundController } from '../round/round-controller.js';
import { type FlyingPath } from './flying-path.js';
import { resetCreepIdCounter } from './creep-factory.js';
import { type WaveSpawnerState } from './wave-spawner.js';
import type { CombatEvent, CombatSnapshot, CreepEntity, TowerRuntimeState } from './types.js';
export interface MatchSimulatorConfig {
    mvpStacks?: Record<string, number>;
}
export interface TickResult {
    events: CombatEvent[];
    snapshot: CombatSnapshot;
    waveComplete: boolean;
}
export declare class MatchSimulator {
    readonly match: RoundController;
    readonly content: GameContent;
    creeps: CreepEntity[];
    waveSpawner: WaveSpawnerState | null;
    readonly flyingPath: FlyingPath;
    readonly towerRuntime: Map<string, TowerRuntimeState>;
    readonly mvpStacks: Map<string, number>;
    tickCount: number;
    leaksThisWave: number;
    killsThisWave: number;
    waveActive: boolean;
    constructor(match: RoundController, content: GameContent, config?: MatchSimulatorConfig);
    startWave(): void;
    tick(dt?: number): TickResult;
    buildSnapshot(): CombatSnapshot;
}
export declare function runCombatUntilWaveEnd(sim: MatchSimulator, maxTicks?: number): TickResult;
export { resetCreepIdCounter };
//# sourceMappingURL=match-simulator.d.ts.map