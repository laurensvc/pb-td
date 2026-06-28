import { describe, expect, it } from 'vitest';
import { dispatchFacet } from './engine';
import { createRecording, recordCommand, replayCommands, statesMatch } from './replay';
import { createFacetState } from './engine';

describe('replay', () => {
  it('reproduces state from command log', () => {
    const seed = 99;
    const live = createFacetState(seed);
    const rec = createRecording(seed);

    recordCommand(rec, 0, { type: 'PLACE_ROCK', x: 1, y: 10 });
    dispatchFacet(live, { type: 'PLACE_ROCK', x: 1, y: 10 });
    recordCommand(rec, 1, { type: 'CLAIM_OFFER', index: 0 });
    dispatchFacet(live, { type: 'CLAIM_OFFER', index: 0 });
    recordCommand(rec, 2, { type: 'UPGRADE_ROCK', rockX: 1, rockY: 10 });
    dispatchFacet(live, { type: 'UPGRADE_ROCK', rockX: 1, rockY: 10 });

    const replayed = replayCommands(seed, rec.commands);
    expect(statesMatch(live, replayed)).toBe(true);
  });
});
