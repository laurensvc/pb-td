# Asset Generation Tracker

Living checklist of **sprites and animations** to generate for `pb-td`. Update this document as assets move through generation, review, and Phaser integration.

**Related docs**

| Document                                                         | Purpose                                                            |
| ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| [`PIXELLAB-ASSET-GENERATION.md`](./PIXELLAB-ASSET-GENERATION.md) | Prompt templates, MCP workflow, quality bar                        |
| [`MONSTER-SYSTEMS-DEEP-DIVE.md`](./MONSTER-SYSTEMS-DEEP-DIVE.md) | Monster movement & defense behavior (what animations must support) |
| [`HANDOVER.md`](./HANDOVER.md)                                   | Gem types, gameplay loop, combat                                   |

---

## How to use this document

### Status values

| Status       | Meaning                                           |
| ------------ | ------------------------------------------------- |
| `pending`    | Not started — needs prompt + generation           |
| `generating` | PixelLab job queued or in progress                |
| `review`     | Candidates ready — pick best variant              |
| `accepted`   | Exported to `public/assets/` — passes quality bar |
| `integrated` | Preloaded in Phaser + verified in-game            |

### Per-asset fields

When you complete an asset, fill in:

- **Job ID** — PixelLab MCP job / character ID
- **Candidate** — which variant or frame was selected
- **Prompt** — final prompt that worked (link or short excerpt)
- **Notes** — scale tweaks, reject reasons, integration quirks

### Generation order (recommended)

1. **Environment** — board must be readable before units
2. **One complete monster** (`stone-grunt`) — movement smoke test
3. **One tower family** (flame t1–t3) + projectile + hit FX
4. **Remaining vertical-slice assets** (see §Progress)
5. **Slice 2+** — deferred archetypes, more tiers, biomes

---

## Progress summary

_Update these counts when statuses change._

| Section        |  Total | Pending | Generating | Review | Accepted | Integrated |
| -------------- | -----: | ------: | ---------: | -----: | -------: | ---------: |
| Monsters       |     24 |       0 |          0 |      0 |        3 |         17 |
| Towers         |     30 |       0 |          0 |      0 |        0 |         30 |
| Projectiles    |      6 |       0 |          0 |      0 |        0 |          4 |
| Particles / FX |      8 |       0 |          0 |      0 |        0 |          5 |
| Environment    |     13 |       0 |          0 |      0 |       13 |         13 |
| **All**        | **81** |  **53** |      **0** |  **0** |   **16** |     **69** |

**Current focus:** Vertical slice complete (69 files on disk). Slice-2 deferred items remain pending. PixelLab replacements can overwrite procedural fallbacks via `scripts/pixellab-pull.mjs` / `pixellab-export-animation.mjs`.

---

## 1. Monsters and monster movement

Ground creeps use `walk` while Phaser advances position along the path. Flying creeps use `fly` + a separate `shadow` sprite. Movement speed is **content data**, not animation FPS.

**Shared animation contract**

| Animation |     Frames |   FPS | Loop | Origin        |
| --------- | ---------: | ----: | :--: | ------------- |
| `walk`    |        6–8 |  8–10 | yes  | `[0.5, 0.75]` |
| `fly`     |        6–8 |  8–12 | yes  | `[0.5, 0.75]` |
| `hit`     |        2–4 | 12–16 |  no  | `[0.5, 0.75]` |
| `death`   |       6–10 | 10–14 |  no  | `[0.5, 0.75]` |
| `split`   |        6–8 | 10–14 |  no  | `[0.5, 0.75]` |
| `spawn`   |       6–10 |  8–12 |  no  | `[0.5, 0.75]` |
| `shadow`  | 1 (static) |     — |  —   | `[0.5, 0.5]`  |

**Generation size:** 64×64 per frame (boss 96×96 or 128×128). **Render size:** 32–48px ground/flying; 64–96px boss.

### 1.1 Vertical slice (generate first)

