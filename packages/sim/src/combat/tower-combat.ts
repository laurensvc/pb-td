import type { GameContent } from '@facet/content'
import type { TargetingMode } from './types.js'
import type { TowerEntity } from '../round/types.js'
import type { PathCache } from '../pathfinding/path-cache.js'
import { resolveDamage, type DamageResolverConfig } from './damage-resolver.js'
import { applyPoison, applySlow } from './status-effects.js'
import { resolveTowerCombat } from './tower-stats.js'
import { computeMagicBoundsMrReduction } from './kill-milestones.js'
import {
  computeMvpAuraAllyDamageMultiplier,
  computeMrReductionForCreep,
} from './mvp-system.js'
import type { AttackPacket, CombatEvent, CreepEntity, TowerRuntimeState } from './types.js'

function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(bx - ax, by - ay)
}

function canTarget(creep: CreepEntity, tower: ReturnType<typeof resolveTowerCombat>): boolean {
  if (creep.state !== 'moving') return false
  if (!tower) return false
  const d = distance(tower.worldX, tower.worldY, creep.worldPos.x, creep.worldPos.y)
  return d <= tower.stats.range
}

function acquireTarget(
  creeps: CreepEntity[],
  tower: NonNullable<ReturnType<typeof resolveTowerCombat>>,
  mode: TargetingMode,
): CreepEntity | null {
  const inRange = creeps.filter((c) => canTarget(c, tower))
  if (inRange.length === 0) return null

  switch (mode) {
    case 'closest_to_goal':
      return inRange.reduce((best, c) => (c.pathProgress > best.pathProgress ? c : best))
    case 'closest_to_tower':
      return inRange.reduce((best, c) => {
        const dBest = distance(tower.worldX, tower.worldY, best.worldPos.x, best.worldPos.y)
        const dCur = distance(tower.worldX, tower.worldY, c.worldPos.x, c.worldPos.y)
        return dCur < dBest ? c : best
      })
    case 'highest_hp':
      return inRange.reduce((best, c) => (c.hp > best.hp ? c : best))
    case 'first_in_range':
      return inRange[0] ?? null
    default:
      return inRange[0] ?? null
  }
}

function buildAttackPacket(
  tower: NonNullable<ReturnType<typeof resolveTowerCombat>>,
  magicResistReduction = 0,
): AttackPacket {
  let armorReduction = 0
  for (const ability of tower.abilities) {
    if (ability.type === 'pierce' || ability.type === 'corrupt') {
      armorReduction = Math.max(armorReduction, ability.armorReduction)
    }
  }

  return {
    baseDamage: tower.stats.baseDamage,
    attackType: tower.stats.primaryAttackType,
    sourceTowerId: tower.towerId,
    armorReduction: armorReduction > 0 ? armorReduction : undefined,
    magicResistReduction: magicResistReduction > 0 ? magicResistReduction : undefined,
  }
}

function computeMagicBoundsAuraMrReduction(
  towers: TowerEntity[],
  content: GameContent,
  creep: CreepEntity,
  mvpStacks: Map<string, number>,
): number {
  let total = 0
  for (const towerEntity of towers) {
    if (!towerEntity.active) continue
    const auraTower = resolveTowerCombat(content, towerEntity, mvpStacks.get(towerEntity.id) ?? 0)
    if (!auraTower || auraTower.stats.primaryAttackType !== 'magic') continue
    if (!canTarget(creep, auraTower)) continue
    total += computeMagicBoundsMrReduction(towerEntity.killCount)
  }
  return total
}

function applyOnHitAbilities(
  creep: CreepEntity,
  tower: NonNullable<ReturnType<typeof resolveTowerCombat>>,
): void {
  for (const ability of tower.abilities) {
    switch (ability.type) {
      case 'slow':
        applySlow(creep, tower.towerId, ability.speedReduction, ability.duration ?? 3)
        break
      case 'poison':
        applyPoison(creep, tower.towerId, ability.dps, ability.duration)
        break
      case 'anti_fly':
        if (creep.mobility === 'flying') {
          creep.armor -= ability.armorReduction
          creep.magicResist = Math.max(0, creep.magicResist - (ability.mrReduction ?? 0))
          applySlow(creep, tower.towerId, ability.speedReduction, 3)
        }
        break
      default:
        break
    }
  }
}

