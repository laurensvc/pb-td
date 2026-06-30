import type { GameContent } from '@facet/content';
import type { TowerEntity } from '../round/types.js';
import type { PathCache } from '../pathfinding/path-cache.js';
import { type DamageResolverConfig } from './damage-resolver.js';
import type { CombatEvent, CreepEntity, TowerRuntimeState } from './types.js';
export interface TowerCombatTickResult {
    events: CombatEvent[];
    kills: Array<{
        creepId: string;
        killerTowerId: string;
        gold: number;
    }>;
}
export declare function tickTowerCombat(content: GameContent, towers: TowerEntity[], towerRuntime: Map<string, TowerRuntimeState>, creeps: CreepEntity[], mvpStacks: Map<string, number>, dt: number, damageConfig: DamageResolverConfig, _pathCache: PathCache | null): TowerCombatTickResult;
export declare function pickMvpTower(towerRuntime: Map<string, TowerRuntimeState>): string | null;
export declare function resetWaveDamage(towerRuntime: Map<string, TowerRuntimeState>): void;
//# sourceMappingURL=tower-combat.d.ts.map