import { BOARD_HEIGHT, BOARD_WIDTH } from './content';
import { describe, expect, it } from 'vitest';
import { hexWorldCenter } from './hexGrid';
import { canPlaceRawGemAt, createGame, dispatchGameAction } from './engine';
import { areAdjacentGems, findRawRecipeMatches, hybridRecipes, listHybridRecipes } from './recipes';

describe('recipes hex adjacency', () => {
  it('allows merge on adjacent hex cells', () => {
    const a = hexWorldCenter(2, 3);
    const b = hexWorldCenter(3, 3);
    expect(areAdjacentGems(a.x, a.y, b.x, b.y)).toBe(true);
  });

  it('rejects non-adjacent hex cells', () => {
    const a = hexWorldCenter(2, 3);
    const b = hexWorldCenter(4, 3);
    expect(areAdjacentGems(a.x, a.y, b.x, b.y)).toBe(false);
  });
});

describe('hybrid recipe catalog', () => {
  it('lists every authored hybrid recipe for the formula panel', () => {
    expect(listHybridRecipes()).toEqual(hybridRecipes);
    expect(listHybridRecipes().length).toBeGreaterThan(0);
  });

  it('detects matching raw recipe pairs among five placed gems', () => {
    const rawGems = [
      { family: 'kinetic' as const, level: 1 as const },
      { family: 'verdant' as const, level: 1 as const },
      { family: 'arcane' as const, level: 1 as const },
      { family: 'nova' as const, level: 1 as const },
      { family: 'prism' as const, level: 1 as const },
    ];
    const matches = findRawRecipeMatches(rawGems);
    expect(matches.map((recipe) => recipe.id)).toContain('hybrid-toxic-shot');
    expect(matches.map((recipe) => recipe.id)).toContain('hybrid-plasma-mortar');
  });
});

describe('commit raw recipe', () => {
  function placeOfferedRawGems(game: ReturnType<typeof createGame>): void {
    for (let r = 0; r < BOARD_HEIGHT && game.rawGems.length < 5; r++) {
      for (let q = 0; q < BOARD_WIDTH && game.rawGems.length < 5; q++) {
        const point = hexWorldCenter(q, r);
        if (canPlaceRawGemAt(game, point.x, point.y)) {
          dispatchGameAction(game, { type: 'placeRawGem', x: point.x, y: point.y });
        }
      }
    }
  }

  it('commits hybrid output and turns the other four raw gems into stones', () => {
    const game = createGame();
    game.offers = [
      { family: 'kinetic', level: 1 },
      { family: 'verdant', level: 1 },
      { family: 'arcane', level: 1 },
      { family: 'nova', level: 1 },
      { family: 'prism', level: 1 },
    ];
    placeOfferedRawGems(game);
    expect(game.buildStep).toBe('prospect');
    expect(findRawRecipeMatches(game.rawGems).map((recipe) => recipe.id)).toContain(
      'hybrid-toxic-shot',
    );

    dispatchGameAction(game, { type: 'commitRawRecipe', recipeId: 'hybrid-toxic-shot' });

    expect(game.rawGems).toHaveLength(0);
    expect(game.gems).toHaveLength(1);
    expect(game.gems[0]!.family).toBe('toxic_shot');
    expect(game.gems[0]!.level).toBe(1);
    expect(game.rocks).toHaveLength(4);
    expect(game.buildStep).toBe('ready');
  });
});
