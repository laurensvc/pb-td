import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  LUCKY_BOX_COST,
  MISSILE_BASE,
  RANDOM_GEM_COST,
  STARTING_LIVES,
  TOTAL_WAVES,
  areaDefinitions,
  areaTierKey,
  gemDefinitions,
  getArea,
  getEnemy,
  getUpgrade,
  upgrades,
} from './content';
import { acceptsRock, parityMatchesPlacement } from './boardParity';
import {
  ROCKS_PER_PHASE,
  defaultGemTargeting,
  generateOffers,
  isPlanningPhase,
  prospectRerollCost,
} from './buildPhase';
import { hexWorldCenter, isOnBoard, worldToHex } from './hexGrid';
import {
  effectiveDamageMultiplier,
  gemDamageType,
  isEnemyVisible,
} from './damage';
import { goldInterest, CRYSTAL_DUST_PER_WAVE, QUEST_REROLL_COST, waveIncome } from './economy';
import {
  canMergeGems,
  countIdenticalCluster,
  gemSellValue,
  getGemCombatStats,
  resolveMerge,
} from './gems';
import { nextCombatRoll } from './rng';
import { cellsAlongPath } from './pathBuild';
import {
  buildWaveSpawnTracker,
} from './waveTables';
import { buildMazePathNav, canPlaceRock, createMazeLayout, hasValidPath, rockRefundPercent } from './maze';
import { LEAK_EPSILON, pathProgressAt, resolveCheckpoints, stepEnemyOnPath } from './pathNav';
import {
  applyQuestRewards,
  createRunQuests,
  rerollQuest,
} from './quests';
import { areAdjacentGems } from './recipes';
import { cloneSave, createDefaultSave, getRespecCost } from './save';
import type {
  EnemyState,
  FxEvent,
  GameAction,
  GameState,
  GemFamilyId,
  GemLevel,
  GemState,
  HoldGem,
  MergeUndoEntry,
  MissileState,
  ProjectileState,
  QuestState,
  SaveState,
  Snapshot,
  TargetingMode,
  TierId,
  UpgradeDefinition,
  Vec2,
  WaveSegment,
} from './types';

const MAX_DT = 0.05;
const MISSILE_IMPACT_DELAY = 0.24;
const MISSILE_FX_LIFE = 0.42;
const PROJECTILE_HIT_DISTANCE = 0.12;

export function createGame(save: SaveState = createDefaultSave()): GameState {
  return createAttempt(cloneSave(save), 'a1', 'normal');
}

export function dispatchGameAction(state: GameState, action: GameAction): void {
  switch (action.type) {
    case 'startArea':
      replaceState(state, createAttempt(state.save, action.areaId, action.tierId));
      break;
    case 'startWave':
      startWave(state);
      break;
    case 'selectPlacementMode':
      state.placementMode = action.mode;
      if (action.mode !== 'merge') state.mergeSourceGemId = null;
      break;
    case 'selectInventoryGem':
      state.selectedInventoryGemId = action.gemId;
      if (action.gemId !== null) state.placementMode = 'gem';
      break;
    case 'placeGem':
      placeGem(state, action.x, action.y);
      break;
    case 'placeRock':
      placeRock(state, action.x, action.y);
      break;
    case 'finishRocks':
      finishRocks(state);
      break;
    case 'claimOffer':
      claimOffer(state, action.index);
      break;
    case 'rerollOffers':
      rerollOffers(state);
      break;
    case 'upgradeRock':
      upgradeRock(state, action.x, action.y);
      break;
    case 'sellRock':
      sellRock(state, action.x, action.y);
      break;
    case 'sellGem':
      sellGem(state, action.gemId);
      break;
    case 'selectMergeSource':
      state.mergeSourceGemId = action.gemId;
      state.placementMode = 'merge';
      break;
    case 'mergeGems':
      mergeGems(state, action.targetGemId);
      break;
    case 'pickUpGem':
      pickUpGem(state, action.gemId);
      break;
    case 'swapGemWithHold':
      swapGemWithHold(state, action.gemId);
      break;
    case 'selectHoldGem':
      selectHoldGem(state);
      break;
    case 'placeHoldGem':
      placeHoldGem(state, action.x, action.y);
      break;
    case 'clearHold':
      clearHold(state);
      break;
    case 'undoMerge':
      undoMerge(state);
      break;
    case 'cycleGemTargeting':
      cycleGemTargeting(state, action.gemId);
      break;
    case 'setGameSpeed':
      state.gameSpeed = action.speed;
      break;
    case 'previewRockPath':
      previewRockPathAction(state, action.x, action.y);
      break;
    case 'rerollQuest':
      rerollQuestAction(state, action.questId);
      break;
    case 'buyGem':
      buyGem(state, action.family);
      break;
    case 'buyRandomGem':
      buyRandomGem(state);
      break;
    case 'buyLuckyBox':
      buyLuckyBox(state);
      break;
    case 'fireMissile':
      fireMissile(state, action.x, action.y);
      break;
    case 'buyUpgrade':
      buyUpgrade(state, action.upgradeId);
      break;
    case 'respecUpgrades':
      respecUpgrades(state);
      break;
    case 'retry':
      replaceState(state, createAttempt(state.save, state.areaId, state.tierId));
      break;
    case 'resetSave':
      replaceState(state, createAttempt(createDefaultSave(), 'a1', 'normal'));
      break;
  }
}

export function tickGame(state: GameState, dt: number): void {
  const step = Math.min(MAX_DT, Math.max(0, dt));
  tickTransientFx(state, step);
  const pendingMissiles = state.missiles.some((missile) => missile.active && missile.impactIn > 0);
  if (state.status !== 'running') {
    if (pendingMissiles) {
      tickMissiles(state, step);
      clearInactive(state);
    }
    return;
  }

  state.time += step;
  state.missileCooldownLeft = Math.max(0, state.missileCooldownLeft - step);
  spawnEnemies(state, step);
  tickEnemies(state, step);
  tickGems(state, step);
  tickProjectiles(state, step);
  tickMissiles(state, step);
  clearInactive(state);
  completeWaveOrAttempt(state);
}

