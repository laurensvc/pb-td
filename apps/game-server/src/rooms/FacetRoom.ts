import { Room, type Client } from 'colyseus';
import { createFacetState, dispatchFacet, facetSnapshot } from '@facet/sim';
import { commandEnvelopeSchema } from '@facet/protocol';
import type { FacetState } from '@facet/sim';

export class FacetRoom extends Room {
  private states = new Map<string, FacetState>();

  onCreate() {
    this.setPatchRate(100);
    this.maxClients = 4;

    this.onMessage('command', (client: Client, raw: unknown) => {
      const parsed = commandEnvelopeSchema.safeParse(raw);
      if (!parsed.success) return;
      const { playerId, commandType, payload } = parsed.data;
      const state = this.states.get(playerId);
      if (!state) return;

      switch (commandType) {
        case 'PLACE_ROCK':
          dispatchFacet(state, { type: 'PLACE_ROCK', x: Number(payload.x), y: Number(payload.y) });
          break;
        case 'READY_FOR_WAVE':
          dispatchFacet(state, { type: 'READY' });
          break;
        default:
          break;
      }

      client.send('snapshot', facetSnapshot(state));
    });
  }

  onJoin(client: Client, options: { playerId?: string; seed?: number }) {
    const playerId = options.playerId ?? client.sessionId;
    this.states.set(playerId, createFacetState(options.seed ?? Date.now()));
    client.send('welcome', { playerId, seed: options.seed });
  }
}
