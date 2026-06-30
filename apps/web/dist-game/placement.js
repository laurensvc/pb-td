import { getWave } from './content';
import { acceptsRock, parityMatchesPlacement } from './boardParity';
import { ROCKS_PER_PHASE, defaultGemTargeting, generateOffers, isPlanningPhase, prospectRerollCost, } from './buildPhase';
import { canPlaceGemAt, canPlaceRawGemAt, canPlaceRockAt, gemAtCell, rawGemAtCell, rebuildPathNav, rockAtCell, toCell, } from './boardQueries';
import { QUEST_REROLL_COST } from './economy';
import { canMergeGems, gemSellValue, identicalClusterIds, resolveMerge } from './gems';
import { hexWorldCenter, worldToHex } from './hexGrid';
import { rockRefundPercent } from './maze';
import { rerollQuest } from './quests';
import { areAdjacentGems, findMatchingRecipe, hybridRecipes } from './recipes';
import { pushFx, trackQuestProgress } from './runProgress';
export function finishRocks(state) {
    if (!isPlanningPhase(state.status))
        return;
    if (state.buildStep !== 'rocks')
        return;
    if (state.rawGems.length >= ROCKS_PER_PHASE)
        state.buildStep = 'prospect';
}
export function placeRawGem(state, x, y) {
    if (!isPlanningPhase(state.status))
        return {};
    if (state.buildStep !== 'rocks')
        return {};
    if (state.rawGems.length >= ROCKS_PER_PHASE)
        return {};
    if (!canPlaceRawGemAt(state, x, y)) {
        const cell = toCell(x, y);
        if (!rockAtCell(state, cell.x, cell.y) && !rawGemAtCell(state, cell.x, cell.y)) {
            return { toast: 'That raw gem would break the route through checkpoints.' };
        }
        return {};
    }
    const offer = state.offers[state.rawGems.length];
    if (!offer)
        return {};
    const cell = toCell(x, y);
    state.rawGems.push({
        id: state.nextRawGemId++,
        family: offer.family,
        level: offer.level,
        x: cell.x,
        y: cell.y,
    });
    state.rocksPlacedThisPhase = state.rawGems.length;
    if (state.rawGems.length >= ROCKS_PER_PHASE)
        state.buildStep = 'prospect';
    rebuildPathNav(state);
    return {};
}
function commitRawOutput(state, output, outputCell) {
    const center = hexWorldCenter(outputCell.x, outputCell.y);
    state.gems.push({
        id: state.nextGemId++,
        family: output.family,
        level: output.level,
        x: center.x,
        y: center.y,
        cooldownLeft: 0,
        kills: 0,
        damageDone: 0,
        targeting: defaultGemTargeting(),
    });
    for (const raw of state.rawGems) {
        if (raw.x === outputCell.x && raw.y === outputCell.y)
            continue;
        state.rocks.push({ x: raw.x, y: raw.y, costPaid: 0 });
        state.rocksPlaced += 1;
    }
    state.rawGems = [];
    state.claimedOffer = null;
    state.buildStep = 'ready';
    state.placementMode = 'merge';
    rebuildPathNav(state);
}
export function commitRawGem(state, rawGemId) {
    if (!isPlanningPhase(state.status))
        return;
    if (state.buildStep !== 'prospect')
        return;
    if (state.rawGems.length < ROCKS_PER_PHASE)
        return;
    const raw = state.rawGems.find((candidate) => candidate.id === rawGemId);
    if (!raw)
        return;
    commitRawOutput(state, { family: raw.family, level: raw.level }, raw);
}
export function commitRawRecipe(state, recipeId) {
    if (!isPlanningPhase(state.status))
        return;
    if (state.buildStep !== 'prospect')
        return;
    if (state.rawGems.length < ROCKS_PER_PHASE)
        return;
    const recipe = hybridRecipes.find((candidate) => candidate.id === recipeId);
    if (!recipe)
        return;
    const match = findRawRecipeMatch(state.rawGems, recipe);
    if (!match)
        return;
    commitRawOutput(state, recipe.output, match.outputCell);
}
function findRawRecipeMatch(rawGems, recipe) {
    for (let i = 0; i < rawGems.length; i++) {
        for (let j = i + 1; j < rawGems.length; j++) {
            const a = rawGems[i];
            const b = rawGems[j];
            if (findMatchingRecipe(a, b)?.id === recipe.id) {
                return { outputCell: { x: a.x, y: a.y } };
            }
        }
    }
    return null;
}
export function claimOffer(state, index) {
    if (!isPlanningPhase(state.status))
        return {};
    if (state.buildStep === 'rocks')
        finishRocks(state);
    if (state.buildStep !== 'prospect' && state.buildStep !== 'upgrade')
        return {};
    const offer = state.offers[index];
    if (!offer)
        return {};
    if (state.rocks.length === 0) {
        return { toast: 'Place at least one rock before claiming a gem offer.' };
    }
    state.claimedOffer = { ...offer };
    state.buildStep = 'upgrade';
    state.placementMode = 'rock';
    return {};
}
export function rerollOffers(state) {
    if (!isPlanningPhase(state.status))
        return;
    if (state.rawGems.length > 0)
        return;
    if (state.buildStep !== 'rocks' &&
        state.buildStep !== 'prospect' &&
        state.buildStep !== 'upgrade')
        return;
    const cost = prospectRerollCost(state.rerollsThisPhase);
    if (state.gold < cost)
        return;
    state.gold -= cost;
    state.rerollsThisPhase += 1;
    state.offers = generateOffers(state.runSeed, state.waveIndex, state.rerollsThisPhase, state.save.unlockedGemFamilies);
    state.claimedOffer = null;
    state.buildStep = 'prospect';
}
export function upgradeRock(state, x, y) {
    if (!isPlanningPhase(state.status))
        return;
    if (state.buildStep !== 'upgrade' || !state.claimedOffer)
        return;
    const cell = toCell(x, y);
    const rockIdx = state.rocks.findIndex((r) => r.x === cell.x && r.y === cell.y);
    if (rockIdx < 0)
        return;
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
export function startWave(state) {
    if (!isPlanningPhase(state.status))
        return;
    if (state.buildStep !== 'ready')
        return;
    const wave = getWave(state.areaId, state.tierId, state.waveIndex);
    if (!wave)
        return;
    state.mergeUndoStack = [];
    state.killedThisWave = 0;
    state.status = 'running';
    state.segmentIndex = 0;
    state.enemiesToSpawn = wave.segments[0]?.count ?? 0;
    state.spawnTimer = 0;
    state.waveLeaked = false;
}
export function placeGem(state, x, y) {
    if (state.status === 'running' || state.selectedInventoryGemId === null)
        return;
    const cell = toCell(x, y);
    if (!canPlaceGemAt(state, x, y))
        return;
    const invIndex = state.inventory.findIndex((g) => g.id === state.selectedInventoryGemId);
    if (invIndex < 0)
        return;
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
export function placeRock(state, x, y) {
    if (!isPlanningPhase(state.status))
        return {};
    if (state.buildStep !== 'rocks')
        return {};
    const cell = toCell(x, y);
    if (!canPlaceRockAt(state, x, y)) {
        if (acceptsRock(cell.x, cell.y) && !rockAtCell(state, cell.x, cell.y)) {
            return { toast: 'That rock would break the route through checkpoints.' };
        }
        return {};
    }
    state.rocks.push({ x: cell.x, y: cell.y, costPaid: 0 });
    state.rocksPlaced += 1;
    state.rocksPlacedThisPhase += 1;
    if (state.rocksPlacedThisPhase >= ROCKS_PER_PHASE) {
        state.buildStep = 'prospect';
    }
    rebuildPathNav(state);
    return {};
}
export function sellRock(state, x, y) {
    if (state.status === 'running')
        return {};
    const cell = toCell(x, y);
    const index = state.rocks.findIndex((rock) => rock.x === cell.x && rock.y === cell.y);
    if (index < 0)
        return {};
    if (isPlanningPhase(state.status) &&
        state.buildStep === 'upgrade' &&
        state.claimedOffer &&
        state.rocks.length <= 1) {
        return { toast: 'Keep a rock to apply your claimed upgrade.' };
    }
    const rock = state.rocks[index];
    const refund = Math.floor(rock.costPaid * rockRefundPercent(state.rocksPlaced));
    state.gold += refund;
    state.rocks.splice(index, 1);
    state.rocksPlaced = Math.max(0, state.rocksPlaced - 1);
    rebuildPathNav(state);
    return {};
}
export function sellGem(state, gemId) {
    if (state.status === 'running')
        return;
    const index = state.gems.findIndex((g) => g.id === gemId);
    if (index < 0)
        return;
    const gem = state.gems[index];
    state.gold += gemSellValue(gem.family, gem.level);
    state.gems.splice(index, 1);
    if (state.mergeSourceGemId === gemId)
        state.mergeSourceGemId = null;
    rebuildPathNav(state);
}
export function mergeGems(state, targetGemId) {
    if (!isPlanningPhase(state.status) || state.mergeSourceGemId === null)
        return;
    const source = state.gems.find((g) => g.id === state.mergeSourceGemId);
    const target = state.gems.find((g) => g.id === targetGemId);
    if (!source || !target || source.id === target.id)
        return;
    const identicalCluster = source.family === target.family && source.level === target.level
        ? identicalClusterIds(state.gems, source)
        : [];
    const clusterSize = identicalCluster.length || 2;
    const result = resolveMerge(source, target, clusterSize);
    if (!result || !canMergeGems(source, target, state.greatUnlocked, clusterSize))
        return;
    if (!areAdjacentGems(source.x, source.y, target.x, target.y))
        return;
    const undoEntry = {
        gems: state.gems.map((g) => ({ ...g })),
        removedGemId: source.id,
        quests: state.quests.map((q) => ({ ...q })),
        greatUnlocked: [...state.greatUnlocked],
        gold: state.gold,
    };
    state.mergeUndoStack.push(undoEntry);
    target.family = result.family;
    target.level = result.level;
    const removeIds = new Set([source.id]);
    if (identicalCluster.length >= 4) {
        for (const id of identicalCluster) {
            if (id === target.id || removeIds.has(id))
                continue;
            removeIds.add(id);
            if (removeIds.size >= 3)
                break;
        }
    }
    state.gems = state.gems.filter((g) => !removeIds.has(g.id));
    state.mergeSourceGemId = null;
    state.placementMode = 'merge';
    state.mergeCount += 1;
    trackQuestProgress(state, 'merge', 1);
    pushFx(state, 'merge', target.x, target.y, result.hybrid ? 'Hybrid!' : `L${result.level}`);
    rebuildPathNav(state);
}
export function undoMerge(state) {
    if (!isPlanningPhase(state.status))
        return;
    const entry = state.mergeUndoStack.pop();
    if (!entry)
        return;
    state.gems = entry.gems.map((g) => ({ ...g }));
    state.quests = entry.quests.map((q) => ({ ...q }));
    state.greatUnlocked = [...entry.greatUnlocked];
    state.gold = entry.gold;
    state.mergeSourceGemId = null;
    state.mergeCount = Math.max(0, state.mergeCount - 1);
    rebuildPathNav(state);
}
export function pickUpGem(state, gemId) {
    if (state.status === 'running')
        return;
    if (isPlanningPhase(state.status)) {
        swapGemWithHold(state, gemId);
        return;
    }
    const index = state.gems.findIndex((g) => g.id === gemId);
    if (index < 0)
        return;
    const gem = state.gems[index];
    state.inventory.push({
        id: state.nextInventoryGemId++,
        family: gem.family,
        level: gem.level,
    });
    state.gems.splice(index, 1);
    if (state.mergeSourceGemId === gemId)
        state.mergeSourceGemId = null;
    if (state.selectedInventoryGemId === null) {
        state.selectedInventoryGemId = state.inventory[state.inventory.length - 1].id;
    }
    rebuildPathNav(state);
}
export function swapGemWithHold(state, gemId) {
    if (!isPlanningPhase(state.status))
        return;
    const index = state.gems.findIndex((g) => g.id === gemId);
    if (index < 0)
        return;
    const gem = state.gems[index];
    const incoming = { family: gem.family, level: gem.level };
    if (state.holdGem) {
        gem.family = state.holdGem.family;
        gem.level = state.holdGem.level;
        state.holdGem = incoming;
    }
    else {
        state.gems.splice(index, 1);
        state.holdGem = incoming;
    }
    if (state.mergeSourceGemId === gemId)
        state.mergeSourceGemId = null;
    rebuildPathNav(state);
}
export function selectHoldGem(state) {
    if (!isPlanningPhase(state.status) || !state.holdGem)
        return;
    state.placementMode = 'hold';
    state.mergeSourceGemId = null;
    state.selectedInventoryGemId = null;
}
export function placeHoldGem(state, x, y) {
    if (!isPlanningPhase(state.status) || !state.holdGem)
        return;
    const cell = toCell(x, y);
    const existing = state.gems.find((g) => {
        const gemCell = worldToHex(g.x, g.y);
        return gemCell.x === cell.x && gemCell.y === cell.y;
    });
    if (existing) {
        swapGemWithHold(state, existing.id);
        return;
    }
    if (!parityMatchesPlacement(cell.x, cell.y, 'gem') ||
        rockAtCell(state, cell.x, cell.y) ||
        gemAtCell(state, cell.x, cell.y)) {
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
export function clearHold(state) {
    if (!isPlanningPhase(state.status) || !state.holdGem)
        return;
    state.holdGem = null;
    if (state.placementMode === 'hold')
        state.placementMode = 'merge';
}
export function cycleGemTargeting(state, gemId) {
    if (!isPlanningPhase(state.status))
        return;
    const gem = state.gems.find((g) => g.id === gemId);
    if (!gem)
        return;
    const order = ['first', 'last', 'strong', 'weak'];
    const idx = order.indexOf(gem.targeting);
    gem.targeting = order[(idx + 1) % order.length];
}
export function setGemTargeting(state, gemId, mode) {
    if (!isPlanningPhase(state.status))
        return;
    const gem = state.gems.find((g) => g.id === gemId);
    if (!gem)
        return;
    gem.targeting = mode;
}
export function rerollQuestAction(state, questId) {
    if (state.status === 'running')
        return;
    if (state.gold < QUEST_REROLL_COST)
        return;
    const quest = state.quests.find((q) => q.id === questId);
    if (!quest || quest.completed)
        return;
    state.gold -= QUEST_REROLL_COST;
    rerollQuest(state.quests, questId, Math.floor(state.time * 1000) + state.gold);
}
export function addInventoryGem(state, family, level) {
    state.inventory.push({
        id: state.nextInventoryGemId++,
        family,
        level,
    });
    if (state.selectedInventoryGemId === null) {
        state.selectedInventoryGemId = state.inventory[state.inventory.length - 1].id;
    }
}
