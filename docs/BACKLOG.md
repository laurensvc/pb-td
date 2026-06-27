# Cosmic Gem Siege — Full GemTD Backlog

Product goal: evolve **PB TD / Cosmic Siege** from a fixed-path horde TD MVP into a **full-fledged GemTD-style** browser game — checkerboard maze building, gem merge progression, wave economy, long seasonal runs, and pixel-art presentation generated through the **PixelLab MCP** server.

---

## 1. Vision

**Cosmic Gem Siege** keeps the cosmic theme and fail-forward meta (stars, crowns, upgrade tree) while adopting the core GemTD loop:

1. Build a **maze** with rocks on a checkerboard.
2. Place and **merge gems** (towers) on opposite-colored cells.
3. Survive **long wave seasons** (target: 50 waves) with escalating enemy mixes.
4. Spend **run gold** on rocks, gems, lucky draws, and mid-run tools.
5. Earn **persistent stars/crowns** for meta upgrades between runs.

Success looks like: a solo player can plan a maze, merge toward a “great gem” build, lose lives on leaks, still earn meta currency, and return for another season with new quests and areas.

---

## 2. Current State vs GemTD Target

| Area | Today (MVP) | GemTD target |
|------|-------------|--------------|
| Board | 16×10 grid, **fixed path** | Checkerboard build cells; **player-routed maze** |
| Towers | 4 tower types, 1 per slot, no merge | **5 gem families**, levels 1–7, **merge pairs** |
| Economy | Stars from kills (meta only) | **Gold per wave** + stars/crowns (meta) |
| Placement | Authored build-zone cells near path | **Rocks** (block) + **gems** (attack), parity rules |
| Waves | 3 waves × 100 spawns per area tier | **50-wave seasons**, bosses, mixed compositions |
| Between waves | Place towers, buy meta upgrades | Shop, lucky box, merge UI, quest checks |
| Active ability | Orbital missile (click AoE) | Optional hero skill / consumable (keep missile as hero power) |
| Content | 3 areas, 6 enemy types | 12+ enemies, elites, bosses, 6+ areas |
| Art | Single atlas `terrain-towers-enemies.png` | Full PixelLab tilesets, gems, rocks, VFX, UI |
| Social | None | Leaderboards, async seeds, co-op (later) |

**Keep from MVP:** React + Phaser stack, deterministic engine tests, save/respec, crown tier unlocks, shield/poison/splash combat primitives.

**Replace or extend:** path model, placement rules, tower identity, wave structure, in-run economy.

---

## 3. Milestones

| Milestone | Name | Outcome |
|-----------|------|---------|
| **M0** | Foundation (done) | Fixed-path MVP, meta tree, 3 areas — see `ISSUES.MD` |
| **M1** | Maze Core | Checkerboard, rocks, dynamic pathfinding, valid-maze validation |
| **M2** | Gem Loop | 5 gem types, merge, levels 1–6, parity placement |
| **M3** | Season Structure | 50-wave template, gold economy, lucky box, wave intermission UI |
| **M4** | Combat Depth | Bosses, elites, gem-specific passives, quest cards |
| **M5** | Content & Meta | 6 areas, difficulty tiers, extended upgrade tree, balance pass |
| **M6** | Polish & Ship | PixelLab art integration, juice, audio, mobile, leaderboard |

Recommended order: **M1 → M2 → M3** are blocking; M4–M6 can overlap once M3 is playable.

---

## 4. Epic Backlog

Priority key: **P0** (blocking), **P1** (core fun), **P2** (depth), **P3** (polish / live ops).

---

### Epic A — Checkerboard Maze Foundation (M1) `P0`

Replace fixed-path TD with GemTD-style maze routing.

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| A-1 | As a player, I build on a **checkerboard** where only half the cells accept rocks and the other half accept gems | Parity enum per cell; invalid cell type rejects placement |
| A-2 | As a player, I place **rocks** that block movement | Rock occupies cell; removed only by sell/refund rules |
| A-3 | When I place or remove a rock, the **path recalculates** | A* (or BFS) from spawn → goal; enemies follow shortest path |
| A-4 | The game **rejects invalid mazes** (no path, spawn/goal blocked) | Placement preview shows red/green; illegal rock placement blocked |
| A-5 | Spawn and goal cells are **fixed per area** | Authored in area definitions; visual markers on board |
| A-6 | Board sizes match GemTD feel | Start with **5×5** build core per area; outer rim for spawn/goal (configurable per area) |
| A-7 | **Sell rock** with refund curve | Refund % configurable; prevents infinite gold exploit |

