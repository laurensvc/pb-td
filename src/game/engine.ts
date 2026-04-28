import { gameConfig, getEnemy, getGem } from './config';
import { buildOccupancy, canPlaceWithoutBlocking, findPath } from './pathfinding';
import type {
  DraftCandidate,
  EnemyState,
  FloatingText,
  GameAction,
  GameConfig,
  GameSnapshot,
  GameState,
  GemDefinition,
  GemFamily,
  GridPoint,
  ProjectileState,
  RecipeDefinition,
  SaveState,
  TowerState,
} from './types';

const DEFAULT_FAMILIES: readonly GemFamily[] = ['ruby', 'sapphire', 'topaz'];
const DRAFT_SIZE = 5;
const TILE_EPSILON = 0.03;

export const defaultSaveState: SaveState = {
  version: 1,
  bestWave: 0,
  wins: 0,
  discoveredRecipes: [],
  unlockedFamilies: ['ruby', 'sapphire', 'topaz'],
  settings: {
    reducedMotion: false,
    muted: false,
  },
};

function nextRandom(state: GameState): number {
  state.rngSeed = (state.rngSeed * 1664525 + 1013904223) >>> 0;
  return state.rngSeed / 4294967296;
}

function makeTower(state: GameState, gem: GemDefinition, x: number, y: number): TowerState {
  return {
    id: state.nextTowerId++,
    gemId: gem.id,
    name: gem.name,
    family: gem.family,
    tier: gem.tier,
    x,
    y,
    damage: gem.damage,
    range: gem.range,
    cooldown: gem.cooldown,
    cooldownLeft: 0,
    projectileSpeed: gem.projectileSpeed,
    color: gem.color,
    splashRadius: gem.splashRadius ?? 0,
    slow: gem.slow ?? 0,
    kills: 0,
  };
}

export function createGame(
  config: GameConfig = gameConfig,
  save: SaveState = defaultSaveState,
): GameState {
  const unlocked = new Set<GemFamily>(
    save.unlockedFamilies.length > 0 ? save.unlockedFamilies : DEFAULT_FAMILIES,
  );
  const state: GameState = {
    config,
    status: 'ready',
    time: 0,
    rngSeed: (Date.now() ^ Math.floor(Math.random() * 1000000)) >>> 0,
    gold: config.economy.startingGold,
    lives: config.economy.startingLives,
    score: 0,
    waveIndex: 0,
    activeWaveId: null,
    enemiesToSpawn: 0,
    spawnTimer: 0,
    draft: [],
    draftQueue: [],
    draftWaveIndex: null,
    pendingGemId: null,
    stones: [],
    selectedTile: null,
    hoverTile: null,
    towers: [],
    enemies: [],
    projectiles: [],
    floatingTexts: [],
    occupied: new Int16Array(config.map.width * config.map.height),
    path: [],
    nextTowerId: 1,
    nextDraftId: 1,
    nextEnemyId: 1,
    nextProjectileId: 1,
    discoveredRecipes: new Set(save.discoveredRecipes),
    unlockedFamilies: unlocked,
  };
  state.occupied = buildOccupancy(config.map, state.towers, state.stones, state.draft);
  state.path = findPath(config.map, state.occupied, config.map.entrance, config.map.exit);
  beginDraftRound(state);
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
  state.path = findPath(
    state.config.map,
    state.occupied,
    state.config.map.entrance,
    state.config.map.exit,
  );
  for (let i = 0; i < state.enemies.length; i++) {
    const enemy = state.enemies[i];
    if (!enemy.alive) continue;
    const start = {
      x: clamp(Math.round(enemy.x), 0, state.config.map.width - 1),
      y: clamp(Math.round(enemy.y), 0, state.config.map.height - 1),
    };
    const path = findPath(state.config.map, state.occupied, start, state.config.map.exit);
    if (path.length > 0) {
      enemy.path = path;
      enemy.pathIndex = 0;
    }
  }
}

