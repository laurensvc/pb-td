import type {
  BaseGemFamilyId,
  DamageType,
  EnemyId,
  GemFamilyId,
  GemLevel,
  MissileStat,
  TierId,
  TowerStat,
  UpgradeBranch,
  Vec2,
} from './primitives';

export interface GemOffer {
  family: BaseGemFamilyId;
  level: GemLevel;
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