export function createSnapshot(state: GameState): Snapshot {
  const area = getArea(state.areaId);
  const tier = area.tiers[state.tierId];
  const wave = tier.waves[state.waveIndex];
  const waveNum = Math.min(state.waveIndex + 1, tier.waves.length);
  const snapshot: Snapshot = {
    status: state.status,
    areaId: state.areaId,
    areaName: area.name,
    tierId: state.tierId,
    time: state.time,
    wave: Math.min(state.waveIndex + 1, tier.waves.length),
    totalWaves: tier.waves.length,
    lives: state.lives,
    maxLives: state.maxLives,
    gold: state.gold,
    rockCost: 0,
    activeEnemies: state.enemies.filter((enemy) => enemy.alive).length,
    stars: state.save.stars,
    crowns: state.save.crowns,
    attemptStars: state.rewards.stars,
    attemptCrowns: state.rewards.crowns,
    missileCooldownLeft: state.missileCooldownLeft,
    missileCooldown: getMissileStats(state).cooldown,
    placementMode: state.placementMode,
    buildStep: state.buildStep,
    rocksPlacedThisPhase: state.rocksPlacedThisPhase,
    rocksRemaining: Math.max(0, ROCKS_PER_PHASE - state.rocksPlacedThisPhase),
    offers: state.offers.map((o) => ({ ...o })),
    claimedOffer: state.claimedOffer ? { ...state.claimedOffer } : null,
    holdGem: state.holdGem ? { ...state.holdGem } : null,
    mergeUndoCount: state.mergeUndoStack.length,
    prospectRerollCost: prospectRerollCost(state.rerollsThisPhase),
    rockPathDelta: state.rockPathDelta,
    nextWavePreview: buildWavePreview(state),
    waveSpawnTracker: buildCurrentWaveSpawnTracker(state),
    runSeed: state.runSeed,
    gameSpeed: state.gameSpeed,
    crystalDust: state.crystalDust,
    missileUnlocked: hasMissileUnlocked(state.save),
    rockCount: state.rocks.length,
    inventory: state.inventory.map((g) => ({ ...g })),
    selectedInventoryGemId: state.selectedInventoryGemId,
    mergeSourceGemId: state.mergeSourceGemId,
    placedGems: state.gems.map((g) => ({
      id: g.id,
      family: g.family,
      level: g.level,
      x: g.x,
      y: g.y,
      targeting: g.targeting,
    })),
    toast: state.toast,
    unlockedGemFamilies: [...state.save.unlockedGemFamilies],
    canStartWave:
      isPlanningPhase(state.status) && state.buildStep === 'ready',
    canRetry: state.status === 'lost' || state.status === 'cleared',
    isBossWave: wave?.isBoss ?? false,
    pathLength: state.pathNav.maxProgress,
    waveIncome: waveIncome(waveNum),
    interestPreview: goldInterest(state.gold),
    quests: state.quests.map((q) => ({ ...q })),
    greatUnlocked: [...state.greatUnlocked],
    fxEvents: state.fxEvents.map((fx) => ({ ...fx })),
    resultTitle:
      state.status === 'lost'
        ? `Wave ${state.waveIndex + 1} breached the nexus.`
        : state.status === 'cleared'
          ? 'Season cleared!'
          : null,
    resultMessage:
      state.status === 'lost'
        ? `${state.killedEnemies} invaders destroyed. Stars and meta progress kept.`
        : state.status === 'cleared'
          ? state.rewards.crowns > 0
            ? 'All 50 waves cleared. Crown secured for this tier.'
            : 'All 50 waves cleared. Mastery held.'
          : null,
  };
  return snapshot;
}

export function consumeTransientUi(state: GameState): void {
  state.toast = null;
  state.rockPathDelta = null;
}

export function getMissileStats(state: GameState): {
  damage: number;
  radius: number;
  cooldown: number;
} {
  let damage = MISSILE_BASE.damage;
  let radius = MISSILE_BASE.radius;
  let cooldown = MISSILE_BASE.cooldown;
  for (const upgrade of purchasedUpgrades(state.save)) {
    if (upgrade.missileStat === 'damage') damage += upgrade.value;
    if (upgrade.missileStat === 'radius') radius += upgrade.value;
    if (upgrade.missileStat === 'cooldown') cooldown += upgrade.value;
  }
  return {
    damage: Math.round(damage),
    radius: Number(Math.max(0.55, radius).toFixed(2)),
    cooldown: Number(Math.max(0.8, cooldown).toFixed(2)),
  };
}

export function canBuyUpgrade(save: SaveState, upgrade: UpgradeDefinition): boolean {
  if (save.purchasedUpgradeIds.includes(upgrade.id)) return false;
  if (save.stars < upgrade.costStars) return false;
  if (save.crowns < (upgrade.costCrowns ?? 0)) return false;
  return (upgrade.requires ?? []).every((requiredId) =>
    save.purchasedUpgradeIds.includes(requiredId),
  );
}

export function isTierUnlocked(save: SaveState, areaId: string, tierId: TierId): boolean {
  if (tierId === 'normal')
    return (
      areaDefinitions.findIndex((area) => area.id === areaId) === 0 ||
      save.clearedAreaTiers.includes(areaTierKey(previousAreaId(areaId), 'normal'))
    );
  return save.clearedAreaTiers.includes(areaTierKey(areaId, 'normal'));
}

export function canPlaceRockAt(state: GameState, x: number, y: number): boolean {
  if (!isPlanningPhase(state.status)) return false;
  if (state.buildStep !== 'rocks') return false;
  if (state.rocksPlacedThisPhase >= ROCKS_PER_PHASE) return false;
  const cell = toCell(x, y);
  if (!isOnBoard(cell.x, cell.y, BOARD_WIDTH, BOARD_HEIGHT)) return false;
  if (!acceptsRock(cell.x, cell.y) || rockAtCell(state, cell.x, cell.y)) return false;
  return canPlaceRock(mazeLayoutFromState(state), cell.x, cell.y);
}

export function canPlaceHoldGemAt(state: GameState, x: number, y: number): boolean {
  if (!isPlanningPhase(state.status) || !state.holdGem) return false;
  const cell = toCell(x, y);
  if (!isOnBoard(cell.x, cell.y, BOARD_WIDTH, BOARD_HEIGHT)) return false;
  return (
    parityMatchesPlacement(cell.x, cell.y, 'gem') &&
    !rockAtCell(state, cell.x, cell.y) &&
    !gemAtCell(state, cell.x, cell.y)
  );
}

export function rockPathLengthDelta(state: GameState, x: number, y: number): number | null {
  if (!isPlanningPhase(state.status) || state.buildStep !== 'rocks') return null;
  const cell = toCell(x, y);
  if (!acceptsRock(cell.x, cell.y) || rockAtCell(state, cell.x, cell.y)) return null;
  const layout = mazeLayoutFromState(state);
  if (!canPlaceRock(layout, cell.x, cell.y)) return null;
  const before = state.pathNav.maxProgress;
  const area = getArea(state.areaId);
  const corridorCells = cellsAlongPath(area.path);
  const checkpoints =
    area.pathNav.checkpoints.length > 0
      ? area.pathNav.checkpoints
      : resolveCheckpoints(area.path, corridorCells);
  const newRocks = [...state.rocks, { x: cell.x, y: cell.y, costPaid: 0 }];
  const newLayout = createMazeLayout(
    BOARD_WIDTH,
    BOARD_HEIGHT,
    checkpoints[0]!,
    checkpoints[checkpoints.length - 1]!,
    newRocks,
    state.gems.map((gem) => toCell(gem.x, gem.y)),
    checkpoints,
  );
  if (!hasValidPath(newLayout)) return null;
  const after = buildMazePathNav(newLayout).maxProgress;
  return after - before;
}

