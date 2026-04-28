export type GemFamily =
  | 'amethyst'
  | 'aquamarine'
  | 'diamond'
  | 'emerald'
  | 'opal'
  | 'ruby'
  | 'sapphire'
  | 'topaz';

export type GemTier = 1 | 2 | 3 | 4 | 5 | 6;
export type GameStatus = 'ready' | 'running' | 'paused' | 'won' | 'lost';
export type GamePhase = 'build' | 'attack';
export type DamageType = 'physical' | 'magic' | 'pure';
export type EnemySkill =
  | 'magicImmune'
  | 'physicalImmune'
  | 'disarm'
  | 'flying'
  | 'evasion'
  | 'refraction'
  | 'blink'
  | 'rush'
  | 'thief'
  | 'permanentInvisibility'
  | 'vitality'
  | 'untouchable'
  | 'highArmor'
  | 'reactiveArmor'
  | 'recharge'
  | 'cloakAndDagger'
  | 'krakenShell';

export type TowerClass = 'gem' | 'basic' | 'intermediate' | 'advanced' | 'top' | 'secret';
export type TargetMode =
  | 'first'
  | 'last'
  | 'strongest'
  | 'weakest'
  | 'closest'
  | 'flyingOnly'
  | 'bossOnly';
export type TowerEffect =
  | 'armorBreak'
  | 'speedAura'
  | 'damageAura'
  | 'poison'
  | 'cleave'
  | 'slow'
  | 'split'
  | 'crit'
  | 'burn'
  | 'antiFly'
  | 'corrupt'
  | 'stun'
  | 'lightning'
  | 'radiation'
  | 'inspire'
  | 'resist'
  | 'greedy'
  | 'overlook'
  | 'recover'
  | 'mvpAura'
  | 'decadent';

export type SkillId =
  | 'heal'
  | 'guard'
  | 'evade'
  | 'revenge'
  | 'gemPray'
  | 'gemQualityPray'
  | 'adjacentSwap'
  | 'timelapse'
  | 'hammer'
  | 'attackSpeed'
  | 'aim'
  | 'crit'
  | 'fatalBonds'
  | 'swap'
  | 'flawlessPray'
  | 'perfectPray'
  | 'candyMaker';

export interface GridPoint {
  x: number;
  y: number;
}

export interface MapDefinition {
  id: string;
  name: string;
  width: number;
  height: number;
  entrance: GridPoint;
  checkpoints: readonly GridPoint[];
  exit: GridPoint;
  blocked: readonly GridPoint[];
}

export interface TowerEffectDefinition {
  type: TowerEffect;
  value: number;
  radius?: number;
  duration?: number;
  damageType?: DamageType;
  maxTargets?: number;
}

export interface GemDefinition {
  id: string;
  name: string;
  code: string;
  family: GemFamily;
  tier: GemTier;
  color: string;
  damage: number;
  range: number;
  cooldown: number;
  projectileSpeed: number;
  damageType: DamageType;
  effects: readonly TowerEffectDefinition[];
  classification: TowerClass;
}

export interface RecipeIngredient {
  family?: GemFamily;
  tier?: GemTier;
  gemId?: string;
  towerId?: string;
}

export interface RecipeDefinition {
  id: string;
  name: string;
  classification: Exclude<TowerClass, 'gem'>;
  description: string;
  ingredients: readonly RecipeIngredient[];
  resultGemId: string;
  hidden?: boolean;
  oneRoundOnly?: boolean;
}

export interface EnemyDefinition {
  id: string;
  name: string;
  hp: number;
  speed: number;
  reward: number;
  armor: number;
  color: string;
  boss?: boolean;
  flying?: boolean;
  skills: readonly EnemySkill[];
}

export interface WaveDefinition {
  id: string;
  wave: number;
  name: string;
  enemyId: string;
  alternativeEnemyIds?: readonly string[];
  count: number;
  spawnInterval: number;
  skills: readonly EnemySkill[];
  boss?: boolean;
}

export interface SkillDefinition {
  id: SkillId;
  name: string;
  rarity: 'common' | 'rare' | 'mythical' | 'legendary';
  description: string;
  goldCosts: readonly number[];
  active: boolean;
}

export interface QuestDefinition {
  id: string;
  name: string;
  fixed?: boolean;
  cooldownDays?: number;
}

