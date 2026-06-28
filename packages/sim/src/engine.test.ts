import { describe, expect, it } from 'vitest';
import { createFacetState, dispatchFacet, facetSnapshot } from './engine';
import { canPlaceRock } from './maze';

describe('facet sim', () => {
  it('places rocks up to 5 per phase', () => {
    const state = createFacetState(1);
    dispatchFacet(state, { type: 'PLACE_ROCK', x: 1, y: 10 });
    dispatchFacet(state, { type: 'PLACE_ROCK', x: 2, y: 10 });
    expect(state.rocks).toHaveLength(2);
    expect(facetSnapshot(state).rocksRemaining).toBe(3);
  });

  it('prospect and upgrade flow', () => {
    const state = createFacetState(99);
    dispatchFacet(state, { type: 'PLACE_ROCK', x: 1, y: 10 });
    dispatchFacet(state, { type: 'CLAIM_OFFER', index: 0 });
    expect(state.claimedOffer).not.toBeNull();
    dispatchFacet(state, { type: 'UPGRADE_ROCK', rockX: 1, rockY: 10 });
    expect(state.towers).toHaveLength(1);
    expect(state.rocks).toHaveLength(0);
  });

  it('allows valid rock placement on buildable tile', () => {
    expect(canPlaceRock(1, 10, [], [])).toBe(true);
  });

  it('deterministic offers from seed', () => {
    const a = createFacetState(42);
    const b = createFacetState(42);
    expect(a.offers).toEqual(b.offers);
  });
});