function chooseGemId(state: GameState): string {
  const roll = nextRandom(state);
  const waveBoost = state.waveIndex / Math.max(1, state.config.waves.length);
  let tier = 1;
  if (roll > 0.96 - waveBoost * 0.1) tier = 4;
  else if (roll > 0.82 - waveBoost * 0.16) tier = 3;
  else if (roll > 0.48 - waveBoost * 0.18) tier = 2;

  const unlocked = Array.from(state.unlockedFamilies);
  const family = unlocked[Math.floor(nextRandom(state) * unlocked.length)] ?? 'ruby';
  return `${family}-${tier}`;
}

function canBeginDraftRound(state: GameState): boolean {
  return (
    state.draft.length === 0 &&
    state.draftQueue.length === 0 &&
    state.draftWaveIndex !== state.waveIndex &&
    !state.pendingGemId &&
    !state.activeWaveId &&
    state.status !== 'running' &&
    state.status !== 'paused' &&
    state.status !== 'lost' &&
    state.status !== 'won'
  );
}

function beginDraftRound(state: GameState): void {
  if (!canBeginDraftRound(state)) return;
  state.draftQueue = [];
  for (let i = 0; i < DRAFT_SIZE; i++) state.draftQueue.push(chooseGemId(state));
  state.draftWaveIndex = state.waveIndex;
  state.pendingGemId = state.draftQueue.shift() ?? null;
}

function buyDraft(state: GameState): void {
  if (!canBeginDraftRound(state)) return;
  beginDraftRound(state);
}

function placePendingGem(state: GameState, x: number, y: number): void {
  if (!state.pendingGemId) return;
  const enemyCells = getActiveEnemyCells(state);
  if (!canPlaceWithoutBlocking(state.config.map, state.occupied, x, y, enemyCells)) return;
  state.draft.push({ id: state.nextDraftId++, gemId: state.pendingGemId, x, y });
  state.pendingGemId = state.draftQueue.shift() ?? null;
  state.selectedTile = null;
  rebuildPaths(state);
}

function getTowerAt(state: GameState, x: number, y: number): TowerState | null {
  for (let i = 0; i < state.towers.length; i++) {
    const tower = state.towers[i];
    if (tower.x === x && tower.y === y) return tower;
  }
  return null;
}

function removeTowerAt(state: GameState, x: number, y: number): TowerState | null {
  for (let i = 0; i < state.towers.length; i++) {
    const tower = state.towers[i];
    if (tower.x !== x || tower.y !== y) continue;
    state.towers[i] = state.towers[state.towers.length - 1];
    state.towers.length -= 1;
    return tower;
  }
  return null;
}

function getDraftCandidateAt(state: GameState, x: number, y: number): DraftCandidate | null {
  for (let i = 0; i < state.draft.length; i++) {
    const candidate = state.draft[i];
    if (candidate.x === x && candidate.y === y) return candidate;
  }
  return null;
}

function keepDraftCandidate(state: GameState, x: number, y: number): void {
  if (state.pendingGemId || state.draft.length !== DRAFT_SIZE) return;
  const kept = getDraftCandidateAt(state, x, y);
  if (!kept) return;
  for (let i = 0; i < state.draft.length; i++) {
    const candidate = state.draft[i];
    if (candidate.id === kept.id) continue;
    state.stones.push({ x: candidate.x, y: candidate.y });
  }
  const gem = getGem(state.config, kept.gemId);
  state.towers.push(makeTower(state, gem, kept.x, kept.y));
  state.draft = [];
  state.draftQueue = [];
  state.selectedTile = { x: kept.x, y: kept.y };
  rebuildPaths(state);
}

function ingredientMatches(
  tower: TowerState,
  ingredient: RecipeDefinition['ingredients'][number],
): boolean {
  if (ingredient.gemId && tower.gemId !== ingredient.gemId) return false;
  if (ingredient.family && tower.family !== ingredient.family) return false;
  if (ingredient.tier && tower.tier < ingredient.tier) return false;
  return true;
}

