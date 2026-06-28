# AGENTS.md

## Project Facet (`pb-td`)

Browser GemTD-style tower defense — monorepo pivot from Cosmic Siege.

### Structure

```text
apps/web/           React + Facet UI (main client)
apps/game-server/   Colyseus multiplayer (Phase 3)
apps/admin/         Balance dashboard stub (Phase 4)
packages/sim/       Authoritative game rules
packages/content/   Board, waves, gems JSON + Zod schemas
packages/protocol/  Multiplayer command schemas
infra/              Docker Compose
docs/               backlog, game-design, runbook
```

### Commands (from repo root)

- `pnpm install`
- `pnpm dev` — web client on http://localhost:5173/
- `pnpm test` — all workspace tests
- `pnpm --filter @facet/game-server dev` — Colyseus on :2567

### Game rules

Live in `packages/sim`. UI in `apps/web/src/components/FacetApp.tsx`.  
Design contract: `docs/game-design.md`. Backlog: `docs/backlog.md`.

### Legacy code

Cosmic Siege code removed in PF-1.0. All rules live in `packages/sim`.

### Firebase

Set `VITE_FIREBASE_*` in `apps/web/.env`. Without config, dev auth bypasses with a mock user.