| ID               | Anim   | Export path                                      | Phaser key                   | Slice | Status  | Job ID | Notes                                  |
| ---------------- | ------ | ------------------------------------------------ | ---------------------------- | :---: | ------- | ------ | -------------------------------------- |
| `crystal-runner` | walk   | `public/assets/enemies/crystal-runner/walk.png`  | `enemy.crystal-runner.walk`  |   ✓   | pending |        | Fast light ground                      |
| `crystal-runner` | hit    | `public/assets/enemies/crystal-runner/hit.png`   | `enemy.crystal-runner.hit`   |   ✓   | pending |        |                                        |
| `crystal-runner` | death  | `public/assets/enemies/crystal-runner/death.png` | `enemy.crystal-runner.death` |   ✓   | pending |        |                                        |
| `stone-grunt`    | walk   | `public/assets/enemies/stone-grunt/walk.png`     | `enemy.stone-grunt.walk`     |   ✓   | pending |        | **First monster to finish end-to-end** |
| `stone-grunt`    | hit    | `public/assets/enemies/stone-grunt/hit.png`      | `enemy.stone-grunt.hit`      |   ✓   | pending |        |                                        |
| `stone-grunt`    | death  | `public/assets/enemies/stone-grunt/death.png`    | `enemy.stone-grunt.death`    |   ✓   | pending |        |                                        |
| `shield-bulwark` | walk   | `public/assets/enemies/shield-bulwark/walk.png`  | `enemy.shield-bulwark.walk`  |   ✓   | pending |        | Large shield read                      |
| `shield-bulwark` | hit    | `public/assets/enemies/shield-bulwark/hit.png`   | `enemy.shield-bulwark.hit`   |   ✓   | pending |        |                                        |
| `shield-bulwark` | death  | `public/assets/enemies/shield-bulwark/death.png` | `enemy.shield-bulwark.death` |   ✓   | pending |        |                                        |
| `sky-warden`     | fly    | `public/assets/enemies/sky-warden/fly.png`       | `enemy.sky-warden.fly`       |   ✓   | pending |        | Flying loop                            |
| `sky-warden`     | hit    | `public/assets/enemies/sky-warden/hit.png`       | `enemy.sky-warden.hit`       |   ✓   | pending |        |                                        |
| `sky-warden`     | death  | `public/assets/enemies/sky-warden/death.png`     | `enemy.sky-warden.death`     |   ✓   | pending |        |                                        |
| `sky-warden`     | shadow | `public/assets/enemies/sky-warden/shadow.png`    | `enemy.sky-warden.shadow`    |   ✓   | pending |        | Static oval shadow                     |
| `gate-colossus`  | walk   | `public/assets/enemies/gate-colossus/walk.png`   | `enemy.gate-colossus.walk`   |   ✓   | pending |        | 96–128px gen                           |
| `gate-colossus`  | hit    | `public/assets/enemies/gate-colossus/hit.png`    | `enemy.gate-colossus.hit`    |   ✓   | pending |        |                                        |
| `gate-colossus`  | death  | `public/assets/enemies/gate-colossus/death.png`  | `enemy.gate-colossus.death`  |   ✓   | pending |        |                                        |
| `gate-colossus`  | spawn  | `public/assets/enemies/gate-colossus/spawn.png`  | `enemy.gate-colossus.spawn`  |   ✓   | pending |        | Boss entry at wave gate                |

### 1.2 Slice 2 (after vertical slice playable)

| ID               | Anim  | Export path                                      | Phaser key                   | Status  | Job ID | Notes                   |
| ---------------- | ----- | ------------------------------------------------ | ---------------------------- | ------- | ------ | ----------------------- |
| `thorn-splitter` | walk  | `public/assets/enemies/thorn-splitter/walk.png`  | `enemy.thorn-splitter.walk`  | pending |        | Cracked pod body        |
| `thorn-splitter` | hit   | `public/assets/enemies/thorn-splitter/hit.png`   | `enemy.thorn-splitter.hit`   | pending |        |                         |
| `thorn-splitter` | death | `public/assets/enemies/thorn-splitter/death.png` | `enemy.thorn-splitter.death` | pending |        |                         |
| `thorn-splitter` | split | `public/assets/enemies/thorn-splitter/split.png` | `enemy.thorn-splitter.split` | pending |        | Spawn children on death |
| `arcane-mystic`  | walk  | `public/assets/enemies/arcane-mystic/walk.png`   | `enemy.arcane-mystic.walk`   | pending |        | Robe + staff            |
| `arcane-mystic`  | hit   | `public/assets/enemies/arcane-mystic/hit.png`    | `enemy.arcane-mystic.hit`    | pending |        |                         |
| `arcane-mystic`  | death | `public/assets/enemies/arcane-mystic/death.png`  | `enemy.arcane-mystic.death`  | pending |        |                         |

