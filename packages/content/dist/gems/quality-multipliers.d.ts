import type { QualityTier } from '../schemas/common.js';
import type { TowerAbility } from '../schemas/gem.js';
export interface QualityMultipliers {
    damage: number;
    dotDebuff: number;
    range: number;
    attackSpeed: number;
}
export declare const qualityMultipliers: Record<QualityTier, QualityMultipliers>;
export declare function scaleAbilities(abilities: TowerAbility[], mult: QualityMultipliers): TowerAbility[];
//# sourceMappingURL=quality-multipliers.d.ts.map