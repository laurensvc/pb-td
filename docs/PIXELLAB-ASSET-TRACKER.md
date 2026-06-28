# PixelLab Asset Tracker

Companion to [`backlog.md`](./backlog.md). Track generation jobs, file paths, and integration status for **Project Facet** art.

> **Note:** Gem families in this tracker still use legacy Cosmic Siege names (Kinetic, Verdant, …). Align exports to Project Facet families (Flame, Tide, Gale, Stone, Thorn, Radiant, Umbral, Arcane) per [backlog.md](./backlog.md) when regenerating assets.

**MCP server:** `user-pixellab`  
**Status key:** `planned` · `generating` · `review` · `exported` · `in-game`

---

## Style Bible

| Property | Value |
|----------|-------|
| Theme | Cosmic siege — void, cyan, purple, gold accents |
| Camera | `high top-down` (board), `low top-down` (units) |
| Tile size | 32×32 |
| Unit size | 32–48px (enemies), 40–48px (gems) |
| Outline | `single color outline` |
| Shading | `medium shading` |
| Reference atlas (legacy) | `public/assets/terrain-towers-enemies.png` — replace gradually |

---

## Phase 1 — Board & Maze (Epic A)

| ID | Asset | Tool | Status | Job ID | Export path |
|----|-------|------|--------|--------|-------------|
| T-01 | Void floor tileset | `create_topdown_tileset` | exported | `50d8ede0-9bff-424c-af23-313bce8a1035` | `public/assets/terrain/void-floor.png` |
| T-02 | Light gem-cell tileset | `create_topdown_tileset` | exported | `33c6e27f-fcc6-4fd2-af2a-4f8e261575bb` | `public/assets/terrain/gem-cell.png` |
| O-01 | Cosmic rock blocker | `create_1_direction_object` | exported | `425bf958-3e0c-4570-86f7-542bd8461974` | `public/assets/objects/rock.png` |
| O-02 | Spawn warp gate | `create_map_object` | planned | — | `public/assets/objects/spawn-portal.png` |
| O-03 | Goal breach nexus | `create_map_object` | planned | — | `public/assets/objects/goal-nexus.png` |
| FX-01 | Path preview sparkle | `create_tiles_pro` | planned | — | `public/assets/fx/path-sparkle.png` |

### T-01 prompt
- **lower:** `deep space void black`
- **upper:** `dark cosmic metal floor plate with faint cyan circuit lines`
- **tile_size:** 32×32

### T-02 prompt
- Chain from T-01 `upper_base_tile_id`
- **upper:** `lighter starfield tile, soft cyan glow, gem placement cell`

---

## Phase 2 — Gems (Epic B)

Five families × 7 tiers (L1–L6 + GREAT). Generate one family per session for style consistency.

| Family | GemTD analog | Color | Levels | Status |
|--------|--------------|-------|--------|--------|
| Kinetic | Amethyst | Cyan `#7dd3fc` | L1–GREAT | planned |
| Verdant | Emerald | Green `#66f2a4` | L1–GREAT | planned |
| Arcane | Sapphire | Purple `#c084fc` | L1–GREAT | planned |
| Nova | Topaz | Rose `#fb7185` | L1–GREAT | planned |
| Prism | Opal | Gold `#ffd166` | L1–GREAT | planned |

| ID | Asset | Tool | Status | Export path |
|----|-------|------|--------|-------------|
| G-KIN-L1 … G-KIN-GREAT | Kinetic gems | `create_1_direction_object` | planned | `public/assets/gems/kinetic/` |
| G-VER-L1 … G-VER-GREAT | Verdant gems | `create_1_direction_object` | planned | `public/assets/gems/verdant/` |
| G-ARC-L1 … G-ARC-GREAT | Arcane gems | `create_1_direction_object` | planned | `public/assets/gems/arcane/` |
| G-NOV-L1 … G-NOV-GREAT | Nova gems | `create_1_direction_object` | planned | `public/assets/gems/nova/` |
| G-PRI-L1 … G-PRI-GREAT | Prism gems | `create_1_direction_object` | planned | `public/assets/gems/prism/` |
| FX-02 | Merge burst | `create_1_direction_object` | planned | `public/assets/fx/merge-burst.png` |
| P-01 … P-05 | Family projectiles | `create_1_direction_object` | planned | `public/assets/fx/projectiles/` |