**Engine touchpoints:** new `maze.ts`, replace `pathNav` distance field with dynamic graph, update `pathBuild.ts` → `boardParity.ts`.

**PixelLab assets (Epic A):**

| Asset | MCP tool | Prompt / notes |
|-------|----------|----------------|
| Cosmic void floor (dark cell) | `create_topdown_tileset` | lower: `deep space void`, upper: `dark cosmic stone floor`, 32px, `high top-down` |
| Cosmic light cell (gem slot) | chained tileset | lower: prior dark base id, upper: `glowing starfield tile, subtle cyan grid` |
| Rock blocker | `create_1_direction_object` | `cosmic asteroid rock, chunky, top-down, single color outline`, 48px |
| Spawn portal | `create_map_object` | `alien warp gate, cyan energy ring`, 64×64 |
| Goal nexus | `create_map_object` | `cosmic breach core, pulsing red`, 64×64 |
| Path hint overlay | `create_tiles_pro` | `1). path dust trail 2). path edge sparkle` — use for optional path preview FX |

**Style lock:** generate dark cell tileset first; pass `upper_base_tile_id` into light cell set; use exported PNG as `style_images` for rocks/portals.

---

### Epic B — Gem Types & Merge System (M2) `P0`

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| B-1 | Five gem families exist: **Kinetic, Verdant, Arcane, Nova, Prism** (cosmic reskin of Amethyst/Topaz/Emerald/Sapphire/Opal roles) | Data-driven `GemDefinition` with branch + color |
| B-2 | Gems have **levels 1–6**; two adjacent same-type same-level gems **merge** into level+1 | Merge action in intermission; animation + SFX hook |
| B-3 | Level 7 **“Great”** gem requires quest or lucky box (see Epic E) | Unique sprite + kit modifier |
| B-4 | Each gem level scales **damage, range, attack speed** per family curve | Tables in `content.ts`; unit tests per family |
| B-5 | **Family passives** (GemTD fidelity): | |
| | Kinetic (Amethyst-like) | Multi-hit / crit chance per level |
| | Verdant (Emerald-like) | Poison stacks, spreads on merge tier |
| | Arcane (Sapphire-like) | Shield break + magic resist shred |
| | Nova (Topaz-like) | Slow on hit; splash at higher tiers |
| | Prism (Opal-like) | Armor reduction; bonus vs high-HP |
| B-6 | Drag-or-click **merge UX** with legal target highlighting | Illegal merge shows reason |
| B-7 | **Gem inventory** from wave rewards and shop | Holds unplaced gems between waves |
| B-8 | Migrate existing 4 towers into gem families or deprecate | Migration note in save `version` bump |

**PixelLab assets (Epic B):**

| Asset | MCP tool | Notes |
|-------|----------|-------|
| Gem sprites L1–L6 × 5 families | `create_1_direction_object` | Batch with `item_descriptions`: e.g. `small cyan kinetic crystal` … `massive kinetic great crystal`; size 32–48px |
| Merge flash FX | `create_1_direction_object` | `starburst merge sparkle, 32px`, lineless |
| Great gem variants (×5) | `create_map_object` | 48×48, style-matched to L6 via `background_image` |
| Projectile sprites per family | `create_1_direction_object` | 16px bolts, orbs, spores, mortar shell, prism shard |

**Pipeline:** one family at a time; select best candidate via `get_object` → `select_object_frames`; atlas pack into `public/assets/gems/` with Phaser JSON.

---

### Epic C — Wave Economy & Intermission (M3) `P0`

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| C-1 | **Gold** earned per kill during a run (separate from stars) | Shown in HUD; persists only for current attempt |
| C-2 | **Rock cost** escalates per rock placed (GemTD curve) | Formula + tests; soft cap option |
| C-3 | **Gem shop** between waves: buy random gem by family or tier | Weighted table; pity counter optional |
| C-4 | **Lucky box** — spend gold for random gem level | Animation; log outcome |
| C-5 | Intermission phases: `planning` → `wave` → `reward` | Clear UI states; block input appropriately |
| C-6 | **Interest** on banked gold (optional, P2) | +X% if player skips shop |
| C-7 | Starfall missile costs **gold or cooldown** during wave | Tunable; default keep cooldown-only |
| C-8 | **50-wave season** template per area | Wave table generator + hand-tuned bosses |

