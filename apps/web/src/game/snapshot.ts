import { getArea, getEnemy, getWave, getWaveCount } from './content';
import { ROCKS_PER_PHASE, isPlanningPhase, prospectRerollCost } from './buildPhase';
import { goldInterest, waveIncome } from './economy';
import { cloneSave } from './save';
import { getMissileStats, hasMissileUnlocked } from './upgrades';
import { buildWaveSpawnTracker } from './waveTables';
import type { GameState, Snapshot } from './types';

export function buildCurrentWaveSpawnTracker(state: GameState): Snapshot['waveSpawnTracker'] {
  if (state.status !== 'running') return null;
  const wave = getWave(state.areaId, state.tierId, state.waveIndex);
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

function buildWavePreview(state: GameState): Snapshot['nextWavePreview'] {
  const wave = getWave(state.areaId, state.tierId, state.waveIndex);
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

export function createSnapshot(state: GameState): Snapshot {
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
    canStartWave: isPlanningPhase(state.status) && state.buildStep === 'ready',
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
    save: cloneSave(state.save),
  };
}

export function consumeTransientUi(state: GameState): void {
  state.toast = null;
  state.rockPathDelta = null;
}
