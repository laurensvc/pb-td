import { describe, expect, it } from 'vitest';
import { canMergeGems, gemSellValue, getGemCombatStats, mergedLevel } from './gems';
import { createDefaultSave } from './save';

describe('gems', () => {
  it('allows merging same family and level below 7', () => {
    expect(canMergeGems({ family: 'kinetic', level: 3 }, { family: 'kinetic', level: 3 })).toBe(
      true,
    );
    expect(canMergeGems({ family: 'kinetic', level: 3 }, { family: 'verdant', level: 3 })).toBe(
      false,
    );
    expect(canMergeGems({ family: 'kinetic', level: 7 }, { family: 'kinetic', level: 7 })).toBe(
      false,
    );
  });

  it('increments level on merge', () => {
    expect(mergedLevel(1)).toBe(2);
    expect(mergedLevel(6)).toBe(7);
    expect(mergedLevel(7)).toBe(7);
  });

  it('scales combat stats with level', () => {
    const save = createDefaultSave();
    const l1 = getGemCombatStats(save, 'verdant', 1);
    const l4 = getGemCombatStats(save, 'verdant', 4);
    expect(l4.damage).toBeGreaterThan(l1.damage);
    expect(l4.poisonDps).toBeGreaterThan(l1.poisonDps ?? 0);
  });

  it('great gems have boosted stats', () => {
    const save = createDefaultSave();
    const l6 = getGemCombatStats(save, 'arcane', 6);
    const l7 = getGemCombatStats(save, 'arcane', 7);
    expect(l7.damage).toBeGreaterThan(l6.damage);
    expect(l7.range).toBeGreaterThan(l6.range);
  });

  it('sell value scales with level', () => {
    expect(gemSellValue('kinetic', 1)).toBeLessThan(gemSellValue('kinetic', 5));
  });
});
