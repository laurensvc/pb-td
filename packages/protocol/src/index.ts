/** Shared command/event/snapshot contracts for sim and web. */

export const PROTOCOL_VERSION = 1

export type {
  GamePhase,
  TargetingMode,
  GameCommand,
  WorldInputCommand,
  GameEvent,
  SnapshotWorldPos,
  SnapshotCandidate,
  SnapshotTower,
  SnapshotRock,
  SnapshotCreep,
  SnapshotSelectionAction,
  SnapshotWavePreview,
  SnapshotHoverFootprint,
  SnapshotDps,
  GameSnapshot,
} from './types.js'