export function previewRockPath(state: GameState, x: number, y: number): void {
  state.rockPathDelta = rockPathLengthDelta(state, x, y);
}

export function clearRockPathPreview(state: GameState): void {
  state.rockPathDelta = null;
}

function previewRockPathAction(state: GameState, x: number, y: number): void {
  previewRockPath(state, x, y);
}

function buildCurrentWaveSpawnTracker(state: GameState): Snapshot['waveSpawnTracker'] {
  if (state.status !== 'running') return null;
  const area = getArea(state.areaId);
  const wave = area.tiers[state.tierId].waves[state.waveIndex];
  if (!wave) return null;
  return buildWaveSpawnTracker(
    wave.segments,
    state.segmentIndex,
    state.enemiesToSpawn,
    state.enemies.filter((e) => e.alive).length,
    state.killedThisWave,
    (id) => getEnemy(id).name,
  );
}

function hasMissileUnlocked(save: SaveState): boolean {
  return save.purchasedUpgradeIds.some((id) => id.startsWith('missile-'));
}

function buildWavePreview(state: GameState): Snapshot['nextWavePreview'] {
  const area = getArea(state.areaId);
  const wave = area.tiers[state.tierId].waves[state.waveIndex];
  if (!wave) return [];
  return wave.segments.map((segment) => {
    const def = getEnemy(segment.enemyId);
    const tags: string[] = [];
    if (def.flying) tags.push('air');
    if (def.invisible) tags.push('stealth');
    if (def.magicImmune) tags.push('magic↓');
    if (def.physicalImmune) tags.push('phys↓');
    if (def.isBoss) tags.push('boss');
    return {
      enemyId: segment.enemyId,
      count: segment.count,
      name: def.name,
      tags,
    };
  });
}

function gemCanTargetAir(family: GemFamilyId): boolean {
  const def = gemDefinitions[family];
  if (def.hybrid) return true;
  return family === 'nova' || family === 'arcane' || family === 'prism' || family === 'plasma_mortar' || family === 'solar_flare';
}

export function canPlaceGemAt(state: GameState, x: number, y: number): boolean {
  if (!isPlanningPhase(state.status)) return false;
  const cell = toCell(x, y);
  if (!isOnBoard(cell.x, cell.y, BOARD_WIDTH, BOARD_HEIGHT)) return false;
  return (
    parityMatchesPlacement(cell.x, cell.y, 'gem') &&
    !rockAtCell(state, cell.x, cell.y) &&
    !gemAtCell(state, cell.x, cell.y) &&
    state.selectedInventoryGemId !== null
  );
}

function createAttempt(save: SaveState, areaId: string, tierId: TierId): GameState {
  const safeTier = isTierUnlocked(save, areaId, tierId) ? tierId : 'normal';
  const tier = getArea(areaId).tiers[safeTier];
  const runSeed = (Date.now() ^ (save.stars * 997)) | 0;

  const attempt: GameState = {
    status: 'idle',
    areaId,
    tierId: safeTier,
    time: 0,
    waveIndex: 0,
    segmentIndex: 0,
    enemiesToSpawn: 0,
    spawnTimer: 0,
    lives: STARTING_LIVES,
    maxLives: STARTING_LIVES,
    gold: tier.startingGold,
    rocksPlaced: 0,
    missileCooldownLeft: 0,
    selectedInventoryGemId: null,
    mergeSourceGemId: null,
    placementMode: 'rock',
    buildStep: 'rocks',
    runSeed,
    combatRollNonce: 0,
    gameSpeed: 1,
    crystalDust: 0,
    killedThisWave: 0,
    rocksPlacedThisPhase: 0,
    rerollsThisPhase: 0,
    offers: [],
    claimedOffer: null,
    holdGem: null,
    mergeUndoStack: [],
    toast: null,
    rockPathDelta: null,
    pathNav: getArea(areaId).pathNav,
    rocks: [],
    inventory: [],
    enemies: [],
    gems: [],
    projectiles: [],
    missiles: [],
    rewards: { stars: 0, crowns: 0 },
    leakedEnemies: 0,
    killedEnemies: 0,
    nextEnemyId: 1,
    nextGemId: 1,
    nextInventoryGemId: 1,
    nextProjectileId: 1,
    nextMissileId: 1,
    nextFxId: 1,
    quests: createRunQuests(areaId.charCodeAt(1) + tier.startingGold),
    greatUnlocked: [],
    waveLeaked: false,
    mergeCount: 0,
    fxEvents: [],
    save: cloneSave(save),
  };
  rebuildPathNav(attempt);
  beginBuildPhase(attempt);
  return attempt;
}

function beginBuildPhase(state: GameState): void {
  state.buildStep = 'rocks';
  state.rocksPlacedThisPhase = 0;
  state.rerollsThisPhase = 0;
  state.claimedOffer = null;
  state.holdGem = null;
  state.mergeUndoStack = [];
  state.placementMode = 'rock';
  state.mergeSourceGemId = null;
  state.offers = generateOffers(
    state.runSeed,
    state.waveIndex,
    0,
    state.save.unlockedGemFamilies,
  );
}

function finishRocks(state: GameState): void {
  if (!isPlanningPhase(state.status)) return;
  if (state.buildStep !== 'rocks') return;
  state.buildStep = 'prospect';
}

function claimOffer(state: GameState, index: number): void {
  if (!isPlanningPhase(state.status)) return;
  if (state.buildStep === 'rocks') finishRocks(state);
  if (state.buildStep !== 'prospect' && state.buildStep !== 'upgrade') return;
  const offer = state.offers[index];
  if (!offer) return;
  if (state.rocks.length === 0) {
    state.toast = 'Place at least one rock before claiming a gem offer.';
    return;
  }
  state.claimedOffer = { ...offer };
  state.buildStep = 'upgrade';
  state.placementMode = 'rock';
}

function rerollOffers(state: GameState): void {
  if (!isPlanningPhase(state.status)) return;
  if (state.buildStep === 'rocks') finishRocks(state);
  if (state.buildStep !== 'prospect' && state.buildStep !== 'upgrade') return;
  const cost = prospectRerollCost(state.rerollsThisPhase);
  if (state.gold < cost) return;
  state.gold -= cost;
  state.rerollsThisPhase += 1;
  state.offers = generateOffers(
    state.runSeed,
    state.waveIndex,
    state.rerollsThisPhase,
    state.save.unlockedGemFamilies,
  );
  state.claimedOffer = null;
  state.buildStep = 'prospect';
}