### 1.3 Monster prompt cheat sheet

```text
top-down pixel art monster sprite for a GemTD-inspired fantasy crystal maze tower defense game, <description>, <role readability>, clean strong silhouette, single-color dark outline, medium shading, Warcraft 3 custom map readability, readable at 32 pixels, facing downward-right as default, transparent background, background removed, no square backdrop, no scene background, isolated sprite
```

| ID               | Prompt focus                                                         |
| ---------------- | -------------------------------------------------------------------- |
| `crystal-runner` | Lean hunched body, narrow sprinting silhouette, fast low-health read |
| `stone-grunt`    | Broad simple torso, baseline enemy, neutral threat                   |
| `shield-bulwark` | Large frontal shield or shell, armored slow read                     |
| `sky-warden`     | Wings or hover body, flying enemy, small shadow separate asset       |
| `gate-colossus`  | Large crown/horns/core, boss scale, intimidating silhouette          |
| `thorn-splitter` | Cracked pod or seed body, looks like it will burst                   |
| `arcane-mystic`  | Robe, glow, staff — resistant caster read                            |

---

## 2. Towers, particles, and projectiles

Towers sit on `setOrigin(0.5, 1.0)`. Attacks are mostly in-place; **projectiles** carry direction. **Particles** are short one-shot bursts (pooled during waves).

**Tower animation contract**

| Animation | Frames |   FPS | Loop | Origin       |
| --------- | -----: | ----: | :--: | ------------ |
| `idle`    |    4–6 |   4–8 | yes  | `[0.5, 1.0]` |
| `attack`  |    4–8 | 10–16 |  no  | `[0.5, 1.0]` |
| `build`   |   6–10 | 10–14 |  no  | `[0.5, 1.0]` |

**Generation size:** 64×64 basic gems; 96×96 special towers. **Render:** 40–56px basic; 56–72px special.

### 2.1 Tower families (vertical slice)

Five families in the art pipeline. Map to gameplay gem colors in content data later.

| Family    | Color       | Combat read       | Gem TD analog (approx.) |
| --------- | ----------- | ----------------- | ----------------------- |
| `flame`   | Red/orange  | Splash / burn     | Ruby                    |
| `stone`   | Grey/gold   | Heavy hits / slow | Diamond                 |
| `thorn`   | Green       | Poison DoT        | Emerald                 |
| `arcane`  | Violet/blue | Pierce / magic    | Amethyst                |
| `radiant` | Gold/white  | Aura / support    | Opal                    |

### 2.2 Towers — vertical slice

