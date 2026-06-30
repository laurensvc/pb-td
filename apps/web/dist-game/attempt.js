import { STARTING_LIVES, getArea } from './content';
import { generateOffers } from './buildPhase';
import { rebuildPathNav } from './boardQueries';
import { isTierUnlocked } from './upgrades';
import { cloneSave, createDefaultSave } from './save';
import { createRunQuests } from './quests';
export function createGame(save = createDefaultSave(), options) {
    return createAttempt(cloneSave(save), 'a1', 'normal', options?.runSeed);
}
export function replaceState(target, source) {
    Object.assign(target, source);
}
export function beginBuildPhase(state) {
    state.buildStep = 'rocks';
    state.rocksPlacedThisPhase = 0;
    state.rerollsThisPhase = 0;
    state.claimedOffer = null;
    state.rawGems = [];
    state.holdGem = null;
    state.mergeUndoStack = [];
    state.placementMode = 'rock';
    state.mergeSourceGemId = null;
    state.offers = generateOffers(state.runSeed, state.waveIndex, 0, state.save.unlockedGemFamilies);
}
export function createAttempt(save, areaId, tierId, runSeed) {
    const safeTier = isTierUnlocked(save, areaId, tierId) ? tierId : 'normal';
    const tier = getArea(areaId).tiers[safeTier];
    const resolvedSeed = runSeed ?? (Date.now() ^ 0x9e3779b9) | 0;
    const attempt = {
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
        selectedInventoryGemId: null,
        mergeSourceGemId: null,
        placementMode: 'rock',
        buildStep: 'rocks',
        runSeed: resolvedSeed,
        combatRollNonce: 0,
        gameSpeed: 1,
        crystalDust: 0,
        killedThisWave: 0,
        rocksPlacedThisPhase: 0,
        rerollsThisPhase: 0,
        offers: [],
        claimedOffer: null,
        holdGem: null,
        rawGems: [],
        mergeUndoStack: [],
        pathNav: getArea(areaId).pathNav,
        rocks: [],
        inventory: [],
        enemies: [],
        gems: [],
        projectiles: [],
        leakedEnemies: 0,
        killedEnemies: 0,
        nextEnemyId: 1,
        nextGemId: 1,
        nextInventoryGemId: 1,
        nextRawGemId: 1,
        nextProjectileId: 1,
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
