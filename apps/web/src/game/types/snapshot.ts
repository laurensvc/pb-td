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
import type { GemOffer, RawGemQualityOdds, SaveState } from './content';
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
  placementMode: PlacementMode;
  buildStep: BuildStep;
  rocksPlacedThisPhase: number;
  rocksRemaining: number;
  offers: GemOffer[];
  rawGemBuildLevel: number;
  rawGemQualityOdds: RawGemQualityOdds[];
  claimedOffer: GemOffer | null;
  rawGems: {
    id: number;
    family: BaseGemFamilyId;
    level: GemLevel;
    x: number;
    y: number;
  }[];
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
