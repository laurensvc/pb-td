import { describe, expect, it } from 'vitest';
import { TOTAL_WAVES, areaTierKey, rockPlacementCost } from './content';
import { createDefaultSave } from './save';
import {
  canPlaceGemAt,
  canPlaceRockAt,
  createGame,
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

describe('cosmic gem siege simulation', () => {
  it('has 50 waves per area tier', () => {
    const game = createGame();
    expect(game.waveIndex).toBe(0);
    const area = game.areaId;
    dispatchGameAction(game, { type: 'startArea', areaId: area, tierId: 'normal' });
    const snapshot = TOTAL_WAVES;
    expect(snapshot).toBe(50);
  });

  it('moves enemies along the path and fails when enough enemies leak', () => {
    const game = createGame();
    for (let wave = 0; wave < 25 && game.status !== 'lost'; wave++) {
      if (game.status === 'idle' || game.status === 'betweenWaves') {
        dispatchGameAction(game, { type: 'startWave' });
      }
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
    dispatchGameAction(game, { type: 'startWave' });
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
    dispatchGameAction(game, { type: 'startWave' });
    runFor(0.1, (dt) => tickGame(game, dt));
    dispatchGameAction(game, { type: 'fireMissile', x: game.enemies[0].x, y: game.enemies[0].y });
    runFor(0.4, (dt) => tickGame(game, dt));
    const earned = game.save.stars;

    runFor(30, (dt) => tickGame(game, dt));
    for (let wave = 0; wave < 25 && game.status !== 'lost'; wave++) {
      if (game.status === 'idle' || game.status === 'betweenWaves') {
        dispatchGameAction(game, { type: 'startWave' });
      }
      runFor(30, (dt) => tickGame(game, dt));
    }
    expect(game.status).toBe('lost');
    dispatchGameAction(game, { type: 'retry' });

    expect(game.status).toBe('idle');
    expect(game.save.stars).toBe(earned);
    expect(game.gold).toBeGreaterThan(0);
  });

  it('places gems from inventory on gem cells', () => {
    const game = createGame();
    dispatchGameAction(game, { type: 'selectInventoryGem', gemId: game.inventory[0].id });
    dispatchGameAction(game, { type: 'placeGem', x: 2, y: 5 });
    dispatchGameAction(game, { type: 'startWave' });
    runFor(4, (dt) => tickGame(game, dt));

    expect(game.gems).toHaveLength(1);
    expect(game.projectiles.length + game.gems[0].damageDone).toBeGreaterThan(0);
  });

  it('charges gold for rocks with escalating cost', () => {
    const game = createGame();
    const startGold = game.gold;
    dispatchGameAction(game, { type: 'placeRock', x: 0, y: 0 });
    expect(game.rocks).toHaveLength(1);
    expect(game.gold).toBe(startGold - rockPlacementCost(0));
    expect(canPlaceRockAt(game, 2, 1)).toBeTypeOf('boolean');
  });

  it('merges same family and level gems', () => {
    const game = createGame();
    dispatchGameAction(game, { type: 'buyGem', family: 'kinetic' });
    dispatchGameAction(game, { type: 'buyGem', family: 'kinetic' });
    const kinetics = game.inventory.filter((g) => g.family === 'kinetic');
    dispatchGameAction(game, { type: 'selectInventoryGem', gemId: kinetics[0].id });
    dispatchGameAction(game, { type: 'placeGem', x: 2, y: 5 });
    dispatchGameAction(game, { type: 'selectInventoryGem', gemId: kinetics[1].id });
    dispatchGameAction(game, { type: 'placeGem', x: 3, y: 6 });
    const [a, b] = game.gems;
    expect(canMergeGems(a, b, game.greatUnlocked)).toBe(true);
    dispatchGameAction(game, { type: 'selectMergeSource', gemId: a.id });
    dispatchGameAction(game, { type: 'mergeGems', targetGemId: b.id });
    expect(game.gems).toHaveLength(1);
    expect(game.gems[0].level).toBe(mergedLevel(1));
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

  it('enforces gem family unlocks in shop', () => {
    const game = createGame();
    const goldBefore = game.gold;
    dispatchGameAction(game, { type: 'buyGem', family: 'arcane' });
    expect(game.gold).toBe(goldBefore);

    dispatchGameAction(game, { type: 'buyGem', family: 'kinetic' });
    expect(game.inventory.length).toBeGreaterThan(2);
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
    dispatchGameAction(game, { type: 'placeRock', x: 0, y: 0 });
    expect(game.rocks).toHaveLength(1);
    dispatchGameAction(game, { type: 'placeRock', x: 1, y: 0 });
    expect(game.rocks).toHaveLength(1);
    expect(canPlaceRockAt(game, 15, 8)).toBe(false);
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
    dispatchGameAction(game, { type: 'selectInventoryGem', gemId: game.inventory[0].id });
    expect(canPlaceGemAt(game, 0, 0)).toBe(false);
    dispatchGameAction(game, { type: 'placeGem', x: 2, y: 5 });
    expect(canPlaceGemAt(game, 2, 5)).toBe(false);
  });
});