**PixelLab assets (Epic C):**

| Asset | MCP tool | Notes |
|-------|----------|-------|
| Gold coin icon | `create_1_direction_object` | `pixel gold star coin`, 24px |
| Lucky box | `create_1_direction_object` | `cosmic loot crate, purple glow`, 40px |
| Shop panel frame | `create_map_object` | UI frame 256×128, nine-slice later in code |
| Wave banner | `create_1_direction_object` | `WAVE text hologram badge` for intermission |

---

### Epic D — Enemies, Bosses & Waves (M4) `P1`

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| D-1 | Expand roster to **12+ enemy types** | Fast, tank, shield, split, heal, invisible, flying |
| D-2 | **Boss every 10 waves** with telegraphed abilities | Boss bar UI; unique rewards |
| D-3 | **Wave composition** mixes types (not single-id floods) | `WaveSegment[]` with weights |
| D-4 | **Elite modifiers** (armored, swift, regen) | Small icon + stat multipliers |
| D-5 | Area-specific enemy themes | Orion, Lunar, Crownfall + 3 new areas |
| D-6 | Leak damage respects **lives**; boss leaks = 2 lives | Config per enemy |
| D-7 | Pathing supports **flying** (optional shortcut) | Second path layer or ignore rocks flag |

**PixelLab assets (Epic D):**

| Asset | MCP tool | Notes |
|-------|----------|-------|
| Enemy walkers (12 types) | `create_character` | `mode: standard`, `view: high top-down`, size 32–48, chibi proportions |
| Enemy walk cycles | `animate_character` | walk ×4 directions minimum |
| Bosses (6) | `create_character` | `mode: pro` or `v3`, size 64–96 |
| Boss ability telegraphs | `create_1_direction_object` | ground AOEs, 32–64px |
| Elite aura FX | `create_1_direction_object` | `red elite crown aura`, lineless overlay |
| Shield bar segment | `create_1_direction_object` | 8×4px UI pip |

---

### Epic E — Quests, Great Gems & Meta (M4–M5) `P1`

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| E-1 | **Quest cards** each season (e.g. “Merge 3 Verdant gems”, “Clear wave 30 without leak”) | 3 active quests; reroll costs gold |
| E-2 | Completing quests grants **great gem recipe** or meta stars | Reward table |
| E-3 | Extend **upgrade tree** for gem families and maze tools | +rock cap, +merge range, missile tiers |
| E-4 | **Crowns** unlock new areas and hard modifiers | Keep MVP behavior |
| E-5 | **Respec** remains for meta stars | Already implemented |
| E-6 | **Daily seed** run for leaderboard | Same maze + wave seed for all |

**PixelLab assets (Epic E):**

| Asset | MCP tool | Notes |
|-------|----------|-------|
| Quest card frame | `create_map_object` | 180×240 card |
| Quest icons (8) | `create_1_direction_object` | merge, kill, leakless, boss, gold, etc. |
| Crown / star icons (HD) | `create_1_direction_object` | replace Lucide in HUD optionally |

---

### Epic F — Areas & Map Variety (M5) `P1`

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| F-1 | **6 areas** with unique checkerboard layouts | Different spawn/goal positions, blocked cells |
| F-2 | **Normal / Hard / Nightmare** tiers | Multipliers + extra quest |
| F-3 | **Environmental tiles** (slow terrain, damage terrain) | Optional P2 |
| F-4 | Area select screen with **preview minimap** | React route or modal |
| F-5 | Chained **PixelLab tilesets** per biome | void→nebula→lunar→solar→crown→abyss |

**PixelLab assets (Epic F):**

| Biome | `create_topdown_tileset` chain |
|-------|-------------------------------|
| Orion Breach | void → steel platform → rust debris |
| Lunar Causeway | moon dust → silver path → crater rock |
| Crownfall Gate | gold trim floor → marble → royal carpet |
| Nebula Drift (new) | purple gas → crystal floor |
| Solar Flare (new) | obsidian → magma crack → cooled basalt |
| Abyss Gate (new) | dark water → void stone → corruption vein |

Use `lower_base_tile_id` / `upper_base_tile_id` chaining for seamless biome transitions.

