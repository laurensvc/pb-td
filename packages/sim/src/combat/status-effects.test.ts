import { describe, expect, it } from 'vitest'
import { effectiveSlowPercent, applySlow } from './status-effects.js'
import type { CreepEntity } from './types.js'

function baseCreep(): CreepEntity {
  return {
    id: 'c1',
    enemyId: 'stone-grunt',
    waveNumber: 1,
    mobility: 'ground',
    hp: 100,
    maxHp: 100,
    baseSpeed: 270,
    speedMultiplier: 1,
    armorType: 'medium',
    armor: 0,
    magicResist: 0,
    evasion: 0,
    magicImmune: false,
    physicalImmune: false,
    slowImmune: false,
    pathIndex: 0,
    distanceAlongSegment: 0,
    legIndex: 0,
    pathProgress: 0,
    worldPos: { x: 0, y: 0 },
    slowEffects: [],
    poisonEffects: [],
    state: 'moving',
    goldReward: 1,
    lifeCost: 1,
  }
}

describe('status effects', () => {
  it('caps total slow at 75%', () => {
    const creep = baseCreep()
    applySlow(creep, 't1', 50, 5)
    applySlow(creep, 't2', 50, 5)
    expect(effectiveSlowPercent(creep)).toBe(75)
  })

  it('applies diminishing returns on additional slows', () => {
    const creep = baseCreep()
    applySlow(creep, 't1', 40, 5)
    applySlow(creep, 't2', 40, 5)
    expect(effectiveSlowPercent(creep)).toBe(60)
  })

  it('ignores slow for slow-immune creeps', () => {
    const creep = baseCreep()
    creep.slowImmune = true
    applySlow(creep, 't1', 80, 5)
    expect(effectiveSlowPercent(creep)).toBe(0)
  })
})
