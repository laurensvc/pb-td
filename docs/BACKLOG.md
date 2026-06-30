# Project Facet Backlog

Browser GemTD-style tower defense. This backlog tracks the remaining work needed to make the current Phaser/React game closely reflect the Warcraft 3 GemTD custom-map experience.

Primary references:

- [`docs/game-design.md`](./game-design.md) — binding gameplay rules.
- [`docs/PIXELLAB-ASSET-TRACKER.md`](./PIXELLAB-ASSET-TRACKER.md) — PixelLab-first asset plan.
- `apps/web/src/game/engine.ts` — authoritative solo action dispatcher.
- `apps/web/src/game/combat.ts` — combat, movement, projectiles, enemy status effects.
- `apps/web/src/game/placement.ts` — raw gem placement, commit, stone conversion, merge behavior.

---

## Current Verified State

Last verified commands:

- `pnpm --filter @facet/web test` — 18 files, 88 tests passed.
- `pnpm --filter @facet/protocol test` — 1 file, 6 tests passed.
- `pnpm --filter @facet/game-server test` — 1 file, 1 test passed.
- `pnpm --filter @facet/web build` — passed (includes `build:game`).
- `pnpm --filter @facet/game-server build` — passed.
- `pnpm lint` — passed with one existing warning in `apps/admin/src/main.tsx` for `react-refresh/only-export-components`.

Implemented and verified:

- Raw GemTD round ritual: roll 5 raw gems, place 5, commit one gem or a raw recipe, convert all unused raw gems into stone blocks.
- Visible raw gem quality odds by build level.
- Natural raw gem quality levels 1-5.
- Two-identical merge: same family and level produces one gem at `+1`.
- Four-identical merge: connected four-match cluster consumes three matching inputs and upgrades the selected target by `+2`.
- Ordered GemTD checkpoint route: `S -> 1 -> 2 -> 3 -> 4 -> 5 -> F`.
- Flying enemies use a direct route.
- Legacy missile/star/crown account-power runtime paths removed from active web source.
- Asset plan updated for PixelLab-first generation, transparent object backgrounds, distinct monster silhouettes, spawn/end gates, ground variation, and five checkpoint tiles.

Known code-name debt:

- Resolved: `CosmicBoardScene`, `useCosmicGame`, and `components/cosmic/` renamed to Gem TD naming.

---

## Remaining GemTD Parity Work

### P0 — Debuff stacking by gem level ✅

Guide requirement:

- Attack speed, damage, minus armor, and slow debuffs stack when they come from different levels.
- Duplicate same-level debuffs do not stack.

Implemented:

- `ProjectileState.effectLevel` set from `gem.level` in `makeProjectile`.
- Per-level `slowDebuffs` and `armorDebuffs` arrays on `EnemyState`.
- Helpers in `combat.ts`: `applySlowDebuff`, `effectiveSlowFactor`, `applyArmorDebuff`, `effectiveArmorReduction`, `syncDebuffScalars`.
- Scalar `slowUntil` / `slowFactor` / `armorReduction` kept as derived compatibility fields for render.
- Tests in `apps/web/src/game/combatDebuffs.test.ts`.

Remaining note:

- Attack-speed debuff stacking is not yet modeled (no attack-speed debuff mechanic in combat).

### P0 — 24-wave GemTD content alignment ✅

Guide/design requirement:

- `docs/game-design.md` specifies 24 waves.

Implemented:

- `TOTAL_WAVES` set to 24 in `apps/web/src/game/content/constants.ts`.
- Boss milestones at waves 6, 12, and 24 in `waves.ts`.
- Authored finale waves moved from wave 50 to wave 24 in `waveTables.ts`.
- Tests updated for 24-wave totals and snapshot reporting.

### P0 — Remove or rename remaining Cosmic-facing UI labels ✅

Renamed in a behavior-neutral pass:

- `CosmicBoardScene` → `GemBoardScene` (`apps/web/src/phaser/GemBoardScene.ts`)
- `useCosmicGame` → `useGemGame` (`apps/web/src/hooks/useGemGame.ts`)
- `components/cosmic/` → `components/gem/`
- Phaser scene key `gem-board`, texture key `board-rock`
- Canvas aria-label: "Gem TD game board"
- Test suite describe block updated

Acceptance: `rg "Cosmic|cosmic|Cosmic Siege" apps/web/src` returns no matches.

### P1 — Raw recipe parity and formula UI ✅

Guide requirement:

