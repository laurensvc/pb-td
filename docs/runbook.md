# Project Facet — Deployment Runbook (Phase 5)

## Stack

| Component | Deploy target |
|-----------|---------------|
| Web (`apps/web`) | Firebase Hosting |
| Game server (`apps/game-server`) | Cloud Run or `docker compose` |
| Postgres | Docker volume or managed DB |

## Local development

```bash
pnpm install
pnpm dev              # web on :5173
pnpm --filter @facet/game-server dev   # Colyseus on :2567
```

## Production (homelab)

```bash
cd infra
docker compose up -d
```

Configure Firebase env in `apps/web/.env`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
```

## Health checks

- Web: load `/`
- Server: `GET /health` on port 2567

## Replay debugging

Match command logs stored in Postgres `match_commands` table (Phase 3+). Replay by re-running `packages/sim` with logged commands and content version.
