export {
  TILE_SIZE,
  GEM_FOOTPRINT,
  SIM_HZ,
  STARTING_GOLD,
  PLACEMENT_CHARGES_PER_ROUND,
  FIRST_LETHAL_LEAK_LEVEL,
  MAX_WAVE_LEVEL,
  SLOW_STACK_CAP,
  SLOW_MIN_SPEED_FRACTION,
  MVP_DAMAGE_BONUS_PER_STACK,
  MVP_MAX_STACKS,
  MAX_GEM_CHANCE_LEVEL_V1,
  gemChanceUpgradeCost,
  GEM_TYPES,
  GEM_QUALITY_ORDER,
  qualityIndex,
  qualityAtIndex,
  gemId,
  parseGemId,
} from './constants.js'

export {
  gridToWorldCenter,
  gridToWorldTopLeft,
  worldToGrid,
  snapFootprint,
  type GridCoord,
  type WorldCoord,
} from './board/coordinates.js'

export {
  footprintCells,
  isEvenAlignedFootprint,
  footprintInBounds,
  footprintsOverlap,
} from './board/footprint.js'

export {
  createSimBoard,
  rebuildBlocking,
  addStructure,
  removeStructure,
  removeStructures,
  isGroundWalkable,
  isFootprintBuildable,
  overlapsStructure,
  trialFootprintBlocking,
  type SimBoard,
  type BoardStructure,
  type StructureKind,
} from './board/sim-board.js'

export { findPath, findLegPath, allLegsReachable } from './pathfinding/astar.js'

export {
  buildPathCache,
  ensurePathCache,
  isPathCacheValid,
  type PathCache,
} from './pathfinding/path-cache.js'

export {
  computePathProgress,
  progressAtNode,
  progressAtConcatIndex,
  findLegForConcatIndex,
} from './pathfinding/path-progress.js'

export {
  validatePlacement,
  canPlaceFootprint,
  type PlacementRejectReason,
  type PlacementValidationResult,
} from './placement/placement-validator.js'

export { GemRoller, type GemRoll } from './build/gem-roller.js'

export {
  computeSelectionActions,
  resolveSelection,
  type SelectionAction,
  type SelectionResolution,
} from './build/selection-resolver.js'

export {
  RoundController,
  resetEntityIdCounter,
  type RoundControllerConfig,
  type PlaceCandidateResult,
  type UpgradeGemChanceResult,
  type SimTickResult,
} from './round/round-controller.js'

export type {
  GamePhase,
  CandidateGem,
  TowerEntity,
  RockEntity,
  PlayerRunState,
} from './round/types.js'

export { SeededRng, type RngState } from './rng/seeded-rng.js'

export {
  CombatSession,
  createCombatSession,
  type CombatSessionConfig,
  type CombatTickResult,
} from './combat/combat-session.js'

export {
  resolveDamage,
  type DamageResolverConfig,
  type ResolvedDamage,
} from './combat/damage-resolver.js'

export { buildFlyingPath, type FlyingPath } from './combat/flying-path.js'

export { createCreepFromWave, resetCreepIdCounter } from './combat/creep-factory.js'

export {
  effectiveSlowPercent,
  effectiveSpeedMultiplier,
  applySlow,
  applyPoison,
  tickStatusEffects,
} from './combat/status-effects.js'

export { advanceGroundCreep, advanceFlyingCreep, initCreepPosition } from './combat/movement.js'

export {
  createWaveSpawner,
  tickWaveSpawner,
  registerCreepResolved,
  isWaveCleared,
  type WaveSpawnerState,
} from './combat/wave-spawner.js'

export {
  resolveTowerCombat,
  towerWorldCenter,
  awardMvpStack,
  MVP_MAX_STACKS as TOWER_MVP_MAX_STACKS,
} from './combat/tower-stats.js'

export {
  creditTowerKill,
  computeKillMilestoneDamageMultiplier,
  computeMagicBoundsMrReduction,
  computePhysicalKillDamageMultiplier,
  sumKillCountAtTiles,
  KILL_MILESTONE_INTERVAL,
} from './combat/kill-milestones.js'

export { tickTowerCombat, pickMvpTower, resetWaveDamage } from './combat/tower-combat.js'

export {
  computeMvpMrDebuffForCreep,
  computeMvpAuraAllyDamageMultiplier,
  computeMrReductionForCreep,
  MVP_MR_DEBUFF_RADIUS,
  MVP_MR_DEBUFF_PER_STACK,
  MVP_AURA_RADIUS,
  MVP_AURA_ALLY_DAMAGE_BONUS,
} from './combat/mvp-system.js'

export type {
  TargetingMode,
  CreepEntity,
  CreepLifecycleState,
  AttackPacket,
  CombatEvent,
  CombatSnapshot,
  TowerRuntimeState,
  WorldPos,
} from './combat/types.js'

/** @deprecated Use content schema validation */
export { isValidBoardId } from './legacy.js'
