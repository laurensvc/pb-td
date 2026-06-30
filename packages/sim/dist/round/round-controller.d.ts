import type { GameContent } from '@facet/content';
import { type SelectionAction } from '../build/selection-resolver.js';
import { type SimBoard } from '../board/sim-board.js';
import { type PlacementRejectReason } from '../placement/placement-validator.js';
import { type PathCache } from '../pathfinding/path-cache.js';
import { SeededRng } from '../rng/seeded-rng.js';
import { CombatSession } from '../combat/combat-session.js';
import type { CombatEvent, CombatSnapshot } from '../combat/types.js';
import type { CandidateGem, GamePhase, PlayerRunState, RockEntity, TargetingMode, TowerEntity } from './types.js';
export interface RoundControllerConfig {
    playerId?: string;
    seed: number;
    routeId?: string;
}
export type PlaceCandidateResult = {
    ok: true;
    candidate: CandidateGem;
} | {
    ok: false;
    reason: PlacementRejectReason;
};
export type UpgradeGemChanceResult = {
    ok: true;
    newLevel: number;
} | {
    ok: false;
    reason: 'max_level' | 'insufficient_gold' | 'wrong_phase';
};
export interface SimTickResult {
    events: CombatEvent[];
    snapshot: CombatSnapshot | null;
}
export declare function resetEntityIdCounter(): void;
export declare class RoundController {
    readonly content: GameContent;
    readonly simBoard: SimBoard;
    readonly rng: SeededRng;
    readonly routeId: string;
    readonly playerId: string;
    phase: GamePhase;
    level: number;
    gold: number;
    placementCharges: number;
    chanceLevel: number;
    candidates: CandidateGem[];
    towers: TowerEntity[];
    rocks: RockEntity[];
    pathCache: PathCache | null;
    combatSession: CombatSession | null;
    lastCombatSnapshot: CombatSnapshot | null;
    pendingEvents: CombatEvent[];
    private readonly gemRoller;
    constructor(content: GameContent, config: RoundControllerConfig);
    get state(): PlayerRunState;
    /** Fixed-step sim tick — movement always runs; tower combat only in combat phase. */
    tick(dt?: number): SimTickResult;
    drainEvents(): CombatEvent[];
    setTowerTargeting(towerId: string, mode: TargetingMode): void;
    setTowerHoldFire(towerId: string, holdFire: boolean): void;
    upgradeGemChance(): UpgradeGemChanceResult;
    beginPlacementPhase(): void;
    skipCountdown(): void;
    placeCandidate(gx: number, gy: number): PlaceCandidateResult;
    getSelectionActions(): SelectionAction[];
    resolveSelection(action: SelectionAction): void;
    completeWave(): void;
    registerLeak(): void;
    private startCombatSession;
    private setTowersActive;
    private syncStructure;
    private rebuildPath;
}
//# sourceMappingURL=round-controller.d.ts.map