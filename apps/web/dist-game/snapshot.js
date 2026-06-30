import { getArea, getEnemy, getWave, getWaveCount } from './content';
import { ROCKS_PER_PHASE, isPlanningPhase, prospectRerollCost, rawGemBuildLevel, rawGemQualityOdds, } from './buildPhase';
import { goldInterest, waveIncome } from './economy';
import { cloneSave } from './save';
import { buildWaveSpawnTracker } from './waveTables';
export function buildCurrentWaveSpawnTracker(state) {
    if (state.status !== 'running')
        return null;
    const wave = getWave(state.areaId, state.tierId, state.waveIndex);
    if (!wave)
        return null;
    return buildWaveSpawnTracker(wave.segments, state.segmentIndex, state.enemiesToSpawn, state.enemies.filter((e) => e.alive).length, state.killedThisWave, (id) => getEnemy(id).name);
}
function buildWavePreview(state) {
    const wave = getWave(state.areaId, state.tierId, state.waveIndex);
    if (!wave)
        return [];
    return wave.segments.map((segment) => {
        const def = getEnemy(segment.enemyId);
        const tags = [];
        if (def.flying)
            tags.push('air');
        if (def.invisible)
            tags.push('stealth');
        if (def.magicImmune)
            tags.push('magic↓');
        if (def.physicalImmune)
            tags.push('phys↓');
        if (def.isBoss)
            tags.push('boss');
        return {
            enemyId: segment.enemyId,
            count: segment.count,
            name: def.name,
            tags,
        };
    });
}
export function createSnapshot(state) {
    const area = getArea(state.areaId);
    const wave = getWave(state.areaId, state.tierId, state.waveIndex);
    const waveNum = Math.min(state.waveIndex + 1, getWaveCount());
    return {
        status: state.status,
        areaId: state.areaId,
        areaName: area.name,
        tierId: state.tierId,
        time: state.time,
        wave: Math.min(state.waveIndex + 1, getWaveCount()),
        totalWaves: getWaveCount(),
        lives: state.lives,
        maxLives: state.maxLives,
        gold: state.gold,
        rockCost: 0,
        activeEnemies: state.enemies.filter((enemy) => enemy.alive).length,
        placementMode: state.placementMode,
        buildStep: state.buildStep,
        rocksPlacedThisPhase: state.rocksPlacedThisPhase,
        rocksRemaining: Math.max(0, ROCKS_PER_PHASE - state.rawGems.length),
        offers: state.offers.map((o) => ({ ...o })),
        rawGemBuildLevel: rawGemBuildLevel(state.waveIndex),
        rawGemQualityOdds: rawGemQualityOdds(state.waveIndex),
        claimedOffer: state.claimedOffer ? { ...state.claimedOffer } : null,
        rawGems: state.rawGems.map((raw) => ({ ...raw })),
        holdGem: state.holdGem ? { ...state.holdGem } : null,
        mergeUndoCount: state.mergeUndoStack.length,
        prospectRerollCost: prospectRerollCost(state.rerollsThisPhase),
        nextWavePreview: buildWavePreview(state),
        waveSpawnTracker: buildCurrentWaveSpawnTracker(state),
        runSeed: state.runSeed,
        gameSpeed: state.gameSpeed,
        crystalDust: state.crystalDust,
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
        toast: null,
        rockPathDelta: null,
        unlockedGemFamilies: [...state.save.unlockedGemFamilies],
        canStartWave: isPlanningPhase(state.status) && state.buildStep === 'ready',
        canRetry: state.status === 'lost' || state.status === 'cleared',
        isBossWave: wave?.isBoss ?? false,
        pathLength: state.pathNav.maxProgress,
        waveIncome: waveIncome(waveNum),
        interestPreview: goldInterest(state.gold),
        quests: state.quests.map((q) => ({ ...q })),
        greatUnlocked: [...state.greatUnlocked],
        fxEvents: state.fxEvents.map((fx) => ({ ...fx })),
        resultTitle: state.status === 'lost'
            ? `Wave ${state.waveIndex + 1} breached the nexus.`
            : state.status === 'cleared'
                ? 'Season cleared!'
                : null,
        resultMessage: state.status === 'lost'
            ? `${state.killedEnemies} invaders destroyed.`
            : state.status === 'cleared'
                ? 'All waves cleared.'
                : null,
        save: cloneSave(state.save),
    };
}
