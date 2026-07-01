import type { AttackType } from '@facet/content'
import type { TowerEntity } from '../round/types.js'

export const KILL_MILESTONE_INTERVAL = 10
export const PHYSICAL_DAMAGE_BONUS_PER_MILESTONE = 0.1
/** +150% damage at 100+ kills (Gem TD cap). */
export const PHYSICAL_DAMAGE_BONUS_CAP = 1.5
export const PHYSICAL_DAMAGE_CAP_KILL_THRESHOLD = 100
export const MAGIC_BOUNDS_MR_PER_MILESTONE = 10
export const MAGIC_BOUNDS_MR_CAP = 100

export function countKillMilestones(killCount: number): number {
  return Math.floor(killCount / KILL_MILESTONE_INTERVAL)
}

export function isMagicAttackType(attackType: AttackType): boolean {
  return attackType === 'magic'
}

export function computePhysicalKillDamageMultiplier(killCount: number): number {
  if (killCount >= PHYSICAL_DAMAGE_CAP_KILL_THRESHOLD) {
    return 1 + PHYSICAL_DAMAGE_BONUS_CAP
  }
  return 1 + countKillMilestones(killCount) * PHYSICAL_DAMAGE_BONUS_PER_MILESTONE
}

export function computeMagicBoundsMrReduction(killCount: number): number {
  return Math.min(
    MAGIC_BOUNDS_MR_CAP,
    countKillMilestones(killCount) * MAGIC_BOUNDS_MR_PER_MILESTONE,
  )
}

export function computeKillMilestoneDamageMultiplier(
  killCount: number,
  attackType: AttackType,
): number {
  if (isMagicAttackType(attackType)) return 1
  return computePhysicalKillDamageMultiplier(killCount)
}

export function creditTowerKill(tower: TowerEntity): void {
  tower.killCount += 1
}

export function sumKillCountAtTiles(
  towers: TowerEntity[],
  tiles: Array<{ gx: number; gy: number }>,
): { totalKills: number; consumedTowerIds: string[] } {
  const consumedTowerIds: string[] = []
  let totalKills = 0
  const seenTiles = new Set<string>()

  for (const tile of tiles) {
    const key = `${tile.gx},${tile.gy}`
    if (seenTiles.has(key)) continue
    seenTiles.add(key)

    const tower = towers.find((t) => t.gx === tile.gx && t.gy === tile.gy)
    if (!tower || consumedTowerIds.includes(tower.id)) continue

    consumedTowerIds.push(tower.id)
    totalKills += tower.killCount
  }

  return { totalKills, consumedTowerIds }
}