function upgradeRock(state: GameState, x: number, y: number): void {
  if (!isPlanningPhase(state.status)) return;
  if (state.buildStep !== 'upgrade' || !state.claimedOffer) return;
  const cell = toCell(x, y);
  const rockIdx = state.rocks.findIndex((r) => r.x === cell.x && r.y === cell.y);
  if (rockIdx < 0) return;
  const { family, level } = state.claimedOffer;
  state.rocks.splice(rockIdx, 1);
  const center = hexWorldCenter(cell.x, cell.y);
  state.gems.push({
    id: state.nextGemId++,
    family,
    level,
    x: center.x,
    y: center.y,
    cooldownLeft: 0,
    kills: 0,
    damageDone: 0,
    targeting: defaultGemTargeting(),
  });
  state.claimedOffer = null;
  state.buildStep = 'ready';
  state.placementMode = 'merge';
  rebuildPathNav(state);
}

function startWave(state: GameState): void {
  if (!isPlanningPhase(state.status)) return;
  if (state.buildStep !== 'ready') return;
  const area = getArea(state.areaId);
  const wave = area.tiers[state.tierId].waves[state.waveIndex];
  if (!wave) return;
  state.mergeUndoStack = [];
  state.killedThisWave = 0;
  state.status = 'running';
  state.segmentIndex = 0;
  state.enemiesToSpawn = wave.segments[0]?.count ?? 0;
  state.spawnTimer = 0;
  state.waveLeaked = false;
}

function placeGem(state: GameState, x: number, y: number): void {
  if (state.status === 'running' || state.selectedInventoryGemId === null) return;
  const cell = toCell(x, y);
  if (!canPlaceGemAt(state, x, y)) return;

  const invIndex = state.inventory.findIndex((g) => g.id === state.selectedInventoryGemId);
  if (invIndex < 0) return;
  const invGem = state.inventory[invIndex];

  const center = hexWorldCenter(cell.x, cell.y);
  state.gems.push({
    id: state.nextGemId++,
    family: invGem.family,
    level: invGem.level,
    x: center.x,
    y: center.y,
    cooldownLeft: 0,
    kills: 0,
    damageDone: 0,
    targeting: defaultGemTargeting(),
  });
  state.inventory.splice(invIndex, 1);
  state.selectedInventoryGemId = state.inventory[0]?.id ?? null;
  rebuildPathNav(state);
}

function placeRock(state: GameState, x: number, y: number): void {
  if (!isPlanningPhase(state.status)) return;
  if (state.buildStep !== 'rocks') return;
  const cell = toCell(x, y);
  if (!canPlaceRockAt(state, x, y)) {
    if (acceptsRock(cell.x, cell.y) && !rockAtCell(state, cell.x, cell.y)) {
      state.toast = 'That rock would break the route through checkpoints.';
    }
    return;
  }
  state.rocks.push({ x: cell.x, y: cell.y, costPaid: 0 });
  state.rocksPlaced += 1;
  state.rocksPlacedThisPhase += 1;
  if (state.rocksPlacedThisPhase >= ROCKS_PER_PHASE) {
    state.buildStep = 'prospect';
  }
  rebuildPathNav(state);
}

function sellRock(state: GameState, x: number, y: number): void {
  if (state.status === 'running') return;
  const cell = toCell(x, y);
  const index = state.rocks.findIndex((rock) => rock.x === cell.x && rock.y === cell.y);
  if (index < 0) return;
  if (
    isPlanningPhase(state.status) &&
    state.buildStep === 'upgrade' &&
    state.claimedOffer &&
    state.rocks.length <= 1
  ) {
    state.toast = 'Keep a rock to apply your claimed upgrade.';
    return;
  }
  const rock = state.rocks[index];
  const refund = Math.floor(rock.costPaid * rockRefundPercent(state.rocksPlaced));
  state.gold += refund;
  state.rocks.splice(index, 1);
  state.rocksPlaced = Math.max(0, state.rocksPlaced - 1);
  rebuildPathNav(state);
}

function sellGem(state: GameState, gemId: number): void {
  if (state.status === 'running') return;
  const index = state.gems.findIndex((g) => g.id === gemId);
  if (index < 0) return;
  const gem = state.gems[index];
  state.gold += gemSellValue(gem.family, gem.level);
  state.gems.splice(index, 1);
  if (state.mergeSourceGemId === gemId) state.mergeSourceGemId = null;
  rebuildPathNav(state);
}

function mergeGems(state: GameState, targetGemId: number): void {
  if (!isPlanningPhase(state.status) || state.mergeSourceGemId === null) return;
  const source = state.gems.find((g) => g.id === state.mergeSourceGemId);
  const target = state.gems.find((g) => g.id === targetGemId);
  if (!source || !target || source.id === target.id) return;
  const clusterSize = countIdenticalCluster(state.gems, source);
  const result = resolveMerge(source, target, clusterSize);
  if (!result || !canMergeGems(source, target, state.greatUnlocked)) return;
  if (!areAdjacentGems(source.x, source.y, target.x, target.y)) return;

  const undoEntry: MergeUndoEntry = {
    gems: state.gems.map((g) => ({ ...g })),
    removedGemId: source.id,
  };
  state.mergeUndoStack.push(undoEntry);

  target.family = result.family;
  target.level = result.level;
  state.gems = state.gems.filter((g) => g.id !== source.id);
  state.mergeSourceGemId = null;
  state.placementMode = 'merge';
  state.mergeCount += 1;
  trackQuestProgress(state, 'merge', 1);
  pushFx(state, 'merge', target.x, target.y, result.hybrid ? 'Hybrid!' : `L${result.level}`);
  rebuildPathNav(state);
}

function undoMerge(state: GameState): void {
  if (!isPlanningPhase(state.status)) return;
  const entry = state.mergeUndoStack.pop();
  if (!entry) return;
  state.gems = entry.gems.map((g) => ({ ...g }));
  state.mergeSourceGemId = null;
  state.mergeCount = Math.max(0, state.mergeCount - 1);
  rebuildPathNav(state);
}

