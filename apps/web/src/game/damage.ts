import type { GemFamilyId } from './types';
import { getGemDefinition } from './gems';

export type DamageType = 'physical' | 'magic' | 'pure';

export interface EnemyResistances {
  magicImmune?: boolean;
  physicalImmune?: boolean;
}

export function gemDamageType(family: GemFamilyId): DamageType {
  const def = getGemDefinition(family);
  if (def.damageType) return def.damageType;
  if (family === 'arcane' || family === 'verdant' || family === 'venom_lens') return 'magic';
  if (family === 'kinetic' || family === 'prism' || family === 'slayer_shard') return 'physical';
  return 'pure';
}

export function effectiveDamageMultiplier(
  damageType: DamageType,
  resistances: EnemyResistances,
): number {
  if (damageType === 'physical' && resistances.physicalImmune) return 0.12;
  if (damageType === 'magic' && resistances.magicImmune) return 0.12;
  if (damageType === 'pure') return 1;
  return 1;
}

export function isEnemyVisible(
  revealedUntil: number,
  time: number,
  gemDetectionRange: number,
  enemy: { x: number; y: number },
  gems: readonly { x: number; y: number; range: number }[],
  invisible: boolean,
): boolean {
  if (!invisible) return true;
  if (revealedUntil > time) return true;
  for (const gem of gems) {
    if (Math.hypot(gem.x - enemy.x, gem.y - enemy.y) <= gemDetectionRange + gem.range) {
      return true;
    }
  }
  return false;
}
