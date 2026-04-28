# PB TD

A browser-based, GEMTD-inspired tower defense game with React 19, TypeScript, Tailwind CSS, Zustand, Vite, ESLint, Prettier, and a canvas renderer.

## Scripts

- `pnpm install` - install dependencies
- `pnpm dev` - run the local dev server
- `pnpm test` - run unit tests
- `pnpm lint` - run ESLint
- `pnpm typecheck` - run TypeScript
- `pnpm build` - build for production
- `pnpm assets:folders` - create `public/assets/towers` and `public/assets/monsters` folders from game config (see `public/assets/README.md`)

## Gameplay

Each round, place five random gem candidates on the grid, then choose one to keep as a tower. The other four harden into maze stones, shaping the route for later waves. Survive waves, fuse adjacent recipes into stronger towers, and build persistent local progress.
