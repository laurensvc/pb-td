import { loadGameContent } from '@facet/content';
import { describe, expect, it } from 'vitest';
import { SeededRng } from '../rng/seeded-rng.js';
import { GemRoller } from './gem-roller.js';
describe('GemRoller', () => {
    const content = loadGameContent();
    it('rolls deterministically by seed', () => {
        const a = new GemRoller(content, new SeededRng(42));
        const b = new GemRoller(content, new SeededRng(42));
        const rollsA = Array.from({ length: 5 }, () => a.roll(1));
        const rollsB = Array.from({ length: 5 }, () => b.roll(1));
        expect(rollsA).toEqual(rollsB);
    });
    it('level 1 always rolls chipped in v1 table', () => {
        const roller = new GemRoller(content, new SeededRng(1));
        for (let i = 0; i < 20; i++) {
            expect(roller.roll(1).quality).toBe('chipped');
        }
    });
    it('level 3 can roll normal', () => {
        const roller = new GemRoller(content, new SeededRng(5));
        const qualities = new Set(Array.from({ length: 200 }, () => roller.roll(3).quality));
        expect(qualities.has('normal')).toBe(true);
    });
});