- Different gems combine into upgrades, formulas should be visible in a tab at the left side.
- If the 5 raw gems contain an upgrade formula, the player can build that upgrade directly.

Implemented:

- Dedicated **Formulas** side tab (`FormulasTab` → `RecipePanel`) listing all `hybridRecipes` with inputs, output, and natural level constraints.
- Shared helpers in `recipes.ts`: `listHybridRecipes`, `findRawRecipeMatches`, `describeRecipeInputs`.
- Prospect panel still shows detected recipe commit buttons when five raw gems match a pair recipe.
- Tests in `recipes.test.ts` for catalog completeness, raw match detection, and `commitRawRecipe` stone conversion.

Out of scope note:

- "Third part of an upgrade only after round starts" does not apply to the current pair-based `hybridRecipes` system.

### P1 — Maze legality and GemTD squeeze-gap parity ✅

Guide requirement:

- Creeps cannot travel through diagonally linked blocks (hex: off-axis distance-2 blocker pinches).
- Ground units travel checkpoint-to-checkpoint on shortest BFS distances.

Implemented:

- `isSqueezeGapCell` and `isBlockedCell` in `maze.ts`.
- Off-axis hex blockers at distance 2 pinch shared neighbor cells closed for pathfinding.
- Collinear distance-2 pairs still allow a legal one-hex corridor.
- `isWalkableCell` excludes squeeze gaps; checkpoint path validation and path nav inherit the rule.
- Tests in `maze.test.ts` for pinch detection, corridor legality, path-nav exclusion, and post-raw-gem route validity.

### P1 — PixelLab asset production and integration (batch 1) ✅

Implemented this iteration:

- Verified PixelLab MCP (`user-pixellab`) is available; generated checkpoint markers C-01…C-05 via `create_1_direction_object` (job `ed91107e-ce86-4a67-a1a4-b8f4e781222a`).
- Exported to `public/assets/terrain/checkpoints/1.png` … `5.png`.
- Wired `checkpointTextureKey` / `checkpointAssetPath` in `assetManifest.ts`, preload in `GemBoardScene`, and numbered markers in `boardSprites.ts`.
- Added `assetManifest.test.ts` — verifies core object/gem/enemy/checkpoint paths exist and object PNGs retain alpha.
- Added placeholder `ember`, `ember_lance`, and `solar_flare` gem folders (copied from existing hybrids) so preload covers all families.

Already in repo before this slice:

- Spawn/end gates, rock, terrain floors, 12 enemy walk sheets, and 13 gem families with L1–L7 PNGs.

Remaining for full tracker completion:

- PixelLab replacements for ember-family gems, ground tileset variants (T-02), projectiles/FX, and UI polish assets per `PIXELLAB-ASSET-TRACKER.md`.

### P1 — Warcraft 3 GemTD feel pass ✅

Implemented:

- Base gem `boardName` labels (Amethyst, Emerald, Sapphire, Ruby, Opal, Topaz) used in shop, formulas, and `gemDisplayName`.
- Build ritual UI: three-step stepper (Place five → Commit one → Ready) with contextual banner hints.
- Prospect tab renamed from "Raw gem roll"; clearer ritual copy.
- Larger spawn/end gate and numbered checkpoint sprites on the board (no text labels required).

### P2 — Multiplayer protocol + engine bridge ✅

Implemented:

- GemTD-aligned command types in `packages/protocol/src/commands.ts`: `PLACE_RAW_GEM`, `COMMIT_RAW_GEM`, `COMMIT_RAW_RECIPE`, `MERGE_GEMS`, `FINISH_ROCKS`, `REROLL_OFFERS`, plus shared tile/gem payload schemas.
- `parseCommandEnvelope()` validates envelope + payload together (board bounds 28×20, offer index 0–4, positive gem ids).
- `protocolBridge.ts` maps validated commands to `GameAction` sequences (including two-step merges).
- `FacetRoom` retired `@facet/sim`; uses `createGame`, `applyProtocolCommand`, and `createSnapshot` from `@facet/web/game`.
- Per-player `GameState` with shared `sharedOfferSeed` for deterministic offer rolls across clients.
- `setGemTargeting` action added for `SET_TARGETING` command parity.
- `MERGE_GEMS` payload includes `sourceGemId` + `targetGemId`.
- Web game library emit via `pnpm --filter @facet/web build:game` → `dist-game/` for server consumption.
- Tests in `commands.test.ts`, `protocolBridge.test.ts`, and `FacetRoom.test.ts`.

