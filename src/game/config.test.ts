import { describe, expect, it } from 'vitest';
import { gameConfig, getEnemy, getGem } from './config';

describe('PB TD gameplay data', () => {
  it('defines all 50 required waves', () => {
    expect(gameConfig.waves).toHaveLength(50);
    for (let i = 0; i < gameConfig.waves.length; i++) {
      const wave = gameConfig.waves[i];
      expect(wave.wave).toBe(i + 1);
      expect(() => getEnemy(gameConfig, wave.enemyId)).not.toThrow();
      for (const enemyId of wave.alternativeEnemyIds ?? []) {
        expect(() => getEnemy(gameConfig, enemyId)).not.toThrow();
      }
    }
  });

  it('defines eight gem families with six levels each', () => {
    const families = new Set(
      gameConfig.gems.filter((gem) => gem.classification === 'gem').map((gem) => gem.family),
    );
    expect(families.size).toBe(8);
    for (const family of families) {
      for (let tier = 1; tier <= 6; tier++) {
        expect(() => getGem(gameConfig, `${family}-${tier}`)).not.toThrow();
      }
    }
  });

  it('resolves every recipe ingredient and result', () => {
    for (const recipe of gameConfig.recipes) {
      expect(() => getGem(gameConfig, recipe.resultGemId)).not.toThrow();
      for (const ingredient of recipe.ingredients) {
        if (ingredient.gemId) expect(() => getGem(gameConfig, ingredient.gemId!)).not.toThrow();
        if (ingredient.towerId) expect(() => getGem(gameConfig, ingredient.towerId!)).not.toThrow();
      }
    }
  });
});
