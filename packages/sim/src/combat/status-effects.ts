import { resolveDamage, type DamageResolverConfig } from './damage-resolver.js'
import type { CreepEntity, PoisonEffect, SlowEffect } from './types.js'

const MIN_SPEED_FRACTION = 0.25
const ADDITIONAL_SLOW_FACTOR = 0.5

export function effectiveSlowPercent(creep: CreepEntity): number {
  if (creep.slowImmune || creep.slowEffects.length === 0) return 0

  const sorted = [...creep.slowEffects].sort((a, b) => b.speedReduction - a.speedReduction)
  let total = sorted[0]?.speedReduction ?? 0
  for (let i = 1; i < sorted.length; i++) {
    total += sorted[i]!.speedReduction * ADDITIONAL_SLOW_FACTOR
  }

  return Math.min(100 - MIN_SPEED_FRACTION * 100, total)
}

export function effectiveSpeedMultiplier(creep: CreepEntity): number {
  const slow = effectiveSlowPercent(creep)
  return creep.speedMultiplier * (1 - slow / 100)
}

export function applySlow(
  creep: CreepEntity,
  sourceId: string,
  speedReduction: number,
  duration: number,
): void {
  if (creep.slowImmune) return
  creep.slowEffects.push({ sourceId, speedReduction, remaining: duration })
}

export function applyPoison(
  creep: CreepEntity,
  sourceId: string,
  dps: number,
  duration: number,
): void {
  creep.poisonEffects.push({ sourceId, dps, remaining: duration })
}

export function tickStatusEffects(
  creep: CreepEntity,
  dt: number,
  damageConfig: DamageResolverConfig,
): { poisonDamage: number; sourceTowerId: string | null } {
  let poisonDamage = 0
  let poisonSource: string | null = null

  for (const effect of creep.poisonEffects) {
    effect.remaining -= dt
    if (effect.remaining > 0) {
      const tick = resolveDamage(
        creep,
        {
          baseDamage: effect.dps * dt,
          attackType: 'magic',
          sourceTowerId: effect.sourceId,
        },
        damageConfig,
      )
      if (tick.damage > 0) {
        poisonDamage += tick.damage
        poisonSource = effect.sourceId
      }
    }
  }
  creep.poisonEffects = creep.poisonEffects.filter((e) => e.remaining > 0)

  creep.slowEffects = creep.slowEffects.filter((e) => {
    e.remaining -= dt
    return e.remaining > 0
  })

  return { poisonDamage, sourceTowerId: poisonSource }
}

export function pruneExpiredEffects(effects: SlowEffect[] | PoisonEffect[], dt: number): void {
  for (const effect of effects) {
    effect.remaining -= dt
  }
}
