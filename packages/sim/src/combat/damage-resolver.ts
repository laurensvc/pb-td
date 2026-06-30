import type { ArmorDamageMatrix, ArmorType, AttackType } from '@facet/content'
import type { SeededRng } from '../rng/seeded-rng.js'
import type { AttackPacket, CreepEntity } from './types.js'

export interface DamageResolverConfig {
  matrix: ArmorDamageMatrix
  rng: SeededRng
}

export interface ResolvedDamage {
  damage: number
  missed: boolean
  blocked: boolean
}

function armorTypeMultiplier(
  matrix: ArmorDamageMatrix,
  attackType: AttackType,
  armorType: ArmorType,
): number {
  const row = matrix.multipliers[attackType]
  if (!row) return 1
  return (row[armorType] ?? 100) / 100
}

function armorValueMultiplier(
  matrix: ArmorDamageMatrix,
  armor: number,
  attackType: AttackType,
): number {
  if (matrix.bypassAttackTypes.includes(attackType)) return 1

  const { positiveFactor, negativeBase, negativeFactor, minPositiveMultiplier, minArmorFloor } =
    matrix.armorValue

  const clampedArmor = Math.max(armor, minArmorFloor)

  if (clampedArmor >= 0) {
    return Math.max(minPositiveMultiplier, 1 - positiveFactor * clampedArmor)
  }

  return negativeBase - Math.pow(negativeFactor, -clampedArmor)
}

function magicResistMultiplier(mr: number, matrix: ArmorDamageMatrix): number {
  const clamped = Math.max(matrix.magicResist.min, Math.min(matrix.magicResist.max, mr))
  return 1 - clamped / 100
}

export function resolveDamage(
  creep: CreepEntity,
  attack: AttackPacket,
  config: DamageResolverConfig,
): ResolvedDamage {
  const { matrix, rng } = config

  if (attack.attackType === 'magic' && creep.magicImmune) {
    return { damage: 0, missed: false, blocked: true }
  }
  if (
    attack.attackType !== 'magic' &&
    attack.attackType !== 'pure' &&
    attack.attackType !== 'chaos' &&
    creep.physicalImmune
  ) {
    return { damage: 0, missed: false, blocked: true }
  }

  if (!attack.trueStrike && creep.evasion > 0 && rng.next() < creep.evasion) {
    return { damage: 0, missed: true, blocked: false }
  }

  let damage = attack.baseDamage
  const effectiveArmor = creep.armor - (attack.armorReduction ?? 0)

  if (!matrix.bypassAttackTypes.includes(attack.attackType)) {
    damage *= armorTypeMultiplier(matrix, attack.attackType, creep.armorType)
    damage *= armorValueMultiplier(matrix, effectiveArmor, attack.attackType)
  }

  if (attack.attackType === 'magic') {
    damage *= magicResistMultiplier(creep.magicResist, matrix)
  }

  return {
    damage: Math.max(0, Math.floor(damage)),
    missed: false,
    blocked: false,
  }
}