| ID           | Anim   | Export path                                  | Phaser key                | Slice | Status  | Job ID | Notes                              |
| ------------ | ------ | -------------------------------------------- | ------------------------- | :---: | ------- | ------ | ---------------------------------- |
| `flame-t1`   | idle   | `public/assets/towers/flame-t1/idle.png`     | `tower.flame-t1.idle`     |   ✓   | pending |        | Chipped tier                       |
| `flame-t1`   | attack | `public/assets/towers/flame-t1/attack.png`   | `tower.flame-t1.attack`   |   ✓   | pending |        |                                    |
| `flame-t1`   | build  | `public/assets/towers/flame-t1/build.png`    | `tower.flame-t1.build`    |   ✓   | pending |        | Gem → tower transform              |
| `flame-t2`   | idle   | `public/assets/towers/flame-t2/idle.png`     | `tower.flame-t2.idle`     |   ✓   | pending |        |                                    |
| `flame-t2`   | attack | `public/assets/towers/flame-t2/attack.png`   | `tower.flame-t2.attack`   |   ✓   | pending |        |                                    |
| `flame-t2`   | build  | `public/assets/towers/flame-t2/build.png`    | `tower.flame-t2.build`    |   ✓   | pending |        |                                    |
| `flame-t3`   | idle   | `public/assets/towers/flame-t3/idle.png`     | `tower.flame-t3.idle`     |   ✓   | pending |        |                                    |
| `flame-t3`   | attack | `public/assets/towers/flame-t3/attack.png`   | `tower.flame-t3.attack`   |   ✓   | pending |        |                                    |
| `flame-t3`   | build  | `public/assets/towers/flame-t3/build.png`    | `tower.flame-t3.build`    |   ✓   | pending |        |                                    |
| `stone-t1`   | idle   | `public/assets/towers/stone-t1/idle.png`     | `tower.stone-t1.idle`     |   ✓   | pending |        |                                    |
| `stone-t1`   | attack | `public/assets/towers/stone-t1/attack.png`   | `tower.stone-t1.attack`   |   ✓   | pending |        |                                    |
| `stone-t1`   | build  | `public/assets/towers/stone-t1/build.png`    | `tower.stone-t1.build`    |   ✓   | pending |        |                                    |
| `stone-t2`   | idle   | `public/assets/towers/stone-t2/idle.png`     | `tower.stone-t2.idle`     |   ✓   | pending |        |                                    |
| `stone-t2`   | attack | `public/assets/towers/stone-t2/attack.png`   | `tower.stone-t2.attack`   |   ✓   | pending |        |                                    |
| `stone-t2`   | build  | `public/assets/towers/stone-t2/build.png`    | `tower.stone-t2.build`    |   ✓   | pending |        |                                    |
| `stone-t3`   | idle   | `public/assets/towers/stone-t3/idle.png`     | `tower.stone-t3.idle`     |   ✓   | pending |        |                                    |
| `stone-t3`   | attack | `public/assets/towers/stone-t3/attack.png`   | `tower.stone-t3.attack`   |   ✓   | pending |        |                                    |
| `stone-t3`   | build  | `public/assets/towers/stone-t3/build.png`    | `tower.stone-t3.build`    |   ✓   | pending |        |                                    |
| `thorn-t1`   | idle   | `public/assets/towers/thorn-t1/idle.png`     | `tower.thorn-t1.idle`     |   ✓   | pending |        |                                    |
| `thorn-t1`   | attack | `public/assets/towers/thorn-t1/attack.png`   | `tower.thorn-t1.attack`   |   ✓   | pending |        |                                    |
| `thorn-t1`   | build  | `public/assets/towers/thorn-t1/build.png`    | `tower.thorn-t1.build`    |   ✓   | pending |        |                                    |
| `thorn-t2`   | idle   | `public/assets/towers/thorn-t2/idle.png`     | `tower.thorn-t2.idle`     |   ✓   | pending |        |                                    |
| `thorn-t2`   | attack | `public/assets/towers/thorn-t2/attack.png`   | `tower.thorn-t2.attack`   |   ✓   | pending |        |                                    |
| `thorn-t2`   | build  | `public/assets/towers/thorn-t2/build.png`    | `tower.thorn-t2.build`    |   ✓   | pending |        |                                    |
| `thorn-t3`   | idle   | `public/assets/towers/thorn-t3/idle.png`     | `tower.thorn-t3.idle`     |   ✓   | pending |        |                                    |
| `thorn-t3`   | attack | `public/assets/towers/thorn-t3/attack.png`   | `tower.thorn-t3.attack`   |   ✓   | pending |        |                                    |
| `thorn-t3`   | build  | `public/assets/towers/thorn-t3/build.png`    | `tower.thorn-t3.build`    |   ✓   | pending |        |                                    |
| `magma-core` | idle   | `public/assets/towers/magma-core/idle.png`   | `tower.magma-core.idle`   |   ✓   | pending |        | Special tower — larger gen (96×96) |
| `magma-core` | attack | `public/assets/towers/magma-core/attack.png` | `tower.magma-core.attack` |   ✓   | pending |        |                                    |
| `magma-core` | build  | `public/assets/towers/magma-core/build.png`  | `tower.magma-core.build`  |   ✓   | pending |        |                                    |