export function findRecipeAt(state: GameState, x: number, y: number): RecipeDefinition | null {
  const nearby: TowerState[] = [];
  for (let i = 0; i < state.towers.length; i++) {
    const tower = state.towers[i];
    if (Math.abs(tower.x - x) <= 1 && Math.abs(tower.y - y) <= 1) nearby.push(tower);
  }

  const base = getTowerAt(state, x, y);
  if (base && base.tier < 4) {
    let count = 0;
    for (let i = 0; i < nearby.length; i++) {
      const tower = nearby[i];
      if (tower.family === base.family && tower.tier === base.tier) count++;
    }
    if (count >= 3) {
      return {
        id: `upgrade-${base.family}-${base.tier}`,
        name: `${base.name} refinement`,
        description: `Fuse three adjacent ${base.name}s into the next tier.`,
        ingredients: [
          { family: base.family, tier: base.tier },
          { family: base.family, tier: base.tier },
          { family: base.family, tier: base.tier },
        ],
        resultGemId: `${base.family}-${(base.tier + 1).toString()}`,
      };
    }
  }

  for (let r = 0; r < state.config.recipes.length; r++) {
    const recipe = state.config.recipes[r];
    const used = new Uint8Array(nearby.length);
    let matched = 0;
    for (let i = 0; i < recipe.ingredients.length; i++) {
      for (let t = 0; t < nearby.length; t++) {
        if (used[t] === 1) continue;
        if (!ingredientMatches(nearby[t], recipe.ingredients[i])) continue;
        used[t] = 1;
        matched++;
        break;
      }
    }
    if (matched === recipe.ingredients.length) return recipe;
  }
  return null;
}

function combineAt(state: GameState, x: number, y: number): void {
  const recipe = findRecipeAt(state, x, y);
  if (!recipe) return;
  const consumedIndexes: number[] = [];
  const used = new Uint8Array(state.towers.length);
  for (let i = 0; i < recipe.ingredients.length; i++) {
    for (let t = 0; t < state.towers.length; t++) {
      if (used[t] === 1) continue;
      const tower = state.towers[t];
      if (Math.abs(tower.x - x) > 1 || Math.abs(tower.y - y) > 1) continue;
      if (!ingredientMatches(tower, recipe.ingredients[i])) continue;
      used[t] = 1;
      consumedIndexes.push(t);
      break;
    }
  }
  if (consumedIndexes.length !== recipe.ingredients.length) return;

  consumedIndexes.sort((a, b) => b - a);
  for (let i = 0; i < consumedIndexes.length; i++) {
    const index = consumedIndexes[i];
    state.towers[index] = state.towers[state.towers.length - 1];
    state.towers.length -= 1;
  }
  const gem = getGem(state.config, recipe.resultGemId);
  state.towers.push(makeTower(state, gem, x, y));
  state.discoveredRecipes.add(recipe.id);
  state.selectedTile = { x, y };
  rebuildPaths(state);
}

function sellTower(state: GameState, x: number, y: number): void {
  const tower = removeTowerAt(state, x, y);
  if (!tower) return;
  state.gold += Math.round(
    state.config.economy.draftCost * state.config.economy.sellRefundRate * tower.tier,
  );
  rebuildPaths(state);
}

function startWave(state: GameState): void {
  if (state.activeWaveId || state.status === 'lost' || state.status === 'won') return;
  if (state.pendingGemId || state.draft.length > 0 || state.draftQueue.length > 0) return;
  if (state.waveIndex >= state.config.waves.length) return;
  const wave = state.config.waves[state.waveIndex];
  state.status = 'running';
  state.activeWaveId = wave.id;
  state.enemiesToSpawn = wave.count;
  state.spawnTimer = 0;
}

function spawnEnemy(state: GameState): void {
  if (!state.activeWaveId) return;
  const wave = state.config.waves[state.waveIndex];
  const definition = getEnemy(state.config, wave.enemyId);
  const waveScale = 1 + state.waveIndex * 0.16;
  const enemy: EnemyState = {
    id: state.nextEnemyId++,
    definitionId: definition.id,
    x: state.config.map.entrance.x,
    y: state.config.map.entrance.y,
    hp: Math.round(definition.hp * waveScale),
    maxHp: Math.round(definition.hp * waveScale),
    speed: definition.speed,
    reward: definition.reward + Math.floor(state.waveIndex * 0.8),
    armor: definition.armor,
    path: state.path,
    pathIndex: 0,
    alive: true,
    reachedExit: false,
    slowUntil: 0,
    slowMultiplier: 1,
    color: definition.color,
  };
  state.enemies.push(enemy);
}