function pickUpGem(state: GameState, gemId: number): void {
  if (state.status === 'running') return;
  if (isPlanningPhase(state.status)) {
    swapGemWithHold(state, gemId);
    return;
  }
  const index = state.gems.findIndex((g) => g.id === gemId);
  if (index < 0) return;
  const gem = state.gems[index];
  state.inventory.push({
    id: state.nextInventoryGemId++,
    family: gem.family,
    level: gem.level,
  });
  state.gems.splice(index, 1);
  if (state.mergeSourceGemId === gemId) state.mergeSourceGemId = null;
  if (state.selectedInventoryGemId === null) {
    state.selectedInventoryGemId = state.inventory[state.inventory.length - 1].id;
  }
  rebuildPathNav(state);
}

function swapGemWithHold(state: GameState, gemId: number): void {
  if (!isPlanningPhase(state.status)) return;
  const index = state.gems.findIndex((g) => g.id === gemId);
  if (index < 0) return;
  const gem = state.gems[index];
  const incoming: HoldGem = { family: gem.family, level: gem.level };

  if (state.holdGem) {
    gem.family = state.holdGem.family;
    gem.level = state.holdGem.level;
    state.holdGem = incoming;
  } else {
    state.gems.splice(index, 1);
    state.holdGem = incoming;
  }
  if (state.mergeSourceGemId === gemId) state.mergeSourceGemId = null;
  rebuildPathNav(state);
}

function selectHoldGem(state: GameState): void {
  if (!isPlanningPhase(state.status) || !state.holdGem) return;
  state.placementMode = 'hold';
  state.mergeSourceGemId = null;
  state.selectedInventoryGemId = null;
}

function placeHoldGem(state: GameState, x: number, y: number): void {
  if (!isPlanningPhase(state.status) || !state.holdGem) return;
  const cell = toCell(x, y);
  const existing = state.gems.find((g) => {
    const gemCell = worldToHex(g.x, g.y);
    return gemCell.x === cell.x && gemCell.y === cell.y;
  });

  if (existing) {
    swapGemWithHold(state, existing.id);
    return;
  }

  if (
    !parityMatchesPlacement(cell.x, cell.y, 'gem') ||
    rockAtCell(state, cell.x, cell.y) ||
    gemAtCell(state, cell.x, cell.y)
  ) {
    return;
  }

  const center = hexWorldCenter(cell.x, cell.y);
  state.gems.push({
    id: state.nextGemId++,
    family: state.holdGem.family,
    level: state.holdGem.level,
    x: center.x,
    y: center.y,
    cooldownLeft: 0,
    kills: 0,
    damageDone: 0,
    targeting: defaultGemTargeting(),
  });
  state.holdGem = null;
  state.placementMode = 'merge';
  rebuildPathNav(state);
}

function clearHold(state: GameState): void {
  if (!isPlanningPhase(state.status) || !state.holdGem) return;
  state.holdGem = null;
  if (state.placementMode === 'hold') state.placementMode = 'merge';
}

function cycleGemTargeting(state: GameState, gemId: number): void {
  if (!isPlanningPhase(state.status)) return;
  const gem = state.gems.find((g) => g.id === gemId);
  if (!gem) return;
  const order: TargetingMode[] = ['first', 'last', 'strong', 'weak'];
  const idx = order.indexOf(gem.targeting);
  gem.targeting = order[(idx + 1) % order.length]!;
}

function rerollQuestAction(state: GameState, questId: string): void {
  if (state.status === 'running') return;
  if (state.gold < QUEST_REROLL_COST) return;
  const quest = state.quests.find((q) => q.id === questId);
  if (!quest || quest.completed) return;
  state.gold -= QUEST_REROLL_COST;
  rerollQuest(state.quests, questId, Math.floor(state.time * 1000) + state.gold);
}

function buyGem(state: GameState, family: GemFamilyId): void {
  if (isPlanningPhase(state.status)) return;
  if (state.status === 'running') return;
  if (!state.save.unlockedGemFamilies.includes(family)) return;
  const cost = gemDefinitions[family].shopCost;
  if (state.gold < cost) return;
  state.gold -= cost;
  addInventoryGem(state, family, 1);
}

function buyRandomGem(state: GameState): void {
  if (isPlanningPhase(state.status)) return;
  if (state.status === 'running') return;
  if (state.gold < RANDOM_GEM_COST) return;
  const families = state.save.unlockedGemFamilies;
  if (families.length === 0) return;
  state.gold -= RANDOM_GEM_COST;
  const family = families[Math.floor(nextCombatRoll(state) * families.length)]!;
  addInventoryGem(state, family, 1);
}

function buyLuckyBox(state: GameState): void {
  if (isPlanningPhase(state.status)) return;
  if (state.status === 'running') return;
  if (state.gold < LUCKY_BOX_COST) return;
  const families = state.save.unlockedGemFamilies;
  if (families.length === 0) return;
  state.gold -= LUCKY_BOX_COST;
  const family = families[Math.floor(nextCombatRoll(state) * families.length)]!;
  const level = (1 + Math.floor(nextCombatRoll(state) * 3)) as GemLevel;
  addInventoryGem(state, family, level);
}

function addInventoryGem(state: GameState, family: GemFamilyId, level: GemLevel): void {
  state.inventory.push({
    id: state.nextInventoryGemId++,
    family,
    level,
  });
  if (state.selectedInventoryGemId === null) {
    state.selectedInventoryGemId = state.inventory[state.inventory.length - 1].id;
  }
}

function fireMissile(state: GameState, x: number, y: number): void {
  if (state.status !== 'running' || state.missileCooldownLeft > 0) return;
  if (!hasMissileUnlocked(state.save)) return;
  const stats = getMissileStats(state);
  state.missiles.push({
    id: state.nextMissileId++,
    x,
    y,
    damage: stats.damage,
    radius: stats.radius,
    impactIn: MISSILE_IMPACT_DELAY,
    life: MISSILE_FX_LIFE,
    active: true,
  });
  state.missileCooldownLeft = stats.cooldown;
}

function buyUpgrade(state: GameState, upgradeId: string): void {
  const upgrade = getUpgrade(upgradeId);
  if (!canBuyUpgrade(state.save, upgrade)) return;
  state.save.stars -= upgrade.costStars;
  state.save.crowns -= upgrade.costCrowns ?? 0;
  state.save.spentStars += upgrade.costStars;
  state.save.purchasedUpgradeIds.push(upgrade.id);
  if (
    upgrade.unlockGemFamily &&
    !state.save.unlockedGemFamilies.includes(upgrade.unlockGemFamily)
  ) {
    state.save.unlockedGemFamilies.push(upgrade.unlockGemFamily);
  }
}

