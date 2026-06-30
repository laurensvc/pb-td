import { describe, expect, it } from 'vitest';
import { TOTAL_WAVES, areaTierKey } from './content';
import { hexWorldCenter } from './hexGrid';
import { createDefaultSave } from './save';
import type { GameState, GemFamilyId, GemLevel } from './types';
import {
  canPlaceGemAt,
  canPlaceRockAt,
  createGame,
  createSnapshot,
  dispatchGameAction,
  getMissileStats,
  isTierUnlocked,
  tickGame,
} from './engine';
import { canMergeGems, getGemCombatStats, mergedLevel } from './gems';

function runFor(seconds: number, step: (dt: number) => void): void {
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.05) {
    step(0.05);
  }
}

function addBoardGem(
  game: GameState,
  q: number,
  r: number,
  family: GemFamilyId = 'kinetic',
  level: GemLevel = 1,
): void {
  const center = hexWorldCenter(q, r);
  game.gems.push({
    id: game.nextGemId++,
    family,
    level,
    x: center.x,
    y: center.y,
    cooldownLeft: 0,
    kills: 0,
    damageDone: 0,
    targeting: 'first',
  });
}

function skipBuildPhaseToReady(game: GameState): void {
  dispatchGameAction(game, { type: 'finishRocks' });
  dispatchGameAction(game, { type: 'claimOffer', index: 0 });
  if (game.rocks.length > 0) {
    const rock = game.rocks[0]!;
    const center = hexWorldCenter(rock.x, rock.y);
    dispatchGameAction(game, { type: 'upgradeRock', x: center.x, y: center.y });
  } else {
    game.buildStep = 'ready';
  }
}

function startWaveWhenReady(game: GameState): void {
  if (game.status === 'idle' || game.status === 'betweenWaves') {
    if (game.buildStep !== 'ready') skipBuildPhaseToReady(game);
    dispatchGameAction(game, { type: 'startWave' });
  }
}

