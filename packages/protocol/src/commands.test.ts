import { describe, expect, it } from 'vitest';
import { BOARD_HEIGHT, BOARD_WIDTH, commandEnvelopeSchema, parseCommandEnvelope } from './commands';

describe('protocol command envelope', () => {
  it('parses a legacy place-rock envelope', () => {
    const result = commandEnvelopeSchema.safeParse({
      playerId: 'p1',
      roomId: 'r1',
      clientSequence: 0,
      commandType: 'PLACE_ROCK',
      payload: { x: 1, y: 2 },
    });
    expect(result.success).toBe(true);
  });

  it('rejects out-of-bounds tile coordinates', () => {
    const result = parseCommandEnvelope({
      playerId: 'p1',
      roomId: 'r1',
      clientSequence: 1,
      commandType: 'PLACE_RAW_GEM',
      payload: { x: BOARD_WIDTH, y: 0 },
    });
    expect(result.success).toBe(false);
  });

  it('validates GemTD build-phase commands', () => {
    const cases = [
      {
        commandType: 'PLACE_RAW_GEM',
        payload: { x: 3, y: 4 },
      },
      {
        commandType: 'COMMIT_RAW_GEM',
        payload: { rawGemId: 12 },
      },
      {
        commandType: 'COMMIT_RAW_RECIPE',
        payload: { recipeId: 'hybrid-toxic-shot' },
      },
      {
        commandType: 'MERGE_GEMS',
        payload: { sourceGemId: 1, targetGemId: 7 },
      },
      {
        commandType: 'CLAIM_OFFER',
        payload: { index: 2 },
      },
      {
        commandType: 'FINISH_ROCKS',
        payload: {},
      },
      {
        commandType: 'REROLL_OFFERS',
        payload: {},
      },
    ] as const;

    for (const { commandType, payload } of cases) {
      const result = parseCommandEnvelope({
        playerId: 'p1',
        roomId: 'r1',
        clientSequence: 0,
        commandType,
        payload,
      });
      expect(result.success, commandType).toBe(true);
      if (result.success) {
        expect(result.command.commandType).toBe(commandType);
        expect(result.command.payload).toEqual(payload);
      }
    }
  });

  it('rejects invalid offer index and gem ids', () => {
    expect(
      parseCommandEnvelope({
        playerId: 'p1',
        roomId: 'r1',
        clientSequence: 0,
        commandType: 'CLAIM_OFFER',
        payload: { index: 5 },
      }).success,
    ).toBe(false);

    expect(
      parseCommandEnvelope({
        playerId: 'p1',
        roomId: 'r1',
        clientSequence: 0,
        commandType: 'COMMIT_RAW_GEM',
        payload: { rawGemId: 0 },
      }).success,
    ).toBe(false);
  });

  it('accepts coordinates on board edges', () => {
    const result = parseCommandEnvelope({
      playerId: 'p1',
      roomId: 'r1',
      clientSequence: 0,
      commandType: 'PLACE_ROCK',
      payload: { x: BOARD_WIDTH - 1, y: BOARD_HEIGHT - 1 },
    });
    expect(result.success).toBe(true);
  });

  it('still validates legacy sim commands', () => {
    const merge = parseCommandEnvelope({
      playerId: 'p1',
      roomId: 'r1',
      clientSequence: 0,
      commandType: 'MERGE_TOWERS',
      payload: { sourceId: 1, targetId: 2 },
    });
    expect(merge.success).toBe(true);

    const combo = parseCommandEnvelope({
      playerId: 'p1',
      roomId: 'r1',
      clientSequence: 0,
      commandType: 'CREATE_COMBINATION',
      payload: { recipeId: 'magma', x: 1, y: 2, towerA: 3, towerB: 4 },
    });
    expect(combo.success).toBe(true);
  });
});
