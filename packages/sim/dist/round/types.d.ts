import type { GemType, QualityTier } from '@facet/content';
import type { TargetingMode } from '../combat/types.js';
export type { TargetingMode };
export type GamePhase = 'countdown' | 'placement' | 'selection' | 'combat' | 'finished' | 'lost';
export interface CandidateGem {
    id: string;
    gemId: string;
    type: GemType;
    quality: QualityTier;
    gx: number;
    gy: number;
}
export interface TowerEntity {
    id: string;
    gemId?: string;
    specialId?: string;
    gx: number;
    gy: number;
    active: boolean;
    killCount: number;
    targetingMode: TargetingMode;
    holdFire: boolean;
    mvpStacks: number;
}
export interface RockEntity {
    id: string;
    gx: number;
    gy: number;
}
export interface PlayerRunState {
    playerId: string;
    phase: GamePhase;
    level: number;
    gold: number;
    placementCharges: number;
    chanceLevel: number;
    candidates: CandidateGem[];
    towers: TowerEntity[];
    rocks: RockEntity[];
    activeCreepCount: number;
    leaksThisWave: number;
}
//# sourceMappingURL=types.d.ts.map