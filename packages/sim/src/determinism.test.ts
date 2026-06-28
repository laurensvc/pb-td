import { describe, expect, it } from 'vitest';
import { createFacetState, dispatchFacet } from './engine';

describe('determinism', () => {
  it('same seed and commands produce identical state', () => {
    const run = (seed: number) => {
      const s = createFacetState(seed);
      dispatchFacet(s, { type: 'PLACE_ROCK', x: 1, y: 10 });
      dispatchFacet(s, { type: 'CLAIM_OFFER', index: 0 });
      dispatchFacet(s, { type: 'UPGRADE_ROCK', rockX: 1, rockY: 10 });
      return JSON.stringify({
        offers: s.offers,
        towers: s.towers,
        gold: s.gold,
        rocks: s.rocks,
      });
    };
    expect(run(42)).toBe(run(42));
    expect(run(42)).not.toBe(run(43));
  });
});
