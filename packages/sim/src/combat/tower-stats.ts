import type { GameContent, TowerAbility, TowerCombatStats } from '@facet/content'
import { gridToWorldCenter } from '../board/coordinates.js'
import { GEM_FOOTPRINT } from '../constants.js'
import type { TowerEntity } from '../round/types.js'
import {
  computeKillMilestoneDamageMultiplier,
  computeMagicBoundsMrReduction,
} from './kill-milestones.js'

export interface ResolvedTowerCombat {
  towerId: string
  gx: number
  gy: number
  worldX: number
  worldY: number
  stats: TowerCombatStats
  abilities: TowerAbility[]
  damageMultiplier: number
  killMilestoneMultiplier: number
  magicBoundsMrReduction: number
}

const MVP_DAMAGE_BONUS_PER_STACK = 0.1
const MAX_MVP_STACKS = 10

export function towerWorldCenter(gx: number, gy: number): { x: number; y: number } {
  const centerGx = gx + GEM_FOOTPRINT / 2
  const centerGy = gy + GEM_FOOTPRINT / 2
  return gridToWorldCenter(centerGx, centerGy)
}

export function resolveTowerCombat(
  content: GameContent,
  tower: TowerEntity,
  mvpStacks: number,
  mvpAuraAllyMultiplier = 1,
): ResolvedTowerCombat | null {
  if (!tower.active) return null

  let stats: TowerCombatStats
  let abilities: TowerAbility[]

  if (tower.specialId) {
    const special = content.towers.find((t) => t.id === tower.specialId)
    if (!special) return null
    stats = special.combat
    abilities = special.abilities
  } else if (tower.gemId) {
    const gem = content.gems.find((g) => g.id === tower.gemId)
    if (!gem) return null
    stats = gem.combat
    abilities = gem.abilities
  } else {
    return null
  }

  const mvpMultiplier = 1 + mvpStacks * MVP_DAMAGE_BONUS_PER_STACK
  const killMilestoneMultiplier = computeKillMilestoneDamageMultiplier(
    tower.killCount,
    stats.primaryAttackType,
  )
  const damageMultiplier = mvpMultiplier * killMilestoneMultiplier * mvpAuraAllyMultiplier
  const magicBoundsMrReduction = computeMagicBoundsMrReduction(tower.killCount)
  const center = towerWorldCenter(tower.gx, tower.gy)

  return {
    towerId: tower.id,
    gx: tower.gx,
    gy: tower.gy,
    worldX: center.x,
    worldY: center.y,
    stats: {
      ...stats,
      baseDamage: stats.baseDamage * damageMultiplier,
    },
    abilities,
    damageMultiplier,
    killMilestoneMultiplier,
    magicBoundsMrReduction,
  }
}

export function awardMvpStack(currentStacks: number): number {
  return Math.min(MAX_MVP_STACKS, currentStacks + 1)
}

export const MVP_MAX_STACKS = MAX_MVP_STACKS
