import { loadGameContent } from '@facet/content'
import { describe, expect, it } from 'vitest'
import { createWaveSpawner, tickWaveSpawner } from './wave-spawner.js'
import { buildFlyingPath } from './flying-path.js'

describe('WaveSpawner', () => {
  const content = loadGameContent()

  it('respects group delay before first spawn', () => {
    const spawner = createWaveSpawner(content, 1)
    const flyingPath = buildFlyingPath(content.board, content.board.defaultRouteId)
    const { spawned } = tickWaveSpawner(spawner, content, 0.5, null, flyingPath)
    expect(spawned).toHaveLength(0)
  })

  it('spawns creeps at configured interval', () => {
    const spawner = createWaveSpawner(content, 1)
    const flyingPath = buildFlyingPath(content.board, content.board.defaultRouteId)
    const wave = content.waves[0]!
    const groupDelay = wave.spawn.groupDelayMs / 1000

    const beforeDelay = tickWaveSpawner(spawner, content, groupDelay - 0.001, null, flyingPath)
    expect(beforeDelay.spawned).toHaveLength(0)

    const first = tickWaveSpawner(spawner, content, 0.001, null, flyingPath)
    expect(first.spawned).toHaveLength(1)

    const interval = wave.spawn.spawnIntervalMs / 1000
    const tooSoon = tickWaveSpawner(spawner, content, interval - 0.001, null, flyingPath)
    expect(tooSoon.spawned).toHaveLength(0)

    const second = tickWaveSpawner(spawner, content, 0.001, null, flyingPath)
    expect(second.spawned).toHaveLength(1)
  })

  it('marks spawn complete after all entries', () => {
    const spawner = createWaveSpawner(content, 1)
    const flyingPath = buildFlyingPath(content.board, content.board.defaultRouteId)
    const wave = content.waves[0]!
    const totalCreeps = wave.spawn.entries.reduce((n, e) => n + e.count, 0)
    const groupDelay = wave.spawn.groupDelayMs / 1000
    const interval = wave.spawn.spawnIntervalMs / 1000

    let spawned = 0
    tickWaveSpawner(spawner, content, groupDelay, null, flyingPath)
    while (!spawner.spawnComplete && spawned < totalCreeps + 5) {
      const result = tickWaveSpawner(spawner, content, interval, null, flyingPath)
      spawned += result.spawned.length
    }
    expect(spawner.spawnComplete).toBe(true)
    expect(spawner.spawnedCount).toBe(totalCreeps)
  })
})
