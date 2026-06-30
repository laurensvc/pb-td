import { describe, expect, it } from 'vitest';
import { parseCommandEnvelope } from '@facet/protocol';
import { canPlaceRockAt, createGame } from './engine';
import { applyProtocolCommand, protocolCommandToActions } from './protocolBridge';
import { hexWorldCenter } from './hexGrid';
import { dispatchGameAction } from './engine';

describe('protocolBridge', () => {
  it('maps GemTD build commands to engine actions', () => {
    const parsed = parseCommandEnvelope({
      playerId: 'p1',
      roomId: 'r1',
      clientSequence: 0,
      commandType: 'PLACE_RAW_GEM',
      payload: { x: 5, y: 5 },
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(protocolCommandToActions(parsed.command)).toEqual([{ type: 'placeRawGem', x: 5, y: 5 }]);
  });

  it('expands merge commands into source selection plus merge', () => {
    const parsed = parseCommandEnvelope({
      playerId: 'p1',
      roomId: 'r1',
      clientSequence: 0,
      commandType: 'MERGE_GEMS',
      payload: { sourceGemId: 1, targetGemId: 2 },
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(protocolCommandToActions(parsed.command)).toEqual([
      { type: 'selectMergeSource', gemId: 1 },
      { type: 'mergeGems', targetGemId: 2 },
    ]);
  });

  it('applies place-rock through the bridge', () => {
    const game = createGame();
    const cell = hexWorldCenter(0, 0);
    expect(canPlaceRockAt(game, cell.x, cell.y)).toBe(true);

    const parsed = parseCommandEnvelope({
      playerId: 'p1',
      roomId: 'r1',
      clientSequence: 0,
      commandType: 'PLACE_ROCK',
      payload: { x: 0, y: 0 },
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    applyProtocolCommand(game, parsed.command);
    expect(game.rocksPlacedThisPhase).toBe(1);
  });

  it('shares deterministic offers when players use the same run seed', () => {
    const left = createGame(undefined, { runSeed: 4242 });
    const right = createGame(undefined, { runSeed: 4242 });
    dispatchGameAction(left, { type: 'finishRocks' });
    dispatchGameAction(right, { type: 'finishRocks' });
    expect(left.offers).toEqual(right.offers);
  });
});
