import { gameConfig, gemFamilies, getEnemy, getGem, getSkill } from './config';
import {
  buildOccupancy,
  canPlaceWithoutBlocking,
  findCheckpointPaths,
  findPath,
  flattenCheckpointPaths,
} from './pathfinding';
import type {
  DamageType,
  EnemySkill,
  EnemyState,
  FloatingText,
  GameAction,
  GameConfig,
  GameSnapshot,
  GameState,
  GemDefinition,
  GemFamily,
  GemTier,
  GridPoint,
  ProjectileState,
  QuestProgress,
  RecipeDefinition,
  SaveState,
  SkillId,
  TargetMode,
  TowerUpgradeLevels,
  TowerUpgradeStat,
  TowerEffectDefinition,
  TowerState,
} from './types';

const DRAFT_SIZE = 5; // Legacy recipe helpers only; active gameplay uses shop placement.
const TILE_EPSILON = 0.03;
const MAX_MVP_AWARDS = 10;
const MVP_AURA_RANGE = 2;
const STAT_UPGRADE_MODIFIERS = {
  damage: 0.18,
  speed: 0.08,
  range: 0.35,
} as const;
const REQUIRED_WAVES = 50;
const REPEAT_WAVE_SKILLS: readonly EnemySkill[] = [
  'vitality',
  'rush',
  'evasion',
  'refraction',
  'reactiveArmor',
  'krakenShell',
  'recharge',
  'disarm',
];
const DEFAULT_RANK = {
  season: 'Local Season',
  soloRank: 25,
  raceRank: 25,
  seasonRankId: 'gray-gem',
  claimedSeasonReward: false,
};

export const defaultSaveState: SaveState = {
  version: 2,
  bestWave: 0,
  wins: 0,
  discoveredRecipes: [],
  unlockedSecrets: [],
  skillInventory: [],
  quests: gameConfig.quests.map((quest) => ({ id: quest.id, completed: false, progress: 0 })),
  rank: DEFAULT_RANK,
  settings: {
    reducedMotion: false,
    muted: false,
  },
};

function nextRandom(state: GameState): number {
  state.rngSeed = (state.rngSeed * 1664525 + 1013904223) >>> 0;
  return state.rngSeed / 4294967296;
}

function rollInt(state: GameState, min: number, max: number): number {
  return min + Math.floor(nextRandom(state) * (max - min + 1));
}

function cloneEffects(effects: readonly TowerEffectDefinition[]): TowerEffectDefinition[] {
  const result: TowerEffectDefinition[] = [];
  for (let i = 0; i < effects.length; i++) result.push({ ...effects[i] });
  return result;
}

function emptyUpgradeLevels(): TowerUpgradeLevels {
  return { damage: 0, speed: 0, range: 0 };
}

function applyUpgradeStats(
  gem: GemDefinition,
  upgradeLevels: TowerUpgradeLevels,
): Pick<TowerState, 'damage' | 'range' | 'cooldown'> {
  return {
    damage: Math.round(gem.damage * (1 + upgradeLevels.damage * STAT_UPGRADE_MODIFIERS.damage)),
    range: Number((gem.range + upgradeLevels.range * STAT_UPGRADE_MODIFIERS.range).toFixed(2)),
    cooldown: Number(
      (gem.cooldown * Math.pow(1 - STAT_UPGRADE_MODIFIERS.speed, upgradeLevels.speed)).toFixed(3),
    ),
  };
}

function makeTower(state: GameState, gem: GemDefinition, x: number, y: number): TowerState {
  const upgradeLevels = emptyUpgradeLevels();
  const upgradedStats = applyUpgradeStats(gem, upgradeLevels);
  return {
    id: state.nextTowerId++,
    gemId: gem.id,
    name: gem.name,
    family: gem.family,
    tier: gem.tier,
    classification: gem.classification,
    x,
    y,
    damage: upgradedStats.damage,
    range: upgradedStats.range,
    cooldown: upgradedStats.cooldown,
    cooldownLeft: 0,
    projectileSpeed: gem.projectileSpeed,
    color: gem.color,
    damageType: gem.damageType,
    effects: cloneEffects(gem.effects),
    kills: 0,
    roundDamage: 0,
    totalDamage: 0,
    mvpAwards: 0,
    stopped: false,
    targetId: null,
    targetMode: 'first',
    buffUntil: 0,
    attackSpeedBuff: 0,
    rangeBuff: 0,
    critBuff: 0,
    critMultiplier: 1,
    upgradeLevels,
  };
}

export function createGame(
  config: GameConfig = gameConfig,
  save: SaveState = defaultSaveState,
): GameState {
  const saveQuests = save.quests ?? defaultSaveState.quests;
  const saveSkills = save.skillInventory ?? defaultSaveState.skillInventory;
  const saveDiscovered = save.discoveredRecipes ?? defaultSaveState.discoveredRecipes;
  const saveUnlocked = save.unlockedSecrets ?? defaultSaveState.unlockedSecrets;

  const quests = new Map<string, QuestProgress>();
  const questDefinitions = config.quests ?? [];
  for (let i = 0; i < questDefinitions.length; i++) {
    const definition = questDefinitions[i];
    let saved: QuestProgress | undefined;
    for (let q = 0; q < saveQuests.length; q++) {
      if (saveQuests[q].id === definition.id) saved = saveQuests[q];
    }
    quests.set(definition.id, saved ?? { id: definition.id, completed: false, progress: 0 });
  }

  const skillInventory = new Map<SkillId, number>();
  for (let i = 0; i < saveSkills.length; i++) {
    skillInventory.set(saveSkills[i].id, saveSkills[i].level);
  }

  const state: GameState = {
    config,
    status: 'ready',
    phase: 'build',
    time: 0,
    rngSeed: (Date.now() ^ Math.floor(Math.random() * 1000000)) >>> 0,
    gold: config.economy.startingGold,
    lives: config.economy.startingLives,
    score: 0,
    waveIndex: 0,
    activeWaveId: null,
    enemiesToSpawn: 0,
    spawnTimer: 0,
    bankedMazeBlocks: config.freeBlocksPerWave,
    buildMode: 'select',
    selectedShopGemId: null,
    draft: [],
    draftQueue: [],
    draftWaveIndex: null,
    pendingGemId: null,
    stones: [],
    selectedTile: null,
    draftRowHover: null,
    hoverTile: null,
    towers: [],
    enemies: [],
    projectiles: [],
    floatingTexts: [],
    occupied: new Int16Array(config.map.width * config.map.height),
    checkpointPaths: [],
    currentPath: [],
    nextTowerId: 1,
    nextDraftId: 1,
    nextEnemyId: 1,
    nextProjectileId: 1,
    discoveredRecipes: new Set(saveDiscovered),
    unlockedSecrets: new Set(saveUnlocked),
    skillInventory,
    activeSkills: {
      guardUntil: 0,
      evadeUntil: 0,
      fatalBondsUntil: 0,
      candyAvailable: true,
    },
    quests,
    rank: save.rank ?? DEFAULT_RANK,
    stats: {
      startedAt: 0,
      leaks: 0,
      mvpAwards: 0,
      secretTowersBuilt: 0,
      oneRoundTowersBuilt: 0,
      mazeBlocksPlaced: 0,
      shopTowersBought: 0,
      towerUpgradesBought: 0,
      killedGoldenRoshan: false,
      killedZard: false,
      completedRequiredWaves: false,
    },
  };
  rebuildPaths(state);
  return state;
}

function getActiveEnemyCells(state: GameState): GridPoint[] {
  const cells: GridPoint[] = [];
  for (let i = 0; i < state.enemies.length; i++) {
    const enemy = state.enemies[i];
    if (!enemy.alive) continue;
    cells.push({
      x: clamp(Math.round(enemy.x), 0, state.config.map.width - 1),
      y: clamp(Math.round(enemy.y), 0, state.config.map.height - 1),
    });
  }
  return cells;
}

