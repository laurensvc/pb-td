# AGENTS.md

## Cursor Cloud specific instructions

Cosmic Siege (`pb-td`) is a **frontend-only** browser tower-defense/clicker game. There is **no backend, database, or external service** — game progress is persisted to the browser's `localStorage` (`src/game/save.ts`). Rendering uses Phaser (`src/phaser`) inside a React 19 + Vite app, with Zustand for state.

- Package manager is **pnpm** (pinned via `packageManager` in `package.json`). Dependencies are installed automatically by the startup update script (`pnpm install`).
- Standard scripts are documented in `README.md` / `package.json` (`pnpm dev`, `pnpm test`, `pnpm lint`, `pnpm build`). Use those rather than re-deriving commands.
- The dev server (`pnpm dev`) runs on **port 5173** and does not expose a network host by default; use `http://localhost:5173/`. Tests run headless via Vitest + jsdom, so no server is needed for `pnpm test`.
- To verify the game end-to-end, load `http://localhost:5173/`, enter an area (e.g. Orion Breach, Normal), click **Start Wave**, then click the board to fire the Starfall missile / place towers — progress and earned stars persist in `localStorage`.
- `pnpm build` emits a large single JS chunk and prints a >500 kB chunk-size warning; this is expected and not an error.
