import type { AbilityDefinition, EnemyDefinition, GameContent, WaveDefinition } from '@facet/content';
import type { CreepEntity } from './types.js';
export declare function resetCreepIdCounter(): void;
export declare function createCreepFromWave(content: GameContent, enemyId: string, wave: WaveDefinition, entryHpMultiplier: number, entrySpeedMultiplier: number, waveNumber: number): CreepEntity;
export declare function getEnemyDef(content: GameContent, enemyId: string): EnemyDefinition;
export declare function getAbilityDef(content: GameContent, abilityId: string): AbilityDefinition | undefined;
//# sourceMappingURL=creep-factory.d.ts.map