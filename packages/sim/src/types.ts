import type { GemFamily, GemTier } from '@facet/content';

export interface Vec2 {
  x: number;
  y: number;
}

export type MatchPhase = 'build' | 'wave' | 'resolution' | 'ended';
export type BuildStep = 'rocks' | 'prospect' | 'upgrade' | 'ready';

export interface TowerState {
  id: number;
  x: number;
  y: number;
  family: GemFamily;
  tier: GemTier;
  comboId?: string;
}

export interface RockState {
  x: number;
  y: number;
}

export interface EnemyState {
  id: number;
  enemyId: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  leakDamage: number;
  bountyGold: number;
}

export interface ProjectileState {
  id: number;
  towerId: number;
  x: number;
  y: number;
  targetId: number;
  damage: number;
  speed: number;
}

export interface GemOffer {
  family: GemFamily;
  tier: GemTier;
}

export interface FacetState {
  seed: number;
  tick: number;
  phase: MatchPhase;
  buildStep: BuildStep;
  wave: number;
  lives: number;
  gold: number;
  rocksPlacedThisPhase: number;
  rerollsThisPhase: number;
  claimedOffer: GemOffer | null;
  offers: GemOffer[];
  rocks: RockState[];
  towers: TowerState[];
  enemies: EnemyState[];
  projectiles: ProjectileState[];
  mergeSourceId: number | null;
  ready: boolean;
  enemiesKilled: number;
  leaks: number;
  nextEntityId: number;
  pathNav: PathNavData | null;
  spawnQueue: { enemyId: string; ticksUntil: number }[];
  waveSpawnDone: boolean;
}

export interface PathNavData {
  pathCells: Set<string>;
  distanceToGoal: Map<string, number>;
  maxProgress: number;
  spawnCell: Vec2;
  goalCell: Vec2;
}

export interface FacetSnapshot {
  phase: MatchPhase;
  buildStep: BuildStep;
  wave: number;
  lives: number;
  gold: number;
  rocksPlacedThisPhase: number;
  offers: GemOffer[];
  claimedOffer: GemOffer | null;
  rocks: RockState[];
  towers: TowerState[];
  enemies: EnemyState[];
  projectiles: ProjectileState[];
  ready: boolean;
  rerollCost: number;
  rocksRemaining: number;
  canUpgrade: boolean;
  wavePreview: string;
}

export type FacetAction =
  | { type: 'PLACE_ROCK'; x: number; y: number }
  | { type: 'SELL_ROCK'; x: number; y: number }
  | { type: 'CLAIM_OFFER'; index: number }
  | { type: 'REROLL_OFFER' }
  | { type: 'UPGRADE_ROCK'; rockX: number; rockY: number }
  | { type: 'MERGE_TOWERS'; sourceId: number; targetId: number }
  | { type: 'SELL_TOWER'; towerId: number }
  | {
      type: 'CREATE_COMBINATION';
      recipeId: string;
      x: number;
      y: number;
      towerA: number;
      towerB: number;
    }
  | { type: 'READY' }
  | { type: 'START_MATCH'; seed?: number }
  | { type: 'TICK'; dt: number };