function respecUpgrades(state: GameState): void {
  const cost = getRespecCost(state.save);
  if (state.save.stars < cost) return;
  const purchased = purchasedUpgrades(state.save);
  const starRefund = purchased.reduce((total, upgrade) => total + upgrade.costStars, 0) - cost;
  const crownRefund = purchased.reduce((total, upgrade) => total + (upgrade.costCrowns ?? 0), 0);
  state.save.stars += Math.max(0, starRefund);
  state.save.crowns += crownRefund;
  state.save.spentStars = 0;
  state.save.purchasedUpgradeIds = [];
  state.save.unlockedGemFamilies = ['kinetic', 'verdant'];
}

function spawnEnemies(state: GameState, dt: number): void {
  if (state.enemiesToSpawn <= 0) return;
  const area = getArea(state.areaId);
  const tier = area.tiers[state.tierId];
  const wave = tier.waves[state.waveIndex];
  if (!wave) return;

  state.spawnTimer -= dt;
  while (state.enemiesToSpawn > 0 && state.spawnTimer <= 0) {
    const segment = wave.segments[state.segmentIndex];
    if (!segment) break;
    spawnEnemy(state, segment.enemyId, tier);
    state.enemiesToSpawn -= 1;
    state.spawnTimer += wave.spawnInterval;

    if (state.enemiesToSpawn <= 0) {
      advanceSegment(state, wave.segments);
    }
  }
}

function advanceSegment(state: GameState, segments: WaveSegment[]): void {
  if (state.segmentIndex < segments.length - 1) {
    state.segmentIndex += 1;
    state.enemiesToSpawn = segments[state.segmentIndex].count;
  }
}

function spawnEnemy(
  state: GameState,
  enemyId: string,
  tier: ReturnType<typeof getArea>['tiers'][TierId],
): void {
  const definition = getEnemy(enemyId);
  const spawn = state.pathNav.spawnCell;
  const spawnCenter = hexWorldCenter(spawn.x, spawn.y);
  const waveScale = 1 + state.waveIndex * 0.04;
  const hp = Math.round(definition.hp * tier.enemyHpMultiplier * waveScale);
  const shield = Math.round((definition.shield ?? 0) * tier.enemyHpMultiplier * waveScale);
  state.enemies.push({
    id: state.nextEnemyId++,
    definitionId: definition.id,
    name: definition.name,
    x: spawnCenter.x,
    y: spawnCenter.y,
    pathProgress: pathProgressAt(state.pathNav, spawnCenter.x, spawnCenter.y),
    checkpointIndex: 1,
    hp,
    maxHp: hp,
    shield,
    maxShield: shield,
    speed: definition.speed * tier.enemySpeedMultiplier,
    rewardStars: Math.ceil(definition.rewardStars * tier.starMultiplier),
    rewardGold: Math.ceil(definition.rewardGold * tier.goldMultiplier),
    color: definition.color,
    alive: true,
    leaked: false,
    flying: definition.flying ?? false,
    invisible: definition.invisible ?? false,
    magicImmune: definition.magicImmune ?? false,
    physicalImmune: definition.physicalImmune ?? false,
    revealedUntil: 0,
    poisonDps: 0,
    poisonUntil: 0,
    slowUntil: 0,
    slowFactor: 1,
    armorReduction: 0,
  });
}

function tickEnemies(state: GameState, dt: number): void {
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    if (enemy.poisonUntil > state.time && enemy.poisonDps > 0) {
      applyDamage(state, enemy, enemy.poisonDps * dt, null, {
        bypassShield: false,
        damageType: 'magic',
      });
    }
    const speedMult = enemy.slowUntil > state.time ? 1 - enemy.slowFactor : 1;
    const result = enemy.flying
      ? stepFlyingEnemy(enemy, state.pathNav, dt * speedMult)
      : stepEnemyOnPath(enemy, state.pathNav, dt * speedMult);
    if (result === 'leaked') {
      enemy.alive = false;
      enemy.leaked = true;
      state.leakedEnemies += 1;
      state.waveLeaked = true;
      const leakDamage = getEnemy(enemy.definitionId).leakDamage ?? 1;
      state.lives = Math.max(0, state.lives - leakDamage);
      if (state.lives <= 0) state.status = 'lost';
    }
  }
}

function stepFlyingEnemy(
  enemy: EnemyState,
  nav: GameState['pathNav'],
  dt: number,
): 'moving' | 'leaked' {
  const targetIdx = Math.min(enemy.checkpointIndex, nav.checkpoints.length - 1);
  const target = nav.checkpoints[targetIdx]!;
  const targetCenter = hexWorldCenter(target.x, target.y);
  const dx = targetCenter.x - enemy.x;
  const dy = targetCenter.y - enemy.y;
  const dist = Math.hypot(dx, dy);
  const travel = enemy.speed * dt;

  if (dist <= LEAK_EPSILON) {
    if (targetIdx >= nav.checkpoints.length - 1) {
      return 'leaked';
    }
    enemy.checkpointIndex = targetIdx + 1;
    return 'moving';
  }

  if (travel >= dist) {
    enemy.x = targetCenter.x;
    enemy.y = targetCenter.y;
  } else {
    enemy.x += (dx / dist) * travel;
    enemy.y += (dy / dist) * travel;
  }
  enemy.pathProgress = pathProgressAt(nav, enemy.x, enemy.y);
  return 'moving';
}

function tickGems(state: GameState, dt: number): void {
  for (const gem of state.gems) {
    gem.cooldownLeft = Math.max(0, gem.cooldownLeft - dt);
    if (gem.cooldownLeft > 0) continue;
    const stats = getGemCombatStats(state.save, gem.family, gem.level);
    const target = findGemTarget(state, gem, stats.range);
    if (!target) continue;
    state.projectiles.push(makeProjectile(state, gem, stats, target));
    gem.cooldownLeft = stats.cooldown;
  }
}

function tickProjectiles(state: GameState, dt: number): void {
  for (const projectile of state.projectiles) {
    if (!projectile.active) continue;
    const target = state.enemies.find((enemy) => enemy.id === projectile.targetId && enemy.alive);
    if (!target) {
      projectile.active = false;
      continue;
    }
    const dx = target.x - projectile.x;
    const dy = target.y - projectile.y;
    const distance = Math.hypot(dx, dy);
    const travel = projectile.speed * dt;
    if (distance <= PROJECTILE_HIT_DISTANCE || travel >= distance) {
      projectile.x = target.x;
      projectile.y = target.y;
      projectile.active = false;
      hitWithProjectile(state, projectile, target);
    } else {
      projectile.x += (dx / distance) * travel;
      projectile.y += (dy / distance) * travel;
    }
  }
}

function tickMissiles(state: GameState, dt: number): void {
  for (const missile of state.missiles) {
    if (!missile.active) continue;
    missile.impactIn -= dt;
    if (missile.impactIn > 0) continue;
    missile.active = false;
    damageInRadius(state, missile);
  }
}

