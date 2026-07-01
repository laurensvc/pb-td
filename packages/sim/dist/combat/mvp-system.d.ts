import type { TowerEntity } from '../round/types.js';
import type { CreepEntity } from './types.js';
export declare const MVP_MR_DEBUFF_RADIUS = 64;
export declare const MVP_MR_DEBUFF_PER_STACK = 10;
export declare const MVP_AURA_RADIUS = 192;
export declare const MVP_AURA_ALLY_DAMAGE_BONUS = 0.75;
/** −10% MR per MVP stack on creeps within 64px of the MVP tower. */
export declare function computeMvpMrDebuffForCreep(towers: TowerEntity[], creep: CreepEntity, mvpStacks: Map<string, number>): number;
/** +75% damage from a nearby tower with 10 MVP stacks (6-tile radius). */
export declare function computeMvpAuraAllyDamageMultiplier(towers: TowerEntity[], attackingTower: TowerEntity, mvpStacks: Map<string, number>): number;
export declare function computeMrReductionForCreep(towers: TowerEntity[], creep: CreepEntity, mvpStacks: Map<string, number>, magicBoundsMrReduction: number): number;
//# sourceMappingURL=mvp-system.d.ts.map