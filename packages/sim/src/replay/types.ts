import type { GamePhase } from '../round/types.js'

export type ReplayStep =
  | { type: 'skipCountdown' }
  | { type: 'place'; gx: number; gy: number }
  | { type: 'keep'; candidateIndex?: number }
  | { type: 'tick'; count: number }
  | { type: 'tickUntilPhase'; phase: GamePhase; maxTicks: number }

export interface ReplayScript {
  seed: number
  routeId?: string
  steps: ReplayStep[]
}
