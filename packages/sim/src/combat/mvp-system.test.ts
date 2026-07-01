import { describe, expect, it } from 'vitest'
import {
  computeMvpAuraAllyDamageMultiplier,
  computeMvpMrDebuffForCreep,
  MVP_MR_DEBUFF_PER_STACK,
  MVP_MR_DEBUFF_RADIUS,
} from './mvp-system.js'
import { towerWorldCenter } from './tower-stats.js'
import type { TowerEntity } from '../round/types.js'
import type { CreepEntity } from './types.js'

function tower(id: string, gx: number, gy: number, mvpStacks: number): TowerEntity {
  return {
    id,
    gemId: 'ruby-chipped',
    gx,
    gy,
    active: true,
    killCount: 0,
    targetingMode: 'closest_to_goal',
    holdFire: false,
    mvpStacks,
  }
}

function creepAt(x: number, y: number): CreepEntity {
  return {
    id: 'c1',
    enemyId: 'stone-grunt',
    waveNumber: 1,
    mobility: 'ground',
    hp: 100,
    maxHp: 100,
    baseSpeed: 100,
    speedMultiplier: 1,
    armorType: 'medium',
    armor: 0,
    magicResist: 50,
    evasion: 0,
    magicImmune: false,
    physicalImmune: false,
    slowImmune: false,
    pathIndex: 0,
    distanceAlongSegment: 0,
    legIndex: 0,
    pathProgress: 0,
    worldPos: { x, y },
    slowEffects: [],
    poisonEffects: [],
    state: 'moving',
    goldReward: 1,
    lifeCost: 1,
  }
}

describe('mvp system', () => {
  it('applies MR debuff per stack within 64px', () => {
    const mvpTower = tower('mvp', 68, 68, 3)
    const center = towerWorldCenter(mvpTower.gx, mvpTower.gy)
    const nearby = creepAt(center.x, center.y)
    const far = creepAt(center.x + MVP_MR_DEBUFF_RADIUS + 10, center.y)

    const stacks = new Map([[mvpTower.id, 3]])
    expect(computeMvpMrDebuffForCreep([mvpTower], nearby, stacks)).toBe(
      3 * MVP_MR_DEBUFF_PER_STACK,
    )
    expect(computeMvpMrDebuffForCreep([mvpTower], far, stacks)).toBe(0)
  })

  it('grants ally damage aura from 10-stack towers within 192px', () => {
    const carry = tower('carry', 68, 68, 0)
    const mvpAura = tower('aura', 72, 68, 10)
    const stacks = new Map([[mvpAura.id, 10]])

    expect(computeMvpAuraAllyDamageMultiplier([carry, mvpAura], carry, stacks)).toBe(1.75)
    expect(computeMvpAuraAllyDamageMultiplier([carry], carry, stacks)).toBe(1)
  })
})
