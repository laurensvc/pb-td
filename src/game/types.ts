export type PlacementMode = 'tower' | 'rock';
export type TierId = 'normal' | 'hard';
export type GameStatus = 'idle' | 'running' | 'betweenWaves' | 'lost' | 'cleared';
export type TowerId = 'kinetic' | 'nature' | 'arcane' | 'nova';
export type EnemyId = 'scout' | 'trooper' | 'bulwark' | 'striker' | 'warden' | 'vanguard';
export type UpgradeBranch = 'missile' | 'kinetic' | 'nature' | 'arcane' | 'nova' | 'unlock';
export type TowerStat = 'damage' | 'range' | 'rate';
export type MissileStat = 'damage' | 'radius' | 'cooldown';

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
  shield?: number;
  color: string;
}

export interface TowerDefinition {
  id: TowerId;
  name: string;
  role: string;
  branch: Exclude<UpgradeBranch, 'missile' | 'unlock'>;
  damage: number;
  range: number;
  cooldown: number;
  projectileSpeed: number;
  color: string;
  poisonDps?: number;
  poisonDuration?: number;
  shieldPierce?: number;
  splashRadius?: number;
}

export interface WaveDefinition {
  id: string;
  enemyId: EnemyId;
  count: number;
  spawnInterval: number;
}

export interface AreaTierDefinition {
  waves: WaveDefinition[];
  enemyHpMultiplier: number;
  enemySpeedMultiplier: number;
  starMultiplier: number;
}

export interface PathNavData {
  pathCells: ReadonlySet<string>;
  distanceToGoal: ReadonlyMap<string, number>;
  maxProgress: number;
  goalCell: Vec2;
  spawnCell: Vec2;
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
  towerId?: TowerId;
  towerStat?: TowerStat;
  missileStat?: MissileStat;
  unlockTowerId?: TowerId;
  value: number;
}

export interface SaveState {
  version: number;
  stars: number;
  crowns: number;
  spentStars: number;
  totalStarsEarned: number;
  unlockedTowerIds: TowerId[];
  purchasedUpgradeIds: string[];
  clearedAreaTiers: string[];
  selectedLoadout: TowerId[];
}

export interface EnemyState {
  id: number;
  definitionId: EnemyId;
  name: string;
  x: number;
  y: number;
  pathProgress: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  speed: number;
  rewardStars: number;
  color: string;
  alive: boolean;
  leaked: boolean;
  poisonDps: number;
  poisonUntil: number;
}

export interface TowerState {
  id: number;
  towerId: TowerId;
  x: number;
  y: number;
  cooldownLeft: number;
  kills: number;
  damageDone: number;
}

export interface ProjectileState {
  id: number;
  towerId: number;
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
}

export interface GameState {
  status: GameStatus;
  areaId: string;
  tierId: TierId;
  time: number;
  waveIndex: number;
  enemiesToSpawn: number;
  spawnTimer: number;
  lives: number;
  maxLives: number;
  missileCooldownLeft: number;
  selectedTowerId: TowerId | null;
  placementMode: PlacementMode;
  loadout: TowerId[];
  /** Dynamic maze path from spawn to goal; recomputed when rocks or towers change. */
  pathNav: PathNavData;
  rocks: RockState[];
  enemies: EnemyState[];
  towers: TowerState[];
  projectiles: ProjectileState[];
  missiles: MissileState[];
  rewards: AttemptRewards;
  leakedEnemies: number;
  killedEnemies: number;
  nextEnemyId: number;
  nextTowerId: number;
  nextProjectileId: number;
  nextMissileId: number;
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
  activeEnemies: number;
  stars: number;
  crowns: number;
  attemptStars: number;
  attemptCrowns: number;
  missileCooldownLeft: number;
  missileCooldown: number;
  selectedTowerId: TowerId | null;
  placementMode: PlacementMode;
  rockCount: number;
  loadout: TowerId[];
  unlockedTowerIds: TowerId[];
  canStartWave: boolean;
  canRetry: boolean;
  resultTitle: string | null;
  resultMessage: string | null;
}

export type GameAction =
  | { type: 'startArea'; areaId: string; tierId: TierId }
  | { type: 'startWave' }
  | { type: 'selectTower'; towerId: TowerId | null }
  | { type: 'selectPlacementMode'; mode: PlacementMode }
  | { type: 'selectLoadout'; towerIds: TowerId[] }
  | { type: 'placeTower'; x: number; y: number; towerId?: TowerId }
  | { type: 'placeRock'; x: number; y: number }
  | { type: 'sellRock'; x: number; y: number }
  | { type: 'fireMissile'; x: number; y: number }
  | { type: 'buyUpgrade'; upgradeId: string }
  | { type: 'respecUpgrades' }
  | { type: 'retry' }
  | { type: 'resetSave' };
