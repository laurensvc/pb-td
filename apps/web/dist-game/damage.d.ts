import type { GemFamilyId } from './types';
export type DamageType = 'physical' | 'magic' | 'pure';
export interface EnemyResistances {
    magicImmune?: boolean;
    physicalImmune?: boolean;
}
export declare function gemDamageType(family: GemFamilyId): DamageType;
export declare function effectiveDamageMultiplier(damageType: DamageType, resistances: EnemyResistances): number;
export declare function isEnemyVisible(revealedUntil: number, time: number, gemDetectionRange: number, enemy: {
    x: number;
    y: number;
}, gems: readonly {
    x: number;
    y: number;
    range: number;
}[], invisible: boolean): boolean;
