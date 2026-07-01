import type { GameSnapshot, SnapshotSelectionAction } from '@facet/protocol'
import { BOARD_LANDMARKS } from '../board/landmarks.js'

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

export interface MinimapState {
  worldWidth: number
  worldHeight: number
  landmarks: Array<{ id: string; x: number; y: number }>
  towers: Array<{ x: number; y: number; active: boolean }>
  creeps: Array<{ x: number; y: number }>
  candidates: Array<{ x: number; y: number }>
}

function structureWorldCenter(gx: number, gy: number, tileSize: number): { x: number; y: number } {
  return {
    x: gx * tileSize + tileSize,
    y: gy * tileSize + tileSize,
  }
}

export function selectMinimapState(snapshot: GameSnapshot): MinimapState {
  const { tileSize, worldWidth, worldHeight } = snapshot.board

  return {
    worldWidth,
    worldHeight,
    landmarks: BOARD_LANDMARKS.map((landmark) => ({
      id: landmark.id,
      ...structureWorldCenter(landmark.gx, landmark.gy, tileSize),
    })),
    towers: snapshot.towers.map((tower) => ({
      ...structureWorldCenter(tower.gx, tower.gy, tileSize),
      active: tower.active,
    })),
    creeps: snapshot.creeps.map((creep) => ({ x: creep.worldPos.x, y: creep.worldPos.y })),
    candidates: snapshot.candidates.map((candidate) =>
      structureWorldCenter(candidate.gx, candidate.gy, tileSize),
    ),
  }
}

export interface BuildControlsState {
  phase: GameSnapshot['phase']
  chanceLevel: number
  canUpgradeChance: boolean
  chanceUpgradeCost: number
  selectionActions: SnapshotSelectionAction[]
  selectedTower: {
    id: string
    targetingMode: GameSnapshot['towers'][number]['targetingMode']
    holdFire: boolean
  } | null
}

export interface WavePreviewState {
  visible: boolean
  wave: GameSnapshot['nextWave']
}

export interface RecipeDictionaryState {
  ownedGemIds: string[]
}

export interface BoardPresentationState {
  phase: GameSnapshot['phase']
  pathVersion: number
  buildOverlayVisible: boolean
  hover: GameSnapshot['hover']
  candidates: GameSnapshot['candidates']
  towers: GameSnapshot['towers']
  rocks: GameSnapshot['rocks']
  creeps: GameSnapshot['creeps']
  board: Pick<GameSnapshot['board'], 'tileSize' | 'worldWidth' | 'worldHeight'>
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

export function selectBuildControlsState(snapshot: GameSnapshot): BuildControlsState {
  const selected = snapshot.towers.find((tower) => tower.id === snapshot.selectedTowerId)
  return {
    phase: snapshot.phase,
    chanceLevel: snapshot.chanceLevel,
    canUpgradeChance: snapshot.canUpgradeChance,
    chanceUpgradeCost: snapshot.chanceUpgradeCost,
    selectionActions: snapshot.selectionActions,
    selectedTower: selected
      ? {
          id: selected.id,
          targetingMode: selected.targetingMode,
          holdFire: selected.holdFire,
        }
      : null,
  }
}

export function selectWavePreviewState(snapshot: GameSnapshot): WavePreviewState {
  const showDuringBuild =
    snapshot.phase === 'placement' ||
    snapshot.phase === 'selection' ||
    snapshot.phase === 'countdown'

  return {
    visible: showDuringBuild && snapshot.nextWave !== null,
    wave: snapshot.nextWave,
  }
}

export function selectRecipeDictionaryState(snapshot: GameSnapshot): RecipeDictionaryState {
  const ownedGemIds = [
    ...new Set([
      ...snapshot.candidates.map((candidate) => candidate.gemId),
      ...snapshot.towers.flatMap((tower) => (tower.gemId ? [tower.gemId] : [])),
    ]),
  ].sort()

  return { ownedGemIds }
}

export function selectBoardPresentationState(snapshot: GameSnapshot): BoardPresentationState {
  return {
    phase: snapshot.phase,
    pathVersion: snapshot.pathVersion,
    buildOverlayVisible: snapshot.buildOverlayVisible,
    hover: snapshot.hover,
    candidates: snapshot.candidates,
    towers: snapshot.towers,
    rocks: snapshot.rocks,
    creeps: snapshot.creeps,
    board: {
      tileSize: snapshot.board.tileSize,
      worldWidth: snapshot.board.worldWidth,
      worldHeight: snapshot.board.worldHeight,
    },
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