function tickTransientFx(state: GameState, dt: number): void {
  for (const missile of state.missiles) {
    if (missile.active) continue;
    missile.life -= dt;
  }
  state.fxEvents = state.fxEvents.filter((fx) => {
    fx.life -= dt;
    return fx.life > 0;
  });
}

function pushFx(
  state: GameState,
  kind: FxEvent['kind'],
  x: number,
  y: number,
  text: string,
): void {
  state.fxEvents.push({
    id: state.nextFxId++,
    kind,
    x: x + 0.5,
    y: y + 0.5,
    text,
    life: kind === 'merge' ? 1.2 : 0.9,
  });
}

function trackQuestProgress(
  state: GameState,
  templateId: QuestState['templateId'],
  amount: number,
): void {
  for (const quest of state.quests) {
    if (quest.completed || quest.templateId !== templateId) continue;
    if (templateId === 'gold') {
      quest.progress = Math.max(quest.progress, amount);
    } else {
      quest.progress += amount;
    }
    if (quest.progress >= quest.target) {
      quest.completed = true;
      const reward = applyQuestRewards(quest, state.greatUnlocked);
      state.gold += reward.gold;
      if (reward.unlocked) {
        pushFx(state, 'quest', 8, 5, `Great ${reward.unlocked} unlocked!`);
      } else {
        pushFx(state, 'quest', 8, 5, `Quest +${reward.gold}g`);
      }
    }
  }
}

function completeWaveOrAttempt(state: GameState): void {
  if (state.status !== 'running') return;
  if (state.enemiesToSpawn > 0) return;
  if (state.enemies.some((enemy) => enemy.alive)) return;
  if (state.projectiles.some((projectile) => projectile.active)) return;
  if (state.missiles.some((missile) => missile.active && missile.impactIn > 0)) return;

  const area = getArea(state.areaId);
  const tier = area.tiers[state.tierId];
  const wave = tier.waves[state.waveIndex];
  const waveNumber = state.waveIndex + 1;

  if (wave?.goldBonus) state.gold += wave.goldBonus;
  state.crystalDust += CRYSTAL_DUST_PER_WAVE;
  const income = waveIncome(waveNumber);
  const interest = goldInterest(state.gold);
  state.gold += income + interest;
  if (income > 0) pushFx(state, 'gold', state.pathNav.goalCell.x, state.pathNav.goalCell.y, `+${income}g`);
  if (interest > 0) pushFx(state, 'gold', state.pathNav.spawnCell.x, state.pathNav.spawnCell.y, `+${interest} interest`);

  if (!state.waveLeaked) trackQuestProgress(state, 'leakless', 1);
  trackQuestProgress(state, 'gold', state.gold);

  if (state.waveIndex < tier.waves.length - 1) {
    state.waveIndex += 1;
    state.status = 'betweenWaves';
    state.enemies = state.enemies.filter((enemy) => enemy.alive);
    beginBuildPhase(state);
    return;
  }

  state.status = 'cleared';
  if (state.leakedEnemies === 0) {
    const key = areaTierKey(state.areaId, state.tierId);
    if (!state.save.clearedAreaTiers.includes(key)) {
      state.save.clearedAreaTiers.push(key);
      state.save.crowns += 1;
      state.rewards.crowns += 1;
    }
  }
}

function hitWithProjectile(
  state: GameState,
  projectile: ProjectileState,
  target: EnemyState,
): void {
  const gem = state.gems.find((candidate) => candidate.id === projectile.gemId) ?? null;
  const damageType = gem ? gemDamageType(gem.family) : 'pure';
  if (target.invisible) target.revealedUntil = state.time + 2.5;

  let damage = projectile.damage;

  if (projectile.bonusVsHighHp && target.maxHp > 150) {
    damage *= 1 + projectile.bonusVsHighHp;
  }
  if (projectile.armorReduction) {
    target.armorReduction = Math.max(target.armorReduction, projectile.armorReduction);
    damage *= 1 + target.armorReduction;
  }
  if (projectile.critChance && nextCombatRoll(state) < projectile.critChance) {
    damage *= 2;
  }

  const damageDone = applyDamage(state, target, damage, gem, {
    shieldPierce: projectile.shieldPierce ?? 1,
    damageType,
  });
  if (gem) gem.damageDone += damageDone;

  if (projectile.poisonDps && projectile.poisonDuration) {
    target.poisonDps = Math.max(target.poisonDps, projectile.poisonDps);
    target.poisonUntil = Math.max(target.poisonUntil, state.time + projectile.poisonDuration);
  }
  if (projectile.slowFactor && projectile.slowDuration) {
    target.slowFactor = Math.max(target.slowFactor, projectile.slowFactor);
    target.slowUntil = Math.max(target.slowUntil, state.time + projectile.slowDuration);
  }
  if (projectile.splashRadius && projectile.splashRadius > 0) {
    for (const enemy of state.enemies) {
      if (!enemy.alive || enemy.id === target.id) continue;
      if (distance(enemy, target) <= projectile.splashRadius) {
        applyDamage(state, enemy, damage * 0.45, gem, {
          shieldPierce: projectile.shieldPierce ?? 1,
          damageType,
        });
      }
    }
  }

  projectile.active = false;
}

function handleEnemyDeath(state: GameState, enemy: EnemyState): void {
  const definition = getEnemy(enemy.definitionId);
  if (definition.splitInto && definition.splitCount) {
    for (let i = 0; i < definition.splitCount; i++) {
      spawnSplitEnemy(state, definition.splitInto, enemy.x, enemy.y, enemy.checkpointIndex);
    }
  }
}

function spawnSplitEnemy(
  state: GameState,
  enemyId: string,
  x: number,
  y: number,
  checkpointIndex: number,
): void {
  const area = getArea(state.areaId);
  const tier = area.tiers[state.tierId];
  const definition = getEnemy(enemyId);
  const waveScale = 1 + state.waveIndex * 0.04;
  const hp = Math.round(definition.hp * tier.enemyHpMultiplier * waveScale * 0.5);
  state.enemies.push({
    id: state.nextEnemyId++,
    definitionId: definition.id,
    name: definition.name,
    x,
    y,
    pathProgress: pathProgressAt(state.pathNav, x, y),
    checkpointIndex,
    hp,
    maxHp: hp,
    shield: 0,
    maxShield: 0,
    speed: definition.speed * tier.enemySpeedMultiplier,
    rewardStars: Math.ceil(definition.rewardStars * tier.starMultiplier * 0.5),
    rewardGold: Math.ceil(definition.rewardGold * tier.goldMultiplier * 0.5),
    color: definition.color,
    alive: true,
    leaked: false,
    flying: definition.flying ?? false,
    invisible: definition.invisible ?? false,
    magicImmune: definition.magicImmune ?? false,
    physicalImmune: definition.physicalImmune ?? false,
    revealedUntil: 0,
    poisonDps: 0,
    poisonUntil: 0,
    slowUntil: 0,
    slowFactor: 1,
    armorReduction: 0,
  });
}