### L1–L6 batch template (per family)
```json
{
  "tool": "create_1_direction_object",
  "description": "cosmic <family> crystal tower gem",
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

| ID | Asset | Tool | Status | Export path |
|----|-------|------|--------|-------------|
| UI-01 | Gold star coin | `create_1_direction_object` | planned | `public/assets/ui/gold-coin.png` |
| UI-02 | Lucky loot crate | `create_1_direction_object` | planned | `public/assets/ui/lucky-box.png` |
| UI-03 | Shop panel frame | `create_map_object` | planned | `public/assets/ui/shop-frame.png` |
| UI-04 | Wave hologram badge | `create_1_direction_object` | planned | `public/assets/ui/wave-badge.png` |

---

## Phase 4 — Enemies (Epic D)

| ID | Enemy | MVP id | Tool | Status | Export path |
|----|-------|--------|------|--------|-------------|
| E-01 | Void Scout | scout | `create_character` | planned | `public/assets/enemies/scout/` |
| E-02 | Astral Trooper | trooper | `create_character` | planned | `public/assets/enemies/trooper/` |
| E-03 | Shield Bulwark | bulwark | `create_character` | planned | `public/assets/enemies/bulwark/` |
| E-04 | Comet Striker | striker | `create_character` | planned | `public/assets/enemies/striker/` |
| E-05 | Nebula Warden | warden | `create_character` | planned | `public/assets/enemies/warden/` |
| E-06 | Crown Vanguard | vanguard | `create_character` | planned | `public/assets/enemies/vanguard/` |
| E-07 | Phase Skitter | new | `create_character` | planned | `public/assets/enemies/phase-skitter/` |
| E-08 | Hull Weaver | new | `create_character` | planned | `public/assets/enemies/hull-weaver/` |
| E-09 | Splitter Pod | new | `create_character` | planned | `public/assets/enemies/splitter-pod/` |
| E-10 | Ghost Drift | new | `create_character` | planned | `public/assets/enemies/ghost-drift/` |
| E-11 | Apex Harrier | new | `create_character` | planned | `public/assets/enemies/apex-harrier/` |
| E-12 | Forge Behemoth | boss | `create_character` | planned | `public/assets/enemies/forge-behemoth/` |

After each character: `animate_character` with `walk` animation.

---

## Phase 5 — Biomes (Epic F)

| ID | Biome | Tileset chain | Status |
|----|-------|---------------|--------|
| B-01 | Orion Breach | void → steel → rust | planned |
| B-02 | Lunar Causeway | moon dust → silver → crater | planned |
| B-03 | Crownfall Gate | gold trim → marble → carpet | planned |
| B-04 | Nebula Drift | purple gas → crystal | planned |
| B-05 | Solar Flare | obsidian → magma → basalt | planned |
| B-06 | Abyss Gate | dark water → void stone → corruption | planned |

---

## Phase 6 — Quest & Polish (Epics E, G)

| ID | Asset | Tool | Status | Export path |
|----|-------|------|--------|-------------|
| UI-05 | Quest card frame | `create_map_object` | planned | `public/assets/ui/quest-card.png` |
| UI-06 | Quest icons ×8 | `create_1_direction_object` | planned | `public/assets/ui/quest-icons/` |
| FX-03 | Hit sparks ×3 | `create_1_direction_object` | planned | `public/assets/fx/hit-spark.png` |
| FX-04 | Leak warning | `create_1_direction_object` | planned | `public/assets/fx/leak-skull.png` |
| UI-07 | Tutorial pointer | `create_1_direction_object` | planned | `public/assets/ui/tutorial-hand.png` |

---

## Integration Checklist (per asset)

- [ ] Job completed (`get_*` returns success)
- [ ] Candidate selected (`select_object_frames` if needed)
- [ ] PNG saved under `public/assets/`
- [ ] Atlas JSON or frame coords documented
- [ ] `CosmicBoardScene` preload updated
- [ ] Legacy atlas reference removed or deprecated
- [ ] Visual pass in dev server (`pnpm dev`)

---

## Estimated Generation Budget

| Category | Approx. jobs | Notes |
|----------|--------------|-------|
| Terrain tilesets | 8–12 | chained biomes |
| Gems | 35–40 | 5×7 + projectiles |
| Objects/UI | 15–20 | |
| Enemies | 12–18 | + boss animations |
| FX | 8–10 | |
| **Total** | **~80–100** | Run in batches; check `get_balance` first |

---

*Update Job ID and Status columns as assets are generated.*
