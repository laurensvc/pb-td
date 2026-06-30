# AGENTS.md

## Project Facet (`pb-td`)

Browser GemTD-style tower defense — monorepo pivot from Cosmic Siege.

### Structure

```text
apps/web/           React + Phaser client (Cosmic Gem Siege)
apps/game-server/   Colyseus multiplayer (Phase 3)
apps/admin/         Balance dashboard stub (Phase 4)
packages/sim/       Legacy Facet sim prototype (reference)
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

Authoritative solo rules: `apps/web/src/game/engine.ts`.  
UI shell: `apps/web/src/App.tsx` + `apps/web/src/components/cosmic/`.  
Design contract: `docs/game-design.md`. Parity loop: `docs/GEMTD-PHASE-LOOP.md`.
