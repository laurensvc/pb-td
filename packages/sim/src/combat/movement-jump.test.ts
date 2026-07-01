import { loadGameContent } from '@facet/content'
import { describe, expect, it } from 'vitest'
import { SIM_HZ } from '../constants.js'
import { RoundController } from '../round/round-controller.js'

describe('creep movement continuity', () => {
  it('does not teleport large distances between sim ticks', async () => {
    const content = await loadGameContent()
    const controller = new RoundController(content, { seed: 42 })
    controller.skipCountdown()

    for (let i = 0; i < 5; i++) {
      controller.placeCandidate(28 + i * 4, 24)
    }
    controller.resolveSelection({
      kind: 'keep',
      candidateId: controller.state.candidates[0]!.id,
    })

    const tracks = new Map<string, { x: number; y: number }>()
    let maxJump = 0
    let worst: { creepId: string; d: number } | null = null

    for (let t = 0; t < 5000; t++) {
      controller.tick(1 / SIM_HZ)
      const session = controller.combatSession
      if (!session?.creeps.length) continue

      for (const creep of session.creeps) {
        const pos = creep.worldPos
        const prev = tracks.get(creep.id)
        if (prev) {
          const d = Math.hypot(pos.x - prev.x, pos.y - prev.y)
          if (d > maxJump) {
            maxJump = d
            worst = { creepId: creep.id, d }
          }
        }
        tracks.set(creep.id, { x: pos.x, y: pos.y })
      }
    }

    if (worst) console.log('worst jump', worst)

    expect(maxJump).toBeLessThan(48)
  })
})
