import type { AttackType } from '@facet/content';
import type { TowerEntity } from '../round/types.js';
export declare const KILL_MILESTONE_INTERVAL = 10;
export declare const PHYSICAL_DAMAGE_BONUS_PER_MILESTONE = 0.1;
/** +150% damage at 100+ kills (Gem TD cap). */
export declare const PHYSICAL_DAMAGE_BONUS_CAP = 1.5;
export declare const PHYSICAL_DAMAGE_CAP_KILL_THRESHOLD = 100;
export declare const MAGIC_BOUNDS_MR_PER_MILESTONE = 10;
export declare const MAGIC_BOUNDS_MR_CAP = 100;
export declare function countKillMilestones(killCount: number): number;
export declare function isMagicAttackType(attackType: AttackType): boolean;
export declare function computePhysicalKillDamageMultiplier(killCount: number): number;
export declare function computeMagicBoundsMrReduction(killCount: number): number;
export declare function computeKillMilestoneDamageMultiplier(killCount: number, attackType: AttackType): number;
export declare function creditTowerKill(tower: TowerEntity): void;
export declare function sumKillCountAtTiles(towers: TowerEntity[], tiles: Array<{
    gx: number;
    gy: number;
}>): {
    totalKills: number;
    consumedTowerIds: string[];
};
//# sourceMappingURL=kill-milestones.d.ts.map