Remaining for full multiplayer parity:

- Room tick loop, pause votes, and combat sync still run client-side only; server stores authoritative build-phase state per player.

### P1 — PixelLab asset production (batch 2) ✅

Implemented:

- PixelLab jobs for ember-family gems (`3877995f…`, `62e9f8c0…`, `5cde4518…`) exported to `gems/ember/`, `gems/ember_lance/`, `gems/solar_flare/` (L1–L7).
- T-02 ground variation tileset (`a7d38ad9…`) exported to `terrain/floor-variants.png`.
- `assetManifest.ts`: `terrainFloorVariants`, `terrainVariantIndex`, `floorVariantFrame`.
- `boardSprites.ts`: rock-floor cells use `floor-variants` spritesheet frames when loaded.
- `GemBoardScene` preloads `floor-variants` as 32×32 spritesheet.
- `scripts/export-pixellab-batch2.mjs` for re-exporting batch assets.
- Tests extended in `assetManifest.test.ts` (variant index + ember distinctiveness).

Remaining per full tracker:

- UI polish assets per `PIXELLAB-ASSET-TRACKER.md`.

### P1 — PixelLab asset production (batch 3) ✅

Implemented:

- PixelLab jobs: five base-family projectiles (`af3349ff…`), merge burst (`14590726…`), hit spark (`f56058e0…`).
- Exported to `public/assets/fx/projectiles/{kinetic,verdant,arcane,nova,prism}.png`, `fx/merge-burst.png`, `fx/hit-spark.png`.
- `ProjectileState.family` added; `projectileVisualBranch()` maps hybrids to base projectile art.
- `FxSpriteLayer` renders rotated projectile sprites and merge-burst FX (replaces colored circles when assets load).
- `GemBoardScene` preloads FX textures; circle fallback retained when sprites missing.
- Tests in `projectileManifest.test.ts` and extended `assetManifest.test.ts`.

---

## Handoff Notes For The Next Agent

Start here:

1. Run `git status --short` and inspect the current diff. The worktree is intentionally dirty with GemTD parity changes.
2. Run verification before changing behavior:
   - `pnpm --filter @facet/web test`
   - `pnpm --filter @facet/web build`
   - `pnpm lint`
3. Treat `docs/game-design.md` as the binding design contract.
4. Treat the supplied GemTD guide as the source for parity details not yet encoded in tests.

Recent important implementation points:

- Raw quality odds live in `apps/web/src/game/buildPhase.ts`.
- Raw odds are exposed in `Snapshot` via `rawGemBuildLevel` and `rawGemQualityOdds`.
- Prospect UI is `apps/web/src/components/gem/panels/shop.tsx`.
- Four-identical merge is implemented in `apps/web/src/game/placement.ts` using `identicalClusterIds` from `apps/web/src/game/gems.ts`.
- Active combat debuff scalar logic is still in `apps/web/src/game/combat.ts`; this is the next high-priority parity gap.
- Enemy render tint still depends on scalar `slowUntil`; preserve or deliberately migrate this when adding per-level slow stacks.

Process constraints from the previous session:

- The `brainstorming` skill was invoked earlier and required approval before behavior changes. The user approved the odds/four-merge slice. For a new behavior slice, get user approval first if that skill remains active in your environment.
- PixelLab was requested by the user, but no PixelLab MCP tool was exposed in the previous session. Check tool availability first; if unavailable, do not pretend assets were generated.
- Keep transparent backgrounds mandatory for enemies, gems, rocks, towers, and gates.
- Do not revert unrelated user changes in the dirty worktree.

Recommended next implementation slice after approval:

**Multiplayer combat tick sync** for full MP parity, or **PixelLab UI polish batch** per `PIXELLAB-ASSET-TRACKER.md`.

---

## Definition Of Done For GemTD Parity Plan

The full plan is not complete until all of these are true:

- GemTD round ritual is implemented and covered by tests.
- Raw quality odds are visible and drive actual rolls.
- Two-merge and four-merge behavior match the guide.
- Debuff stacking follows different-level-stack, same-level-no-stack rules.
- Ordered checkpoint routing is implemented, tested, and visually represented.
- Flying enemies ignore maze routing.
- PixelLab or approved fallback assets are generated/integrated with transparent object backgrounds.
- Visible UI and board presentation no longer read as Cosmic Siege.
- Web tests, web build, and lint pass.