function findEnemyById(state: GameState, id: number): EnemyState | null {
  for (let i = 0; i < state.enemies.length; i++) {
    if (state.enemies[i].id === id && state.enemies[i].alive) return state.enemies[i];
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
    damage: 0,
    speed: 0,
    color: '#ffffff',
    splashRadius: 0,
    slow: 0,
  };
  state.projectiles.push(projectile);
  return projectile;
}

function acquireFloatingText(state: GameState): FloatingText {
  for (let i = 0; i < state.floatingTexts.length; i++) {
    if (!state.floatingTexts[i].active) return state.floatingTexts[i];
  }
  const text: FloatingText = { active: false, x: 0, y: 0, value: 0, life: 0, color: '#fff0a8' };
  state.floatingTexts.push(text);
  return text;
}

function damageEnemy(state: GameState, enemy: EnemyState, damage: number, slow: number): void {
  const amount = Math.max(1, Math.round(damage - enemy.armor));
  enemy.hp -= amount;
  if (slow > 0) {
    enemy.slowUntil = state.time + 1.1;
    enemy.slowMultiplier = Math.max(0.45, 1 - slow);
  }
  const text = acquireFloatingText(state);
  text.active = true;
  text.x = enemy.x;
  text.y = enemy.y - 0.25;
  text.value = amount;
  text.life = 0.6;
  text.color = enemy.color;
  if (enemy.hp <= 0 && enemy.alive) {
    enemy.alive = false;
    state.gold += enemy.reward;
    state.score += enemy.reward * 9 + state.waveIndex * 11;
  }
}

function fireTower(state: GameState, tower: TowerState): void {
  let best: EnemyState | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  const tx = tower.x + 0.5;
  const ty = tower.y + 0.5;
  for (let i = 0; i < state.enemies.length; i++) {
    const enemy = state.enemies[i];
    if (!enemy.alive) continue;
    const dx = enemy.x + 0.5 - tx;
    const dy = enemy.y + 0.5 - ty;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq > tower.range * tower.range || distanceSq >= bestDistance) continue;
    bestDistance = distanceSq;
    best = enemy;
  }
  if (!best) return;
  const projectile = acquireProjectile(state);
  projectile.active = true;
  projectile.x = tx;
  projectile.y = ty;
  projectile.targetId = best.id;
  projectile.damage = tower.damage;
  projectile.speed = tower.projectileSpeed;
  projectile.color = tower.color;
  projectile.splashRadius = tower.splashRadius;
  projectile.slow = tower.slow;
  tower.cooldownLeft = tower.cooldown;
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
    const path = enemy.path;
    if (path.length <= 1 || enemy.pathIndex >= path.length - 1) {
      enemy.alive = false;
      enemy.reachedExit = true;
      state.lives -= 1;
      continue;
    }
    const next = path[enemy.pathIndex + 1];
    const dx = next.x - enemy.x;
    const dy = next.y - enemy.y;
    const distance = Math.hypot(dx, dy);
    const multiplier = enemy.slowUntil > state.time ? enemy.slowMultiplier : 1;
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
      if (projectile.splashRadius > 0) {
        for (let e = 0; e < state.enemies.length; e++) {
          const enemy = state.enemies[e];
          if (!enemy.alive) continue;
          const sx = enemy.x + 0.5 - tx;
          const sy = enemy.y + 0.5 - ty;
          if (sx * sx + sy * sy <= projectile.splashRadius * projectile.splashRadius) {
            damageEnemy(state, enemy, projectile.damage, projectile.slow);
          }
        }
      } else {
        damageEnemy(state, target, projectile.damage, projectile.slow);
      }
    } else {
      projectile.x += (dx / distance) * travel;
      projectile.y += (dy / distance) * travel;
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
    if (enemy.alive) {
      state.enemies[write++] = enemy;
      continue;
    }
    if (enemy.reachedExit) continue;
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
  state.activeWaveId = null;
  state.waveIndex += 1;
  state.gold += 25 + state.waveIndex * 6;
  unlockFamilyByWave(state);
  if (state.waveIndex >= state.config.waves.length) {
    state.status = 'won';
  } else {
    state.status = 'ready';
    beginDraftRound(state);
  }
}

