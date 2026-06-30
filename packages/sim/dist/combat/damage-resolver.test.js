import { armorDamageMatrix, loadGameContent } from '@facet/content';
import { describe, expect, it } from 'vitest';
import { SeededRng } from '../rng/seeded-rng.js';
import { resolveDamage } from './damage-resolver.js';
import { createCreepFromWave } from './creep-factory.js';
describe('resolveDamage', () => {
    const content = loadGameContent();
    const wave = content.waves[0];
    const rng = new SeededRng(42);
    it('applies armor type matrix for pierce vs heavy', () => {
        const creep = createCreepFromWave(content, 'shield-bulwark', wave, 1, 1, 1);
        const result = resolveDamage(creep, { baseDamage: 100, attackType: 'pierce', sourceTowerId: 't1' }, { matrix: armorDamageMatrix, rng });
        expect(result.missed).toBe(false);
        expect(result.damage).toBeLessThan(100);
    });
    it('blocks magic damage when magic immune', () => {
        const creep = createCreepFromWave(content, 'stone-grunt', wave, 1, 1, 1);
        creep.magicImmune = true;
        const result = resolveDamage(creep, { baseDamage: 50, attackType: 'magic', sourceTowerId: 't1' }, { matrix: armorDamageMatrix, rng });
        expect(result.blocked).toBe(true);
        expect(result.damage).toBe(0);
    });
    it('can miss via evasion', () => {
        const creep = createCreepFromWave(content, 'stone-grunt', wave, 1, 1, 1);
        creep.evasion = 1;
        const result = resolveDamage(creep, { baseDamage: 50, attackType: 'normal', sourceTowerId: 't1' }, { matrix: armorDamageMatrix, rng });
        expect(result.missed).toBe(true);
        expect(result.damage).toBe(0);
    });
    it('applies magic resist reduction', () => {
        const creep = createCreepFromWave(content, 'stone-grunt', wave, 1, 1, 1);
        creep.magicResist = 75;
        const result = resolveDamage(creep, { baseDamage: 100, attackType: 'magic', sourceTowerId: 't1' }, { matrix: armorDamageMatrix, rng });
        expect(result.damage).toBeLessThan(50);
    });
    it('pure damage ignores armor typing', () => {
        const creep = createCreepFromWave(content, 'gate-colossus', wave, 1, 1, 1);
        const result = resolveDamage(creep, { baseDamage: 40, attackType: 'pure', sourceTowerId: 't1' }, { matrix: armorDamageMatrix, rng });
        expect(result.damage).toBe(40);
    });
});
