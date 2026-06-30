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

- `pnpm --filter @facet/web test` — 14 files, 57 tests passed.
- `pnpm --filter @facet/web build` — passed.
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

- Several internal files/components still use `Cosmic*` names, for example `CosmicBoardScene` and `useCosmicGame`. These are now mostly naming debt, not active Cosmic Siege mechanics.

---

## Remaining GemTD Parity Work

### P0 — Debuff stacking by gem level

Guide requirement:

- Attack speed, damage, minus armor, and slow debuffs stack when they come from different levels.
- Duplicate same-level debuffs do not stack.

Current state:

- `apps/web/src/game/combat.ts` stores slow and armor reduction as scalar max values on `EnemyState`.
- This means duplicate and different-level debuffs are not distinguished.

Implementation notes:

- Add projectile provenance, likely `effectLevel: GemLevel`, in `ProjectileState`.
- Add per-level debuff state to `EnemyState`, for example:
  - `slowDebuffs: { level: GemLevel; factor: number; until: number }[]`
  - `armorDebuffs: { level: GemLevel; reduction: number; until?: number }[]`
- Derive compatibility scalar fields (`slowFactor`, `slowUntil`, `armorReduction`) until render/tests are migrated.
- Slow movement should sum active slow factors from distinct levels, clamp to a safe cap, and ignore duplicate same-level slow except refreshing duration or keeping the stronger same-level value.
- Armor reduction should sum reductions from distinct levels, ignore duplicate same-level reductions except keeping the stronger same-level value.

Acceptance tests:

- L1 slow + L2 slow stacks into a stronger movement penalty than either alone.
- L2 slow + L2 slow does not stack.
- Expired slow no longer affects movement.
- L1 armor reduction + L2 armor reduction stacks damage amplification.
- L2 armor reduction + L2 armor reduction does not stack damage amplification.

Suggested files:

- `apps/web/src/game/types/runtime.ts`
- `apps/web/src/game/combat.ts`
- `apps/web/src/game/engine.test.ts` or a new focused `combatDebuffs.test.ts`

### P0 — 24-wave GemTD content alignment

Guide/design requirement:

- `docs/game-design.md` specifies 24 waves.

Current state:

- Some source/tests still reference 50 waves, including `apps/web/src/game/engine.test.ts`.
- `apps/web/src/game/content/constants.ts` should be checked for `TOTAL_WAVES`.

Implementation notes:

- Decide whether to immediately move the active web content to 24 waves or keep 50 until content JSON migration.
- If moving now, update constants, wave tables, tests, UI copy, and any balancing assumptions.
- Ensure the first playable vertical slice can still be tested without excessive runtime.

Acceptance tests:

- `TOTAL_WAVES` matches the design target.
- Start/clear/loss tests still run within normal test time.
- Wave preview and result messages report the correct total.

### P0 — Remove or rename remaining Cosmic-facing UI labels

Current state:

- Runtime mechanics are GemTD-oriented, but some internal and accessibility names still say Cosmic.

Known examples:

- `apps/web/src/components/PhaserGameHost.tsx` aria-label.
- `apps/web/src/phaser/CosmicBoardScene.ts`
- `apps/web/src/hooks/useCosmicGame.ts`
- `apps/web/src/components/cosmic/`
- Some test descriptions, such as "cosmic gem siege simulation".

Implementation notes:

- Prefer a separate rename-only pass after mechanical parity work is stable.
- Keep behavior unchanged during the rename pass.
- Update imports in one commit/slice to reduce mixed semantic and rename diffs.

Acceptance tests:

- `rg "Cosmic|cosmic|Cosmic Siege" apps/web/src docs -n` returns only intentional historical notes or no runtime-facing references.
- Web build/test/lint pass.

### P1 — Raw recipe parity and formula UI

Guide requirement:

- Different gems combine into upgrades, formulas should be visible in a tab at the left side.
- If the 5 raw gems contain an upgrade formula, the player can build that upgrade directly.
- Some third-part upgrade behavior may only become available once the round starts.

Current state:

- Raw recipe commit exists for pair-based `hybridRecipes`.
- Prospect panel shows detected raw recipe actions only when available.
- There is not yet a full formula reference tab matching the guide.

Implementation notes:

- Add a formula reference panel listing all `hybridRecipes`, required inputs, output, and natural level constraints.
- Keep detected recipe commit buttons in Prospect.
- Decide whether "third part of an upgrade only after round starts" applies to this project’s recipe system or is out of scope.

Acceptance tests:

- Formula panel renders all recipes from `apps/web/src/game/recipes.ts`.
- Direct raw recipe commit consumes the selected output raw cell and converts all other raw gems into stones.
- No formula UI hardcodes recipe data outside content/helpers.

### P1 — Maze legality and GemTD squeeze-gap parity

Guide requirement:

- Creeps cannot travel through diagonally linked blocks.
- Ground units travel from arrow to arrow; drawn path does not matter.
- Ground units take the shortest path and do not prefer tower exposure.

Current state:

