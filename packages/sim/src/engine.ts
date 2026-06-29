import { combinations, gemsById, sliceWaves, getGemId } from '@facet/content';
import type { GemFamily, GemTier } from '@facet/content';
import { buildPathNav, canPlaceRock, facetBoard } from './maze';
import { cellKey, mulberry32 } from './rng';
import type {
  EnemyState,
  FacetAction,
  FacetSnapshot,
  FacetState,
  GemOffer,
  PathNavData,
} from './types';

const STARTING_LIVES = 20;
const STARTING_GOLD = 40;
const ROCKS_PER_PHASE = 5;
const TICK_RATE = 20;
const ENEMIES: Record<string, { hp: number; speed: number; leak: number; gold: number }> = {
  runner: { hp: 48, speed: 1.75, leak: 1, gold: 4 },
  swarm: { hp: 22, speed: 2.1, leak: 1, gold: 2 },
  bulwark: { hp: 95, speed: 1.05, leak: 2, gold: 7 },
  burrower: { hp: 420, speed: 0.9, leak: 5, gold: 25 },
};

function rerollCost(n: number): number {
  const costs = [10, 20, 40, 80, 160];
  if (n < costs.length) return costs[n]!;
  return costs[costs.length - 1]! * 2 ** (n - costs.length + 1);
}

function generateOffers(seed: number, wave: number, reroll: number): GemOffer[] {
  const rng = mulberry32(seed + wave * 997 + reroll * 131);
  const families: GemFamily[] = ['flame', 'stone', 'thorn'];
  const tiers: GemTier[] = [1, 2, 1, 2, 3];
  const offers: GemOffer[] = [];
  for (let i = 0; i < 5; i++) {
    offers.push({
      family: families[Math.floor(rng() * families.length)]!,
      tier: tiers[Math.floor(rng() * tiers.length)]!,
    });
  }
  return offers;
}

export function createFacetState(seed = 42): FacetState {
  const state: FacetState = {
    seed,
    tick: 0,
    phase: 'build',
    buildStep: 'rocks',
    wave: 0,
    lives: STARTING_LIVES,
    gold: STARTING_GOLD,
    rocksPlacedThisPhase: 0,
    rerollsThisPhase: 0,
    claimedOffer: null,
    offers: [],
    rocks: [],
    towers: [],
    enemies: [],
    projectiles: [],
    mergeSourceId: null,
    ready: false,
    enemiesKilled: 0,
    leaks: 0,
    nextEntityId: 1,
    pathNav: null,
    spawnQueue: [],
    waveSpawnDone: false,
  };
  refreshPath(state);
  beginBuildPhase(state);
  return state;
}

function beginBuildPhase(state: FacetState): void {
  state.phase = 'build';
  state.buildStep = 'rocks';
  state.rocksPlacedThisPhase = 0;
  state.rerollsThisPhase = 0;
  state.claimedOffer = null;
  state.ready = false;
  state.mergeSourceId = null;
  state.offers = generateOffers(state.seed, state.wave + 1, 0);
}

function refreshPath(state: FacetState): void {
  state.pathNav = buildPathNav(state.rocks, state.towers);
}

export function dispatchFacet(state: FacetState, action: FacetAction): void {
  switch (action.type) {
    case 'START_MATCH':
      Object.assign(state, createFacetState(action.seed ?? 42));
      break;
    case 'PLACE_ROCK':
      placeRock(state, action.x, action.y);
      break;
    case 'SELL_ROCK':
      sellRock(state, action.x, action.y);
      break;
    case 'CLAIM_OFFER':
      claimOffer(state, action.index);
      break;
    case 'REROLL_OFFER':
      rerollOffer(state);
      break;
    case 'UPGRADE_ROCK':
      upgradeRock(state, action.rockX, action.rockY);
      break;
    case 'MERGE_TOWERS':
      mergeTowers(state, action.sourceId, action.targetId);
      break;
    case 'SELL_TOWER':
      sellTower(state, action.towerId);
      break;
    case 'CREATE_COMBINATION':
      createCombination(state, action.recipeId, action.x, action.y, action.towerA, action.towerB);
      break;
    case 'READY':
      if (state.phase === 'build') {
        state.ready = true;
        startWave(state);
      }
      break;
    case 'TICK':
      tickFacet(state, action.dt);
      break;
  }
}

function placeRock(state: FacetState, x: number, y: number): void {
  if (state.phase !== 'build' || state.buildStep !== 'rocks') return;
  if (state.rocksPlacedThisPhase >= ROCKS_PER_PHASE) return;
  if (!canPlaceRock(x, y, state.rocks, state.towers)) return;
  state.rocks.push({ x, y });
  state.rocksPlacedThisPhase++;
  refreshPath(state);
}

function sellRock(state: FacetState, x: number, y: number): void {
  if (state.phase !== 'build') return;
  const idx = state.rocks.findIndex((r) => r.x === x && r.y === y);
  if (idx < 0) return;
  state.rocks.splice(idx, 1);
  refreshPath(state);
}

