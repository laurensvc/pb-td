import type { GemType, QualityTier } from '@facet/content';
export declare const TILE_SIZE = 32;
export declare const GEM_FOOTPRINT = 2;
export declare const SIM_HZ = 30;
export declare const STARTING_GOLD = 10;
export declare const PLACEMENT_CHARGES_PER_ROUND = 5;
export declare const FIRST_LETHAL_LEAK_LEVEL = 10;
export declare const MAX_WAVE_LEVEL = 10;
export declare const SLOW_STACK_CAP = 0.75;
export declare const SLOW_MIN_SPEED_FRACTION = 0.25;
export declare const MVP_DAMAGE_BONUS_PER_STACK = 0.1;
export declare const MVP_MAX_STACKS = 10;
export declare const MAX_GEM_CHANCE_LEVEL_V1 = 3;
/** Gold cost to upgrade from `currentLevel` to the next probability tier. */
export declare function gemChanceUpgradeCost(currentLevel: number): number;
export declare const GEM_TYPES: readonly GemType[];
export declare const GEM_QUALITY_ORDER: readonly QualityTier[];
export declare function qualityIndex(quality: QualityTier): number;
export declare function qualityAtIndex(index: number): QualityTier | undefined;
export declare function gemId(type: GemType, quality: QualityTier): string;
export declare function parseGemId(gemId: string): {
    type: GemType;
    quality: QualityTier;
};
//# sourceMappingURL=constants.d.ts.map