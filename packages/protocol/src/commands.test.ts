import { describe, expect, it } from 'vitest';
import { commandEnvelopeSchema } from './commands';

describe('protocol', () => {
  it('parses command envelope', () => {
    const result = commandEnvelopeSchema.safeParse({
      playerId: 'p1',
      roomId: 'r1',
      clientSequence: 0,
      commandType: 'PLACE_ROCK',
      payload: { x: 1, y: 2 },
    });
    expect(result.success).toBe(true);
  });
});
