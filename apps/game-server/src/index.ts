import { createServer } from 'node:http';
import { Server } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import express from 'express';
import { FacetRoom } from './rooms/FacetRoom.js';

const port = Number(process.env.COLYSEUS_PORT ?? 2567);

const app = express();
app.get('/health', (_req, res) => res.json({ ok: true, service: 'facet-game-server' }));

const httpServer = createServer(app);
const gameServer = new Server({ transport: new WebSocketTransport({ server: httpServer }) });
gameServer.define('facet', FacetRoom);

httpServer.listen(port, () => {
  console.log(`[facet] Colyseus listening on :${port}`);
});
