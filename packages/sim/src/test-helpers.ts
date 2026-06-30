import type { SimBoard } from './board/sim-board.js'
import { isFootprintBuildable } from './board/sim-board.js'

export function findBuildableFootprint(sim: SimBoard): { gx: number; gy: number } {
  for (let gy = 4; gy < sim.board.height - 4; gy += 2) {
    for (let gx = 4; gx < sim.board.width - 4; gx += 2) {
      if (isFootprintBuildable(sim, gx, gy)) {
        return { gx, gy }
      }
    }
  }
  throw new Error('No buildable footprint found on board')
}