### 2.3 Towers — slice 2 (deferred)

| ID                          | Anims needed        | Status  | Notes                              |
| --------------------------- | ------------------- | ------- | ---------------------------------- |
| `arcane-t1` … `arcane-t3`   | idle, attack, build | pending | Violet pierce family               |
| `radiant-t1` … `radiant-t3` | idle, attack, build | pending | Gold aura family                   |
| `raw-gem` (placement)       | idle                | pending | Unselected 5-gem placement ghost   |
| `rock` (tower form)         | static              | pending | See §3 — maze rock may share asset |

### 2.4 Projectiles

| ID                | Type            | Export path                                     | Phaser key                   | Used by           | Gen size | Status  | Job ID | Notes                 |
| ----------------- | --------------- | ----------------------------------------------- | ---------------------------- | ----------------- | -------: | ------- | ------ | --------------------- |
| `flame-bolt`      | sheet or static | `public/assets/projectiles/flame-bolt.png`      | `projectile.flame-bolt`      | flame t1–t3       |    32×32 | pending |        | Orange ember + trail  |
| `stone-shard`     | sheet or static | `public/assets/projectiles/stone-shard.png`     | `projectile.stone-shard`     | stone t1–t3       |    32×32 | pending |        | Grey-gold heavy shard |
| `thorn-spore`     | sheet or static | `public/assets/projectiles/thorn-spore.png`     | `projectile.thorn-spore`     | thorn t1–t3       |    32×32 | pending |        | Green poison seed     |
| `arcane-lance`    | sheet or static | `public/assets/projectiles/arcane-lance.png`    | `projectile.arcane-lance`    | arcane (slice 2)  |    32×32 | pending |        | Violet needle         |
| `radiant-prism`   | sheet or static | `public/assets/projectiles/radiant-prism.png`   | `projectile.radiant-prism`   | radiant (slice 2) |    32×32 | pending |        | Gold-white bead       |
| `magma-core-shot` | sheet or static | `public/assets/projectiles/magma-core-shot.png` | `projectile.magma-core-shot` | magma-core        |    64×64 | pending |        | Larger molten shell   |

**Projectile prompt template**

```text
top-down pixel art tower defense projectile, <description>, strong readable shape at 16 pixels, color-coded for <family>, crisp pixel edges, short transparent motion trail, no background, transparent background, isolated sprite
```

### 2.5 Particles and FX

| ID             | Frames |   FPS | Loop | Export path                                | Phaser key        | Slice | Status  | Job ID | Notes                         |
| -------------- | -----: | ----: | :--: | ------------------------------------------ | ----------------- | :---: | ------- | ------ | ----------------------------- |
| `hit-spark`    |    4–6 | 16–24 |  no  | `public/assets/particles/hit-spark.png`    | `fx.hit-spark`    |   ✓   | pending |        | Generic impact — pool heavily |
| `burn-tick`    |    4–6 |  8–12 | yes  | `public/assets/particles/burn-tick.png`    | `fx.burn-tick`    |   ✓   | pending |        | Subtle flame DoT on creep     |
| `poison-tick`  |    4–6 |  8–12 | yes  | `public/assets/particles/poison-tick.png`  | `fx.poison-tick`  |   ✓   | pending |        | Low opacity in Phaser         |
| `splash-burst` |    6–8 | 16–24 |  no  | `public/assets/particles/splash-burst.png` | `fx.splash-burst` |       | pending |        | Flame/ruby splash radius      |
| `merge-burst`  |   8–12 | 16–24 |  no  | `public/assets/particles/merge-burst.png`  | `fx.merge-burst`  |   ✓   | pending |        | Gem combine celebration       |
| `build-flash`  |   6–10 | 16–24 |  no  | `public/assets/particles/build-flash.png`  | `fx.build-flash`  |   ✓   | pending |        | Gem → tower resolution        |
| `slow-frost`   |    4–6 | 12–16 |  no  | `public/assets/particles/slow-frost.png`   | `fx.slow-frost`   |       | pending |        | Sapphire slow (slice 2)       |
| `leak-warning` |   6–10 | 10–14 |  no  | `public/assets/particles/leak-warning.png` | `fx.leak-warning` |       | pending |        | Creep near goal alert         |

