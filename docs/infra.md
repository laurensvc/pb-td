# Project Facet — Infrastructure

PF-0.5 / Phase 3 hosting decisions (locked in grill session).

---

## Stack summary

| Component | Service | Notes |
|-----------|---------|-------|
| Web client | **Firebase Hosting** | SPA build from `apps/web` |
| Authentication | **Firebase Auth** (Google OAuth) | Required from Phase 1 |
| Game simulation | **Colyseus** (`apps/game-server`) | Authoritative; anti-cheat |
| Game server host | **Cloud Run** or **homelab Docker** | WebSocket friendly |
| Match + command logs | **PostgreSQL** (preferred) | Replay reconstruction |
| Optional metadata | Firestore | Room invites, presence only if needed |

**Decision:** Use **PostgreSQL** for `matches`, `match_players`, `match_commands` per original data model. Firestore optional for lightweight lobby metadata if Postgres ops are heavy on homelab.

---

## Protocol package (PF-0.5)

**Target:** `packages/protocol`

```ts
// Envelope for every client → server command
type CommandEnvelope = {
  playerId: string;
  roomId: string;
  clientSequence: number;
  commandType: CommandType;
  payload: unknown;
};

type CommandType =
  | 'PLACE_ROCK'
  | 'SELL_ROCK'
  | 'UPGRADE_ROCK'
  | 'SELL_TOWER'
  | 'CLAIM_OFFER'
  | 'REROLL_OFFER'
  | 'MERGE_TOWERS'
  | 'CREATE_COMBINATION'
  | 'SET_TARGETING'
  | 'READY_FOR_WAVE'
  | 'REQUEST_SPEED'
  | 'VOTE_PAUSE'
  | 'PING_TILE';
```

Validate with **Zod** on server before applying to `packages/sim`.

---

## Monorepo (PF-0.6)

```text
pnpm-workspace.yaml
apps/web/          ← migrate current src/, public/, vite
packages/sim/      ← Phase 1: engine from src/game/
packages/content/  ← schemas + data JSON
packages/protocol/ ← Zod command schemas
packages/config/   ← shared tsconfig
```

**Exit command:** `pnpm dev` from repo root runs `apps/web`.

---

## Environment variables

| Var | Used by |
|-----|---------|
| `VITE_FIREBASE_*` | Web client |
| `DATABASE_URL` | Game server / API |
| `COLYSEUS_PORT` | Game server |
| `CONTENT_VERSION` | Sim + replay |

---

## Deployment (Phase 5 preview)

1. `pnpm build` → Firebase deploy (web)
2. Docker image → Cloud Run or `docker compose up` (Colyseus + Postgres)
3. Nginx/Caddy optional reverse proxy on homelab

Full steps: `docs/runbook.md` (Phase 5).
