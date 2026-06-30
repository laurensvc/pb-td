export type PlacementMode = 'gem' | 'rock' | 'merge';
export type TierId = 'normal' | 'hard';
export type GameStatus = 'idle' | 'running' | 'betweenWaves' | 'lost' | 'cleared';
export type BaseGemFamilyId = 'kinetic' | 'verdant' | 'arcane' | 'nova' | 'prism';
export type HybridGemFamilyId =
  | 'toxic_shot'
  | 'plasma_mortar'
  | 'pierce_crystal'
  | 'spore_bomb'
  | 'slayer_shard'
  | 'venom_lens'
  | 'shatter_star'
  | 'executioner';
export type GemFamilyId = BaseGemFamilyId | HybridGemFamilyId;
export type DamageType = 'physical' | 'magic' | 'pure';
export type GemLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type EnemyId =
  | 'scout'
  | 'trooper'
  | 'bulwark'
  | 'striker'
  | 'warden'
  | 'vanguard'
  | 'runner'
  | 'brute'
  | 'shifter'
  | 'mystic'
  | 'colossus'
  | 'dreadnought';
export type UpgradeBranch = 'missile' | 'kinetic' | 'verdant' | 'arcane' | 'nova' | 'prism' | 'unlock';
export type TowerStat = 'damage' | 'range' | 'rate';
export type MissileStat = 'damage' | 'radius' | 'cooldown';

/** @deprecated Use GemFamilyId */
export type TowerId = GemFamilyId;

export interface Vec2 {
  x: number;
  y: number;
}

export interface EnemyDefinition {
  id: EnemyId;
  name: string;
  hp: number;
  speed: number;
  rewardStars: number;
  rewardGold: number;
  shield?: number;
  color: string;
  isBoss?: boolean;
  leakDamage?: number;
  splitInto?: EnemyId;
  splitCount?: number;
  flying?: boolean;
  invisible?: boolean;
  magicImmune?: boolean;
  physicalImmune?: boolean;
}

export interface GemDefinition {
  id: GemFamilyId;
  name: string;
  role: string;
  branch?: Exclude<UpgradeBranch, 'missile' | 'unlock'>;
  hybrid?: boolean;
  damageType?: DamageType;
  baseDamage: number;
  baseRange: number;
  baseCooldown: number;
  projectileSpeed: number;
  color: string;
  shopCost: number;
  poisonDps?: number;
  poisonDuration?: number;
  shieldPierce?: number;
  splashRadius?: number;
  slowFactor?: number;
  slowDuration?: number;
  armorReduction?: number;
  critChance?: number;
  bonusVsHighHp?: number;
}

export interface GemCombatStats {
  family: GemFamilyId;
  level: GemLevel;
  damage: number;
  range: number;
  cooldown: number;
  projectileSpeed: number;
  color: string;
  poisonDps?: number;
  poisonDuration?: number;
  shieldPierce?: number;
  splashRadius?: number;
  slowFactor?: number;
  slowDuration?: number;
  armorReduction?: number;
  critChance?: number;
  bonusVsHighHp?: number;
}

export interface WaveSegment {
  enemyId: EnemyId;
  count: number;
}

export interface WaveDefinition {
  id: string;
  segments: WaveSegment[];
  spawnInterval: number;
  isBoss?: boolean;
  goldBonus?: number;
}

export interface AreaTierDefinition {
  waves: WaveDefinition[];
  enemyHpMultiplier: number;
  enemySpeedMultiplier: number;
  starMultiplier: number;
  goldMultiplier: number;
  startingGold: number;
}

export interface PathNavData {
  pathCells: ReadonlySet<string>;
  distanceToGoal: ReadonlyMap<string, number>;
  /** BFS distance fields from each checkpoint (same index as checkpoints). */
  checkpointDistances: readonly ReadonlyMap<string, number>[];
  maxProgress: number;
  goalCell: Vec2;
  spawnCell: Vec2;
  /** Ordered route vertices monsters must visit (GemTD checkpoints). */
  checkpoints: readonly Vec2[];
}

export interface AreaDefinition {
  id: string;
  name: string;
  subtitle: string;
  path: Vec2[];
  pathNav: PathNavData;
  tiers: Record<TierId, AreaTierDefinition>;
}

export interface UpgradeDefinition {
  id: string;
  label: string;
  branch: UpgradeBranch;
  costStars: number;
  costCrowns?: number;
  requires?: string[];
  gemFamily?: GemFamilyId;
  towerStat?: TowerStat;
  missileStat?: MissileStat;
  unlockGemFamily?: GemFamilyId;
  value: number;
}

export interface SaveState {
  version: number;
  stars: number;
  crowns: number;
  spentStars: number;
  totalStarsEarned: number;
  unlockedGemFamilies: GemFamilyId[];
  purchasedUpgradeIds: string[];
  clearedAreaTiers: string[];
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
  rewardStars: number;
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
  slowUntil: number;
  slowFactor: number;
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
}

export interface InventoryGem {
  id: number;
  family: GemFamilyId;
  level: GemLevel;
}

export interface ProjectileState {
  id: number;
  gemId: number;
  targetId: number;
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

export interface MissileState {
  id: number;
  x: number;
  y: number;
  damage: number;
  radius: number;
  impactIn: number;
  life: number;
  active: boolean;
}

export interface AttemptRewards {
  stars: number;
  crowns: number;
}

export interface RockState {
  x: number;
  y: number;
  costPaid: number;
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
  missileCooldownLeft: number;
  selectedInventoryGemId: number | null;
  mergeSourceGemId: number | null;
  placementMode: PlacementMode;
  pathNav: PathNavData;
  rocks: RockState[];
  inventory: InventoryGem[];
  enemies: EnemyState[];
  gems: GemState[];
  projectiles: ProjectileState[];
  missiles: MissileState[];
  rewards: AttemptRewards;
  leakedEnemies: number;
  killedEnemies: number;
  nextEnemyId: number;
  nextGemId: number;
  nextInventoryGemId: number;
  nextProjectileId: number;
  nextMissileId: number;
  nextFxId: number;
  quests: QuestState[];
  greatUnlocked: BaseGemFamilyId[];
  waveLeaked: boolean;
  mergeCount: number;
  fxEvents: FxEvent[];
  save: SaveState;
}

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
  rockCount: number;
  inventory: InventoryGem[];
  selectedInventoryGemId: number | null;
  mergeSourceGemId: number | null;
  placedGems: { id: number; family: GemFamilyId; level: GemLevel; x: number; y: number }[];
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
}

export type GameAction =
  | { type: 'startArea'; areaId: string; tierId: TierId }
  | { type: 'startWave' }
  | { type: 'selectPlacementMode'; mode: PlacementMode }
  | { type: 'selectInventoryGem'; gemId: number | null }
  | { type: 'placeGem'; x: number; y: number }
  | { type: 'placeRock'; x: number; y: number }
  | { type: 'sellRock'; x: number; y: number }
  | { type: 'sellGem'; gemId: number }
  | { type: 'selectMergeSource'; gemId: number | null }
  | { type: 'mergeGems'; targetGemId: number }
  | { type: 'pickUpGem'; gemId: number }
  | { type: 'rerollQuest'; questId: string }
  | { type: 'buyGem'; family: GemFamilyId }
  | { type: 'buyRandomGem' }
  | { type: 'buyLuckyBox' }
  | { type: 'fireMissile'; x: number; y: number }
  | { type: 'buyUpgrade'; upgradeId: string }
  | { type: 'respecUpgrades' }
  | { type: 'retry' }
  | { type: 'resetSave' };