**Particle prompt template**

```text
top-down pixel art tower defense impact effect spritesheet, <description>, short one-shot burst, readable at 32 pixels, crisp pixel edges, transparent background, background removed, no square backdrop
```

---

## 3. Environment, spawn gate, and goal

Terrain uses **32×32** tiles (`setOrigin(0, 0)`). Landmarks use **64×64** or **96×96** objects with `setOrigin(0.5, 1.0)`. The **data grid** decides pathing — art must not imply walkability.

### 3.1 Terrain tiles

| ID              | Type          | Export path                                     | Phaser key              | Tile size | Slice | Status  | Job ID | Notes                                 |
| --------------- | ------------- | ----------------------------------------------- | ----------------------- | --------: | :---: | ------- | ------ | ------------------------------------- |
| `default-floor` | seamless tile | `public/assets/terrain/tiles/default-floor.png` | `terrain.default-floor` |     32×32 |   ✓   | pending |        | Buildable ground                      |
| `path-floor`    | seamless tile | `public/assets/terrain/tiles/path-floor.png`    | `terrain.path-floor`    |     32×32 |   ✓   | pending |        | Pre-marked route (flying path visual) |
| `blocked-floor` | seamless tile | `public/assets/terrain/tiles/blocked-floor.png` | `terrain.blocked-floor` |     32×32 |   ✓   | pending |        | Unbuildable cells                     |

**Terrain prompt**

```text
top-down seamless 32x32 pixel art terrain tile for a GemTD-inspired fantasy crystal maze, <description>, gameplay-readable stone floor, subtle detail only, no tall objects, no text, crisp pixel edges
```

### 3.2 Landmarks — spawn, goal, checkpoints

| ID             | Type   | Export path                                      | Phaser key         | Gen size | Slice | Status  | Job ID | Notes                             |
| -------------- | ------ | ------------------------------------------------ | ------------------ | -------: | :---: | ------- | ------ | --------------------------------- |
| `spawn-gate`   | object | `public/assets/terrain/objects/spawn-gate.png`   | `env.spawn-gate`   |    64×64 |   ✓   | pending |        | **Start** — creep spawn point     |
| `goal-nexus`   | object | `public/assets/terrain/objects/goal-nexus.png`   | `env.goal-nexus`   |    64×64 |   ✓   | pending |        | **End** — leak = life lost        |
| `checkpoint-1` | object | `public/assets/terrain/objects/checkpoint-1.png` | `env.checkpoint-1` |    64×64 |   ✓   | pending |        | Waypoint marker — number readable |
| `checkpoint-2` | object | `public/assets/terrain/objects/checkpoint-2.png` | `env.checkpoint-2` |    64×64 |   ✓   | pending |        |                                   |
| `checkpoint-3` | object | `public/assets/terrain/objects/checkpoint-3.png` | `env.checkpoint-3` |    64×64 |   ✓   | pending |        |                                   |
| `checkpoint-4` | object | `public/assets/terrain/objects/checkpoint-4.png` | `env.checkpoint-4` |    64×64 |   ✓   | pending |        |                                   |
| `checkpoint-5` | object | `public/assets/terrain/objects/checkpoint-5.png` | `env.checkpoint-5` |    64×64 |   ✓   | pending |        |                                   |

**Landmark prompt**

```text
top-down pixel art map object for a GemTD-inspired fantasy crystal maze, <description>, clean silhouette, readable at board scale, single-color dark outline, medium shading, transparent background, background removed, no square backdrop, isolated sprite
```

