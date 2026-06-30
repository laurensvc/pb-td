import type {
  BaseGemFamilyId,
  BuildStep,
  EnemyId,
  GameSpeed,
  GameStatus,
  GemFamilyId,
  GemLevel,
  PlacementMode,
  TargetingMode,
  TierId,
} from './primitives';
import type { GemOffer, SaveState } from './content';
import type { FxEvent, HoldGem, InventoryGem, QuestState } from './runtime';

export interface Snapshot {
  status: GameStatus;
  areaId: string;
  areaName: string;
  tierId: TierId;
  time: number;
  wave: number;
  totalWaves: number;
  lives: number;
  maxLives: number;
  gold: number;
  rockCost: number;
  activeEnemies: number;
  stars: number;
  crowns: number;
  attemptStars: number;
  attemptCrowns: number;
  missileCooldownLeft: number;
  missileCooldown: number;
  placementMode: PlacementMode;
  buildStep: BuildStep;
  rocksPlacedThisPhase: number;
  rocksRemaining: number;
  offers: GemOffer[];
  claimedOffer: GemOffer | null;
  holdGem: HoldGem | null;
  mergeUndoCount: number;
  prospectRerollCost: number;
  rockPathDelta: number | null;
  nextWavePreview: { enemyId: EnemyId; count: number; name: string; tags: string[] }[];
  waveSpawnTracker: {
    total: number;
    spawned: number;
    remaining: number;
    alive: number;
    killed: number;
    currentSegment: { enemyId: EnemyId; name: string } | null;
  } | null;
  runSeed: number;
  gameSpeed: GameSpeed;
  crystalDust: number;
  missileUnlocked: boolean;
  rockCount: number;
  inventory: InventoryGem[];
  selectedInventoryGemId: number | null;
  mergeSourceGemId: number | null;
  placedGems: {
    id: number;
    family: GemFamilyId;
    level: GemLevel;
    x: number;
    y: number;
    targeting: TargetingMode;
  }[];
  toast: string | null;
  unlockedGemFamilies: GemFamilyId[];
  canStartWave: boolean;
  canRetry: boolean;
  isBossWave: boolean;
  pathLength: number;
  waveIncome: number;
  interestPreview: number;
  quests: QuestState[];
  greatUnlocked: BaseGemFamilyId[];
  fxEvents: FxEvent[];
  resultTitle: string | null;
  resultMessage: string | null;
  save: SaveState;
}
