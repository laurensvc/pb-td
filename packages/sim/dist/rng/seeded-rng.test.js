import { describe, expect, it } from 'vitest';
import { SeededRng } from './seeded-rng.js';
describe('SeededRng', () => {
    it('produces identical sequences for the same seed', () => {
        const a = new SeededRng(42);
        const b = new SeededRng(42);
        const seqA = Array.from({ length: 10 }, () => a.next());
        const seqB = Array.from({ length: 10 }, () => b.next());
        expect(seqA).toEqual(seqB);
    });
    it('pickUniform selects from array', () => {
        const rng = new SeededRng(1);
        const item = rng.pickUniform(['a', 'b', 'c']);
        expect(['a', 'b', 'c']).toContain(item);
    });
    it('pickWeighted respects distribution within tolerance', () => {
        const rng = new SeededRng(99);
        const counts = { a: 0, b: 0 };
        for (let i = 0; i < 10_000; i++) {
            const pick = rng.pickWeighted([
                { item: 'a', weight: 70 },
                { item: 'b', weight: 30 },
            ]);
            counts[pick] += 1;
        }
        const ratio = counts.a / 10_000;
        expect(ratio).toBeGreaterThan(0.65);
        expect(ratio).toBeLessThan(0.75);
    });
    it('serializes and restores state', () => {
        const rng = new SeededRng(7);
        rng.next();
        rng.next();
        const state = rng.getState();
        const next = rng.next();
        const restored = SeededRng.fromState(state);
        expect(restored.next()).toBe(next);
    });
    it('fork creates independent stream', () => {
        const parent = new SeededRng(123);
        const child = parent.fork('rolls');
        const parentNext = parent.next();
        const childSeq = [child.next(), child.next()];
        expect(childSeq[0]).not.toBe(parentNext);
    });
});
