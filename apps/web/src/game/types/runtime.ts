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
import type { GemOffer, PathNavData, SaveState } from './content';

export interface SlowDebuffEntry {
  level: GemLevel;
  factor: number;
  until: number;
}

export interface ArmorDebuffEntry {
  level: GemLevel;
  reduction: number;
  until?: number;
}

export interface EnemyState {
  id: number;
  definitionId: EnemyId;
  name: string;
  x: number;
  y: number;
  pathProgress: number;
  /** Index into pathNav.checkpoints for the next checkpoint to reach. */
  checkpointIndex: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  speed: number;
  rewardGold: number;
  color: string;
  alive: boolean;
  leaked: boolean;
  flying: boolean;
  invisible: boolean;
  magicImmune: boolean;
  physicalImmune: boolean;
  revealedUntil: number;
  poisonDps: number;
  poisonUntil: number;
  slowDebuffs: SlowDebuffEntry[];
  armorDebuffs: ArmorDebuffEntry[];
  /** Derived from active slow debuffs for render compatibility. */
  slowUntil: number;
  /** Derived from active slow debuffs for render compatibility. */
  slowFactor: number;
  /** Derived from active armor debuffs for render compatibility. */
  armorReduction: number;
}

export interface GemState {
  id: number;
  family: GemFamilyId;
  level: GemLevel;
  x: number;
  y: number;
  cooldownLeft: number;
  kills: number;
  damageDone: number;
  targeting: TargetingMode;
}

export interface InventoryGem {
  id: number;
  family: GemFamilyId;
  level: GemLevel;
}

export type HoldGem = Pick<InventoryGem, 'family' | 'level'>;

export interface MergeUndoEntry {
  gems: GemState[];
  removedGemId: number;
  quests: QuestState[];
  greatUnlocked: BaseGemFamilyId[];
  gold: number;
}

export interface ProjectileState {
  id: number;
  gemId: number;
  family: GemFamilyId;
  targetId: number;
  effectLevel: GemLevel;
  x: number;
  y: number;
  damage: number;
  speed: number;
  color: string;
  poisonDps?: number;
  poisonDuration?: number;
  shieldPierce?: number;
  splashRadius?: number;
  slowFactor?: number;
  slowDuration?: number;
  critChance?: number;
  bonusVsHighHp?: number;
  armorReduction?: number;
  active: boolean;
}

export interface RockState {
  x: number;
  y: number;
  costPaid: number;
}

export interface RawGemState {
  id: number;
  family: BaseGemFamilyId;
  level: GemLevel;
  x: number;
  y: number;
}

export interface QuestState {
  id: string;
  templateId: string;
  label: string;
  target: number;
  progress: number;
  completed: boolean;
  rewardGold: number;
  unlockGreat?: BaseGemFamilyId;
}

export interface FxEvent {
  id: number;
  kind: 'merge' | 'gold' | 'quest';
  x: number;
  y: number;
  text: string;
  life: number;
}

export interface GameState {
  status: GameStatus;
  areaId: string;
  tierId: TierId;
  time: number;
  waveIndex: number;
  segmentIndex: number;
  enemiesToSpawn: number;
  spawnTimer: number;
  lives: number;
  maxLives: number;
  gold: number;
  rocksPlaced: number;
  selectedInventoryGemId: number | null;
  mergeSourceGemId: number | null;
  placementMode: PlacementMode;
  buildStep: BuildStep;
  runSeed: number;
  combatRollNonce: number;
  gameSpeed: GameSpeed;
  crystalDust: number;
  killedThisWave: number;
  rocksPlacedThisPhase: number;
  rerollsThisPhase: number;
  offers: GemOffer[];
  claimedOffer: GemOffer | null;
  rawGems: RawGemState[];
  holdGem: HoldGem | null;
  mergeUndoStack: MergeUndoEntry[];
  pathNav: PathNavData;
  rocks: RockState[];
  inventory: InventoryGem[];
  enemies: EnemyState[];
  gems: GemState[];
  projectiles: ProjectileState[];
  leakedEnemies: number;
  killedEnemies: number;
  nextEnemyId: number;
  nextGemId: number;
  nextInventoryGemId: number;
  nextRawGemId: number;
  nextProjectileId: number;
  nextFxId: number;
  quests: QuestState[];
  greatUnlocked: BaseGemFamilyId[];
  waveLeaked: boolean;
  mergeCount: number;
  fxEvents: FxEvent[];
  save: SaveState;
}