export interface TowerCombatTickResult {
  events: CombatEvent[]
  kills: Array<{ creepId: string; killerTowerId: string; gold: number }>
}

export function tickTowerCombat(
  content: GameContent,
  towers: TowerEntity[],
  towerRuntime: Map<string, TowerRuntimeState>,
  creeps: CreepEntity[],
  mvpStacks: Map<string, number>,
  dt: number,
  damageConfig: DamageResolverConfig,
  _pathCache: PathCache | null,
): TowerCombatTickResult {
  const events: CombatEvent[] = []
  const kills: TowerCombatTickResult['kills'] = []

  for (const towerEntity of towers) {
    if (!towerEntity.active) continue

    let runtime = towerRuntime.get(towerEntity.id)
    if (!runtime) {
      runtime = {
        towerId: towerEntity.id,
        targetingMode: towerEntity.targetingMode,
        holdFire: towerEntity.holdFire,
        attackCooldown: 0,
        waveDamageDealt: 0,
        mvpStacks: mvpStacks.get(towerEntity.id) ?? 0,
      }
      towerRuntime.set(towerEntity.id, runtime)
    }

    runtime.targetingMode = towerEntity.targetingMode
    runtime.holdFire = towerEntity.holdFire
    runtime.attackCooldown = Math.max(0, runtime.attackCooldown - dt)

    if (runtime.holdFire) continue

    const mvpAuraAllyMultiplier = computeMvpAuraAllyDamageMultiplier(
      towers,
      towerEntity,
      mvpStacks,
    )
    const resolved = resolveTowerCombat(
      content,
      towerEntity,
      runtime.mvpStacks,
      mvpAuraAllyMultiplier,
    )
    if (!resolved) continue

    if (runtime.attackCooldown > 0) continue

    const targetCount = resolved.stats.targets
    const targets: CreepEntity[] = []
    const remaining = creeps.filter((c) => c.state === 'moving')

    for (let i = 0; i < targetCount; i++) {
      const target = acquireTarget(
        remaining.filter((c) => !targets.includes(c)),
        resolved,
        runtime.targetingMode,
      )
      if (!target) break
      targets.push(target)
    }

    if (targets.length === 0) continue

    runtime.attackCooldown = resolved.stats.attackInterval

    for (const target of targets) {
      const magicResistReduction =
        resolved.stats.primaryAttackType === 'magic'
          ?               computeMrReductionForCreep(
              towers,
              target,
              mvpStacks,
              computeMagicBoundsAuraMrReduction(towers, content, target, mvpStacks),
            )
          : 0
      const attack = buildAttackPacket(resolved, magicResistReduction)
      const result = resolveDamage(target, attack, damageConfig)

      if (result.missed) {
        events.push({
          type: 'attack_missed',
          creepId: target.id,
          towerId: resolved.towerId,
        })
        continue
      }

      if (result.damage > 0) {
        target.hp -= result.damage
        runtime.waveDamageDealt += result.damage
        events.push({
          type: 'tower_fired',
          towerId: resolved.towerId,
          creepId: target.id,
          damage: result.damage,
        })
      }

      applyOnHitAbilities(target, resolved)

      if (target.hp <= 0) {
        target.state = 'dead'
        kills.push({
          creepId: target.id,
          killerTowerId: resolved.towerId,
          gold: target.goldReward,
        })
        events.push({
          type: 'creep_killed',
          creepId: target.id,
          killerTowerId: resolved.towerId,
          gold: target.goldReward,
        })
      }
    }
  }

  return { events, kills }
}

export function pickMvpTower(towerRuntime: Map<string, TowerRuntimeState>): string | null {
  let bestId: string | null = null
  let bestDamage = 0
  for (const [id, runtime] of towerRuntime) {
    if (runtime.waveDamageDealt > bestDamage) {
      bestDamage = runtime.waveDamageDealt
      bestId = id
    }
  }
  return bestDamage > 0 ? bestId : null
}

export function resetWaveDamage(towerRuntime: Map<string, TowerRuntimeState>): void {
  for (const runtime of towerRuntime.values()) {
    runtime.waveDamageDealt = 0
  }
}