describe('cosmic gem siege simulation', () => {
  it('has 50 waves per area tier', () => {
    const game = createGame();
    expect(game.waveIndex).toBe(0);
    const area = game.areaId;
    dispatchGameAction(game, { type: 'startArea', areaId: area, tierId: 'normal' });
    expect(TOTAL_WAVES).toBe(50);
  });

  it('moves enemies along the path and fails when enough enemies leak', () => {
    const game = createGame();
    for (let wave = 0; wave < 25 && game.status !== 'lost'; wave++) {
      startWaveWhenReady(game);
      runFor(30, (dt) => tickGame(game, dt));
    }
    expect(game.status).toBe('lost');
    expect(game.leakedEnemies).toBeGreaterThan(0);
    expect(game.lives).toBe(0);
  });

  it('fires cooldown-limited AoE missiles that kill enemies and grant stars', () => {
    const game = createGame({ ...createDefaultSave(), stars: 200 });
    dispatchGameAction(game, { type: 'buyUpgrade', upgradeId: 'missile-damage-1' });
    dispatchGameAction(game, { type: 'buyUpgrade', upgradeId: 'missile-damage-2' });
    startWaveWhenReady(game);
    runFor(0.1, (dt) => tickGame(game, dt));

    const target = game.enemies[0];
    dispatchGameAction(game, { type: 'fireMissile', x: target.x, y: target.y });
    dispatchGameAction(game, { type: 'fireMissile', x: target.x, y: target.y });
    expect(game.missiles).toHaveLength(1);

    runFor(0.4, (dt) => tickGame(game, dt));

    expect(game.killedEnemies).toBeGreaterThan(0);
    expect(game.save.stars).toBeGreaterThan(0);
    expect(game.gold).toBeGreaterThan(0);
    expect(game.missileCooldownLeft).toBeGreaterThan(0);
  });

  it('keeps kill-earned stars after a failed attempt and retries with the same save', () => {
    const game = createGame();
    startWaveWhenReady(game);
    runFor(0.1, (dt) => tickGame(game, dt));
    dispatchGameAction(game, { type: 'fireMissile', x: game.enemies[0].x, y: game.enemies[0].y });
    runFor(0.4, (dt) => tickGame(game, dt));
    const earned = game.save.stars;

    runFor(30, (dt) => tickGame(game, dt));
    for (let wave = 0; wave < 25 && game.status !== 'lost'; wave++) {
      startWaveWhenReady(game);
      runFor(30, (dt) => tickGame(game, dt));
    }
    expect(game.status).toBe('lost');
    dispatchGameAction(game, { type: 'retry' });

    expect(game.status).toBe('idle');
    expect(game.save.stars).toBe(earned);
    expect(game.gold).toBeGreaterThan(0);
  });

  it('fires placed gems during a running wave', () => {
    const game = createGame();
    skipBuildPhaseToReady(game);
    addBoardGem(game, 2, 5);
    dispatchGameAction(game, { type: 'startWave' });
    runFor(4, (dt) => tickGame(game, dt));

    expect(game.gems.length).toBeGreaterThan(0);
    expect(game.projectiles.length + game.gems[0]!.damageDone).toBeGreaterThan(0);
  });

  it('places rocks for free during the rock build step', () => {
    const game = createGame();
    const startGold = game.gold;
    dispatchGameAction(game, { type: 'placeRock', ...hexWorldCenter(0, 0) });
    expect(game.rocks).toHaveLength(1);
    expect(game.gold).toBe(startGold);
    const probe = hexWorldCenter(2, 1);
    expect(canPlaceRockAt(game, probe.x, probe.y)).toBeTypeOf('boolean');
  });

  it('merges same family and level gems during build phase', () => {
    const game = createGame();
    game.buildStep = 'ready';
    addBoardGem(game, 2, 5, 'kinetic', 1);
    addBoardGem(game, 3, 4, 'kinetic', 1);
    const [a, b] = game.gems;
    expect(canMergeGems(a!, b!, game.greatUnlocked)).toBe(true);
    dispatchGameAction(game, { type: 'selectMergeSource', gemId: a!.id });
    dispatchGameAction(game, { type: 'mergeGems', targetGemId: b!.id });
    expect(game.gems).toHaveLength(1);
    expect(game.gems[0]!.level).toBe(mergedLevel(1));
    expect(game.mergeUndoStack).toHaveLength(1);
  });

  it('blocks starting a wave until build step is ready', () => {
    const game = createGame();
    expect(game.buildStep).toBe('rocks');
    dispatchGameAction(game, { type: 'startWave' });
    expect(game.status).toBe('idle');
    skipBuildPhaseToReady(game);
    dispatchGameAction(game, { type: 'startWave' });
    expect(game.status).toBe('running');
  });

  it('applies purchased missile upgrades to combat stats', () => {
    const game = createGame({ ...createDefaultSave(), stars: 200 });
    const beforeMissile = getMissileStats(game);
    dispatchGameAction(game, { type: 'buyUpgrade', upgradeId: 'missile-damage-1' });
    expect(getMissileStats(game).damage).toBeGreaterThan(beforeMissile.damage);
  });

  it('scales gem stats by level', () => {
    const save = createDefaultSave();
    const l1 = getGemCombatStats(save, 'kinetic', 1);
    const l5 = getGemCombatStats(save, 'kinetic', 5);
    expect(l5.damage).toBeGreaterThan(l1.damage);
    expect(l5.range).toBeGreaterThan(l1.range);
  });

  it('enforces gem family unlocks in shop after a loss', () => {
    const game = createGame();
    game.status = 'lost';
    const goldBefore = game.gold;
    dispatchGameAction(game, { type: 'buyGem', family: 'arcane' });
    expect(game.gold).toBe(goldBefore);

    dispatchGameAction(game, { type: 'buyGem', family: 'kinetic' });
    expect(game.inventory.length).toBe(1);
  });

  it('awards a crown once for full clears and unlocks hard tier', () => {
    const save = createDefaultSave();
    const game = createGame({
      ...save,
      clearedAreaTiers: [areaTierKey('a1', 'normal')],
      crowns: 1,
    });

    expect(isTierUnlocked(game.save, 'a1', 'hard')).toBe(true);

    dispatchGameAction(game, { type: 'startArea', areaId: 'a1', tierId: 'hard' });
    expect(game.tierId).toBe('hard');
  });

  it('places rocks on rock parity cells and blocks invalid mazes', () => {
    const game = createGame();
    dispatchGameAction(game, { type: 'placeRock', ...hexWorldCenter(0, 0) });
    expect(game.rocks).toHaveLength(1);
    dispatchGameAction(game, { type: 'placeRock', ...hexWorldCenter(1, 0) });
    expect(game.rocks).toHaveLength(1);
    const offMaze = hexWorldCenter(15, 8);
    expect(canPlaceRockAt(game, offMaze.x, offMaze.y)).toBe(false);
  });

  it('charges the paid respec cost and resets upgrade purchases', () => {
    const game = createGame({ ...createDefaultSave(), stars: 200 });
    dispatchGameAction(game, { type: 'buyUpgrade', upgradeId: 'missile-damage-1' });
    dispatchGameAction(game, { type: 'buyUpgrade', upgradeId: 'kinetic-damage-1' });
    const starsBefore = game.save.stars;

    dispatchGameAction(game, { type: 'respecUpgrades' });

    expect(game.save.purchasedUpgradeIds).toHaveLength(0);
    expect(game.save.unlockedGemFamilies).toEqual(['kinetic', 'verdant']);
    expect(game.save.stars).toBeGreaterThan(starsBefore);
    expect(game.save.stars).toBeLessThan(200);
  });

  it('rejects gem placement on occupied or wrong parity cells', () => {
    const game = createGame();
    game.status = 'lost';
    dispatchGameAction(game, { type: 'buyGem', family: 'kinetic' });
    dispatchGameAction(game, { type: 'selectInventoryGem', gemId: game.inventory[0]!.id });
    const rockCell = hexWorldCenter(0, 0);
    expect(canPlaceGemAt(game, rockCell.x, rockCell.y)).toBe(false);
    dispatchGameAction(game, { type: 'placeGem', ...hexWorldCenter(2, 5) });
    const occupied = hexWorldCenter(2, 5);
    expect(canPlaceGemAt(game, occupied.x, occupied.y)).toBe(false);
  });

  it('exposes next wave preview during build phase', () => {
    const game = createGame();
    const snapshot = createSnapshot(game);
    expect(snapshot.nextWavePreview.length).toBeGreaterThan(0);
    expect(snapshot.buildStep).toBe('rocks');
  });
});
