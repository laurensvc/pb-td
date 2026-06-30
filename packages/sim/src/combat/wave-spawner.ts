import type { GameContent, WaveDefinition } from '@facet/content'
import { createCreepFromWave } from './creep-factory.js'
import { initCreepPosition } from './movement.js'
import type { PathCache } from '../pathfinding/path-cache.js'
import type { FlyingPath } from './flying-path.js'
import type { CreepEntity } from './types.js'

interface SpawnQueueEntry {
  enemyId: string
  hpMultiplier: number
  speedMultiplier: number
}

export interface WaveSpawnerState {
  wave: WaveDefinition
  waveNumber: number
  queue: SpawnQueueEntry[]
  spawnIntervalSec: number
  groupDelaySec: number
  concurrent: boolean
  elapsed: number
  timeSinceLastSpawn: number
  spawnComplete: boolean
  spawnedCount: number
  resolvedCount: number
}

export function createWaveSpawner(content: GameContent, waveNumber: number): WaveSpawnerState {
  const wave = content.waves.find((w) => w.waveNumber === waveNumber)
  if (!wave) throw new Error(`Unknown wave: ${waveNumber}`)

  const queue: SpawnQueueEntry[] = []
  for (const entry of wave.spawn.entries) {
    for (let i = 0; i < entry.count; i++) {
      queue.push({
        enemyId: entry.enemyId,
        hpMultiplier: entry.hpMultiplier ?? 1,
        speedMultiplier: entry.speedMultiplier ?? 1,
      })
    }
  }

  return {
    wave,
    waveNumber,
    queue,
    spawnIntervalSec: wave.spawn.spawnIntervalMs / 1000,
    groupDelaySec: wave.spawn.groupDelayMs / 1000,
    concurrent: wave.spawn.concurrent,
    elapsed: 0,
    timeSinceLastSpawn: 0,
    spawnComplete: queue.length === 0,
    spawnedCount: 0,
    resolvedCount: 0,
  }
}

export interface SpawnTickResult {
  spawned: CreepEntity[]
  spawnJustCompleted: boolean
}

export function tickWaveSpawner(
  spawner: WaveSpawnerState,
  content: GameContent,
  dt: number,
  pathCache: PathCache | null,
  flyingPath: FlyingPath | null,
): SpawnTickResult {
  const spawned: CreepEntity[] = []
  let spawnJustCompleted = false

  if (spawner.spawnComplete) {
    return { spawned, spawnJustCompleted }
  }

  spawner.elapsed += dt
  spawner.timeSinceLastSpawn += dt

  if (spawner.elapsed < spawner.groupDelaySec) {
    return { spawned, spawnJustCompleted }
  }

  const canSpawn =
    spawner.queue.length > 0 &&
    (spawner.spawnedCount === 0 || spawner.timeSinceLastSpawn >= spawner.spawnIntervalSec)

  if (canSpawn) {
    const next = spawner.queue.shift()!
    const creep = createCreepFromWave(
      content,
      next.enemyId,
      spawner.wave,
      next.hpMultiplier,
      next.speedMultiplier,
      spawner.waveNumber,
    )
    initCreepPosition(creep, pathCache, flyingPath)
    spawned.push(creep)
    spawner.spawnedCount += 1
    spawner.timeSinceLastSpawn = 0

    if (spawner.queue.length === 0) {
      spawner.spawnComplete = true
      spawnJustCompleted = true
    }
  }

  return { spawned, spawnJustCompleted }
}

export function registerCreepResolved(spawner: WaveSpawnerState): void {
  spawner.resolvedCount += 1
}

export function isWaveCleared(spawner: WaveSpawnerState): boolean {
  return spawner.spawnComplete && spawner.resolvedCount >= spawner.spawnedCount
}

export function canStartConcurrentWave(
  spawner: WaveSpawnerState,
  activeCreepsFromOtherWaves: number,
): boolean {
  if (spawner.concurrent) return true
  return activeCreepsFromOtherWaves === 0
}
