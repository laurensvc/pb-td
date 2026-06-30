import type { ArmorDamageMatrix } from '@facet/content';
import type { SeededRng } from '../rng/seeded-rng.js';
import type { AttackPacket, CreepEntity } from './types.js';
export interface DamageResolverConfig {
    matrix: ArmorDamageMatrix;
    rng: SeededRng;
}
export interface ResolvedDamage {
    damage: number;
    missed: boolean;
    blocked: boolean;
}
export declare function resolveDamage(creep: CreepEntity, attack: AttackPacket, config: DamageResolverConfig): ResolvedDamage;
//# sourceMappingURL=damage-resolver.d.ts.map