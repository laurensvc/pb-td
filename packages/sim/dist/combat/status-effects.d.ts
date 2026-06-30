import { type DamageResolverConfig } from './damage-resolver.js';
import type { CreepEntity, PoisonEffect, SlowEffect } from './types.js';
export declare function effectiveSlowPercent(creep: CreepEntity): number;
export declare function effectiveSpeedMultiplier(creep: CreepEntity): number;
export declare function applySlow(creep: CreepEntity, sourceId: string, speedReduction: number, duration: number): void;
export declare function applyPoison(creep: CreepEntity, sourceId: string, dps: number, duration: number): void;
export declare function tickStatusEffects(creep: CreepEntity, dt: number, damageConfig: DamageResolverConfig): {
    poisonDamage: number;
    sourceTowerId: string | null;
};
export declare function pruneExpiredEffects(effects: SlowEffect[] | PoisonEffect[], dt: number): void;
//# sourceMappingURL=status-effects.d.ts.map