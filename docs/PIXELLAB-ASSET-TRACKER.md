# PixelLab Asset Tracker

Companion to [`backlog.md`](./backlog.md). Track PixelLab generation jobs, file paths, and integration status for **Project Facet / Gem TD** art.

**MCP server:** `user-pixellab`  
**Status key:** `planned` · `generating` · `review` · `exported` · `in-game`

---

## Style Bible

| Property                 | Value                                                                  |
| ------------------------ | ---------------------------------------------------------------------- |
| Theme                    | GemTD-inspired fantasy crystal maze, atmospheric but gameplay-readable |
| Camera                   | `high top-down` (board), `low top-down` (units)                        |
| Tile size                | 32×32                                                                  |
| Unit size                | 32–48px (enemies), 40–48px (gems)                                      |
| Outline                  | `single color outline`                                                 |
| Shading                  | `medium shading`                                                       |
| Object backgrounds       | Transparent PNG, background removed                                    |
| Reference atlas (legacy) | `public/assets/terrain-towers-enemies.png` — replace gradually         |

---

## Generation Order

PixelLab is the first-choice generator. Run batches in this order so board readability is solved before tower polish:

1. Spawn/end gates and checkpoint ground tiles.
2. Ground tile variants and stone blocks.
3. Raw gems, tower gems, and recipe towers.
4. Distinct enemy set with walk animations.
5. Projectiles, hit FX, and UI icons.

All object jobs must request:

```text
transparent background, background removed, no square backdrop, no scene background, isolated sprite
```

Ground tiles are the only assets that may include a full tile background.

## Phase 1 — Board & Maze (Epic A)

| ID        | Asset                           | Tool                        | Status  | Job ID | Export path                                |
| --------- | ------------------------------- | --------------------------- | ------- | ------ | ------------------------------------------ |
| T-01      | Crystal floor base tileset      | `create_topdown_tileset`    | planned | —      | `public/assets/terrain/floor-base.png`     |
| T-02      | Ground variation tileset        | `create_topdown_tileset`    | planned | —      | `public/assets/terrain/floor-variants.png` |
| O-01      | Stone block from unused raw gem | `create_1_direction_object` | planned | —      | `public/assets/objects/rock.png`           |
| O-02      | Main spawn gate (`S`)           | `create_map_object`         | planned | —      | `public/assets/objects/spawn-portal.png`   |
| O-03      | End gate (`F`)                  | `create_map_object`         | planned | —      | `public/assets/objects/goal-nexus.png`     |
| C-01…C-05 | Ordered checkpoint ground tiles | `create_topdown_tileset`    | planned | —      | `public/assets/terrain/checkpoints/`       |
| FX-01     | Path preview sparkle            | `create_tiles_pro`          | planned | —      | `public/assets/fx/path-sparkle.png`        |

### T-01 prompt

- **lower:** `dark fantasy stone foundation`
- **upper:** `top-down crystal maze floor tile, carved grey stone, subtle gem dust, Warcraft 3 custom map readability`
- **tile_size:** 32×32

### T-02 prompt

- Chain from T-01 `upper_base_tile_id`
- **upper:** `five subtle ground variants for a Gem TD maze, cracked stone, moss edge, crystal fleck, worn path, darker border`

### Gate and checkpoint prompts

- **Spawn gate:** `top-down fantasy monster spawn gate, ancient stone arch with green portal glow, readable S landmark, transparent background, background removed`
- **End gate:** `top-down fantasy exit gate, blue crystal sanctuary portal, readable F landmark, transparent background, background removed`
- **Checkpoint tiles:** `five ordered Gem TD arrow checkpoint ground tiles, numbers 1 through 5, clear path direction marker, 32 pixel top-down tile, readable on board`

---

## Phase 2 — Gems (Epic B)

Five families × 7 tiers (L1–L6 + GREAT). Generate one family per session for style consistency.

