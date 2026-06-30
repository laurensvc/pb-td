import type { BaseGemFamilyId, GemCombatStats, GemDefinition, GemFamilyId, GemLevel, GemState, SaveState } from './types';
export declare function isHybridFamily(family: GemFamilyId): boolean;
export declare function isBaseFamily(family: GemFamilyId): family is BaseGemFamilyId;
export declare function getGemDefinition(family: GemFamilyId): GemDefinition;
export interface MergeResult {
    family: GemFamilyId;
    level: GemLevel;
    hybrid: boolean;
}
export declare function resolveMerge(a: Pick<GemState, 'family' | 'level'>, b: Pick<GemState, 'family' | 'level'>, identicalClusterSize?: number): MergeResult | null;
export declare function countIdenticalCluster(gems: readonly Pick<GemState, 'id' | 'family' | 'level' | 'x' | 'y'>[], seed: Pick<GemState, 'id' | 'family' | 'level' | 'x' | 'y'>): number;
export declare function identicalClusterIds(gems: readonly Pick<GemState, 'id' | 'family' | 'level' | 'x' | 'y'>[], seed: Pick<GemState, 'id' | 'family' | 'level' | 'x' | 'y'>): number[];
export declare function canMergeGems(a: Pick<GemState, 'family' | 'level'>, b: Pick<GemState, 'family' | 'level'>, greatUnlocked?: readonly BaseGemFamilyId[], identicalClusterSize?: number): boolean;
export declare function canCraftGreat(family: BaseGemFamilyId, greatUnlocked: readonly BaseGemFamilyId[]): boolean;
export declare function mergedLevel(level: GemLevel): GemLevel;
export declare function mergedLevelBy(level: GemLevel, gain: number): GemLevel;
export declare function gemSellValue(family: GemFamilyId, level: GemLevel): number;
export declare function getGemCombatStats(_save: SaveState, family: GemFamilyId, level: GemLevel): GemCombatStats;
export declare function gemFamilyBoardName(family: GemFamilyId): string;
export declare function gemDisplayName(family: GemFamilyId, level: GemLevel): string;
export declare function qualityName(level: GemLevel): string;
