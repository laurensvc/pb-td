import { createHash } from 'node:crypto'
import type { RoundController } from '../round/round-controller.js'

function round(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

/** Stable JSON-friendly snapshot for regression hashing. */
export function canonicalRunState(controller: RoundController): unknown {
  const state = controller.state
  const combat = controller.lastCombatSnapshot

  return {
    phase: state.phase,
    level: state.level,
    gold: state.gold,
    chanceLevel: state.chanceLevel,
    placementCharges: state.placementCharges,
    towers: [...state.towers]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((tower) => ({
        gemId: tower.gemId,
        specialId: tower.specialId,
        gx: tower.gx,
        gy: tower.gy,
        active: tower.active,
        killCount: tower.killCount,
        mvpStacks: tower.mvpStacks,
      })),
    rocks: [...state.rocks]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((rock) => ({ gx: rock.gx, gy: rock.gy })),
    candidates: [...state.candidates]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((candidate) => ({
        gemId: candidate.gemId,
        gx: candidate.gx,
        gy: candidate.gy,
      })),
    combat: combat
      ? {
          tick: combat.tick,
          activeCreepCount: combat.activeCreepCount,
          killsThisWave: combat.killsThisWave,
          leaksThisWave: combat.leaksThisWave,
          creeps: [...combat.creeps]
            .sort((a, b) => a.id.localeCompare(b.id))
            .map((creep) => ({
              hp: round(creep.hp, 4),
              pathProgress: round(creep.pathProgress, 4),
            })),
        }
      : null,
    rng: controller.rng.getState(),
  }
}

export function hashRunState(controller: RoundController): string {
  const payload = JSON.stringify(canonicalRunState(controller))
  return createHash('sha256').update(payload).digest('hex')
}