function rebuildPaths(state: GameState): void {
  state.occupied = buildOccupancy(state.config.map, state.towers, state.stones, state.draft);
  state.checkpointPaths = findCheckpointPaths(state.config.map, state.occupied);
  state.currentPath = flattenCheckpointPaths(state.checkpointPaths);
  const flyingPath = getFlyingPath(state);
  for (let i = 0; i < state.enemies.length; i++) {
    const enemy = state.enemies[i];
    if (!enemy.alive) continue;
    if (enemy.flying) {
      enemy.path = flyingPath;
      enemy.pathIndex = getNearestPathIndex(enemy, flyingPath);
      continue;
    }
    const start = {
      x: clamp(Math.round(enemy.x), 0, state.config.map.width - 1),
      y: clamp(Math.round(enemy.y), 0, state.config.map.height - 1),
    };
    const target = getEnemyTarget(state, enemy);
    const path = findPath(state.config.map, state.occupied, start, target);
    if (path.length > 0) {
      enemy.path = path;
      enemy.pathIndex = 0;
    }
  }
}

function getFlyingPath(state: GameState): GridPoint[] {
  return [state.config.map.entrance, state.config.map.exit];
}

function getNearestPathIndex(enemy: EnemyState, path: readonly GridPoint[]): number {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < path.length; i++) {
    const dx = path[i].x - enemy.x;
    const dy = path[i].y - enemy.y;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq >= bestDistance) continue;
    bestDistance = distanceSq;
    bestIndex = i;
  }
  return bestIndex;
}

function getEnemyTarget(state: GameState, enemy: EnemyState): GridPoint {
  if (enemy.flying) return state.config.map.exit;
  if (enemy.checkpointIndex < state.config.map.checkpoints.length) {
    return state.config.map.checkpoints[enemy.checkpointIndex];
  }
  return state.config.map.exit;
}

function getSkillLevel(state: GameState, skillId: SkillId): number {
  return state.skillInventory.get(skillId) ?? 0;
}

function getRequiredWaveCount(state: GameState): number {
  return Math.max(1, Math.min(REQUIRED_WAVES, state.config.waves.length));
}

function getWaveAtIndex(state: GameState, index: number): GameConfig['waves'][number] | null {
  if (state.config.waves.length === 0 || index < 0) return null;
  return state.config.waves[index % state.config.waves.length];
}

function getCurrentWave(state: GameState): GameConfig['waves'][number] | null {
  return getWaveAtIndex(state, state.waveIndex);
}

function getWaveSkills(state: GameState, wave: GameConfig['waves'][number]): EnemySkill[] {
  if (state.waveIndex < state.config.waves.length) return mergeSkills(wave.skills, []);
  const repeatIndex = state.waveIndex - state.config.waves.length;
  const repeatSkill = REPEAT_WAVE_SKILLS[(repeatIndex + wave.wave) % REPEAT_WAVE_SKILLS.length];
  return mergeSkills(wave.skills, [repeatSkill]);
}

function chooseGemId(state: GameState): string {
  const qualityBonus =
    getSkillLevel(state, 'gemQualityPray') * 0.08 +
    getSkillLevel(state, 'flawlessPray') * 0.05 +
    getSkillLevel(state, 'perfectPray') * 0.04;
  const waveBoost = Math.min(0.36, state.waveIndex * 0.008);
  const roll = nextRandom(state);
  let tier: GemTier = 1;
  if (roll > 0.985 - waveBoost - qualityBonus * 0.4) tier = 6;
  else if (roll > 0.92 - waveBoost - qualityBonus * 0.55) tier = 5;
  else if (roll > 0.76 - waveBoost - qualityBonus * 0.7) tier = 4;
  else if (roll > 0.52 - waveBoost - qualityBonus * 0.8) tier = 3;
  else if (roll > 0.26 - waveBoost - qualityBonus) tier = 2;

  let family = gemFamilies[Math.floor(nextRandom(state) * gemFamilies.length)];
  if (
    getSkillLevel(state, 'gemPray') > 0 &&
    nextRandom(state) < 0.28 + getSkillLevel(state, 'gemPray') * 0.1
  ) {
    family = gemFamilies[(state.waveIndex + getSkillLevel(state, 'gemPray')) % gemFamilies.length];
  }
  return `${family}-${tier}`;
}

function canBuildBetweenWaves(state: GameState): boolean {
  return (
    state.phase === 'build' &&
    !state.activeWaveId &&
    state.status !== 'running' &&
    state.status !== 'paused' &&
    state.status !== 'lost'
  );
}

function grantBuildPhaseBlocks(state: GameState): void {
  state.bankedMazeBlocks = Math.min(
    state.config.maxBankedFreeBlocks,
    state.bankedMazeBlocks + state.config.freeBlocksPerWave,
  );
  state.activeSkills.candyAvailable = true;
  state.buildMode = 'select';
  state.selectedShopGemId = null;
}

function placeMazeBlock(state: GameState, x: number, y: number): void {
  if (!canBuildBetweenWaves(state) || state.bankedMazeBlocks <= 0) return;
  if (!canPlaceWithoutBlocking(state.config.map, state.occupied, x, y, getActiveEnemyCells(state)))
    return;
  state.stones.push({ x, y });
  state.bankedMazeBlocks -= 1;
  state.selectedTile = { x, y };
  state.stats.mazeBlocksPlaced += 1;
  maybeCompleteQuestProgress(state, 'build-25-blocks', state.stats.mazeBlocksPlaced / 25);
  rebuildPaths(state);
}

function getShopItem(state: GameState, gemId: string | null) {
  if (!gemId) return null;
  for (let i = 0; i < state.config.towerShop.length; i++) {
    if (state.config.towerShop[i].gemId === gemId) return state.config.towerShop[i];
  }
  return null;
}

function placeShopTower(state: GameState, x: number, y: number): void {
  if (!canBuildBetweenWaves(state)) return;
  const item = getShopItem(state, state.selectedShopGemId);
  if (!item || state.gold < item.cost || getTowerAt(state, x, y)) return;
  const stoneIndex = getStoneAt(state, x, y);
  if (
    stoneIndex < 0 &&
    !canPlaceWithoutBlocking(state.config.map, state.occupied, x, y, getActiveEnemyCells(state))
  )
    return;

  if (stoneIndex >= 0) {
    state.stones[stoneIndex] = state.stones[state.stones.length - 1];
    state.stones.length -= 1;
  }
  state.gold -= item.cost;
  state.towers.push(makeTower(state, getGem(state.config, item.gemId), x, y));
  state.selectedTile = { x, y };
  state.stats.shopTowersBought += 1;
  maybeCompleteQuestProgress(state, 'buy-20-towers', state.stats.shopTowersBought / 20);
  rebuildPaths(state);
}

function getTowerAt(state: GameState, x: number, y: number): TowerState | null {
  for (let i = 0; i < state.towers.length; i++) {
    const tower = state.towers[i];
    if (tower.x === x && tower.y === y) return tower;
  }
  return null;
}

function getStoneAt(state: GameState, x: number, y: number): number {
  for (let i = 0; i < state.stones.length; i++) {
    if (state.stones[i].x === x && state.stones[i].y === y) return i;
  }
  return -1;
}

interface MatchPiece {
  source: 'tower' | 'draft';
  index: number;
  gemId: string;
  family: GemFamily;
  tier: GemTier;
  x: number;
  y: number;
}

const recipePiecesScratch: MatchPiece[] = [];

function pushRecipePiece(piece: MatchPiece, selected: boolean): void {
  if (selected) recipePiecesScratch.unshift(piece);
  else recipePiecesScratch.push(piece);
}

function collectRecipePieces(state: GameState, x: number, y: number): MatchPiece[] {
  recipePiecesScratch.length = 0;
  for (let i = 0; i < state.towers.length; i++) {
    const tower = state.towers[i];
    pushRecipePiece(
      {
        source: 'tower',
        index: i,
        gemId: tower.gemId,
        family: tower.family,
        tier: tower.tier,
        x: tower.x,
        y: tower.y,
      },
      tower.x === x && tower.y === y,
    );
  }
  for (let i = 0; i < state.draft.length; i++) {
    const candidate = state.draft[i];
    const gem = getGem(state.config, candidate.gemId);
    pushRecipePiece(
      {
        source: 'draft',
        index: i,
        gemId: candidate.gemId,
        family: gem.family,
        tier: gem.tier,
        x: candidate.x,
        y: candidate.y,
      },
      candidate.x === x && candidate.y === y,
    );
  }
  return recipePiecesScratch;
}