| Family  | GemTD analog | Color              | Levels   | Status  |
| ------- | ------------ | ------------------ | -------- | ------- |
| Kinetic | Amethyst     | Cyan `#7dd3fc`     | L1–GREAT | planned |
| Verdant | Emerald      | Green `#66f2a4`    | L1–GREAT | planned |
| Arcane  | Sapphire     | Violet `#a78bfa`   | L1–GREAT | planned |
| Nova    | Ruby/Topaz   | Red-gold `#f97316` | L1–GREAT | planned |
| Prism   | Opal         | Gold `#ffd166`     | L1–GREAT | planned |

| ID                     | Asset              | Tool                        | Status  | Export path                        |
| ---------------------- | ------------------ | --------------------------- | ------- | ---------------------------------- |
| G-KIN-L1 … G-KIN-GREAT | Kinetic gems       | `create_1_direction_object` | planned | `public/assets/gems/kinetic/`      |
| G-VER-L1 … G-VER-GREAT | Verdant gems       | `create_1_direction_object` | planned | `public/assets/gems/verdant/`      |
| G-ARC-L1 … G-ARC-GREAT | Arcane gems        | `create_1_direction_object` | planned | `public/assets/gems/arcane/`       |
| G-NOV-L1 … G-NOV-GREAT | Nova gems          | `create_1_direction_object` | planned | `public/assets/gems/nova/`         |
| G-PRI-L1 … G-PRI-GREAT | Prism gems         | `create_1_direction_object` | planned | `public/assets/gems/prism/`        |
| FX-02                  | Merge burst        | `create_1_direction_object` | planned | `public/assets/fx/merge-burst.png` |
| P-01 … P-05            | Family projectiles | `create_1_direction_object` | planned | `public/assets/fx/projectiles/`    |

### L1–L6 batch template (per family)

```json
{
  "tool": "create_1_direction_object",
  "description": "Gem TD <family> crystal tower gem, Warcraft 3 custom map inspired, transparent background, background removed",
  "size": 40,
  "view": "top-down",
  "item_descriptions": [
    "tiny tier 1 <family> gem",
    "small tier 2 <family> gem",
    "medium tier 3 <family> gem",
    "large tier 4 <family> gem",
    "elite tier 5 <family> gem",
    "massive tier 6 <family> gem"
  ]
}
```

---

## Phase 3 — Economy UI (Epic C)

| ID    | Asset               | Tool                        | Status  | Export path                       |
| ----- | ------------------- | --------------------------- | ------- | --------------------------------- |
| UI-01 | Gold coin           | `create_1_direction_object` | planned | `public/assets/ui/gold-coin.png`  |
| UI-02 | Raw gem roll icon   | `create_1_direction_object` | planned | `public/assets/ui/raw-roll.png`   |
| UI-03 | Shop panel frame    | `create_map_object`         | planned | `public/assets/ui/shop-frame.png` |
| UI-04 | Wave hologram badge | `create_1_direction_object` | planned | `public/assets/ui/wave-badge.png` |

---

## Phase 4 — Enemies (Epic D)