| ID             | Prompt focus                                              |
| -------------- | --------------------------------------------------------- |
| `spawn-gate`   | Cracked stone pillars, green portal core, enemy entry     |
| `goal-nexus`   | Gem castle / crystal nexus core, player lives at stake    |
| `checkpoint-n` | Small stone pillar or rune marker with clear number **n** |

### 3.3 Maze and build UX objects

| ID               | Type   | Export path                                        | Phaser key          | Gen size | Slice | Status  | Job ID | Notes                       |
| ---------------- | ------ | -------------------------------------------------- | ------------------- | -------: | :---: | ------- | ------ | --------------------------- |
| `rock`           | object | `public/assets/terrain/objects/rock.png`           | `env.rock`          |    64×64 |   ✓   | pending |        | Unselected gems → maze wall |
| `selection-ring` | FX     | `public/assets/terrain/objects/selection-ring.png` | `fx.selection-ring` |    64×64 |   ✓   | pending |        | Legal placement hover       |
| `invalid-ring`   | FX     | `public/assets/terrain/objects/invalid-ring.png`   | `fx.invalid-ring`   |    64×64 |   ✓   | pending |        | Blocked path / illegal cell |

### 3.4 Environment — slice 2 (deferred)

| ID                      | Notes                                            | Status  |
| ----------------------- | ------------------------------------------------ | ------- |
| `flying-path-overlay`   | Optional grey path strip for aerial route        | pending |
| `border-unbuildable`    | Visual for zones players cannot place on         | pending |
| `biome-crownfall-floor` | First biome variant after default board complete | pending |

---

## 4. Acceptance log

_Copy a block per accepted asset. Newest first._

<!--
### YYYY-MM-DD — `asset-id` / `animation`
...
-->

### 2026-07-01 — Vertical slice pipeline (`69` integrated files)

- **Status:** integrated (16 PixelLab + 53 procedural fallback via `pnpm assets:batch --all-missing`)
- **Pipeline:** `scripts/asset-catalog.mjs`, `pixellab-sync.mjs`, `pixellab-pull.mjs`, `pixellab-export-animation.mjs`, `generate-pixel-art.mjs`
- **PixelLab environment:** `create_tiles_pro` + `create_1_direction_object` (terrain + landmarks + rings)
- **PixelLab monster smoke test:** `stone-grunt` character `d902bc14-0260-4fc9-9f2c-9223cc1e3855` with walk/hit/death south-east animations
- **Phaser:** async preload from `apps/web/public/assets/` with per-key placeholder fallback; `resolvePresentationKey()` maps gem keys → family-tier idle sprites
- **Notes:** Remaining vertical-slice monsters/towers/FX use procedural PNGs until individually regenerated in PixelLab

---

## 5. Changelog

| Date       | Change                                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| 2026-07-01 | Vertical slice asset pipeline: 69 PNGs on disk, PixelLab env + stone-grunt, procedural fallback batch, async Phaser preload. |
| 2026-06-30 | Initial tracker created. Sections: monsters, towers/projectiles/FX, environment. All items `pending`. |

---

## Quick reference — vertical slice minimum

Must-have set for first playable build:

**Environment (11):** `default-floor`, `path-floor`, `blocked-floor`, `rock`, `spawn-gate`, `goal-nexus`, `checkpoint-1`–`5`, `selection-ring`, `invalid-ring`

**Monsters (5 IDs, 17 files):** `crystal-runner`, `stone-grunt`, `shield-bulwark`, `sky-warden` (+shadow), `gate-colossus` (+spawn)

**Towers (10 IDs, 30 files):** `flame-t1`–`t3`, `stone-t1`–`t3`, `thorn-t1`–`t3`, `magma-core` (each: idle, attack, build)

**Projectiles (4):** `flame-bolt`, `stone-shard`, `thorn-spore`, `magma-core-shot`

**FX (5):** `hit-spark`, `burn-tick`, `poison-tick`, `merge-burst`, `build-flash`
