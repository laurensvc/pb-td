import { describe, expect, it } from 'vitest';
import { parseCommandEnvelope } from '@facet/protocol';
import { applyProtocolCommand, createGame } from '@facet/web/game';

describe('FacetRoom engine bridge', () => {
  it('applies validated protocol commands through the web engine', () => {
    const game = createGame(undefined, { runSeed: 99 });
    const parsed = parseCommandEnvelope({
      playerId: 'p1',
      roomId: 'r1',
      clientSequence: 0,
      commandType: 'REQUEST_SPEED',
      payload: { speed: 2 },
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    applyProtocolCommand(game, parsed.command);
    expect(game.gameSpeed).toBe(2);
  });
});