function damageInRadius(state: GameState, missile: MissileState): void {
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    if (distance(enemy, missile) <= missile.radius) {
      applyDamage(state, enemy, missile.damage, null, {
        shieldPierce: 0.75,
        damageType: 'pure',
      });
    }
  }
}

function applyDamage(
  state: GameState,
  enemy: EnemyState,
  amount: number,
  gem: GemState | null,
  options: {
    shieldPierce?: number;
    bypassShield?: boolean;
    damageType?: import('./types').DamageType;
  },
): number {
  if (!enemy.alive || amount <= 0) return 0;
  const damageType = options.damageType ?? 'pure';
  const scaled =
    amount *
    effectiveDamageMultiplier(damageType, {
      magicImmune: enemy.magicImmune,
      physicalImmune: enemy.physicalImmune,
    });
  if (scaled <= 0) return 0;
  let remaining = scaled;
  let damageDone = 0;
  if (!options.bypassShield && enemy.shield > 0) {
    const shieldDamage = Math.min(enemy.shield, remaining * (options.shieldPierce ?? 1));
    enemy.shield -= shieldDamage;
    damageDone += shieldDamage;
    remaining -= shieldDamage / Math.max(0.1, options.shieldPierce ?? 1);
  }
  if (remaining > 0) {
    const hpDamage = Math.min(enemy.hp, remaining);
    enemy.hp -= hpDamage;
    damageDone += hpDamage;
  }
  if (enemy.hp <= 0 && enemy.alive) {
    enemy.alive = false;
    state.killedEnemies += 1;
    state.killedThisWave += 1;
    trackQuestProgress(state, 'kills', 1);
    const definition = getEnemy(enemy.definitionId);
    if (definition.isBoss) trackQuestProgress(state, 'boss', 1);
    state.rewards.stars += enemy.rewardStars;
    state.save.stars += enemy.rewardStars;
    state.save.totalStarsEarned += enemy.rewardStars;
    state.gold += enemy.rewardGold;
    if (gem) gem.kills += 1;
    handleEnemyDeath(state, enemy);
  }
  return damageDone;
}

function clearInactive(state: GameState): void {
  state.enemies = state.enemies.filter((enemy) => enemy.alive);
  state.projectiles = state.projectiles.filter((projectile) => projectile.active);
  state.missiles = state.missiles.filter((missile) => missile.active || missile.life > 0);
}

function makeProjectile(
  state: GameState,
  gem: GemState,
  stats: ReturnType<typeof getGemCombatStats>,
  target: EnemyState,
): ProjectileState {
  return {
    id: state.nextProjectileId++,
    gemId: gem.id,
    targetId: target.id,
    x: gem.x,
    y: gem.y,
    damage: stats.damage,
    speed: stats.projectileSpeed,
    color: stats.color,
    poisonDps: stats.poisonDps,
    poisonDuration: stats.poisonDuration,
    shieldPierce: stats.shieldPierce,
    splashRadius: stats.splashRadius,
    slowFactor: stats.slowFactor,
    slowDuration: stats.slowDuration,
    critChance: stats.critChance,
    bonusVsHighHp: stats.bonusVsHighHp,
    armorReduction: stats.armorReduction,
    active: true,
  };
}

function findGemTarget(
  state: GameState,
  gem: GemState,
  range: number,
): EnemyState | undefined {
  const detectionGems = state.gems.map((g) => ({
    x: g.x,
    y: g.y,
    range: getGemCombatStats(state.save, g.family, g.level).range,
  }));
  const canHitAir = gemCanTargetAir(gem.family);
  const candidates: EnemyState[] = [];

  for (const enemy of state.enemies) {
    if (!enemy.alive || distance(gem, enemy) > range) continue;
    if (enemy.flying && !canHitAir) continue;
    if (
      !isEnemyVisible(enemy.revealedUntil, state.time, 0.5, enemy, detectionGems, enemy.invisible)
    ) {
      continue;
    }
    candidates.push(enemy);
  }

  if (candidates.length === 0) return undefined;

  switch (gem.targeting) {
    case 'last':
      return candidates.reduce((best, enemy) =>
        enemy.pathProgress > best.pathProgress ? enemy : best,
      );
    case 'strong':
      return candidates.reduce((best, enemy) => (enemy.hp > best.hp ? enemy : best));
    case 'weak':
      return candidates.reduce((best, enemy) => (enemy.hp < best.hp ? enemy : best));
    case 'first':
    default:
      return candidates.reduce((best, enemy) =>
        enemy.pathProgress < best.pathProgress ? enemy : best,
      );
  }
}

function purchasedUpgrades(save: SaveState): UpgradeDefinition[] {
  return save.purchasedUpgradeIds
    .map((upgradeId) => upgrades.find((upgrade) => upgrade.id === upgradeId))
    .filter((upgrade): upgrade is UpgradeDefinition => Boolean(upgrade));
}

function previousAreaId(areaId: string): string {
  const index = areaDefinitions.findIndex((area) => area.id === areaId);
  if (index <= 0) return areaId;
  return areaDefinitions[index - 1].id;
}

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function replaceState(target: GameState, source: GameState): void {
  Object.assign(target, source);
}

function toCell(x: number, y: number): Vec2 {
  return worldToHex(x, y);
}

function rockAtCell(state: GameState, x: number, y: number): boolean {
  return state.rocks.some((rock) => rock.x === x && rock.y === y);
}

function gemAtCell(state: GameState, q: number, r: number): boolean {
  return state.gems.some((gem) => {
    const cell = worldToHex(gem.x, gem.y);
    return cell.x === q && cell.y === r;
  });
}

function mazeLayoutFromState(state: GameState): ReturnType<typeof createMazeLayout> {
  const area = getArea(state.areaId);
  const corridorCells = cellsAlongPath(area.path);
  const checkpoints =
    area.pathNav.checkpoints.length > 0
      ? area.pathNav.checkpoints
      : resolveCheckpoints(area.path, corridorCells);
  return createMazeLayout(
    BOARD_WIDTH,
    BOARD_HEIGHT,
    checkpoints[0]!,
    checkpoints[checkpoints.length - 1]!,
    state.rocks,
    state.gems.map((gem) => toCell(gem.x, gem.y)),
    checkpoints,
  );
}

function rebuildPathNav(state: GameState): void {
  state.pathNav = buildMazePathNav(mazeLayoutFromState(state));
}

export { TOTAL_WAVES };
