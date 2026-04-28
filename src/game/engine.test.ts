import { describe, expect, it } from 'vitest';
import { gameConfig } from './config';
import { createGame, createSnapshot, dispatchGameAction, tickGame } from './engine';
import type { GemFamily, GemTier, TowerState } from './types';

function tower(
  id: number,
  x: number,
  y: number,
  family: GemFamily = 'ruby',
  tier: GemTier = 1,
): TowerState {
  return {
    id,
    gemId: `${family}-${tier}`,
    name: 'Test Gem',
    family,
    tier,
    x,
    y,
    damage: 10,
    range: 3,
    cooldown: 1,
    cooldownLeft: 0,
    projectileSpeed: 5,
    color: '#e15c5c',
    splashRadius: 0,
    slow: 0,
    kills: 0,
  };
}

function placeAndKeepDraft(game = createGame(gameConfig)) {
  dispatchGameAction(game, { type: 'placePendingGem', x: 2, y: 4 });
  dispatchGameAction(game, { type: 'placePendingGem', x: 2, y: 5 });
  dispatchGameAction(game, { type: 'placePendingGem', x: 3, y: 4 });
  dispatchGameAction(game, { type: 'placePendingGem', x: 3, y: 5 });
  dispatchGameAction(game, { type: 'placePendingGem', x: 5, y: 4 });
  dispatchGameAction(game, { type: 'keepDraftCandidate', x: 2, y: 4 });
  return game;
}

describe('game engine', () => {
  it('starts a draft automatically, then keeps one and hardens the rest into stones', () => {
    const game = createGame(gameConfig);
    expect(game.pendingGemId).toBeTruthy();
    dispatchGameAction(game, { type: 'placePendingGem', x: 2, y: 4 });
    dispatchGameAction(game, { type: 'placePendingGem', x: 2, y: 5 });
    dispatchGameAction(game, { type: 'placePendingGem', x: 3, y: 4 });
    dispatchGameAction(game, { type: 'placePendingGem', x: 3, y: 5 });
    dispatchGameAction(game, { type: 'placePendingGem', x: 5, y: 4 });
    expect(game.draft).toHaveLength(5);
    expect(game.pendingGemId).toBeNull();
    dispatchGameAction(game, { type: 'keepDraftCandidate', x: 2, y: 4 });
    expect(game.towers).toHaveLength(1);
    expect(game.stones).toHaveLength(4);
    expect(game.draft).toHaveLength(0);
    expect(game.path.length).toBeGreaterThan(0);
  });

  it('spawns enemies and advances a wave', () => {
    const game = placeAndKeepDraft();
    dispatchGameAction(game, { type: 'startWave' });
    tickGame(game, 0.2);
    expect(game.enemies.length).toBeGreaterThan(0);
    expect(createSnapshot(game).status).toBe('running');
  });

  it('starts the next draft automatically after a completed wave', () => {
    const game = placeAndKeepDraft(
      createGame({
        ...gameConfig,
        waves: [
          { id: 'empty-1', name: 'Empty One', enemyId: 'cinderling', count: 0, spawnInterval: 1 },
          { id: 'empty-2', name: 'Empty Two', enemyId: 'cinderling', count: 0, spawnInterval: 1 },
        ],
      }),
    );
    dispatchGameAction(game, { type: 'startWave' });
    tickGame(game, 0.2);
    expect(game.waveIndex).toBe(1);
    expect(game.status).toBe('ready');
    expect(game.pendingGemId).toBeTruthy();
    expect(game.draftWaveIndex).toBe(1);
  });

  it('combines three matching adjacent gems into the next tier', () => {
    const game = createGame(gameConfig);
    game.towers.push(tower(1, 2, 4), tower(2, 2, 5), tower(3, 3, 4));
    dispatchGameAction(game, { type: 'combineAt', x: 2, y: 4 });
    expect(game.towers).toHaveLength(1);
    expect(game.towers[0].gemId).toBe('ruby-2');
  });
});
