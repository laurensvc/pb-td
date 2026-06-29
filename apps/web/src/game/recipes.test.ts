import { describe, expect, it } from 'vitest';
import { areAdjacentGems, findMatchingRecipe } from './recipes';
import { resolveMerge } from './gems';

describe('recipes', () => {
  it('matches hybrid recipes regardless of input order', () => {
    const recipe = findMatchingRecipe(
      { family: 'verdant', level: 1 },
      { family: 'kinetic', level: 1 },
    );
    expect(recipe?.output.family).toBe('toxic_shot');
  });

  it('resolves diagonal adjacency on checkerboard', () => {
    expect(areAdjacentGems(2, 5, 3, 6)).toBe(true);
    expect(areAdjacentGems(2, 5, 4, 5)).toBe(false);
  });

  it('creates hybrid output from recipe merge', () => {
    const result = resolveMerge(
      { family: 'arcane', level: 1 },
      { family: 'nova', level: 1 },
    );
    expect(result).toEqual({
      family: 'plasma_mortar',
      level: 1,
      hybrid: true,
    });
  });
});
