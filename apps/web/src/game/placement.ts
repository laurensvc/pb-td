import {
  LUCKY_BOX_COST,
  RANDOM_GEM_COST,
  gemDefinitions,
  getWave,
} from './content';
import { acceptsRock, parityMatchesPlacement } from './boardParity';
import {
  ROCKS_PER_PHASE,
  defaultGemTargeting,
  generateOffers,
  isPlanningPhase,
  prospectRerollCost,
} from './buildPhase';
import {
  canPlaceGemAt,
  canPlaceRockAt,
  gemAtCell,
  rebuildPathNav,
  rockAtCell,
  toCell,
} from './boardQueries';
import { QUEST_REROLL_COST } from './economy';
import {
  canMergeGems,
  countIdenticalCluster,
  gemSellValue,
  resolveMerge,
} from './gems';
import { hexWorldCenter, worldToHex } from './hexGrid';
import { rockRefundPercent } from './maze';
import { rerollQuest } from './quests';
import { areAdjacentGems } from './recipes';
import { nextCombatRoll } from './rng';
import { pushFx, trackQuestProgress } from './runProgress';
import type {
  GameState,
  GemFamilyId,
  GemLevel,
  HoldGem,
  MergeUndoEntry,
  TargetingMode,
} from './types';

export function finishRocks(state: GameState): void {
  if (!isPlanningPhase(state.status)) return;
  if (state.buildStep !== 'rocks') return;
  state.buildStep = 'prospect';
}

export function claimOffer(state: GameState, index: number): void {
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

export function rerollOffers(state: GameState): void {
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

export function upgradeRock(state: GameState, x: number, y: number): void {
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

export function startWave(state: GameState): void {
  if (!isPlanningPhase(state.status)) return;
  if (state.buildStep !== 'ready') return;
  const wave = getWave(state.areaId, state.tierId, state.waveIndex);
  if (!wave) return;
  state.mergeUndoStack = [];
  state.killedThisWave = 0;
  state.status = 'running';
  state.segmentIndex = 0;
  state.enemiesToSpawn = wave.segments[0]?.count ?? 0;
  state.spawnTimer = 0;
  state.waveLeaked = false;
}

export function placeGem(state: GameState, x: number, y: number): void {
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

export function placeRock(state: GameState, x: number, y: number): void {
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

export function sellRock(state: GameState, x: number, y: number): void {
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

export function sellGem(state: GameState, gemId: number): void {
  if (state.status === 'running') return;
  const index = state.gems.findIndex((g) => g.id === gemId);
  if (index < 0) return;
  const gem = state.gems[index];
  state.gold += gemSellValue(gem.family, gem.level);
  state.gems.splice(index, 1);
  if (state.mergeSourceGemId === gemId) state.mergeSourceGemId = null;
  rebuildPathNav(state);
}

export function mergeGems(state: GameState, targetGemId: number): void {
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
    quests: state.quests.map((q) => ({ ...q })),
    greatUnlocked: [...state.greatUnlocked],
    gold: state.gold,
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

export function undoMerge(state: GameState): void {
  if (!isPlanningPhase(state.status)) return;
  const entry = state.mergeUndoStack.pop();
  if (!entry) return;
  state.gems = entry.gems.map((g) => ({ ...g }));
  state.quests = entry.quests.map((q) => ({ ...q }));
  state.greatUnlocked = [...entry.greatUnlocked];
  state.gold = entry.gold;
  state.mergeSourceGemId = null;
  state.mergeCount = Math.max(0, state.mergeCount - 1);
  rebuildPathNav(state);
}

export function pickUpGem(state: GameState, gemId: number): void {
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

export function swapGemWithHold(state: GameState, gemId: number): void {
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

export function selectHoldGem(state: GameState): void {
  if (!isPlanningPhase(state.status) || !state.holdGem) return;
  state.placementMode = 'hold';
  state.mergeSourceGemId = null;
  state.selectedInventoryGemId = null;
}

export function placeHoldGem(state: GameState, x: number, y: number): void {
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

export function clearHold(state: GameState): void {
  if (!isPlanningPhase(state.status) || !state.holdGem) return;
  state.holdGem = null;
  if (state.placementMode === 'hold') state.placementMode = 'merge';
}

export function cycleGemTargeting(state: GameState, gemId: number): void {
  if (!isPlanningPhase(state.status)) return;
  const gem = state.gems.find((g) => g.id === gemId);
  if (!gem) return;
  const order: TargetingMode[] = ['first', 'last', 'strong', 'weak'];
  const idx = order.indexOf(gem.targeting);
  gem.targeting = order[(idx + 1) % order.length]!;
}

export function rerollQuestAction(state: GameState, questId: string): void {
  if (state.status === 'running') return;
  if (state.gold < QUEST_REROLL_COST) return;
  const quest = state.quests.find((q) => q.id === questId);
  if (!quest || quest.completed) return;
  state.gold -= QUEST_REROLL_COST;
  rerollQuest(state.quests, questId, Math.floor(state.time * 1000) + state.gold);
}

export function buyGem(state: GameState, family: GemFamilyId): void {
  if (isPlanningPhase(state.status)) return;
  if (state.status === 'running') return;
  if (!state.save.unlockedGemFamilies.includes(family)) return;
  const cost = gemDefinitions[family].shopCost;
  if (state.gold < cost) return;
  state.gold -= cost;
  addInventoryGem(state, family, 1);
}

export function buyRandomGem(state: GameState): void {
  if (isPlanningPhase(state.status)) return;
  if (state.status === 'running') return;
  if (state.gold < RANDOM_GEM_COST) return;
  const families = state.save.unlockedGemFamilies;
  if (families.length === 0) return;
  state.gold -= RANDOM_GEM_COST;
  const family = families[Math.floor(nextCombatRoll(state) * families.length)]!;
  addInventoryGem(state, family, 1);
}

export function buyLuckyBox(state: GameState): void {
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

export function addInventoryGem(state: GameState, family: GemFamilyId, level: GemLevel): void {
  state.inventory.push({
    id: state.nextInventoryGemId++,
    family,
    level,
  });
  if (state.selectedInventoryGemId === null) {
    state.selectedInventoryGemId = state.inventory[state.inventory.length - 1].id;
  }
}