- Ordered checkpoints and shortest-path BFS are implemented.
- The project uses a hex board, so the square-grid "diagonal" rule needs a hex-equivalent acceptance rule.

Implementation notes:

- Define and test the hex equivalent of "no ambiguous squeeze gaps".
- Existing path validation lives in `apps/web/src/game/maze.ts`, `boardQueries.ts`, and path navigation helpers.
- Use tests with blocker patterns that visually appear passable but should be rejected by the parity rule.

Acceptance tests:

- Checkpoint-to-checkpoint route remains valid after legal raw gem/stone placement.
- Illegal squeeze-gap blocker patterns are rejected.
- Ground path remains shortest-to-next-checkpoint, independent of tower exposure.

### P1 — PixelLab asset production and integration

User requirement:

- Use PixelLab MCP first to generate assets.
- Enemies, gems, rocks, towers, and gates require transparent backgrounds/background removal.
- Need distinct monsters, ground variations, main spawn gate, end gate, and five special checkpoint tiles.

Current state:

- `docs/PIXELLAB-ASSET-TRACKER.md` has prompts, batches, and acceptance checks.
- PixelLab MCP was not exposed in the previous session; do not silently switch generators unless the user approves.

Implementation notes:

- First check for `user-pixellab` or PixelLab tools with tool discovery.
- Generate in this order:
  1. Spawn/end gates and checkpoint tiles.
  2. Ground variations and stone blocks.
  3. Raw/tower gems and recipe towers.
  4. Distinct enemies and walk animations.
  5. Projectiles and UI icons.
- Verify transparent alpha for all object sprites.
- Integrate under `public/assets/` and update Phaser preload/manifest.

Acceptance tests:

- Asset files exist at the tracker paths.
- Object PNGs have alpha and no opaque square backgrounds.
- Phaser scene renders the new gates/checkpoints/monsters.
- Visual screenshot confirms readability at board scale.

### P1 — Warcraft 3 GemTD feel pass

Current state:

- Mechanics are moving toward GemTD, but names, panel hierarchy, and art still read as a hybrid.

Implementation notes:

- Rename visible gem family labels toward GemTD analogs or a deliberate legally distinct fantasy crystal set.
- Make spawn/end gates and checkpoint arrows strong first-viewport board signals.
- Keep the UI functional and dense; do not add a marketing/landing layer.
- Avoid overdecorated cards; the player should understand the build ritual at a glance.

Acceptance tests:

- First build phase visibly communicates: five raw gems, place all five, commit one, other four become stones.
- Checkpoints are visually numbered or color-coded 1-5.
- Start/end are visible on the board without relying on text.

### P2 — Multiplayer protocol follow-up

Current state:

- Solo web engine is authoritative for current parity work.
- Protocol docs still reference older command names such as `PLACE_ROCK`, `CLAIM_OFFER`, and `CREATE_COMBINATION`.

Implementation notes:

- Add or update protocol commands for:
  - place raw gem,
  - commit raw gem,
  - commit raw recipe,
  - merge two,
  - merge four.
- Ensure multiplayer keeps shared seed/shared raw offers while boards remain independent.

Acceptance tests:

- Zod schemas cover the new commands.
- Server-side command validation mirrors solo engine constraints.

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
- Prospect UI is `apps/web/src/components/cosmic/panels/shop.tsx`.
- Four-identical merge is implemented in `apps/web/src/game/placement.ts` using `identicalClusterIds` from `apps/web/src/game/gems.ts`.
- Active combat debuff scalar logic is still in `apps/web/src/game/combat.ts`; this is the next high-priority parity gap.
- Enemy render tint still depends on scalar `slowUntil`; preserve or deliberately migrate this when adding per-level slow stacks.

Process constraints from the previous session:

- The `brainstorming` skill was invoked earlier and required approval before behavior changes. The user approved the odds/four-merge slice. For a new behavior slice, get user approval first if that skill remains active in your environment.
- PixelLab was requested by the user, but no PixelLab MCP tool was exposed in the previous session. Check tool availability first; if unavailable, do not pretend assets were generated.
- Keep transparent backgrounds mandatory for enemies, gems, rocks, towers, and gates.
- Do not revert unrelated user changes in the dirty worktree.

Recommended next implementation slice after approval:

**GemTD debuff stacking by level**

- Different levels stack.
- Duplicate same-level debuffs do not stack.
- Expired slow effects stop affecting movement.
- Tests should prove L1+L2 stacking, L2+L2 non-stacking, and expiration.

Suggested design:

- Add `effectLevel` to `ProjectileState`, set from `gem.level` in `makeProjectile`.
- Add per-level debuff arrays/maps to `EnemyState`.
- Implement helpers in `combat.ts`:
  - `applySlowDebuff(enemy, level, factor, until)`
  - `effectiveSlowFactor(enemy, now)`
  - `applyArmorDebuff(enemy, level, reduction, until?)`
  - `effectiveArmorReduction(enemy, now?)`
- Keep existing scalar fields as derived compatibility values until the render layer is migrated.

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
