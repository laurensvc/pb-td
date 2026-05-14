# PB TD

Cosmic Siege is a browser-based tower-defense/clicker hybrid built with React 19, TypeScript, Phaser, Vite, Tailwind CSS, Vitest, ESLint, and Prettier.

## Gameplay

- Defend fixed-path cosmic siege lanes against waves of invading soldiers.
- Click the board to launch a cooldown-based Starfall missile that deals AoE damage.
- Place unlocked towers on authored build slots between waves.
- Earn stars from kills even when an attempt fails.
- Earn crowns by fully clearing every enemy in an area difficulty tier.
- Spend stars on missile and tower stat upgrades.
- Spend crowns and stars to unlock major tower branches.
- Use paid respec to experiment without permanently bricking a save.

## MVP Content

- Three areas: Orion Breach, Lunar Causeway, and Crownfall Gate.
- Normal and Hard tiers for each area.
- Kinetic starter tower, Nature poison tower, Arcane shield-break tower, and Nova splash tower.
- Shielded enemies appear in Area 1 wave 3 so Arcane has an early purpose.

## Controls

- Select a tower in the right panel, then click a highlighted build slot before a wave starts.
- Click the board during a wave to fire the Starfall missile.
- Use the Start Wave and Retry controls in the HUD/panels.
- Buy upgrades in the node tree with stars and crowns.

## Scripts

- `pnpm install` - install dependencies
- `pnpm dev` - run the local dev server
- `pnpm test` - run unit tests
- `pnpm lint` - run ESLint
- `pnpm build` - build for production