function ingredientMatches(
  piece: MatchPiece,
  ingredient: RecipeDefinition['ingredients'][number],
): boolean {
  if (ingredient.gemId && piece.gemId !== ingredient.gemId) return false;
  if (ingredient.towerId && piece.gemId !== ingredient.towerId) return false;
  if (ingredient.family && piece.family !== ingredient.family) return false;
  if (ingredient.tier && piece.tier < ingredient.tier) return false;
  return true;
}

function recipeMatches(
  recipe: RecipeDefinition,
  pieces: readonly MatchPiece[],
  used: Uint8Array,
): boolean {
  used.fill(0);
  let matched = 0;
  for (let i = 0; i < recipe.ingredients.length; i++) {
    for (let p = 0; p < pieces.length; p++) {
      if (used[p] === 1) continue;
      if (!ingredientMatches(pieces[p], recipe.ingredients[i])) continue;
      used[p] = 1;
      matched++;
      break;
    }
  }
  return matched === recipe.ingredients.length;
}

function matchedPiecesAreLegalForTile(
  state: GameState,
  x: number,
  y: number,
  recipe: RecipeDefinition,
  pieces: readonly MatchPiece[],
  used: Uint8Array,
): boolean {
  let draftCount = 0;
  let towerCount = 0;
  let selectedDraftConsumed = false;
  let selectedTowerConsumed = false;
  for (let i = 0; i < used.length; i++) {
    if (used[i] !== 1) continue;
    const piece = pieces[i];
    if (piece.source === 'draft') {
      draftCount++;
      if (piece.x === x && piece.y === y) selectedDraftConsumed = true;
    } else {
      towerCount++;
      if (piece.x === x && piece.y === y) selectedTowerConsumed = true;
    }
  }
  if (draftCount === 0) return selectedTowerConsumed;
  return (
    towerCount === 0 &&
    draftCount === recipe.ingredients.length &&
    selectedDraftConsumed &&
    state.phase === 'build' &&
    !state.pendingGemId &&
    state.draft.length === DRAFT_SIZE
  );
}

export function findRecipeAt(state: GameState, x: number, y: number): RecipeDefinition | null {
  const base = getTowerAt(state, x, y);
  if (base && base.classification === 'gem' && base.tier < 6) {
    let count = 0;
    for (let i = 0; i < state.towers.length; i++) {
      const tower = state.towers[i];
      if (Math.abs(tower.x - x) > 1 || Math.abs(tower.y - y) > 1) continue;
      if (
        tower.family === base.family &&
        tower.tier === base.tier &&
        tower.classification === 'gem'
      )
        count++;
    }
    if (count >= 3) {
      return {
        id: `upgrade-${base.family}-${base.tier}`,
        name: `${base.name} merge`,
        classification: 'basic',
        description: `Merge three adjacent ${base.name}s into level ${base.tier + 1}.`,
        ingredients: [
          { family: base.family, tier: base.tier },
          { family: base.family, tier: base.tier },
          { family: base.family, tier: base.tier },
        ],
        resultGemId: `${base.family}-${base.tier + 1}`,
      };
    }
  }

  const pieces = collectRecipePieces(state, x, y);
  const used = new Uint8Array(pieces.length);
  for (let r = 0; r < state.config.recipes.length; r++) {
    const recipe = state.config.recipes[r];
    if (
      recipeMatches(recipe, pieces, used) &&
      matchedPiecesAreLegalForTile(state, x, y, recipe, pieces, used)
    ) {
      return recipe;
    }
  }
  return null;
}

function removeStone(state: GameState, x: number, y: number): void {
  const index = getStoneAt(state, x, y);
  if (index < 0) return;
  state.stones[index] = state.stones[state.stones.length - 1];
  state.stones.length -= 1;
  rebuildPaths(state);
}

function getTierUpgradeCost(state: GameState, tower: TowerState): number | null {
  if (tower.classification !== 'gem' || tower.tier >= 6) return null;
  return Math.round(
    state.config.towerUpgradeCosts.tierBase *
      Math.pow(state.config.towerUpgradeCosts.tierGrowth, tower.tier - 1),
  );
}

function getStatUpgradeCost(
  state: GameState,
  tower: TowerState,
  stat: TowerUpgradeStat,
): number | null {
  const level = tower.upgradeLevels[stat];
  if (level >= state.config.towerUpgradeCosts.maxStatLevel) return null;
  const base =
    stat === 'damage'
      ? state.config.towerUpgradeCosts.damageBase
      : stat === 'speed'
        ? state.config.towerUpgradeCosts.speedBase
        : state.config.towerUpgradeCosts.rangeBase;
  return Math.round(base * Math.pow(state.config.towerUpgradeCosts.statGrowth, level));
}

function upgradeTowerTier(state: GameState, x: number, y: number): void {
  if (!canBuildBetweenWaves(state)) return;
  const tower = getTowerAt(state, x, y);
  if (!tower || tower.classification !== 'gem') return;
  const nextTier = Math.min(6, tower.tier + 1) as GemTier;
  if (nextTier === tower.tier) return;
  const cost = getTierUpgradeCost(state, tower);
  if (cost === null) return;
  if (state.gold < cost) return;
  state.gold -= cost;
  const gem = getGem(state.config, `${tower.family}-${nextTier}`);
  Object.assign(tower, makeTowerFromExisting(state, tower, gem));
  state.stats.towerUpgradesBought += 1;
  maybeCompleteQuestProgress(state, 'upgrade-30-times', state.stats.towerUpgradesBought / 30);
}

function makeTowerFromExisting(
  state: GameState,
  tower: TowerState,
  gem: GemDefinition,
): Partial<TowerState> {
  const upgradeLevels = { ...tower.upgradeLevels };
  const upgradedStats = applyUpgradeStats(gem, upgradeLevels);
  return {
    gemId: gem.id,
    name: gem.name,
    family: gem.family,
    tier: gem.tier,
    classification: gem.classification,
    damage: upgradedStats.damage,
    range: upgradedStats.range,
    cooldown: upgradedStats.cooldown,
    projectileSpeed: gem.projectileSpeed,
    color: gem.color,
    damageType: gem.damageType,
    effects: cloneEffects(gem.effects),
    cooldownLeft: Math.min(tower.cooldownLeft, gem.cooldown),
    buffUntil: state.time > tower.buffUntil ? 0 : tower.buffUntil,
    upgradeLevels,
  };
}

function upgradeTowerStat(state: GameState, x: number, y: number, stat: TowerUpgradeStat): void {
  if (!canBuildBetweenWaves(state)) return;
  const tower = getTowerAt(state, x, y);
  if (!tower) return;
  const cost = getStatUpgradeCost(state, tower, stat);
  if (cost === null || state.gold < cost) return;
  state.gold -= cost;
  tower.upgradeLevels[stat] += 1;
  const gem = getGem(state.config, tower.gemId);
  Object.assign(tower, makeTowerFromExisting(state, tower, gem));
  state.stats.towerUpgradesBought += 1;
  maybeCompleteQuestProgress(state, 'upgrade-30-times', state.stats.towerUpgradesBought / 30);
}

function startWave(state: GameState): void {
  if (
    state.activeWaveId ||
    state.status === 'lost' ||
    (state.status === 'won' && !state.stats.completedRequiredWaves)
  )
    return;
  const wave = getCurrentWave(state);
  if (!wave) return;
  state.status = 'running';
  state.phase = 'attack';
  state.activeWaveId =
    state.waveIndex >= state.config.waves.length
      ? `${wave.id}-repeat-${state.waveIndex + 1}`
      : wave.id;
  state.enemiesToSpawn = wave.count;
  state.spawnTimer = 0;
  for (let i = 0; i < state.towers.length; i++) state.towers[i].roundDamage = 0;
}

function chooseWaveEnemy(state: GameState): string {
  const wave = getCurrentWave(state);
  if (!wave) return state.config.enemies[0]?.id ?? '';
  if (!wave.alternativeEnemyIds || wave.alternativeEnemyIds.length === 0) return wave.enemyId;
  if (nextRandom(state) < (wave.boss ? 0.18 : 0.35)) {
    return wave.alternativeEnemyIds[
      Math.floor(nextRandom(state) * wave.alternativeEnemyIds.length)
    ];
  }
  return wave.enemyId;
}