export interface RankDefinition {
  id: string;
  name: string;
  percentage: string;
}

export interface EconomyConfig {
  startingGold: number;
  startingLives: number;
  sellRefundRate: number;
}

export type TowerUpgradeStat = 'damage' | 'speed' | 'range';

export interface TowerUpgradeLevels {
  damage: number;
  speed: number;
  range: number;
}

export interface TowerShopItem {
  gemId: string;
  cost: number;
}

export interface TowerUpgradeCosts {
  tierBase: number;
  tierGrowth: number;
  damageBase: number;
  speedBase: number;
  rangeBase: number;
  statGrowth: number;
  maxStatLevel: number;
}

export interface GameConfig {
  map: MapDefinition;
  gems: readonly GemDefinition[];
  recipes: readonly RecipeDefinition[];
  towerShop: readonly TowerShopItem[];
  towerUpgradeCosts: TowerUpgradeCosts;
  freeBlocksPerWave: number;
  maxBankedFreeBlocks: number;
  enemies: readonly EnemyDefinition[];
  waves: readonly WaveDefinition[];
  skills: readonly SkillDefinition[];
  quests: readonly QuestDefinition[];
  ranks: readonly RankDefinition[];
  economy: EconomyConfig;
}

export interface EnemyState {
  id: number;
  definitionId: string;
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  reward: number;
  armor: number;
  checkpointIndex: number;
  path: GridPoint[];
  pathIndex: number;
  alive: boolean;
  reachedExit: boolean;
  slowUntil: number;
  slowMultiplier: number;
  sapphireSlowUntil: number[];
  sapphireSlowMultiplier: number[];
  poisonDps: number;
  poisonUntil: number;
  burnDps: number;
  burnUntil: number;
  stunUntil: number;
  refraction: number;
  blinkCooldown: number;
  rechargeTimer: number;
  revealedUntil: number;
  color: string;
  skills: EnemySkill[];
  invisible: boolean;
  flying: boolean;
  boss: boolean;
}

export interface TowerState {
  id: number;
  gemId: string;
  name: string;
  family: GemFamily;
  tier: GemTier;
  classification: TowerClass;
  x: number;
  y: number;
  damage: number;
  range: number;
  cooldown: number;
  cooldownLeft: number;
  projectileSpeed: number;
  color: string;
  damageType: DamageType;
  effects: TowerEffectDefinition[];
  kills: number;
  roundDamage: number;
  totalDamage: number;
  mvpAwards: number;
  stopped: boolean;
  targetId: number | null;
  targetMode: TargetMode;
  buffUntil: number;
  attackSpeedBuff: number;
  rangeBuff: number;
  critBuff: number;
  critMultiplier: number;
  upgradeLevels: TowerUpgradeLevels;
}

export interface ProjectileState {
  id: number;
  active: boolean;
  x: number;
  y: number;
  targetId: number;
  towerId: number;
  damage: number;
  speed: number;
  color: string;
  damageType: DamageType;
  effects: TowerEffectDefinition[];
}

export interface DraftCandidate {
  id: number;
  gemId: string;
  x: number;
  y: number;
}

export interface FloatingText {
  active: boolean;
  x: number;
  y: number;
  value: string;
  life: number;
  color: string;
}

export interface SkillInventoryEntry {
  id: SkillId;
  level: number;
}

export interface ActiveSkillState {
  guardUntil: number;
  evadeUntil: number;
  fatalBondsUntil: number;
  candyAvailable: boolean;
}

export interface QuestProgress {
  id: string;
  completed: boolean;
  progress: number;
}

export interface RankState {
  season: string;
  soloRank: number;
  raceRank: number;
  seasonRankId: string;
  claimedSeasonReward: boolean;
}

export interface GameStats {
  startedAt: number;
  leaks: number;
  mvpAwards: number;
  secretTowersBuilt: number;
  oneRoundTowersBuilt: number;
  mazeBlocksPlaced: number;
  shopTowersBought: number;
  towerUpgradesBought: number;
  killedGoldenRoshan: boolean;
  killedZard: boolean;
  completedRequiredWaves: boolean;
}

