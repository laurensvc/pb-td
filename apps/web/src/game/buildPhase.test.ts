import { describe, expect, it } from 'vitest';
import { hexWorldCenter } from './hexGrid';
import {
  buildRitualHint,
  buildRitualPhase,
  generateOffers,
  prospectRerollCost,
  rawGemBuildLevel,
  rawGemQualityOdds,
  ROCKS_PER_PHASE,
} from './buildPhase';
import { canPlaceHoldGemAt, createGame, dispatchGameAction } from './engine';
import { mergedLevelBy } from './gems';

describe('build phase helpers', () => {
  it('escalates prospect reroll costs', () => {
    expect(prospectRerollCost(0)).toBe(10);
    expect(prospectRerollCost(1)).toBe(20);
    expect(prospectRerollCost(3)).toBe(80);
    expect(prospectRerollCost(4)).toBe(160);
  });

  it('generates five offers from run seed', () => {
    const offers = generateOffers(42, 0, 0, ['kinetic', 'verdant', 'arcane']);
    expect(offers).toHaveLength(5);
    expect(offers.every((o) => o.level >= 1 && o.level <= 5)).toBe(true);
  });

  it('exposes visible raw gem quality odds by build level', () => {
    expect(rawGemBuildLevel(0)).toBe(1);
    expect(rawGemBuildLevel(49)).toBe(5);
    expect(rawGemQualityOdds(0).map((entry) => entry.chance)).toEqual([70, 25, 5, 0, 0]);
    expect(rawGemQualityOdds(49).reduce((sum, entry) => sum + entry.chance, 0)).toBe(100);
  });

  it('allows five free rocks per phase', () => {
    const game = createGame();
    expect(game.rocksPlacedThisPhase).toBe(0);
    expect(ROCKS_PER_PHASE).toBe(5);
  });

  it('maps build steps to the three-step GemTD ritual', () => {
    expect(buildRitualPhase('rocks')).toBe('place');
    expect(buildRitualPhase('prospect')).toBe('commit');
    expect(buildRitualPhase('ready')).toBe('ready');
    expect(buildRitualHint('rocks', 2)).toContain('5 raw gems');
    expect(buildRitualHint('prospect', 5)).toContain('stone blocks');
  });
});

describe('hold slot', () => {
  it('stashes a board gem in hold on right-click flow', () => {
    const game = createGame();
    game.gems.push({
      id: game.nextGemId++,
      family: 'kinetic',
      level: 1,
      ...hexWorldCenter(2, 5),
      cooldownLeft: 0,
      kills: 0,
      damageDone: 0,
      targeting: 'first',
    });
    game.buildStep = 'ready';
    dispatchGameAction(game, { type: 'pickUpGem', gemId: 1 });
    expect(game.holdGem).toEqual({ family: 'kinetic', level: 1 });
    expect(game.gems).toHaveLength(0);
  });

  it('swaps hold gem with a board gem', () => {
    const game = createGame();
    game.holdGem = { family: 'verdant', level: 2 };
    game.gems.push({
      id: 1,
      family: 'kinetic',
      level: 1,
      ...hexWorldCenter(2, 5),
      cooldownLeft: 0,
      kills: 0,
      damageDone: 0,
      targeting: 'first',
    });
    game.buildStep = 'ready';
    dispatchGameAction(game, { type: 'swapGemWithHold', gemId: 1 });
    expect(game.holdGem).toEqual({ family: 'kinetic', level: 1 });
    expect(game.gems[0]?.family).toBe('verdant');
    expect(game.gems[0]?.level).toBe(2);
  });

  it('places held gem on an empty cell', () => {
    const game = createGame();
    game.holdGem = { family: 'arcane', level: 1 };
    game.buildStep = 'ready';
    game.placementMode = 'hold';
    const cell = hexWorldCenter(2, 5);
    expect(canPlaceHoldGemAt(game, cell.x, cell.y)).toBe(true);
    dispatchGameAction(game, { type: 'placeHoldGem', x: cell.x, y: cell.y });
    expect(game.holdGem).toBeNull();
    expect(game.gems).toHaveLength(1);
    expect(game.gems[0]?.family).toBe('arcane');
  });
});

describe('merge depth', () => {
  it('jumps two levels when four identical gems are connected', () => {
    expect(mergedLevelBy(1, 2)).toBe(3);
  });
});