function spawnEnemy(state: GameState): void {
  if (!state.activeWaveId || state.checkpointPaths.length === 0) return;
  const wave = getCurrentWave(state);
  if (!wave) return;
  const definition = getEnemy(state.config, chooseWaveEnemy(state));
  const waveScale = 1 + state.waveIndex * 0.14;
  const skills = mergeSkills(definition.skills, getWaveSkills(state, wave));
  const vitality = skills.includes('vitality') ? 1.28 : 1;
  const flying = definition.flying || skills.includes('flying');
  const enemy: EnemyState = {
    id: state.nextEnemyId++,
    definitionId: definition.id,
    name: definition.name,
    x: state.config.map.entrance.x,
    y: state.config.map.entrance.y,
    hp: Math.round(definition.hp * waveScale * vitality),
    maxHp: Math.round(definition.hp * waveScale * vitality),
    speed: definition.speed * (skills.includes('rush') ? 1.28 : 1),
    reward: definition.reward + Math.floor(state.waveIndex * 1.2),
    armor: definition.armor + (skills.includes('highArmor') ? 10 : 0),
    checkpointIndex: 0,
    path: flying ? getFlyingPath(state) : state.checkpointPaths[0],
    pathIndex: 0,
    alive: true,
    reachedExit: false,
    slowUntil: 0,
    slowMultiplier: 1,
    sapphireSlowUntil: [0, 0, 0, 0, 0, 0],
    sapphireSlowMultiplier: [1, 1, 1, 1, 1, 1],
    poisonDps: 0,
    poisonUntil: 0,
    burnDps: 0,
    burnUntil: 0,
    stunUntil: 0,
    refraction: skills.includes('refraction') ? 3 : 0,
    blinkCooldown: skills.includes('blink') ? 4 : 0,
    rechargeTimer: 0,
    revealedUntil: 0,
    color: definition.color,
    skills,
    invisible: skills.includes('permanentInvisibility') || skills.includes('cloakAndDagger'),
    flying,
    boss: Boolean(definition.boss || wave.boss),
  };
  state.enemies.push(enemy);
}

function mergeSkills(a: readonly EnemySkill[], b: readonly EnemySkill[]): EnemySkill[] {
  const result: EnemySkill[] = [];
  for (let i = 0; i < a.length; i++) result.push(a[i]);
  for (let i = 0; i < b.length; i++) {
    if (!result.includes(b[i])) result.push(b[i]);
  }
  return result;
}

function findEnemyById(state: GameState, id: number): EnemyState | null {
  for (let i = 0; i < state.enemies.length; i++) {
    if (state.enemies[i].id === id && state.enemies[i].alive) return state.enemies[i];
  }
  return null;
}

function findTowerById(state: GameState, id: number): TowerState | null {
  for (let i = 0; i < state.towers.length; i++) {
    if (state.towers[i].id === id) return state.towers[i];
  }
  return null;
}

function acquireProjectile(state: GameState): ProjectileState {
  for (let i = 0; i < state.projectiles.length; i++) {
    if (!state.projectiles[i].active) return state.projectiles[i];
  }
  const projectile: ProjectileState = {
    id: state.nextProjectileId++,
    active: false,
    x: 0,
    y: 0,
    targetId: 0,
    towerId: 0,
    damage: 0,
    speed: 0,
    color: '#ffffff',
    damageType: 'physical',
    effects: [],
  };
  state.projectiles.push(projectile);
  return projectile;
}

function acquireFloatingText(state: GameState): FloatingText {
  for (let i = 0; i < state.floatingTexts.length; i++) {
    if (!state.floatingTexts[i].active) return state.floatingTexts[i];
  }
  const text: FloatingText = { active: false, x: 0, y: 0, value: '', life: 0, color: '#fff0a8' };
  state.floatingTexts.push(text);
  return text;
}

function addText(state: GameState, x: number, y: number, value: string, color: string): void {
  const text = acquireFloatingText(state);
  text.active = true;
  text.x = x;
  text.y = y - 0.25;
  text.value = value;
  text.life = 0.6;
  text.color = color;
}

function effectiveTowerDamage(state: GameState, tower: TowerState): number {
  let damage = tower.damage * (1 + Math.min(MAX_MVP_AWARDS, tower.mvpAwards) * 0.1);
  if (state.lives <= state.config.economy.startingLives * 0.6) {
    damage *= 1 + getSkillLevel(state, 'revenge') * 0.01 + 0.02;
  }
  for (let i = 0; i < state.towers.length; i++) {
    const aura = state.towers[i];
    if (aura.id === tower.id) continue;
    const dx = aura.x - tower.x;
    const dy = aura.y - tower.y;
    const distanceSq = dx * dx + dy * dy;
    for (let e = 0; e < aura.effects.length; e++) {
      const effect = aura.effects[e];
      if (effect.type !== 'damageAura' && effect.type !== 'inspire' && effect.type !== 'mvpAura')
        continue;
      const radius = effect.radius ?? MVP_AURA_RANGE;
      if (distanceSq <= radius * radius) damage *= 1 + Math.min(0.75, effect.value);
    }
    if (aura.mvpAwards > 0 && distanceSq <= MVP_AURA_RANGE * MVP_AURA_RANGE) {
      damage *= 1 + Math.min(0.75, aura.mvpAwards * 0.075);
    }
  }
  return damage;
}

function effectiveCooldown(state: GameState, tower: TowerState): number {
  let multiplier = 1;
  let opalGemAuraMask = 0;
  for (let i = 0; i < state.towers.length; i++) {
    const aura = state.towers[i];
    const dx = aura.x - tower.x;
    const dy = aura.y - tower.y;
    for (let e = 0; e < aura.effects.length; e++) {
      const effect = aura.effects[e];
      if (effect.type !== 'speedAura') continue;
      const radius = effect.radius ?? 5;
      if (dx * dx + dy * dy > radius * radius) continue;
      if (aura.family === 'opal' && aura.classification === 'gem') {
        const mask = 1 << (aura.tier - 1);
        if ((opalGemAuraMask & mask) !== 0) continue;
        opalGemAuraMask |= mask;
      }
      multiplier += Math.min(1.2, effect.value);
    }
  }
  if (tower.buffUntil > state.time) multiplier += tower.attackSpeedBuff;
  return Math.max(0.08, tower.cooldown / multiplier);
}

function effectiveRange(state: GameState, tower: TowerState): number {
  return tower.range + (tower.buffUntil > state.time ? tower.rangeBuff : 0);
}

function canTargetEnemy(state: GameState, tower: TowerState, enemy: EnemyState): boolean {
  if (enemy.invisible && enemy.revealedUntil <= state.time && !hasEffect(tower, 'overlook'))
    return false;
  if (enemy.flying && !hasEffect(tower, 'antiFly') && tower.family !== 'topaz') return false;
  return true;
}

function hasEffect(tower: TowerState, type: TowerEffectDefinition['type']): boolean {
  for (let i = 0; i < tower.effects.length; i++) {
    if (tower.effects[i].type === type) return true;
  }
  return false;
}

function enemyProgress(enemy: EnemyState): number {
  return enemy.checkpointIndex * 10000 + enemy.pathIndex + enemyPathSegmentProgress(enemy);
}

function enemyPathSegmentProgress(enemy: EnemyState): number {
  const current = enemy.path[enemy.pathIndex];
  const next = enemy.path[enemy.pathIndex + 1];
  if (!current || !next) return 0;
  const full = Math.hypot(next.x - current.x, next.y - current.y);
  if (full <= 0) return 0;
  const traveled = Math.hypot(enemy.x - current.x, enemy.y - current.y);
  return clamp(traveled / full, 0, 1);
}

function targetModeAllows(enemy: EnemyState, mode: TargetMode, strict: boolean): boolean {
  if (!strict) return true;
  if (mode === 'flyingOnly') return enemy.flying;
  if (mode === 'bossOnly') return enemy.boss;
  return true;
}

