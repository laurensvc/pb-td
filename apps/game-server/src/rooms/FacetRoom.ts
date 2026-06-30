import { Room, type Client } from 'colyseus';
import { parseCommandEnvelope } from '@facet/protocol';
import { applyProtocolCommand, createGame, createSnapshot, type GameState } from '@facet/web/game';

export class FacetRoom extends Room {
  private states = new Map<string, GameState>();
  private clientPlayers = new Map<string, string>();
  private sharedOfferSeed = Date.now();

  onCreate(options?: { seed?: number }) {
    this.setPatchRate(100);
    this.maxClients = 4;
    if (options?.seed !== undefined) {
      this.sharedOfferSeed = options.seed;
    }

    this.onMessage('command', (client: Client, raw: unknown) => {
      const parsed = parseCommandEnvelope(raw);
      if (!parsed.success) {
        client.send('commandRejected', { reason: 'invalid_command' });
        return;
      }

      const { playerId } = parsed.command;
      const state = this.states.get(playerId);
      if (!state) {
        client.send('commandRejected', { reason: 'unknown_player' });
        return;
      }

      const feedback = applyProtocolCommand(state, parsed.command);
      client.send('snapshot', {
        snapshot: createSnapshot(state),
        feedback,
        clientSequence: parsed.command.clientSequence,
      });
    });
  }

  onJoin(client: Client, options: { playerId?: string; seed?: number }) {
    const seed = options.seed ?? this.sharedOfferSeed;
    const playerId = options.playerId ?? client.sessionId;
    this.clientPlayers.set(client.sessionId, playerId);
    this.states.set(playerId, createGame(undefined, { runSeed: seed }));
    client.send('welcome', { playerId, seed, sharedOfferSeed: this.sharedOfferSeed });
    client.send('snapshot', { snapshot: createSnapshot(this.states.get(playerId)!) });
  }

  onLeave(client: Client) {
    const playerId = this.clientPlayers.get(client.sessionId);
    if (playerId) {
      this.states.delete(playerId);
    }
    this.clientPlayers.delete(client.sessionId);
  }
}