---

### Epic G — UX, Juice & Audio (M6) `P2`

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| G-1 | Tutorial **first season** (waves 1–5) | Step prompts for rock, gem, merge, start wave |
| G-2 | Merge, hit, leak, boss **particles** | Phaser particle emitters |
| G-3 | **Sound** — placement, merge, wave start, boss | WebAudio or howler |
| G-4 | **Mobile** touch — tap place, long-press sell | Responsive layout |
| G-5 | **Accessibility** — reduced motion, colorblind gem shapes | Shape overlay per family |
| G-6 | Settings: volume, speed ×1–×3 | Persist in save |

**PixelLab assets (Epic G):**

| Asset | MCP tool | Notes |
|-------|----------|-------|
| Hit sparks (3 colors) | `create_1_direction_object` | 16px |
| Leak warning skull | `create_1_direction_object` | 24px |
| Tutorial arrow | `create_1_direction_object` | bouncy cursor hand |

---

### Epic H — Online & Live Ops (post-ship) `P3`

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| H-1 | **Leaderboard** — highest wave / fastest boss kill | API + guest name |
| H-2 | **Season rotations** — weekly mutators | JSON config |
| H-3 | **Co-op async** — share maze seed | Out of initial ship scope |
| H-4 | Analytics — funnel, wave death heatmap | Privacy-safe events |

---

### Epic I — Engineering Quality `P1`

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| I-1 | **Deterministic sim** tests for maze + merge + economy | Vitest coverage for new modules |
| I-2 | Save **migration** v1 → v2 (gem inventory, areas) | `save.ts` version bump |
| I-3 | **Content authoring** — JSON or TS for waves/areas | Document schema in `docs/CONTENT-SCHEMA.md` |
| I-4 | Split **engine** from **render** further | Snapshot drives Phaser; no game logic in scene |
| I-5 | Performance — 500+ enemies stress test | 60fps target desktop |
| I-6 | CI — test, lint, build on PR | GitHub Actions |

---

## 5. Suggested Sprint Slices (first 8 weeks)

| Week | Focus | Deliverable |
|------|-------|-------------|
| 1 | A-1–A-4 | Checkerboard + A* path + tests |
| 2 | A-5–A-7, PixelLab floor + rock | Playable maze sandbox |
| 3 | B-1–B-4 | Gems L1–6 data + placement |
| 4 | B-5–B-8 | Merge UX + combat passives |
| 5 | C-1–C-5 | Gold + shop + intermission UI |
| 6 | C-6–C-8 | 50-wave template area 1 |
| 7 | D-1–D-4 | Enemy roster + bosses |
| 8 | PixelLab integration pass | Replace atlas placeholders with gem/enemy art |

---

## 6. PixelLab MCP — Operational Playbook

All assets should be generated via the **user-pixellab** MCP server. Standard workflow:

```
1. create_*        → receive job id
2. get_* / poll    → wait for completed PNG
3. select_object_frames (if review status)
4. Download → public/assets/<category>/
5. Register in Phaser preload + atlas JSON
```

### 6.1 Project conventions

| Setting | Value |
|---------|-------|
| Tile size | 32×32 (board), 16×16 (FX) |
| View | `high top-down` for board; `low top-down` for characters |
| Outline | `single color outline` (game readability) |
| Shading | `medium shading` |
| Detail | `medium detail` |

### 6.2 Generation order (minimize style drift)

1. **Terrain** — `create_topdown_tileset` chain for void/light cells  
2. **Rocks & portals** — `create_1_direction_object` with terrain style reference  
3. **Gems L1–L6** — one family at a time, 6 calls or batched `item_descriptions`  
4. **Enemies** — `create_character` then `animate_character`  
5. **UI** — `create_map_object` / small `create_1_direction_object`  
6. **VFX** — last; lineless outlines  

### 6.3 Asset manifest (target files)

```
public/assets/
  terrain/
    cosmic-void-tileset.png
    cosmic-light-tileset.png
  gems/
    kinetic-L1.png … kinetic-GREAT.png
    verdant-L1.png … 
    arcane-L1.png …
    nova-L1.png …
    prism-L1.png …
  objects/
    rock.png
    spawn-portal.png
    goal-nexus.png
    lucky-box.png
  enemies/
    <id>/
      rotations.png
      atlas.json
  fx/
    merge-burst.png
    hit-spark.png
  ui/
    shop-frame.png
    quest-card.png
```

