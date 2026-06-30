import type { GameContent, TowerAbility, TowerCombatStats } from '@facet/content';
import type { TowerEntity } from '../round/types.js';
export interface ResolvedTowerCombat {
    towerId: string;
    gx: number;
    gy: number;
    worldX: number;
    worldY: number;
    stats: TowerCombatStats;
    abilities: TowerAbility[];
    damageMultiplier: number;
}
export declare function towerWorldCenter(gx: number, gy: number): {
    x: number;
    y: number;
};
export declare function resolveTowerCombat(content: GameContent, tower: TowerEntity, mvpStacks: number): ResolvedTowerCombat | null;
export declare function awardMvpStack(currentStacks: number): number;
export declare const MVP_MAX_STACKS = 10;
//# sourceMappingURL=tower-stats.d.ts.map