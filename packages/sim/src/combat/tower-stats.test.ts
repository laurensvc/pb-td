import { loadGameContent } from '@facet/content'
import { describe, expect, it } from 'vitest'
import { resolveTowerCombat } from './tower-stats.js'
import type { TowerEntity } from '../round/types.js'

describe('resolveTowerCombat kill milestones', () => {
  const content = loadGameContent()

  const physicalTower: TowerEntity = {
    id: 't1',
    gemId: 'ruby-normal',
    gx: 0,
    gy: 0,
    active: true,
    killCount: 20,
    targetingMode: 'closest_to_goal',
    holdFire: false,
    mvpStacks: 0,
  }

  const magicTower: TowerEntity = {
    id: 't2',
    specialId: 'silver',
    gx: 4,
    gy: 0,
    active: true,
    killCount: 20,
    targetingMode: 'closest_to_goal',
    holdFire: false,
    mvpStacks: 0,
  }

  it('scales physical tower damage by kill milestones', () => {
    const base = resolveTowerCombat(content, { ...physicalTower, killCount: 0 }, 0)
    const buffed = resolveTowerCombat(content, physicalTower, 0)
    expect(buffed?.stats.baseDamage).toBeCloseTo((base?.stats.baseDamage ?? 0) * 1.2)
    expect(buffed?.killMilestoneMultiplier).toBe(1.2)
  })

  it('does not scale magic tower damage but tracks magic bounds MR', () => {
    const base = resolveTowerCombat(content, { ...magicTower, killCount: 0 }, 0)
    const buffed = resolveTowerCombat(content, magicTower, 0)
    expect(buffed?.stats.baseDamage).toBe(base?.stats.baseDamage)
    expect(buffed?.magicBoundsMrReduction).toBe(20)
  })
})