function claimOffer(state: FacetState, index: number): void {
  if (state.phase !== 'build') return;
  if (state.buildStep === 'rocks' && state.rocksPlacedThisPhase < ROCKS_PER_PHASE) {
    state.buildStep = 'prospect';
  }
  if (state.buildStep !== 'prospect' && state.buildStep !== 'upgrade') return;
  const offer = state.offers[index];
  if (!offer) return;
  state.claimedOffer = { ...offer };
  state.buildStep = 'upgrade';
}

function rerollOffer(state: FacetState): void {
  if (state.phase !== 'build') return;
  const cost = rerollCost(state.rerollsThisPhase);
  if (state.gold < cost) return;
  state.gold -= cost;
  state.rerollsThisPhase++;
  state.offers = generateOffers(state.seed, state.wave + 1, state.rerollsThisPhase);
  state.claimedOffer = null;
  state.buildStep = 'prospect';
}

function upgradeRock(state: FacetState, rockX: number, rockY: number): void {
  if (state.phase !== 'build' || state.buildStep !== 'upgrade' || !state.claimedOffer) return;
  const rockIdx = state.rocks.findIndex((r) => r.x === rockX && r.y === rockY);
  if (rockIdx < 0) return;
  const { family, tier } = state.claimedOffer;
  if (!gemsById.has(getGemId(family, tier))) return;
  state.rocks.splice(rockIdx, 1);
  state.towers.push({
    id: state.nextEntityId++,
    x: rockX,
    y: rockY,
    family,
    tier,
  });
  state.claimedOffer = null;
  state.buildStep = 'ready';
  refreshPath(state);
}

function mergeTowers(state: FacetState, sourceId: number, targetId: number): void {
  if (state.phase !== 'build') return;
  const source = state.towers.find((t) => t.id === sourceId);
  const target = state.towers.find((t) => t.id === targetId);
  if (!source || !target || source.id === target.id) return;
  if (source.comboId || target.comboId) return;
  if (source.family !== target.family || source.tier !== target.tier) return;
  if (source.tier >= 5) return;
  const nextId = getGemId(source.family, (source.tier + 1) as GemTier);
  if (!gemsById.has(nextId)) return;
  target.tier = (target.tier + 1) as GemTier;
  state.towers = state.towers.filter((t) => t.id !== sourceId);
  refreshPath(state);
}

function sellTower(state: FacetState, towerId: number): void {
  if (state.phase !== 'build') return;
  const tower = state.towers.find((t) => t.id === towerId);
  if (!tower) return;
  const gem = gemsById.get(getGemId(tower.family, tower.tier));
  state.gold += Math.floor((gem?.damage ?? 5000) / 100);
  state.towers = state.towers.filter((t) => t.id !== towerId);
  refreshPath(state);
}

function createCombination(
  state: FacetState,
  recipeId: string,
  x: number,
  y: number,
  towerA: number,
  towerB: number,
): void {
  if (state.phase !== 'build') return;
  const recipe = combinations.find((c) => c.id === recipeId);
  if (!recipe || state.gold < recipe.goldCost) return;
  const a = state.towers.find((t) => t.id === towerA);
  const b = state.towers.find((t) => t.id === towerB);
  if (!a || !b) return;
  if (a.tier < recipe.minTier || b.tier < recipe.minTier) return;
  const families = new Set([a.family, b.family]);
  if (!families.has(recipe.familyA) || !families.has(recipe.familyB)) return;
  if (!canPlaceRock(x, y, state.rocks, state.towers)) return;
  state.gold -= recipe.goldCost;
  state.towers = state.towers.filter((t) => t.id !== towerA && t.id !== towerB);
  const tier = Math.min(a.tier, b.tier) as GemTier;
  state.towers.push({
    id: state.nextEntityId++,
    x,
    y,
    family: recipe.familyA,
    tier,
    comboId: recipe.id,
  });
  refreshPath(state);
}

function startWave(state: FacetState): void {
  state.phase = 'wave';
  state.enemies = [];
  state.projectiles = [];
  state.wave++;
  state.waveSpawnDone = false;
  state.spawnQueue = [];
  const waveDef = sliceWaves.waves.find((w) => w.wave === state.wave);
  if (!waveDef) {
    state.phase = 'ended';
    return;
  }
  let delay = 0;
  for (const seg of waveDef.segments) {
    for (let i = 0; i < seg.count; i++) {
      state.spawnQueue.push({ enemyId: seg.enemyId, ticksUntil: delay });
      delay += seg.intervalTicks ?? 15;
    }
  }
  if (waveDef.bossId) {
    state.spawnQueue.push({ enemyId: waveDef.bossId, ticksUntil: delay + 30 });
  }
}