| ID   | Enemy          | MVP id      | Silhouette requirement        | Tool               | Status  | Export path                          |
| ---- | -------------- | ----------- | ----------------------------- | ------------------ | ------- | ------------------------------------ |
| E-01 | Cave Runner    | scout       | small fast hunched runner     | `create_character` | planned | `public/assets/enemies/scout/`       |
| E-02 | Armored Grunt  | trooper     | broad basic melee body        | `create_character` | planned | `public/assets/enemies/trooper/`     |
| E-03 | Shield Bulwark | bulwark     | large shield front            | `create_character` | planned | `public/assets/enemies/bulwark/`     |
| E-04 | Blade Striker  | striker     | tall angular attacker         | `create_character` | planned | `public/assets/enemies/striker/`     |
| E-05 | Flying Warden  | warden      | winged flyer                  | `create_character` | planned | `public/assets/enemies/warden/`      |
| E-06 | Heavy Vanguard | vanguard    | armored elite silhouette      | `create_character` | planned | `public/assets/enemies/vanguard/`    |
| E-07 | Splitter Imp   | shifter     | pod body with small offspring | `create_character` | planned | `public/assets/enemies/shifter/`     |
| E-08 | Magic Mystic   | mystic      | robed caster glow             | `create_character` | planned | `public/assets/enemies/mystic/`      |
| E-09 | Stone Brute    | brute       | squat stone heavy             | `create_character` | planned | `public/assets/enemies/brute/`       |
| E-10 | Harrier Flyer  | runner      | sleek airborne unit           | `create_character` | planned | `public/assets/enemies/runner/`      |
| E-11 | Gate Colossus  | colossus    | huge boss, two-cell feel      | `create_character` | planned | `public/assets/enemies/colossus/`    |
| E-12 | Final Behemoth | dreadnought | final boss, crown-like horns  | `create_character` | planned | `public/assets/enemies/dreadnought/` |

After each character: `animate_character` with `walk` animation.

### Enemy batch prompt

```text
top-down Warcraft 3 Gem TD inspired monster sprite, distinct silhouette, readable at 32 pixels, single color outline, medium shading, transparent background, background removed, no square backdrop, no scene background
```

---

## Phase 5 — Biomes (Epic F)

| ID   | Biome          | Tileset chain                        | Status  |
| ---- | -------------- | ------------------------------------ | ------- |
| B-01 | Orion Breach   | void → steel → rust                  | planned |
| B-02 | Lunar Causeway | moon dust → silver → crater          | planned |
| B-03 | Crownfall Gate | gold trim → marble → carpet          | planned |
| B-04 | Nebula Drift   | purple gas → crystal                 | planned |
| B-05 | Solar Flare    | obsidian → magma → basalt            | planned |
| B-06 | Abyss Gate     | dark water → void stone → corruption | planned |

---

## Phase 6 — Quest & Polish (Epics E, G)

| ID    | Asset            | Tool                        | Status  | Export path                          |
| ----- | ---------------- | --------------------------- | ------- | ------------------------------------ |
| UI-05 | Quest card frame | `create_map_object`         | planned | `public/assets/ui/quest-card.png`    |
| UI-06 | Quest icons ×8   | `create_1_direction_object` | planned | `public/assets/ui/quest-icons/`      |
| FX-03 | Hit sparks ×3    | `create_1_direction_object` | planned | `public/assets/fx/hit-spark.png`     |
| FX-04 | Leak warning     | `create_1_direction_object` | planned | `public/assets/fx/leak-skull.png`    |
| UI-07 | Tutorial pointer | `create_1_direction_object` | planned | `public/assets/ui/tutorial-hand.png` |

---

## Integration Checklist (per asset)

- [ ] Job completed (`get_*` returns success)
- [ ] Candidate selected (`select_object_frames` if needed)
- [ ] PNG saved under `public/assets/`
- [ ] Transparent alpha verified; no opaque square or baked background
- [ ] Silhouette readable at 32×32 in a Phaser board screenshot
- [ ] Atlas JSON or frame coords documented
- [ ] `CosmicBoardScene` preload updated
- [ ] Legacy atlas reference removed or deprecated
- [ ] Visual pass in dev server (`pnpm dev`)

---

## Estimated Generation Budget

| Category         | Approx. jobs | Notes                                     |
| ---------------- | ------------ | ----------------------------------------- |
| Terrain tilesets | 8–12         | chained biomes                            |
| Gems             | 35–40        | 5×7 + projectiles                         |
| Objects/UI       | 15–20        |                                           |
| Enemies          | 12–18        | + boss animations                         |
| FX               | 8–10         |                                           |
| **Total**        | **~80–100**  | Run in batches; check `get_balance` first |

---

_Update Job ID and Status columns as assets are generated._