export interface GameState {
  config: GameConfig;
  status: GameStatus;
  phase: GamePhase;
  time: number;
  rngSeed: number;
  gold: number;
  lives: number;
  score: number;
  waveIndex: number;
  activeWaveId: string | null;
  enemiesToSpawn: number;
  spawnTimer: number;
  bankedMazeBlocks: number;
  buildMode: 'select' | 'mazeBlock' | 'shopTower';
  selectedShopGemId: string | null;
  draft: DraftCandidate[];
  draftQueue: string[];
  draftWaveIndex: number | null;
  pendingGemId: string | null;
  stones: GridPoint[];
  selectedTile: GridPoint | null;
  /** Side panel draft list hover — highlights that candidate on the board. */
  draftRowHover: GridPoint | null;
  hoverTile: GridPoint | null;
  towers: TowerState[];
  enemies: EnemyState[];
  projectiles: ProjectileState[];
  floatingTexts: FloatingText[];
  occupied: Int16Array;
  checkpointPaths: GridPoint[][];
  currentPath: GridPoint[];
  nextTowerId: number;
  nextDraftId: number;
  nextEnemyId: number;
  nextProjectileId: number;
  discoveredRecipes: Set<string>;
  unlockedSecrets: Set<string>;
  skillInventory: Map<SkillId, number>;
  activeSkills: ActiveSkillState;
  quests: Map<string, QuestProgress>;
  rank: RankState;
  stats: GameStats;
}

export interface SaveState {
  version: number;
  bestWave: number;
  wins: number;
  discoveredRecipes: string[];
  unlockedSecrets: string[];
  skillInventory: SkillInventoryEntry[];
  quests: QuestProgress[];
  rank: RankState;
  settings: {
    reducedMotion: boolean;
    muted: boolean;
  };
}

export interface GameSnapshot {
  status: GameStatus;
  phase: GamePhase;
  gold: number;
  lives: number;
  score: number;
  wave: number;
  totalWaves: number;
  activeEnemies: number;
  towers: number;
  stones: number;
  bankedMazeBlocks: number;
  buildMode: GameState['buildMode'];
  selectedShopGemId: string | null;
  towerShop: readonly TowerShopItem[];
  draft: DraftCandidate[];
  draftRemaining: number;
  pendingGemId: string | null;
  selectedTile: GridPoint | null;
  draftRowHover: GridPoint | null;
  selectedTower: TowerState | null;
  selectedTowerTarget: EnemyState | null;
  hoverTile: GridPoint | null;
  currentWave: WaveDefinition | null;
  currentWaveSkills: EnemySkill[];
  nextWave: WaveDefinition | null;
  requiredWavesCleared: boolean;
  discoveredRecipes: string[];
  unlockedSecrets: string[];
  skills: SkillInventoryEntry[];
  quests: QuestProgress[];
  rank: RankState;
  canStartWave: boolean;
  canPlaceMazeBlock: boolean;
  selectedShopItem: TowerShopItem | null;
  canKeepDraft: boolean;
  selectedTowerUpgradeCosts: {
    tier: number | null;
    damage: number | null;
    speed: number | null;
    range: number | null;
  } | null;
  canRemoveStone: boolean;
  message: string;
}

export type GameAction =
  | { type: 'startWave' }
  | { type: 'selectShopTower'; gemId: string }
  | { type: 'clearShopSelection' }
  | { type: 'placeMazeBlock'; x: number; y: number }
  | { type: 'placeShopTower'; x: number; y: number }
  | { type: 'upgradeTowerTier'; x: number; y: number }
  | { type: 'upgradeTowerStat'; x: number; y: number; stat: TowerUpgradeStat }
  | { type: 'selectTile'; x: number; y: number }
  | { type: 'hoverTile'; x: number; y: number }
  | { type: 'clearHover' }
  | { type: 'removeStone'; x: number; y: number }
  | { type: 'toggleTowerStop'; x: number; y: number }
  | { type: 'setTowerTarget'; x: number; y: number; targetId: number | null }
  | { type: 'setTowerTargetMode'; x: number; y: number; targetMode: TargetMode }
  | { type: 'buySkill'; skillId: SkillId }
  | {
      type: 'activateSkill';
      skillId: SkillId;
      x?: number;
      y?: number;
      targetX?: number;
      targetY?: number;
    }
  | { type: 'claimSeasonReward' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'resetRun' };

export interface RenderViewState {
  width: number;
  height: number;
  cellSize: number;
  offsetX: number;
  offsetY: number;
}