function isPreferredTarget(
  mode: TargetMode,
  enemy: EnemyState,
  current: EnemyState | null,
  enemyDistanceSq: number,
  currentDistanceSq: number,
): boolean {
  if (!current) return true;
  if (mode === 'last') return enemyProgress(enemy) < enemyProgress(current);
  if (mode === 'strongest') return enemy.hp > current.hp;
  if (mode === 'weakest') return enemy.hp < current.hp;
  if (mode === 'closest') return enemyDistanceSq < currentDistanceSq;
  return enemyProgress(enemy) > enemyProgress(current);
}

function findAutomaticTarget(
  state: GameState,
  tower: TowerState,
  tx: number,
  ty: number,
  range: number,
  strictSpecialMode: boolean,
): EnemyState | null {
  let best: EnemyState | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < state.enemies.length; i++) {
    const enemy = state.enemies[i];
    if (!enemy.alive || !canTargetEnemy(state, tower, enemy)) continue;
    if (!targetModeAllows(enemy, tower.targetMode, strictSpecialMode)) continue;
    const dx = enemy.x + 0.5 - tx;
    const dy = enemy.y + 0.5 - ty;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq > range * range) continue;
    if (!isPreferredTarget(tower.targetMode, enemy, best, distanceSq, bestDistance)) continue;
    best = enemy;
    bestDistance = distanceSq;
  }
  return best;
}

function fireTower(state: GameState, tower: TowerState): void {
  if (tower.stopped) return;
  let best: EnemyState | null = tower.targetId ? findEnemyById(state, tower.targetId) : null;
  const tx = tower.x + 0.5;
  const ty = tower.y + 0.5;
  const range = effectiveRange(state, tower);
  if (best && canTargetEnemy(state, tower, best)) {
    const dx = best.x + 0.5 - tx;
    const dy = best.y + 0.5 - ty;
    if (dx * dx + dy * dy > range * range) best = null;
  } else {
    best = null;
  }
  if (!best) {
    const strictSpecialMode = tower.targetMode === 'flyingOnly' || tower.targetMode === 'bossOnly';
    best = findAutomaticTarget(state, tower, tx, ty, range, strictSpecialMode);
    if (!best && strictSpecialMode) {
      best = findAutomaticTarget(state, tower, tx, ty, range, false);
    }
  }
  if (!best) return;
  const projectile = acquireProjectile(state);
  projectile.active = true;
  projectile.x = tx;
  projectile.y = ty;
  projectile.targetId = best.id;
  projectile.towerId = tower.id;
  projectile.damage = effectiveTowerDamage(state, tower);
  projectile.speed = tower.projectileSpeed;
  projectile.color = tower.color;
  projectile.damageType = tower.damageType;
  projectile.effects = cloneEffects(tower.effects);
  tower.cooldownLeft = effectiveCooldown(state, tower);
}

function tickTowers(state: GameState, dt: number): void {
  for (let i = 0; i < state.towers.length; i++) {
    const tower = state.towers[i];
    tower.cooldownLeft -= dt;
    if (tower.cooldownLeft <= 0) fireTower(state, tower);
  }
}

function tickEnemies(state: GameState, dt: number): void {
  for (let i = 0; i < state.enemies.length; i++) {
    const enemy = state.enemies[i];
    if (!enemy.alive) continue;
    tickEnemyDots(state, enemy, dt);
    if (!enemy.alive) continue;
    if (enemy.stunUntil > state.time) continue;
    if (enemy.skills.includes('blink')) {
      enemy.blinkCooldown -= dt;
      if (enemy.blinkCooldown <= 0 && enemy.pathIndex < enemy.path.length - 2) {
        enemy.pathIndex = Math.min(enemy.path.length - 1, enemy.pathIndex + 2);
        enemy.x = enemy.path[enemy.pathIndex].x;
        enemy.y = enemy.path[enemy.pathIndex].y;
        enemy.blinkCooldown = 4.5;
      }
    }
    const path = enemy.path;
    if (path.length <= 1 || enemy.pathIndex >= path.length - 1) {
      if (enemy.flying) leakEnemy(state, enemy);
      else advanceEnemyCheckpoint(state, enemy);
      continue;
    }
    const next = path[enemy.pathIndex + 1];
    const dx = next.x - enemy.x;
    const dy = next.y - enemy.y;
    const distance = Math.hypot(dx, dy);
    const multiplier = effectiveEnemySlowMultiplier(enemy, state.time);
    const travel = enemy.speed * multiplier * dt;
    if (distance <= travel + TILE_EPSILON) {
      enemy.x = next.x;
      enemy.y = next.y;
      enemy.pathIndex += 1;
    } else {
      enemy.x += (dx / distance) * travel;
      enemy.y += (dy / distance) * travel;
    }
  }
}

function effectiveEnemySlowMultiplier(enemy: EnemyState, time: number): number {
  let multiplier = enemy.slowUntil > time ? enemy.slowMultiplier : 1;
  for (let i = 0; i < enemy.sapphireSlowUntil.length; i++) {
    if (enemy.sapphireSlowUntil[i] > time) multiplier *= enemy.sapphireSlowMultiplier[i];
  }
  return Math.max(0.25, multiplier);
}

function tickEnemyDots(state: GameState, enemy: EnemyState, dt: number): void {
  let amount = 0;
  if (enemy.poisonUntil > state.time) amount += enemy.poisonDps * dt;
  if (enemy.burnUntil > state.time) amount += enemy.burnDps * dt;
  if (enemy.skills.includes('recharge')) {
    enemy.rechargeTimer += dt;
    if (enemy.rechargeTimer > 1.4) {
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + Math.max(5, enemy.maxHp * 0.015));
      enemy.rechargeTimer = 0;
    }
  }
  if (amount > 0) applyRawDamage(state, enemy, amount, null, 'pure');
}

function advanceEnemyCheckpoint(state: GameState, enemy: EnemyState): void {
  enemy.checkpointIndex += 1;
  if (enemy.checkpointIndex < state.checkpointPaths.length) {
    enemy.path = state.checkpointPaths[enemy.checkpointIndex];
    enemy.pathIndex = 0;
    if (enemy.path.length > 0) {
      enemy.x = enemy.path[0].x;
      enemy.y = enemy.path[0].y;
    }
    return;
  }
  leakEnemy(state, enemy);
}

function leakEnemy(state: GameState, enemy: EnemyState): void {
  enemy.alive = false;
  enemy.reachedExit = true;
  state.stats.leaks += 1;
  const guard = state.activeSkills.guardUntil > state.time ? getSkillLevel(state, 'guard') : 0;
  const evadeChance =
    state.activeSkills.evadeUntil > state.time
      ? [0, 0.1, 0.15, 0.2, 0.25][getSkillLevel(state, 'evade')]
      : 0;
  if (evadeChance > 0 && nextRandom(state) < evadeChance) {
    addText(state, enemy.x, enemy.y, 'Evade', '#7dd3fc');
    return;
  }
  const damage = Math.max(0, (enemy.boss ? 5 : 1) - guard);
  state.lives -= damage;
}

function applyRawDamage(
  state: GameState,
  enemy: EnemyState,
  damage: number,
  tower: TowerState | null,
  damageType: DamageType,
): number {
  if (!enemy.alive) return 0;
  let amount = damage;
  if (damageType === 'magic' && enemy.skills.includes('magicImmune')) amount = 0;
  else if (damageType === 'magic') amount *= getMvpMagicVulnerability(state, enemy);
  if (damageType === 'physical' && enemy.skills.includes('physicalImmune')) amount = 0;
  if (enemy.skills.includes('evasion') && damageType === 'physical' && nextRandom(state) < 0.28)
    amount = 0;
  if (enemy.skills.includes('untouchable')) amount *= 0.75;
  if (enemy.skills.includes('krakenShell')) amount = Math.max(0, amount - enemy.maxHp * 0.006);
  if (enemy.refraction > 0 && amount > 0) {
    enemy.refraction -= 1;
    amount *= 0.35;
  }
  if (damageType === 'physical') amount = Math.max(1, amount - enemy.armor);
  if (enemy.skills.includes('reactiveArmor') && damageType === 'physical')
    enemy.armor = Math.min(30, enemy.armor + 1);
  amount = Math.max(0, Math.round(amount));
  if (amount <= 0) {
    addText(state, enemy.x, enemy.y, '0', '#94a3b8');
    return 0;
  }
  enemy.hp -= amount;
  if (tower) {
    tower.roundDamage += amount;
    tower.totalDamage += amount;
  }
  addText(state, enemy.x, enemy.y, String(amount), enemy.color);
  if (enemy.hp <= 0 && enemy.alive) killEnemy(state, enemy, tower);
  return amount;
}

