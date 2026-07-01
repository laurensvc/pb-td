import { loadGameContent } from '@facet/content'
import { describe, expect, it } from 'vitest'
import { SeededRng } from '../rng/seeded-rng.js'
import { createCreepFromWave } from './creep-factory.js'
import { resolveDamage } from './damage-resolver.js'
import { computeMvpMrDebuffForCreep } from './mvp-system.js'
import { towerWorldCenter } from './tower-stats.js'
import type { TowerEntity } from '../round/types.js'

describe('mvp MR debuff in combat', () => {
  const content = loadGameContent()
  const wave = content.waves[0]!
  const rng = new SeededRng(1)

  it('increases magic damage against creeps near an MVP tower', () => {
    const mvpTower: TowerEntity = {
      id: 'mvp',
      specialId: 'silver',
      gx: 68,
      gy: 68,
      active: true,
      killCount: 0,
      targetingMode: 'closest_to_goal',
      holdFire: false,
      mvpStacks: 2,
    }
    const center = towerWorldCenter(mvpTower.gx, mvpTower.gy)
    const creep = createCreepFromWave(content, 'stone-grunt', wave, 1, 1, 1)
    creep.magicResist = 50
    creep.worldPos = { x: center.x, y: center.y }

    const mvpStacks = new Map([[mvpTower.id, 2]])
    const mrReduction = computeMvpMrDebuffForCreep([mvpTower], creep, mvpStacks)

    const baseline = resolveDamage(
      creep,
      { baseDamage: 100, attackType: 'magic', sourceTowerId: 't1' },
      { matrix: content.armorDamageMatrix, rng },
    )
    const debuffed = resolveDamage(
      creep,
      {
        baseDamage: 100,
        attackType: 'magic',
        sourceTowerId: 't1',
        magicResistReduction: mrReduction,
      },
      { matrix: content.armorDamageMatrix, rng },
    )

    expect(mrReduction).toBe(20)
    expect(debuffed.damage).toBeGreaterThan(baseline.damage)
  })
})
