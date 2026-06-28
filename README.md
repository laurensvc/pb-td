# Project Facet (`pb-td`)

Browser GemTD-style tower defense: maze building, gem prospects, merges, and shared-seed races.

## Quick start

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173/ — Project Facet UI (Firebase optional; dev bypass without env).

## Monorepo

| Package | Purpose |
|---------|---------|
| `apps/web` | React client |
| `apps/game-server` | Colyseus server |
| `packages/sim` | Game simulation |
| `packages/content` | JSON content + schemas |

See [docs/backlog.md](docs/backlog.md) for the full roadmap.

## Scripts

- `pnpm dev` — web dev server
- `pnpm test` — workspace tests
- `pnpm build` — build all packages
- `pnpm --filter @facet/game-server dev` — multiplayer server

## Docs

- [backlog.md](docs/backlog.md)
- [game-design.md](docs/game-design.md)
- [runbook.md](docs/runbook.md)
