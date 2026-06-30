import type { GameSnapshot } from '@facet/protocol'

export interface HudState {
  gold: number
  level: number
  phase: GameSnapshot['phase']
  placementCharges: number
  chanceLevel: number
  dpsLabel: string
  leaksLabel: string
  leakPolicy: GameSnapshot['leakPolicy']
}

export function selectHudState(snapshot: GameSnapshot): HudState {
  const dps = snapshot.phase === 'combat' ? snapshot.dps.current : snapshot.dps.previous
  return {
    gold: snapshot.gold,
    level: snapshot.level,
    phase: snapshot.phase,
    placementCharges: snapshot.placementCharges,
    chanceLevel: snapshot.chanceLevel,
    dpsLabel: dps > 0 ? dps.toFixed(1) : '—',
    leaksLabel:
      snapshot.leakPolicy === 'lethal'
        ? snapshot.leaksThisWave > 0
          ? 'LETHAL'
          : '1 life'
        : `${snapshot.leaksThisWave} leaks`,
    leakPolicy: snapshot.leakPolicy,
  }
}

export function phaseLabel(phase: GameSnapshot['phase']): string {
  switch (phase) {
    case 'countdown':
      return 'Countdown'
    case 'placement':
      return 'Build'
    case 'selection':
      return 'Selection'
    case 'combat':
      return 'Combat'
    case 'finished':
      return 'Victory'
    case 'lost':
      return 'Defeat'
    default:
      return phase
  }
}
