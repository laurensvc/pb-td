export type GemFamily = 'ruby' | 'sapphire' | 'topaz' | 'emerald' | 'amethyst' | 'onyx';
export type GemTier = 1 | 2 | 3 | 4;
export type GameStatus = 'ready' | 'running' | 'paused' | 'won' | 'lost';

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
  exit: GridPoint;
  blocked: readonly GridPoint[];
}

export interface GemDefinition {
  id: string;
  name: string;
  family: GemFamily;
  tier: GemTier;
  color: string;
  damage: number;
  range: number;
  cooldown: number;
  projectileSpeed: number;
  splashRadius?: number;
  slow?: number;
}

export interface RecipeIngredient {
  family?: GemFamily;
  tier?: GemTier;
  gemId?: string;
}

export interface RecipeDefinition {
  id: string;
  name: string;
  description: string;
  ingredients: readonly RecipeIngredient[];
  resultGemId: string;
  hidden?: boolean;
}

export interface EnemyDefinition {
  id: string;
  name: string;
  hp: number;
  speed: number;
  reward: number;
  armor: number;
  color: string;
}

export interface WaveDefinition {
  id: string;
  name: string;
  enemyId: string;
  count: number;
  spawnInterval: number;
}

export interface EconomyConfig {
  startingGold: number;
  startingLives: number;
  draftCost: number;
  sellRefundRate: number;
}

export interface GameConfig {
  map: MapDefinition;
  gems: readonly GemDefinition[];
  recipes: readonly RecipeDefinition[];
  enemies: readonly EnemyDefinition[];
  waves: readonly WaveDefinition[];
  economy: EconomyConfig;
}

export interface EnemyState {
  id: number;
  definitionId: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  reward: number;
  armor: number;
  path: GridPoint[];
  pathIndex: number;
  alive: boolean;
  reachedExit: boolean;
  slowUntil: number;
  slowMultiplier: number;
  color: string;
}

export interface TowerState {
  id: number;
  gemId: string;
  name: string;
  family: GemFamily;
  tier: GemTier;
  x: number;
  y: number;
  damage: number;
  range: number;
  cooldown: number;
  cooldownLeft: number;
  projectileSpeed: number;
  color: string;
  splashRadius: number;
  slow: number;
  kills: number;
}

export interface ProjectileState {
  id: number;
  active: boolean;
  x: number;
  y: number;
  targetId: number;
  damage: number;
  speed: number;
  color: string;
  splashRadius: number;
  slow: number;
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
  value: number;
  life: number;
  color: string;
}

export interface GameState {
  config: GameConfig;
  status: GameStatus;
  time: number;
  rngSeed: number;
  gold: number;
  lives: number;
  score: number;
  waveIndex: number;
  activeWaveId: string | null;
  enemiesToSpawn: number;
  spawnTimer: number;
  draft: DraftCandidate[];
  draftQueue: string[];
  draftWaveIndex: number | null;
  pendingGemId: string | null;
  stones: GridPoint[];
  selectedTile: GridPoint | null;
  hoverTile: GridPoint | null;
  towers: TowerState[];
  enemies: EnemyState[];
  projectiles: ProjectileState[];
  floatingTexts: FloatingText[];
  occupied: Int16Array;
  path: GridPoint[];
  nextTowerId: number;
  nextDraftId: number;
  nextEnemyId: number;
  nextProjectileId: number;
  discoveredRecipes: Set<string>;
  unlockedFamilies: Set<GemFamily>;
}

export interface SaveState {
  version: number;
  bestWave: number;
  wins: number;
  discoveredRecipes: string[];
  unlockedFamilies: GemFamily[];
  settings: {
    reducedMotion: boolean;
    muted: boolean;
  };
}

export interface GameSnapshot {
  status: GameStatus;
  gold: number;
  lives: number;
  score: number;
  wave: number;
  totalWaves: number;
  activeEnemies: number;
  towers: number;
  draft: DraftCandidate[];
  draftRemaining: number;
  pendingGemId: string | null;
  selectedTile: GridPoint | null;
  selectedTower: TowerState | null;
  hoverTile: GridPoint | null;
  discoveredRecipes: string[];
  unlockedFamilies: GemFamily[];
  canStartWave: boolean;
  canBuyDraft: boolean;
  canKeepDraft: boolean;
  message: string;
}

export type GameAction =
  | { type: 'startWave' }
  | { type: 'buyDraft' }
  | { type: 'keepDraftCandidate'; x: number; y: number }
  | { type: 'placePendingGem'; x: number; y: number }
  | { type: 'selectTile'; x: number; y: number }
  | { type: 'hoverTile'; x: number; y: number }
  | { type: 'clearHover' }
  | { type: 'combineAt'; x: number; y: number }
  | { type: 'sellTower'; x: number; y: number }
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