function getMvpMagicVulnerability(state: GameState, enemy: EnemyState): number {
  for (let i = 0; i < state.towers.length; i++) {
    const tower = state.towers[i];
    if (tower.mvpAwards <= 0) continue;
    const dx = tower.x + 0.5 - (enemy.x + 0.5);
    const dy = tower.y + 0.5 - (enemy.y + 0.5);
    if (dx * dx + dy * dy <= MVP_AURA_RANGE * MVP_AURA_RANGE) return 1.1;
  }
  return 1;
}

function killEnemy(state: GameState, enemy: EnemyState, tower: TowerState | null): void {
  enemy.alive = false;
  if (tower) tower.kills += 1;
  if (enemy.definitionId === 'golden-baby-roshan') state.stats.killedGoldenRoshan = true;
  if (enemy.definitionId === 'zard') state.stats.killedZard = true;
  const greedy = tower ? getEffectValue(tower, 'greedy') : 0;
  state.gold += Math.round(enemy.reward * (1 + greedy));
  state.score += enemy.reward * 9 + state.waveIndex * 11;
}

function getEffectValue(tower: TowerState, type: TowerEffectDefinition['type']): number {
  let value = 0;
  for (let i = 0; i < tower.effects.length; i++) {
    if (tower.effects[i].type === type) value = Math.max(value, tower.effects[i].value);
  }
  return value;
}

function applyProjectileEffects(
  state: GameState,
  enemy: EnemyState,
  tower: TowerState | null,
  effects: readonly TowerEffectDefinition[],
): void {
  for (let i = 0; i < effects.length; i++) {
    const effect = effects[i];
    if (effect.type === 'armorBreak') enemy.armor = Math.max(-64, enemy.armor - effect.value);
    else if (effect.type === 'slow') {
      applySlowEffect(state, enemy, tower, effect);
    } else if (effect.type === 'poison') {
      enemy.poisonDps = Math.max(enemy.poisonDps, effect.value);
      enemy.poisonUntil = state.time + (effect.duration ?? 5);
    } else if (effect.type === 'burn') {
      enemy.burnDps = Math.max(enemy.burnDps, effect.value);
      enemy.burnUntil = state.time + (effect.duration ?? 4);
    } else if (effect.type === 'stun' && nextRandom(state) < effect.value) {
      enemy.stunUntil = Math.max(enemy.stunUntil, state.time + (effect.duration ?? 0.4));
    } else if (effect.type === 'corrupt') {
      enemy.armor = Math.max(-64, enemy.armor - Math.ceil(effect.value * 20));
    } else if (effect.type === 'recover' && tower && nextRandom(state) < 0.08) {
      state.lives = Math.min(state.config.economy.startingLives, state.lives + 1);
    } else if (effect.type === 'overlook' && enemy.invisible) {
      enemy.revealedUntil = Math.max(enemy.revealedUntil, state.time + (effect.duration ?? 4));
    }
  }
}

function applySlowEffect(
  state: GameState,
  enemy: EnemyState,
  tower: TowerState | null,
  effect: TowerEffectDefinition,
): void {
  const until = state.time + (effect.duration ?? 1.5);
  const multiplier = Math.max(0.25, 1 - effect.value);
  if (tower?.family === 'sapphire') {
    const index = tower.tier - 1;
    if (enemy.sapphireSlowUntil[index] <= state.time) enemy.sapphireSlowMultiplier[index] = 1;
    enemy.sapphireSlowUntil[index] = Math.max(enemy.sapphireSlowUntil[index], until);
    enemy.sapphireSlowMultiplier[index] = Math.min(enemy.sapphireSlowMultiplier[index], multiplier);
    return;
  }
  if (enemy.slowUntil <= state.time) enemy.slowMultiplier = 1;
  enemy.slowUntil = Math.max(enemy.slowUntil, until);
  enemy.slowMultiplier = Math.min(enemy.slowMultiplier, multiplier);
}

function tickProjectiles(state: GameState, dt: number): void {
  for (let i = 0; i < state.projectiles.length; i++) {
    const projectile = state.projectiles[i];
    if (!projectile.active) continue;
    const target = findEnemyById(state, projectile.targetId);
    if (!target) {
      projectile.active = false;
      continue;
    }
    const tx = target.x + 0.5;
    const ty = target.y + 0.5;
    const dx = tx - projectile.x;
    const dy = ty - projectile.y;
    const distance = Math.hypot(dx, dy);
    const travel = projectile.speed * dt;
    if (distance <= travel || distance < 0.08) {
      projectile.active = false;
      const tower = findTowerById(state, projectile.towerId);
      hitEnemy(state, target, tower, projectile.damage, projectile.damageType, projectile.effects);
      applyAreaEffects(state, target, tower, projectile);
    } else {
      projectile.x += (dx / distance) * travel;
      projectile.y += (dy / distance) * travel;
    }
  }
}

function hitEnemy(
  state: GameState,
  enemy: EnemyState,
  tower: TowerState | null,
  damage: number,
  damageType: DamageType,
  effects: readonly TowerEffectDefinition[],
): void {
  if (!enemy.alive) return;
  let finalDamage = damage;
  if (
    tower &&
    tower.buffUntil > state.time &&
    tower.critBuff > 0 &&
    nextRandom(state) < tower.critBuff
  ) {
    finalDamage *= tower.critMultiplier;
  }
  applyProjectileEffects(state, enemy, tower, effects);
  applyRawDamage(state, enemy, finalDamage, tower, damageType);
}

function applyAreaEffects(
  state: GameState,
  target: EnemyState,
  tower: TowerState | null,
  projectile: ProjectileState,
): void {
  for (let i = 0; i < projectile.effects.length; i++) {
    const effect = projectile.effects[i];
    if (effect.type === 'cleave' || effect.type === 'radiation') {
      const radius = effect.radius ?? 3;
      for (let e = 0; e < state.enemies.length; e++) {
        const enemy = state.enemies[e];
        if (!enemy.alive || enemy.id === target.id) continue;
        const dx = enemy.x - target.x;
        const dy = enemy.y - target.y;
        if (dx * dx + dy * dy <= radius * radius) {
          hitEnemy(
            state,
            enemy,
            tower,
            projectile.damage * effect.value,
            effect.damageType ?? projectile.damageType,
            projectile.effects,
          );
        }
      }
    } else if (effect.type === 'split' || effect.type === 'lightning') {
      let hits = 0;
      const maxTargets = effect.maxTargets ?? 3;
      for (let e = 0; e < state.enemies.length && hits < maxTargets; e++) {
        const enemy = state.enemies[e];
        if (!enemy.alive || enemy.id === target.id) continue;
        hitEnemy(
          state,
          enemy,
          tower,
          projectile.damage * (effect.type === 'lightning' ? effect.value : 0.65),
          projectile.damageType,
          projectile.effects,
        );
        hits++;
      }
    }
  }
  if (state.activeSkills.fatalBondsUntil > state.time) {
    const level = getSkillLevel(state, 'fatalBonds');
    const radius = [0, 5, 6, 7, 8][level];
    const bonus = [0, 0.1, 0.15, 0.2, 0.25][level];
    let bonds = 0;
    for (let e = 0; e < state.enemies.length && bonds < level + 2; e++) {
      const enemy = state.enemies[e];
      if (!enemy.alive || enemy.id === target.id) continue;
      const dx = enemy.x - target.x;
      const dy = enemy.y - target.y;
      if (dx * dx + dy * dy <= radius * radius) {
        applyRawDamage(state, enemy, projectile.damage * bonus, tower, 'pure');
        bonds++;
      }
    }
  }
}