function unlockFamilyByWave(state: GameState): void {
  if (state.waveIndex >= 2) state.unlockedFamilies.add('emerald');
  if (state.waveIndex >= 4) state.unlockedFamilies.add('amethyst');
  if (state.waveIndex >= 6) state.unlockedFamilies.add('onyx');
}

export function tickGame(state: GameState, dt: number): void {
  if (state.status !== 'running') return;
  state.time += dt;
  if (state.activeWaveId) {
    const wave = state.config.waves[state.waveIndex];
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
    case 'buyDraft':
      buyDraft(state);
      break;
    case 'keepDraftCandidate':
      keepDraftCandidate(state, action.x, action.y);
      break;
    case 'placePendingGem':
      placePendingGem(state, action.x, action.y);
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
    case 'combineAt':
      combineAt(state, action.x, action.y);
      break;
    case 'sellTower':
      sellTower(state, action.x, action.y);
      break;
    case 'pause':
      if (state.status === 'running') state.status = 'paused';
      break;
    case 'resume':
      if (state.status === 'paused') state.status = 'running';
      break;
    case 'resetRun': {
      const next = createGame(state.config, {
        ...defaultSaveState,
        discoveredRecipes: Array.from(state.discoveredRecipes),
        unlockedFamilies: Array.from(state.unlockedFamilies),
      });
      Object.assign(state, next);
      break;
    }
  }
}

export function createSnapshot(state: GameState): GameSnapshot {
  const selectedTower = state.selectedTile
    ? getTowerAt(state, state.selectedTile.x, state.selectedTile.y)
    : null;
  const activeEnemies = countActiveEnemies(state);
  return {
    status: state.status,
    gold: state.gold,
    lives: state.lives,
    score: state.score,
    wave: state.waveIndex + 1,
    totalWaves: state.config.waves.length,
    activeEnemies,
    towers: state.towers.length,
    draft: state.draft,
    draftRemaining: state.pendingGemId ? state.draftQueue.length + 1 : 0,
    pendingGemId: state.pendingGemId,
    selectedTile: state.selectedTile,
    selectedTower,
    hoverTile: state.hoverTile,
    discoveredRecipes: Array.from(state.discoveredRecipes),
    unlockedFamilies: Array.from(state.unlockedFamilies),
    canStartWave:
      !state.activeWaveId &&
      state.status !== 'lost' &&
      state.status !== 'won' &&
      !state.pendingGemId &&
      state.draft.length === 0,
    canKeepDraft: !state.pendingGemId && state.draft.length === DRAFT_SIZE,
    canBuyDraft: canBeginDraftRound(state),
    message: getMessage(state),
  };
}

function getMessage(state: GameState): string {
  if (state.status === 'won') return 'The crucible is quiet. Victory is sealed.';
  if (state.status === 'lost') return 'The ward has cracked. Rebuild the bastion.';
  if (state.pendingGemId)
    return `Place candidate ${state.draft.length + 1} of ${DRAFT_SIZE}, then choose one gem to keep.`;
  if (state.draft.length === DRAFT_SIZE)
    return 'Choose one of the five placed gems to keep. The other four harden into maze stones.';
  if (state.activeWaveId) return 'Wave in motion. Shape, fuse, and hold.';
  return 'Keep one tower from the automatic draft, then ring the wave bell.';
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

export function commitProgressToSave(state: GameState, save: SaveState): SaveState {
  const bestWave = Math.max(
    save.bestWave,
    Math.min(state.waveIndex + 1, state.config.waves.length),
  );
  return {
    ...save,
    bestWave,
    wins: save.wins + (state.status === 'won' ? 1 : 0),
    discoveredRecipes: Array.from(state.discoveredRecipes),
    unlockedFamilies: Array.from(state.unlockedFamilies),
  };
}
