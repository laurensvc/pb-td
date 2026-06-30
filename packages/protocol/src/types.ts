/** Serializable game phase — mirrors @facet/sim round phases. */
export type GamePhase = 'countdown' | 'placement' | 'selection' | 'combat' | 'finished' | 'lost'

export type TargetingMode = 'closest_to_goal' | 'closest_to_tower' | 'highest_hp' | 'first_in_range'

/** Player intent from React UI. */
export type GameCommand =
  | { type: 'game.skipCountdown' }
  | { type: 'game.pause'; paused: boolean }
  | { type: 'build.placeGem'; gx: number; gy: number }
  | { type: 'build.keepGem'; candidateId: string }
  | {
      type: 'build.downgrade'
      candidateId: string
      resultGemId: string
    }
  | {
      type: 'build.combine'
      candidateId: string
      count: 2 | 3 | 4
      resultGemId: string
      consumedCandidateIds: string[]
    }
  | {
      type: 'recipe.combine'
      candidateId: string
      recipeId: string
      outputTowerId: string
      consumedCandidateIds: string[]
    }
  | { type: 'economy.upgradeGemChance' }
  | { type: 'tower.setTargetingMode'; towerId: string; mode: TargetingMode }
  | { type: 'tower.setHoldFire'; towerId: string; held: boolean }

/** World interaction intent from Phaser. */
export type WorldInputCommand =
  | { type: 'pointer.hoverFootprint'; gx: number; gy: number }
  | { type: 'pointer.placeAtHoveredFootprint' }
  | { type: 'pointer.selectStructure'; structureId: string }
  | { type: 'camera.focusLandmark'; landmarkId: string }

export type GameEvent =
  | { type: 'phase.changed'; phase: GamePhase }
  | { type: 'placement.validityChanged'; valid: boolean; reason?: string }
  | { type: 'path.rebuilt'; version: number }
  | { type: 'command.rejected'; commandType: string; reason: string }
  | { type: 'creep.spawned'; creepId: string; enemyId: string; waveNumber: number }
  | { type: 'creep.killed'; creepId: string; killerTowerId: string; gold: number }
  | { type: 'creep.leaked'; creepId: string; waveNumber: number; lifeCost: number }
  | { type: 'attack.missed'; creepId: string; towerId: string }
  | { type: 'tower.fired'; towerId: string; creepId: string; damage: number }
  | { type: 'wave.spawnComplete'; waveNumber: number }
  | { type: 'wave.cleared'; waveNumber: number }
  | { type: 'mvp.awarded'; towerId: string; stacks: number }

export interface SnapshotWorldPos {
  x: number
  y: number
}

export interface SnapshotCandidate {
  id: string
  gemId: string
  type: string
  quality: string
  gx: number
  gy: number
}

export interface SnapshotTower {
  id: string
  gemId?: string
  specialId?: string
  gx: number
  gy: number
  active: boolean
  killCount: number
  targetingMode: TargetingMode
  holdFire: boolean
  mvpStacks: number
}

export interface SnapshotRock {
  id: string
  gx: number
  gy: number
}

export interface SnapshotCreep {
  id: string
  enemyId: string
  hp: number
  maxHp: number
  pathProgress: number
  worldPos: SnapshotWorldPos
  mobility: 'ground' | 'flying'
}

export type SnapshotSelectionAction =
  | { kind: 'keep'; candidateId: string; label: string }
  | { kind: 'downgrade'; candidateId: string; resultGemId: string; label: string }
  | {
      kind: 'duplicate-combine'
      candidateId: string
      count: 2 | 3 | 4
      resultGemId: string
      consumedCandidateIds: string[]
      label: string
    }
  | {
      kind: 'one-hit-special'
      candidateId: string
      recipeId: string
      outputTowerId: string
      consumedCandidateIds: string[]
      label: string
    }

export interface SnapshotWavePreview {
  waveNumber: number
  displayName: string
  announcement: string
  isBoss: boolean
  isFlying: boolean
  threatLevel: number
  abilities: string[]
  enemySummary: string
}

export interface SnapshotHoverFootprint {
  gx: number
  gy: number
  valid: boolean
  reason?: string
}

export interface SnapshotDps {
  /** Current combat wave DPS. */
  current: number
  /** Previous cleared wave DPS (shown during build). */
  previous: number
}

/** Coarse per-tick state for React + Phaser presentation. */
export interface GameSnapshot {
  version: number
  tick: number
  phase: GamePhase
  level: number
  gold: number
  placementCharges: number
  chanceLevel: number
  chanceUpgradeCost: number
  canUpgradeChance: boolean
  candidates: SnapshotCandidate[]
  towers: SnapshotTower[]
  rocks: SnapshotRock[]
  creeps: SnapshotCreep[]
  selectionActions: SnapshotSelectionAction[]
  hover: SnapshotHoverFootprint | null
  buildOverlayVisible: boolean
  pathVersion: number
  dps: SnapshotDps
  leaksThisWave: number
  leakPolicy: 'tolerant' | 'lethal'
  nextWave: SnapshotWavePreview | null
  selectedTowerId: string | null
  mvpTowerId: string | null
  board: {
    width: number
    height: number
    tileSize: number
    worldWidth: number
    worldHeight: number
    cameraBounds: [number, number, number, number]
    startFocusLandmarkId: string
  }
}