function tickFacet(state: FacetState, dt: number): void {
  if (state.phase !== 'wave') return;
  const ticks = Math.floor(dt * TICK_RATE);
  for (let i = 0; i < ticks; i++) {
    state.tick++;
    spawnEnemies(state);
    moveEnemies(state, 1 / TICK_RATE);
    towerCombat(state, 1 / TICK_RATE);
    if (state.enemies.length === 0 && state.spawnQueue.length === 0 && state.waveSpawnDone) {
      endWave(state);
      break;
    }
  }
}

function spawnEnemies(state: FacetState): void {
  if (state.spawnQueue.length === 0) {
    state.waveSpawnDone = true;
    return;
  }
  const next = state.spawnQueue[0]!;
  if (next.ticksUntil > 0) {
    next.ticksUntil--;
    return;
  }
  state.spawnQueue.shift();
  const def = ENEMIES[next.enemyId] ?? ENEMIES.runner;
  state.enemies.push({
    id: state.nextEntityId++,
    enemyId: next.enemyId,
    x: facetBoard.spawn.x + 0.5,
    y: facetBoard.spawn.y + 0.5,
    hp: def.hp,
    maxHp: def.hp,
    speed: def.speed,
    leakDamage: def.leak,
    bountyGold: def.gold,
  });
}

function moveEnemies(state: FacetState, dt: number): void {
  const nav = state.pathNav;
  if (!nav || nav.pathCells.size === 0) return;
  const remaining: EnemyState[] = [];
  for (const enemy of state.enemies) {
    const result = stepEnemy(enemy, nav, dt);
    if (result === 'leaked') {
      state.lives -= enemy.leakDamage;
      state.leaks++;
    } else {
      remaining.push(enemy);
    }
  }
  state.enemies = remaining;
  if (state.lives <= 0) state.phase = 'ended';
}

function stepEnemy(enemy: EnemyState, nav: PathNavData, dt: number): 'moving' | 'leaked' {
  const cx = Math.floor(enemy.x);
  const cy = Math.floor(enemy.y);
  const key = cellKey(cx, cy);
  const dist = nav.distanceToGoal.get(key) ?? Infinity;
  if (dist === 0) return 'leaked';

  let bestCell = { x: cx, y: cy };
  let bestDist = dist;
  for (const [dx, dy] of [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ] as const) {
    const nx = cx + dx;
    const ny = cy + dy;
    const nk = cellKey(nx, ny);
    const nd = nav.distanceToGoal.get(nk);
    if (nd === undefined) continue;
    if (nd < bestDist) {
      bestDist = nd;
      bestCell = { x: nx, y: ny };
    }
  }

  const tx = bestCell.x + 0.5;
  const ty = bestCell.y + 0.5;
  const dx = tx - enemy.x;
  const dy = ty - enemy.y;
  const len = Math.hypot(dx, dy) || 1;
  enemy.x += (dx / len) * enemy.speed * dt;
  enemy.y += (dy / len) * enemy.speed * dt;
  return 'moving';
}

function towerCombat(state: FacetState, dt: number): void {
  for (const tower of state.towers) {
    const gem = gemsById.get(getGemId(tower.family, tower.tier));
    if (!gem) continue;
    const range = gem.rangeTiles;
    let best: EnemyState | undefined;
    let bestDist = Infinity;
    for (const enemy of state.enemies) {
      const d = Math.hypot(enemy.x - tower.x - 0.5, enemy.y - tower.y - 0.5);
      if (d <= range && d < bestDist) {
        bestDist = d;
        best = enemy;
      }
    }
    if (!best) continue;
    best.hp -= (gem.damage / 1000) * dt * gem.attacksPerSecond;
    if (best.hp <= 0) {
      state.gold += best.bountyGold;
      state.enemiesKilled++;
      state.enemies = state.enemies.filter((e) => e.id !== best!.id);
    }
  }
}

function endWave(state: FacetState): void {
  state.gold += 15 + state.wave * 2;
  if (state.wave >= sliceWaves.totalWaves) {
    state.phase = 'ended';
    return;
  }
  beginBuildPhase(state);
}

export function facetSnapshot(state: FacetState): FacetSnapshot {
  const waveDef = sliceWaves.waves.find((w) => w.wave === state.wave + 1);
  return {
    phase: state.phase,
    buildStep: state.buildStep,
    wave: state.wave,
    lives: state.lives,
    gold: state.gold,
    rocksPlacedThisPhase: state.rocksPlacedThisPhase,
    offers: [...state.offers],
    claimedOffer: state.claimedOffer ? { ...state.claimedOffer } : null,
    rocks: state.rocks.map((r) => ({ ...r })),
    towers: state.towers.map((t) => ({ ...t })),
    enemies: state.enemies.map((e) => ({ ...e })),
    projectiles: state.projectiles.map((p) => ({ ...p })),
    ready: state.ready,
    rerollCost: rerollCost(state.rerollsThisPhase),
    rocksRemaining: ROCKS_PER_PHASE - state.rocksPlacedThisPhase,
    canUpgrade: state.buildStep === 'upgrade' && state.claimedOffer !== null,
    wavePreview: waveDef?.preview ?? 'Final',
  };
}