function tickFloatingText(state: GameState, dt: number): void {
  for (let i = 0; i < state.floatingTexts.length; i++) {
    const text = state.floatingTexts[i];
    if (!text.active) continue;
    text.life -= dt;
    text.y -= dt * 0.35;
    if (text.life <= 0) text.active = false;
  }
}

function clearInactiveEnemies(state: GameState): void {
  let write = 0;
  for (let i = 0; i < state.enemies.length; i++) {
    const enemy = state.enemies[i];
    if (enemy.alive) state.enemies[write++] = enemy;
  }
  state.enemies.length = write;
}

function completeWaveIfDone(state: GameState): void {
  if (!state.activeWaveId) return;
  let active = false;
  for (let i = 0; i < state.enemies.length; i++) {
    if (state.enemies[i].alive) {
      active = true;
      break;
    }
  }
  if (state.enemiesToSpawn > 0 || active) return;
  awardMvp(state);
  state.activeWaveId = null;
  state.waveIndex += 1;
  state.gold += 70 + state.waveIndex * 10;
  updateRank(state);
  if (!state.stats.completedRequiredWaves && state.waveIndex >= getRequiredWaveCount(state)) {
    state.stats.completedRequiredWaves = true;
    completeQuests(state);
  }
  state.status = state.stats.completedRequiredWaves ? 'won' : 'ready';
  state.phase = 'build';
  grantBuildPhaseBlocks(state);
}

function awardMvp(state: GameState): void {
  let winner: TowerState | null = null;
  let bestDamage = 0;
  for (let i = 0; i < state.towers.length; i++) {
    const tower = state.towers[i];
    if (tower.roundDamage > bestDamage && tower.mvpAwards < MAX_MVP_AWARDS) {
      bestDamage = tower.roundDamage;
      winner = tower;
    }
  }
  if (!winner || bestDamage <= 0) return;
  winner.mvpAwards += 1;
  state.stats.mvpAwards += 1;
}

function updateRank(state: GameState): void {
  const progress = Math.min(1, state.waveIndex / getRequiredWaveCount(state));
  state.rank.soloRank = Math.max(1, 25 - Math.floor(progress * 22));
  state.rank.raceRank = Math.max(1, 25 - Math.floor(progress * 18));
  const rankIndex = Math.min(
    state.config.ranks.length - 1,
    Math.floor(progress * state.config.ranks.length),
  );
  state.rank.seasonRankId = state.config.ranks[rankIndex].id;
}

function completeQuests(state: GameState): void {
  maybeCompleteQuest(state, 'complete-all');
  if (state.lives === state.config.economy.startingLives) maybeCompleteQuest(state, 'full-health');
  const elapsedMinutes = state.time / 60;
  if (elapsedMinutes <= 40) maybeCompleteQuest(state, 'under-40');
  if (elapsedMinutes <= 60) maybeCompleteQuest(state, 'under-60');
  if (state.stats.killedGoldenRoshan) maybeCompleteQuest(state, 'kill-golden-roshan');
  if (state.stats.mvpAwards >= 5) maybeCompleteQuest(state, 'five-mvps');
  if (state.stats.killedZard) maybeCompleteQuest(state, 'kill-zard');
}

function maybeCompleteQuest(state: GameState, questId: string): void {
  const progress = state.quests.get(questId);
  if (!progress || progress.completed) return;
  progress.completed = true;
  progress.progress = 1;
}

function maybeCompleteQuestProgress(state: GameState, questId: string, amount: number): void {
  const progress = state.quests.get(questId);
  if (!progress || progress.completed) return;
  progress.progress = Math.max(progress.progress, Math.min(1, amount));
  if (progress.progress >= 1) progress.completed = true;
}

function buySkill(state: GameState, skillId: SkillId): void {
  const skill = getSkill(state.config, skillId);
  const level = getSkillLevel(state, skillId);
  if (level >= 4) return;
  const goldCost = skill.goldCosts[level] ?? skill.goldCosts[skill.goldCosts.length - 1] ?? 0;
  if (state.gold < goldCost) return;
  state.gold -= goldCost;
  state.skillInventory.set(skillId, level + 1);
}

function activateSkill(
  state: GameState,
  action: Extract<GameAction, { type: 'activateSkill' }>,
): void {
  const level = getSkillLevel(state, action.skillId);
  if (level <= 0) return;
  const skill = getSkill(state.config, action.skillId);
  const goldCost = skill.goldCosts[level - 1] ?? 0;
  if (state.gold < goldCost) return;
  const tower =
    action.x !== undefined && action.y !== undefined ? getTowerAt(state, action.x, action.y) : null;
  if (action.skillId === 'heal')
    state.lives = Math.min(
      state.config.economy.startingLives,
      state.lives + rollInt(state, 1, [10, 13, 15, 16][level - 1]),
    );
  else if (action.skillId === 'guard') state.activeSkills.guardUntil = state.time + 60;
  else if (action.skillId === 'evade') state.activeSkills.evadeUntil = state.time + 300;
  else if (action.skillId === 'timelapse' && state.phase === 'build') {
    state.draftQueue.length = 0;
    for (let i = 0; i < DRAFT_SIZE - state.draft.length; i++)
      state.draftQueue.push(chooseGemId(state));
    state.pendingGemId = state.draftQueue.shift() ?? state.pendingGemId;
  } else if (
    action.skillId === 'hammer' &&
    tower &&
    tower.classification === 'gem' &&
    tower.tier > 1
  ) {
    const gem = getGem(state.config, `${tower.family}-${tower.tier - 1}`);
    Object.assign(tower, makeTowerFromExisting(state, tower, gem));
  } else if (action.skillId === 'attackSpeed' && tower) {
    tower.buffUntil = state.time + 60;
    tower.attackSpeedBuff = [0.6, 0.8, 1, 1.2][level - 1];
  } else if (action.skillId === 'aim' && tower) {
    tower.buffUntil = state.time + 60;
    tower.rangeBuff = [10, 12, 14, 16][level - 1];
  } else if (action.skillId === 'crit' && tower) {
    tower.buffUntil = state.time + 60;
    tower.critBuff = 0.15;
    tower.critMultiplier = [4, 6, 8, 10][level - 1];
  } else if (action.skillId === 'fatalBonds') state.activeSkills.fatalBondsUntil = state.time + 30;
  else if (action.skillId === 'adjacentSwap' && tower) adjacentSwap(state, tower);
  else if (
    action.skillId === 'swap' &&
    tower &&
    action.targetX !== undefined &&
    action.targetY !== undefined
  ) {
    const other = getTowerAt(state, action.targetX, action.targetY);
    if (other) {
      const tx = tower.x;
      const ty = tower.y;
      tower.x = other.x;
      tower.y = other.y;
      other.x = tx;
      other.y = ty;
      rebuildPaths(state);
    }
  } else if (
    action.skillId === 'candyMaker' &&
    action.x !== undefined &&
    action.y !== undefined &&
    state.activeSkills.candyAvailable
  ) {
    if (
      canPlaceWithoutBlocking(
        state.config.map,
        state.occupied,
        action.x,
        action.y,
        getActiveEnemyCells(state),
      )
    ) {
      state.stones.push({ x: action.x, y: action.y });
      state.activeSkills.candyAvailable = false;
      rebuildPaths(state);
    }
  } else return;
  state.gold -= goldCost;
}

function adjacentSwap(state: GameState, tower: TowerState): void {
  for (let i = 0; i < state.stones.length; i++) {
    const stone = state.stones[i];
    if (Math.abs(stone.x - tower.x) <= 1 && Math.abs(stone.y - tower.y) <= 1) {
      const tx = tower.x;
      const ty = tower.y;
      tower.x = stone.x;
      tower.y = stone.y;
      stone.x = tx;
      stone.y = ty;
      rebuildPaths(state);
      return;
    }
  }
}

function claimSeasonReward(state: GameState): void {
  if (state.rank.claimedSeasonReward) return;
  for (let i = 0; i < state.config.ranks.length; i++) {
    if (state.config.ranks[i].id !== state.rank.seasonRankId) continue;
    state.rank.claimedSeasonReward = true;
    maybeCompleteQuest(state, 'season-award');
    return;
  }
}

