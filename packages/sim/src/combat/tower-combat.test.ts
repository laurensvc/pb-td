import { loadGameContent } from '@facet/content'
import { describe, expect, it } from 'vitest'
import { SeededRng } from '../rng/seeded-rng.js'
import { createCreepFromWave } from './creep-factory.js'
import { tickTowerCombat } from './tower-combat.js'
import { towerWorldCenter } from './tower-stats.js'
import type { TowerEntity } from '../round/types.js'

describe('tickTowerCombat', () => {
  const content = loadGameContent()
  const wave = content.waves[0]!
  const rng = new SeededRng(7)

  const tower: TowerEntity = {
    id: 'tower-1',
    gemId: 'diamond-normal',
    gx: 68,
    gy: 68,
    active: true,
    killCount: 0,
    targetingMode: 'closest_to_goal',
    holdFire: false,
    mvpStacks: 0,
  }

  it('closest_to_goal prefers creep farther along path', () => {
    const center = towerWorldCenter(tower.gx, tower.gy)
    const near = createCreepFromWave(content, 'stone-grunt', wave, 1, 1, 1)
    near.pathProgress = 1
    near.worldPos = { x: center.x, y: center.y }
    const far = createCreepFromWave(content, 'stone-grunt', wave, 1, 1, 1)
    far.pathProgress = 10
    far.worldPos = { x: center.x, y: center.y }

    const result = tickTowerCombat(
      content,
      [tower],
      new Map(),
      [near, far],
      new Map(),
      1,
      { matrix: content.armorDamageMatrix, rng },
      null,
    )

    const fired = result.events.find((e) => e.type === 'tower_fired')
    expect(fired?.creepId).toBe(far.id)
  })

  it('hold fire prevents attacks', () => {
    const center = towerWorldCenter(tower.gx, tower.gy)
    const creep = createCreepFromWave(content, 'stone-grunt', wave, 1, 1, 1)
    creep.worldPos = { x: center.x, y: center.y }

    const held: TowerEntity = { ...tower, holdFire: true }
    const result = tickTowerCombat(
      content,
      [held],
      new Map(),
      [creep],
      new Map(),
      1,
      { matrix: content.armorDamageMatrix, rng },
      null,
    )
    expect(result.events).toHaveLength(0)
  })

  it('highest_hp targets the tankiest creep', () => {
    const center = towerWorldCenter(tower.gx, tower.gy)
    const weak = createCreepFromWave(content, 'crystal-runner', wave, 1, 1, 1)
    weak.worldPos = { x: center.x, y: center.y }
    const tank = createCreepFromWave(content, 'gate-colossus', wave, 1, 1, 1)
    tank.worldPos = { x: center.x, y: center.y }

    const hpTower: TowerEntity = { ...tower, targetingMode: 'highest_hp' }
    const result = tickTowerCombat(
      content,
      [hpTower],
      new Map(),
      [weak, tank],
      new Map(),
      1,
      { matrix: content.armorDamageMatrix, rng },
      null,
    )
    const fired = result.events.find((e) => e.type === 'tower_fired')
    expect(fired?.creepId).toBe(tank.id)
  })
})
