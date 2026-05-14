import { describe, expect, it } from 'vitest';
import { areaTierKey } from './content';
import { createDefaultSave } from './save';
import {
  createGame,
  dispatchGameAction,
  getMissileStats,
  getTowerStats,
  isTierUnlocked,
  tickGame,
} from './engine';

function runFor(seconds: number, step: (dt: number) => void): void {
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.05) {
    step(0.05);
  }
}

describe('cosmic siege simulation', () => {
  it('moves enemies along the path and fails when enough enemies leak', () => {
    const game = createGame();
    dispatchGameAction(game, { type: 'startWave' });

    runFor(80, (dt) => tickGame(game, dt));

    expect(game.status).toBe('lost');
    expect(game.leakedEnemies).toBeGreaterThan(0);
    expect(game.lives).toBe(0);
  });

  it('fires cooldown-limited AoE missiles that kill enemies and grant stars', () => {
    const game = createGame();
    dispatchGameAction(game, { type: 'startWave' });
    runFor(0.1, (dt) => tickGame(game, dt));

    const target = game.enemies[0];
    dispatchGameAction(game, { type: 'fireMissile', x: target.x, y: target.y });
    dispatchGameAction(game, { type: 'fireMissile', x: target.x, y: target.y });
    expect(game.missiles).toHaveLength(1);

    runFor(0.4, (dt) => tickGame(game, dt));

    expect(game.killedEnemies).toBeGreaterThan(0);
    expect(game.save.stars).toBeGreaterThan(0);
    expect(game.missileCooldownLeft).toBeGreaterThan(0);
  });

  it('keeps kill-earned stars after a failed attempt and retries with the same save', () => {
    const game = createGame();
    dispatchGameAction(game, { type: 'startWave' });
    runFor(0.1, (dt) => tickGame(game, dt));
    dispatchGameAction(game, { type: 'fireMissile', x: game.enemies[0].x, y: game.enemies[0].y });
    runFor(0.4, (dt) => tickGame(game, dt));
    const earned = game.save.stars;

    runFor(80, (dt) => tickGame(game, dt));
    expect(game.status).toBe('lost');
    dispatchGameAction(game, { type: 'retry' });

    expect(game.status).toBe('idle');
    expect(game.save.stars).toBe(earned);
  });

  it('places unlocked loadout towers on build slots and targets enemies', () => {
    const game = createGame();
    dispatchGameAction(game, { type: 'placeTower', slotIndex: 0, towerId: 'kinetic' });
    dispatchGameAction(game, { type: 'startWave' });
    runFor(2, (dt) => tickGame(game, dt));

    expect(game.towers).toHaveLength(1);
    expect(game.projectiles.length + game.towers[0].damageDone).toBeGreaterThan(0);
  });

  it('applies purchased missile and tower upgrades to combat stats', () => {
    const game = createGame({ ...createDefaultSave(), stars: 200 });
    const beforeMissile = getMissileStats(game);
    const beforeTower = getTowerStats(game.save, 'kinetic');

    dispatchGameAction(game, { type: 'buyUpgrade', upgradeId: 'missile-damage-1' });
    dispatchGameAction(game, { type: 'buyUpgrade', upgradeId: 'kinetic-damage-1' });

    expect(getMissileStats(game).damage).toBeGreaterThan(beforeMissile.damage);
    expect(getTowerStats(game.save, 'kinetic').damage).toBeGreaterThan(beforeTower.damage);
  });

  it('enforces unlocks and the 3-tower loadout limit', () => {
    const game = createGame({ ...createDefaultSave(), stars: 200 });
    dispatchGameAction(game, { type: 'selectLoadout', towerIds: ['kinetic', 'nature'] });
    expect(game.loadout).toEqual(['kinetic']);

    dispatchGameAction(game, { type: 'buyUpgrade', upgradeId: 'missile-damage-1' });
    dispatchGameAction(game, { type: 'buyUpgrade', upgradeId: 'unlock-nature' });
    dispatchGameAction(game, { type: 'buyUpgrade', upgradeId: 'unlock-arcane' });
    dispatchGameAction(game, { type: 'selectLoadout', towerIds: ['kinetic', 'nature', 'arcane', 'nova'] });

    expect(game.loadout).toEqual(['kinetic', 'nature', 'arcane']);
  });

  it('lets Arcane break shields faster than kinetic damage', () => {
    const base = createDefaultSave();
    const game = createGame({
      ...base,
      stars: 0,
      unlockedTowerIds: ['kinetic', 'arcane'],
      selectedLoadout: ['kinetic', 'arcane'],
    });
    dispatchGameAction(game, { type: 'startArea', areaId: 'a1', tierId: 'normal' });
    game.waveIndex = 2;
    dispatchGameAction(game, { type: 'placeTower', slotIndex: 0, towerId: 'arcane' });
    dispatchGameAction(game, { type: 'startWave' });
    runFor(4, (dt) => tickGame(game, dt));

    const shielded = game.enemies.find((enemy) => enemy.maxShield > 0);
    expect(shielded?.shield ?? 0).toBeLessThan(shielded?.maxShield ?? 1);
  });

  it('awards a crown once for full clears and unlocks hard tier', () => {
    const save = createDefaultSave();
    const game = createGame({
      ...save,
      clearedAreaTiers: [areaTierKey('a1', 'normal')],
      crowns: 1,
    });

    expect(isTierUnlocked(game.save, 'a1', 'hard')).toBe(true);

    game.status = 'cleared';
    dispatchGameAction(game, { type: 'startArea', areaId: 'a1', tierId: 'hard' });
    expect(game.tierId).toBe('hard');
  });

  it('charges the paid respec cost and resets upgrade purchases', () => {
    const game = createGame({ ...createDefaultSave(), stars: 200 });
    dispatchGameAction(game, { type: 'buyUpgrade', upgradeId: 'missile-damage-1' });
    dispatchGameAction(game, { type: 'buyUpgrade', upgradeId: 'kinetic-damage-1' });
    const starsBefore = game.save.stars;

    dispatchGameAction(game, { type: 'respecUpgrades' });

    expect(game.save.purchasedUpgradeIds).toHaveLength(0);
    expect(game.save.unlockedTowerIds).toEqual(['kinetic']);
    expect(game.save.stars).toBeGreaterThan(starsBefore);
    expect(game.save.stars).toBeLessThan(200);
  });
});
