import { describe, expect, it } from 'vitest'
import {
  computeKillMilestoneDamageMultiplier,
  computeMagicBoundsMrReduction,
  computePhysicalKillDamageMultiplier,
  creditTowerKill,
  sumKillCountAtTiles,
} from './kill-milestones.js'
import type { TowerEntity } from '../round/types.js'

function tower(id: string, gx: number, gy: number, killCount: number): TowerEntity {
  return {
    id,
    gemId: 'ruby-chipped',
    gx,
    gy,
    active: true,
    killCount,
    targetingMode: 'closest_to_goal',
    holdFire: false,
    mvpStacks: 0,
  }
}

describe('kill milestones', () => {
  it('grants +10% physical damage per 10 kills', () => {
    expect(computePhysicalKillDamageMultiplier(0)).toBe(1)
    expect(computePhysicalKillDamageMultiplier(10)).toBe(1.1)
    expect(computePhysicalKillDamageMultiplier(90)).toBe(1.9)
  })

  it('caps physical damage bonus at +150% from 100 kills', () => {
    expect(computePhysicalKillDamageMultiplier(100)).toBe(2.5)
    expect(computePhysicalKillDamageMultiplier(120)).toBe(2.5)
  })

  it('grants magic bounds MR reduction for magic attack types only', () => {
    expect(computeKillMilestoneDamageMultiplier(30, 'magic')).toBe(1)
    expect(computeKillMilestoneDamageMultiplier(30, 'normal')).toBe(1.3)
    expect(computeMagicBoundsMrReduction(30)).toBe(30)
    expect(computeMagicBoundsMrReduction(120)).toBe(100)
  })

  it('credits kills on the tower entity', () => {
    const t = tower('t1', 0, 0, 4)
    creditTowerKill(t)
    expect(t.killCount).toBe(5)
  })

  it('sums kill counts from towers at consumed tiles', () => {
    const towers = [tower('t1', 0, 0, 12), tower('t2', 4, 0, 8), tower('t3', 8, 0, 5)]
    const result = sumKillCountAtTiles(towers, [
      { gx: 0, gy: 0 },
      { gx: 4, gy: 0 },
      { gx: 0, gy: 0 },
    ])
    expect(result.totalKills).toBe(20)
    expect(result.consumedTowerIds).toEqual(['t1', 't2'])
  })
})
