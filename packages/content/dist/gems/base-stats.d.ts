import type { GemType } from '../schemas/common.js';
import type { TowerAbility, TowerCombatStats } from '../schemas/gem.js';
export interface GemTypeTemplate {
    type: GemType;
    displayName: string;
    combat: TowerCombatStats;
    abilities: TowerAbility[];
    projectileKey: string;
    assetFamily: string;
}
/** Tier-1 (chipped) base stats from TOWER-AND-GEM-SYSTEMS.md §8.3 */
export declare const gemTypeTemplates: Record<GemType, GemTypeTemplate>;
export declare const gemTypes: GemType[];
export declare const v1Qualities: readonly ["chipped", "flawed", "normal"];
//# sourceMappingURL=base-stats.d.ts.map