### 6.4 MCP tool cheat sheet

| Need | Tool |
|------|------|
| Wang terrain transitions | `create_topdown_tileset` |
| Isometric / shaped tiles | `create_tiles_pro` |
| Towers, gems, rocks, icons | `create_1_direction_object` |
| Style-matched prop on map | `create_map_object` |
| Walking enemies | `create_character` + `animate_character` |
| Static enemy state | `create_character_state` |
| Check job status | `get_topdown_tileset`, `get_object`, `get_character`, `get_map_object` |
| Pick variants | `select_object_frames` |
| Credit check | `get_balance` |

### 6.5 Example MCP calls (reference)

**Dark floor tileset:**
```json
{
  "tool": "create_topdown_tileset",
  "lower_description": "deep space void black",
  "upper_description": "dark cosmic metal floor with faint cyan seams",
  "tile_size": { "width": 32, "height": 32 },
  "view": "high top-down",
  "outline": "single color outline",
  "shading": "medium shading"
}
```

**Kinetic gem level 3:**
```json
{
  "tool": "create_1_direction_object",
  "description": "cyan kinetic crystal gem, tier 3, glowing core, top-down tower defense sprite",
  "size": 40,
  "view": "top-down"
}
```

**Void scout enemy:**
```json
{
  "tool": "create_character",
  "description": "small alien void scout, sleek, cyan eyes",
  "name": "Void Scout",
  "size": 40,
  "view": "high top-down",
  "proportions": "{\"type\": \"preset\", \"name\": \"chibi\"}",
  "mode": "standard",
  "n_directions": 8
}
```

---

## 7. Content Targets (GemTD parity checklist)

- [ ] 5 gem families with distinct passives  
- [ ] Merge levels 1–6 + Great gem  
- [ ] Rock placement maze on checkerboard  
- [ ] Dynamic pathfinding  
- [ ] 50 waves per season  
- [ ] In-run gold + shop + lucky box  
- [ ] 3+ quest types per run  
- [ ] Boss every 10 waves  
- [ ] 6 areas × 3 tiers  
- [ ] Meta upgrade tree (stars/crowns)  
- [ ] Fail-forward stars on loss  
- [ ] Full PixelLab art pass  

---

## 8. Out of Scope (v1)

- Real-time multiplayer  
- Steam / native builds  
- Pay-to-win monetization  
- Full Dota 2 Arcade feature parity (courier, -swap, etc.)  
- User-generated maze sharing (consider v2)  

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Maze pathfinding bugs | Extensive Vitest + visual debug overlay |
| Merge UX confusion | Tutorial + shape icons per family |
| 50-wave balance | Telemetry + iterative area 1 tuning |
| PixelLab style inconsistency | Strict generation order + `style_images` references |
| Scope creep | Ship M1–M3 before bosses/quests |

---

## 10. Definition of Done — “Full GemTD”

The game is **GemTD-complete** when a player can:

1. Select an area and start a **50-wave season**.  
2. Place **rocks** to maze and **gems** on valid cells.  
3. **Merge** gems through level 6 toward a **Great** build.  
4. Spend **gold** on rocks, shop gems, and lucky boxes between waves.  
5. Face **bosses** and diverse enemy types with gem-counter play.  
6. Complete **quests** for bonus rewards.  
7. Earn **stars/crowns** for persistent upgrades across runs.  
8. Play on a board rendered with **PixelLab-produced** terrain, gems, enemies, and UI art.

---

## 11. Loop Progress Log

| Date | Action |
|------|--------|
| 2026-06-27 | Started PixelLab T-01 + O-01 jobs; added `boardParity.ts` + `maze.ts` (Epic A foundation) with tests |
| 2026-06-27 | Exported T-01 tileset + O-01 rock; chained T-02 gem-cell tileset (generating) |
| 2026-06-27 | Epic A maze wired into engine: dynamic pathNav, rocks, checkerboard placement |
| 2026-06-27 | T-02 first job timed out; retried as `33c6e27f-fcc6-4fd2-af2a-4f8e261575bb` |
| 2026-06-27 | T-02 gem-cell tileset exported to `public/assets/terrain/gem-cell.png` — Phase 1 terrain complete |

---

*Last updated: 2026-06-27 · Maintained in `docs/BACKLOG.md`*
