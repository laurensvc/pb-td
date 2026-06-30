import type { EnemyDefinition } from '../types';
export declare const enemyDefinitions: Record<string, EnemyDefinition>;
export declare function getEnemy(enemyId: string): EnemyDefinition;