export function tickGame(state: GameState, dt: number): void {
  if (state.status !== 'running') return;
  state.time += dt;
  if (state.activeWaveId) {
    const wave = getCurrentWave(state);
    if (!wave) return;
    state.spawnTimer -= dt;
    while (state.enemiesToSpawn > 0 && state.spawnTimer <= 0) {
      spawnEnemy(state);
      state.enemiesToSpawn -= 1;
      state.spawnTimer += wave.spawnInterval;
    }
  }
  tickEnemies(state, dt);
  tickTowers(state, dt);
  tickProjectiles(state, dt);
  tickFloatingText(state, dt);
  clearInactiveEnemies(state);
  completeWaveIfDone(state);
  if (state.lives <= 0) {
    state.lives = 0;
    state.status = 'lost';
  }
}

export function dispatchGameAction(state: GameState, action: GameAction): void {
  switch (action.type) {
    case 'startWave':
      startWave(state);
      break;
    case 'selectShopTower':
      state.selectedShopGemId = getShopItem(state, action.gemId) ? action.gemId : null;
      state.buildMode = state.selectedShopGemId ? 'shopTower' : 'select';
      break;
    case 'clearShopSelection':
      state.selectedShopGemId = null;
      state.buildMode = 'select';
      break;
    case 'placeMazeBlock':
      state.buildMode = 'mazeBlock';
      placeMazeBlock(state, action.x, action.y);
      break;
    case 'placeShopTower':
      placeShopTower(state, action.x, action.y);
      break;
    case 'upgradeTowerTier':
      upgradeTowerTier(state, action.x, action.y);
      break;
    case 'upgradeTowerStat':
      upgradeTowerStat(state, action.x, action.y, action.stat);
      break;
    case 'selectTile':
      state.selectedTile = { x: action.x, y: action.y };
      break;
    case 'hoverTile':
      state.hoverTile = { x: action.x, y: action.y };
      break;
    case 'clearHover':
      state.hoverTile = null;
      break;
    case 'removeStone':
      removeStone(state, action.x, action.y);
      break;
    case 'toggleTowerStop': {
      const tower = getTowerAt(state, action.x, action.y);
      if (tower) tower.stopped = !tower.stopped;
      break;
    }
    case 'setTowerTarget': {
      const tower = getTowerAt(state, action.x, action.y);
      if (tower) tower.targetId = action.targetId;
      break;
    }
    case 'setTowerTargetMode': {
      const tower = getTowerAt(state, action.x, action.y);
      if (tower) tower.targetMode = action.targetMode;
      break;
    }
    case 'buySkill':
      buySkill(state, action.skillId);
      break;
    case 'activateSkill':
      activateSkill(state, action);
      break;
    case 'claimSeasonReward':
      claimSeasonReward(state);
      break;
    case 'pause':
      if (state.status === 'running') state.status = 'paused';
      break;
    case 'resume':
      if (state.status === 'paused') state.status = 'running';
      break;
    case 'resetRun': {
      const next = createGame(state.config, commitProgressToSave(state, toSaveState(state)));
      Object.assign(state, next);
      break;
    }
  }
}

export function createSnapshot(state: GameState): GameSnapshot {
  const selectedTower = state.selectedTile
    ? getTowerAt(state, state.selectedTile.x, state.selectedTile.y)
    : null;
  const selectedTowerTarget = selectedTower?.targetId
    ? findEnemyById(state, selectedTower.targetId)
    : null;
  const selectedStone =
    state.selectedTile && getStoneAt(state, state.selectedTile.x, state.selectedTile.y) >= 0;
  const currentWave = getWaveAtIndex(state, state.waveIndex);
  const nextWave = getWaveAtIndex(state, state.waveIndex + 1);
  const selectedTowerUpgradeCosts = selectedTower
    ? {
        tier: getTierUpgradeCost(state, selectedTower),
        damage: getStatUpgradeCost(state, selectedTower, 'damage'),
        speed: getStatUpgradeCost(state, selectedTower, 'speed'),
        range: getStatUpgradeCost(state, selectedTower, 'range'),
      }
    : null;
  return {
    status: state.status,
    phase: state.phase,
    gold: state.gold,
    lives: state.lives,
    score: state.score,
    wave: state.waveIndex + 1,
    totalWaves: getRequiredWaveCount(state),
    activeEnemies: countActiveEnemies(state),
    towers: state.towers.length,
    stones: state.stones.length,
    bankedMazeBlocks: state.bankedMazeBlocks,
    buildMode: state.buildMode,
    selectedShopGemId: state.selectedShopGemId,
    towerShop: state.config.towerShop,
    draft: state.draft,
    draftRemaining: state.pendingGemId ? state.draftQueue.length + 1 : 0,
    pendingGemId: state.pendingGemId,
    selectedTile: state.selectedTile,
    draftRowHover: state.draftRowHover,
    selectedTower,
    selectedTowerTarget,
    hoverTile: state.hoverTile,
    currentWave,
    currentWaveSkills: currentWave ? getWaveSkills(state, currentWave) : [],
    nextWave,
    requiredWavesCleared: state.stats.completedRequiredWaves,
    discoveredRecipes: Array.from(state.discoveredRecipes),
    unlockedSecrets: Array.from(state.unlockedSecrets),
    skills: Array.from(state.skillInventory, ([id, level]) => ({ id, level })),
    quests: Array.from(state.quests.values()),
    rank: state.rank,
    canStartWave:
      state.phase === 'build' &&
      !state.activeWaveId &&
      state.status !== 'lost' &&
      !state.pendingGemId &&
      state.draft.length === 0,
    canPlaceMazeBlock: canBuildBetweenWaves(state) && state.bankedMazeBlocks > 0,
    selectedShopItem: getShopItem(state, state.selectedShopGemId),
    canKeepDraft: false,
    selectedTowerUpgradeCosts,
    canRemoveStone: Boolean(selectedStone),
    message: getMessage(state),
  };
}

function getMessage(state: GameState): string {
  if (state.status === 'won') return 'Wave 50 cleared. The Gem Castle stands.';
  if (state.status === 'lost') return 'The Gem Castle has fallen. Rebuild the maze.';
  if (state.buildMode === 'mazeBlock')
    return 'Build phase: place free maze blocks before the wave.';
  if (state.buildMode === 'shopTower' && state.selectedShopGemId)
    return 'Build phase: place the selected shop tower on an empty tile or maze block.';
  if (state.activeWaveId) return 'Attack phase: towers may be stopped or focused for MVP control.';
  if (state.stats.completedRequiredWaves) return 'Wave 50 cleared. Repeat waves are open.';
  return 'Build phase: buy towers, place maze blocks, upgrade, or start the next wave.';
}

function countActiveEnemies(state: GameState): number {
  let count = 0;
  for (let i = 0; i < state.enemies.length; i++) {
    if (state.enemies[i].alive) count++;
  }
  return count;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toSaveState(state: GameState): SaveState {
  return {
    version: 2,
    bestWave: Math.min(state.waveIndex, getRequiredWaveCount(state)),
    wins: state.stats.completedRequiredWaves || state.status === 'won' ? 1 : 0,
    discoveredRecipes: Array.from(state.discoveredRecipes),
    unlockedSecrets: Array.from(state.unlockedSecrets),
    skillInventory: Array.from(state.skillInventory, ([id, level]) => ({ id, level })),
    quests: Array.from(state.quests.values()),
    rank: state.rank,
    settings: defaultSaveState.settings,
  };
}

export function commitProgressToSave(state: GameState, save: SaveState): SaveState {
  const bestWave = Math.max(
    save.bestWave,
    Math.min(state.waveIndex + 1, getRequiredWaveCount(state)),
  );
  const completedRequiredWaves = state.stats.completedRequiredWaves || state.status === 'won';
  return {
    ...save,
    version: 2,
    bestWave,
    wins: save.wins + (completedRequiredWaves ? 1 : 0),
    discoveredRecipes: Array.from(state.discoveredRecipes),
    unlockedSecrets: Array.from(state.unlockedSecrets),
    skillInventory: Array.from(state.skillInventory, ([id, level]) => ({ id, level })),
    quests: Array.from(state.quests.values()),
    rank: state.rank,
  };
}
