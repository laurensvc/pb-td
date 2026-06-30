# PixelLab Asset Generation Pipeline

Practical guide for producing the first complete art set for the GemTD-inspired tower defense game with the PixelLab MCP.

This project is starting from scratch, so the goal is not one-off pretty sprites. The goal is a repeatable asset pipeline where every generated asset has a clear prompt, export path, animation contract, and Phaser integration shape.

For Codex cloud MCP wiring, see [`CODEX-PIXELLAB-MCP.md`](./CODEX-PIXELLAB-MCP.md).

For board layout, grass terrain, and landmark placement, see [`BOARD-AND-MAZE-SPEC.md`](./BOARD-AND-MAZE-SPEC.md).

For gem types, tower stats, and recipes, see [`TOWER-AND-GEM-SYSTEMS.md`](./TOWER-AND-GEM-SYSTEMS.md).

For per-asset generation status and checklists, see [`ASSET-GENERATION-TRACKER.md`](./ASSET-GENERATION-TRACKER.md).

## 1. Pipeline Goals

- Preserve GemTD readability: every monster, tower, projectile, and tile must be identifiable at gameplay scale.
- Prefer consistent pixel art over detail density.
- Use transparent PNG sprites for objects, units, towers, particles, and projectiles.
- Use tile-backed images only for terrain and environment tiles.
- Keep generation batches small enough to review and regenerate weak assets quickly.
- Document MCP job IDs, selected variants, export paths, and Phaser keys as assets are accepted.

## 2. PixelLab MCP Operating Rules

Use the PixelLab MCP as the first-choice generator for all in-game sprites.

### 2.1 Required Style Invariants

Apply these requirements to every generated asset unless a section overrides them:

```text
GemTD-inspired fantasy crystal maze, Warcraft 3 custom map readability, high top-down or low top-down pixel art, clean silhouette, single-color outline, medium shading, readable at 32 pixels, crisp pixel edges
```

For isolated sprites, always include:

```text
transparent background, background removed, no square backdrop, no scene background, isolated sprite
```

Avoid:

- Painted concept art that does not read as a sprite.
- Perspective-heavy side views.
- Large baked shadows that will fight Phaser lighting or depth sorting.
- Background scenery on monsters, towers, projectiles, or particles.
- Overly thin details that disappear at 32-48px.

### 2.2 Review Gates

Every generated asset must pass these checks before it is integrated:

1. The silhouette is readable at the intended in-game size.
2. The background is truly transparent unless the asset is terrain.
3. The object is centered and not clipped.
4. The sprite faces the documented default direction.
5. Animation frames loop without popping.
6. Exported file names match the manifest path.
7. Phaser preload key and frame metadata are documented.

## 3. Directory and Naming Contract

Use stable paths from the start so content data can reference assets without churn.

```text
public/assets/
  enemies/
    <enemy-id>/
      walk.png
      death.png
      hit.png
      shadow.png
  towers/
    <tower-id>/
      idle.png
      attack.png
      build.png
      impact.png
  projectiles/
    <tower-id>.png
    <effect-id>.png
  particles/
    <effect-id>.png
  terrain/
    tiles/
      <biome-id>.png
    objects/
      rock.png
      spawn-gate.png
      goal-nexus.png
      checkpoint-<n>.png
  ui/
    icons/
      <icon-id>.png
```

Use lowercase kebab-case IDs:

- `crystal-runner`
- `stone-bulwark`
- `flame-chip`
- `magma-core`
- `arcane-bolt`
- `hit-spark`
- `crownfall-floor`

## 4. Sprite Size Standards

These sizes define the generation target, not necessarily the rendered size.

| Asset type | Generation size | Render size | Notes |
| --- | ---: | ---: | --- |
| Ground enemy | 64x64 | 32-48px | Low top-down, clear body shape |
| Flying enemy | 64x64 | 32-48px | Include small separate shadow if needed |
| Boss enemy | 96x96 or 128x128 | 64-96px | Must still fit board cells visually |
| Basic tower/gem | 64x64 | 40-56px | Bottom-center anchor |
| Special tower | 96x96 | 56-72px | Bigger, but not visually blocking paths |
| Projectile | 32x32 or 64x64 | 12-32px | Strong color family match |
| Particle/FX sheet | 64x64 or 128x128 | 24-64px | Short loops or one-shot bursts |
| Terrain tile | 32x32 | 32px | Seamless tile or atlas |
| Environment object | 64x64 or 96x96 | 32-72px | Transparent object sprite |

## 5. MCP Tool Sequence

The exact PixelLab MCP tool names may vary by installed server version. Use this sequence as the required workflow.

### 5.1 Static Object Flow

Use for rocks, gates, checkpoints, tower idle sprites, one-frame projectiles, and UI icons.

1. Create the object with the PixelLab object/static sprite tool.
2. Request multiple variants in one batch when the server supports it.
3. Inspect the returned candidates.
4. Select the best candidate.
5. Export as transparent PNG.
6. Save under the naming contract path.
7. Add or update the Phaser asset manifest.

Recommended MCP shape:

```json
{
  "tool": "create_1_direction_object",
  "description": "<prompt>",
  "size": 64,
  "view": "top-down",
  "item_descriptions": ["<variant 1>", "<variant 2>", "<variant 3>"]
}
```

### 5.2 Character Animation Flow

Use for monsters and any tower that needs directional or frame-based animation.

1. Create the base character with a clear silhouette prompt.
2. Select the best base frame.
3. Generate the required animation from that exact base.
4. Export a spritesheet, not separate loose frames, unless PixelLab only supports frame export.
5. Record frame width, frame height, frame count, and frame rate.
6. Verify the loop at gameplay scale.
7. Save the sheet in the enemy or tower folder.

Recommended MCP shape:

```json
{
  "tool": "create_character",
  "description": "<character prompt>",
  "size": 64,
  "view": "top-down"
}
```

Then:

```json
{
  "tool": "animate_character",
  "character_id": "<selected-character-id>",
  "animation": "walk",
  "frames": 8,
  "fps": 8
}
```

### 5.3 Tileset Flow

Use for terrain, biome floors, path tiles, buildable tiles, and decorative board variants.

1. Generate a base tile first.
2. Chain variants from the accepted base tile to preserve palette and material consistency.
3. Export as either a single atlas or individual 32x32 tiles.
4. Test tiling in Phaser before generating large biome sets.

Recommended MCP shape:

```json
{
  "tool": "create_topdown_tileset",
  "lower": "<base material>",
  "upper": "<tile description>",
  "tile_size": 32
}
```

## 6. Monster Creation and Movement

Monsters are gameplay pieces first. Their art must communicate speed, durability, flying status, and boss threat without needing UI labels.

### 6.1 Monster Archetypes

Start with this minimum set:

| ID | Role | Visual read | Required animations |
| --- | --- | --- | --- |
| `crystal-runner` | Fast light ground | Lean, narrow, bright feet | `walk`, `hit`, `death` |
| `stone-grunt` | Standard ground | Broad, simple, readable torso | `walk`, `hit`, `death` |
| `shield-bulwark` | Armored ground | Large frontal shield or shell | `walk`, `hit`, `death` |
| `thorn-splitter` | Splitter/summoner | Pod or cracked body | `walk`, `hit`, `death`, `split` |
| `arcane-mystic` | Resistant caster | Robe, glow, staff shape | `walk`, `hit`, `death` |
| `sky-warden` | Flying enemy | Wings or hover body | `fly`, `hit`, `death` |
| `gate-colossus` | Boss | Large crown/horns/core | `walk`, `hit`, `death`, `spawn` |

### 6.2 Monster Prompt Template

```text
top-down pixel art monster sprite for a GemTD-inspired fantasy crystal maze tower defense game, <monster description>, <role readability>, clean strong silhouette, single-color dark outline, medium shading, Warcraft 3 custom map readability, readable at 32 pixels, facing downward-right as default, transparent background, background removed, no square backdrop, no scene background, isolated sprite
```

Example:

```text
top-down pixel art monster sprite for a GemTD-inspired fantasy crystal maze tower defense game, fast crystal runner with lean hunched body, small glowing claws and narrow sprinting silhouette, clearly reads as a fast low-health enemy, clean strong silhouette, single-color dark outline, medium shading, Warcraft 3 custom map readability, readable at 32 pixels, facing downward-right as default, transparent background, background removed, no square backdrop, no scene background, isolated sprite
```

### 6.3 Monster Animation Requirements

| Animation | Frames | FPS | Loop | Phaser use |
| --- | ---: | ---: | --- | --- |
| `walk` | 6-8 | 8-10 | yes | Ground movement |
| `fly` | 6-8 | 8-12 | yes | Flying movement |
| `hit` | 2-4 | 12-16 | no | Brief damage flash or recoil |
| `death` | 6-10 | 10-14 | no | Cleanup after final frame |
| `split` | 6-8 | 10-14 | no | Spawn child enemies |
| `spawn` | 6-10 | 8-12 | no | Boss/portal entry |

Movement itself is not baked into animation. Phaser moves the sprite along the path while the `walk` or `fly` loop plays in place.

### 6.4 Monster Export Paths

```text
public/assets/enemies/crystal-runner/walk.png
public/assets/enemies/crystal-runner/hit.png
public/assets/enemies/crystal-runner/death.png
public/assets/enemies/sky-warden/fly.png
public/assets/enemies/gate-colossus/spawn.png
```

### 6.5 Phaser Monster Notes

- Use `setOrigin(0.5, 0.75)` for most monsters.
- Use `setDepth(sprite.y)` for ground enemies.
- Flying enemies should use a higher depth layer and a separate shadow sprite.
- Do not rotate monster sprites freely unless the art supports it. Prefer horizontal flip and animation direction hints.
- Enemy movement speed comes from content data, not animation FPS.

Example manifest entry:

```ts
{
  key: "enemy.crystal-runner.walk",
  path: "assets/enemies/crystal-runner/walk.png",
  frameWidth: 64,
  frameHeight: 64,
  frames: 8,
  fps: 10
}
```

## 7. Tower Creation and Animations

Towers are GemTD gems first and fantasy weapons second. The board must remain readable after many towers and rocks are placed.

### 7.1 Tower Families

Art batches use five visual families. Canonical gameplay gem types (Amethyst, Ruby, etc.) map to these families — see [`TOWER-AND-GEM-SYSTEMS.md`](./TOWER-AND-GEM-SYSTEMS.md) §16.

| Family | Color | Combat identity | Visual motif |
| --- | --- | --- | --- |
| `flame` | Red/orange | Splash, burn | Ember crystal, magma core |
| `stone` | Grey/gold | Slow heavy hits | Granite shard, hammer crystal |
| `thorn` | Green | Poison, damage over time | Thorn gem, vine lens |
| `arcane` | Violet/blue | Pierce, magic | Floating rune crystal |
| `radiant` | Gold/white | Support, chain, aura | Prism, halo facets |

### 7.2 Tower Prompt Template

```text
top-down pixel art GemTD-inspired crystal tower, <family and tier description>, <combat identity cue>, sits on a small dark stone base, clean silhouette, single-color dark outline, medium shading, readable at 40 pixels, Warcraft 3 custom map readability, transparent background, background removed, no square backdrop, no scene background, isolated sprite
```

Example:

```text
top-down pixel art GemTD-inspired crystal tower, tier 3 flame gem tower with jagged ruby-orange crystal and small ember vents, clearly reads as splash fire damage, sits on a small dark stone base, clean silhouette, single-color dark outline, medium shading, readable at 40 pixels, Warcraft 3 custom map readability, transparent background, background removed, no square backdrop, no scene background, isolated sprite
```

### 7.3 Tower Tier Rules

Each family should have visually distinct tiers:

| Tier | Visual increase |
| ---: | --- |
| 1 | Small chipped gem, minimal glow |
| 2 | Larger crystal, clearer color identity |
| 3 | Multiple facets or small base ornament |
| 4 | Strong glow, more angular shape |
| 5 | Elite silhouette, visible power core |
| 6 | Large perfect crystal, strong identity |
| Great | Rare oversized premium form |

Do not make tier differences only brighter. Change shape, scale, base detail, and glow pattern.

### 7.4 Tower Animation Requirements

| Animation | Frames | FPS | Loop | Notes |
| --- | ---: | ---: | --- | --- |
| `idle` | 4-6 | 4-8 | yes | Subtle pulse only |
| `attack` | 4-8 | 10-16 | no | Charge, flash, recoil, or beam start |
| `build` | 6-10 | 10-14 | no | Used when chosen raw gem becomes tower |
| `merge` | 6-10 | 10-14 | no | Optional, can share particle FX |
| `impact` | 4-8 | 12-18 | no | Optional tower-local flash |

Tower animations should be mostly in-place. Phaser handles targeting, projectiles, range checks, and damage timing.

### 7.5 Tower Export Paths

```text
public/assets/towers/flame-t1/idle.png
public/assets/towers/flame-t1/attack.png
public/assets/towers/flame-t1/build.png
public/assets/towers/magma-core/idle.png
public/assets/towers/magma-core/attack.png
```

### 7.6 Phaser Tower Notes

- Use `setOrigin(0.5, 1.0)` for towers so they sit on the board cell.
- Use `setDepth(tower.y + 8)` so towers layer above the tile they occupy.
- Keep attack direction in code when possible. A tower can flash without rotating if its projectile direction is clear.
- If a tower sprite should rotate, generate it facing upward and apply a Phaser rotation offset.
- Tower stats and asset keys should live in content data, not inside Phaser scene logic.

## 8. Particles and Projectiles

Projectiles and particles must communicate damage type quickly without covering the maze.

### 8.1 Projectile Families

| ID | Used by | Visual |
| --- | --- | --- |
| `flame-bolt` | Flame towers | Orange ember orb with short trail |
| `stone-shard` | Stone towers | Grey-gold shard, heavy arc |
| `thorn-spore` | Thorn towers | Green seed/spore, poison flecks |
| `arcane-lance` | Arcane towers | Violet-blue piercing needle |
| `radiant-prism` | Radiant towers | Gold-white prism ray or bead |
| `magma-core-shot` | Magma Core | Larger molten shell |

### 8.2 Projectile Prompt Template

```text
top-down pixel art tower defense projectile, <projectile description>, strong readable shape at 16 pixels, color-coded for <damage family>, crisp pixel edges, short transparent motion trail, no background, transparent background, isolated sprite
```

Example:

```text
top-down pixel art tower defense projectile, violet-blue arcane lance shaped like a sharp glowing crystal needle, strong readable shape at 16 pixels, color-coded for arcane damage, crisp pixel edges, short transparent motion trail, no background, transparent background, isolated sprite
```

### 8.3 Particle Prompt Template

```text
top-down pixel art tower defense impact effect spritesheet, <effect description>, short one-shot burst, readable at 32 pixels, crisp pixel edges, transparent background, background removed, no square backdrop
```

Example:

```text
top-down pixel art tower defense impact effect spritesheet, green poison spore burst with tiny thorn flecks and fading toxic ring, short one-shot burst, readable at 32 pixels, crisp pixel edges, transparent background, background removed, no square backdrop
```

### 8.4 FX Animation Requirements

| FX | Frames | FPS | Loop | Notes |
| --- | ---: | ---: | --- | --- |
| Projectile idle/travel | 1-4 | 12-16 | yes | Often one static sprite is enough |
| Hit spark | 4-6 | 16-24 | no | Destroy after completion |
| Splash burst | 6-8 | 16-24 | no | Must show radius without blocking board |
| Poison tick | 4-6 | 8-12 | yes | Very subtle, low opacity in Phaser |
| Merge burst | 8-12 | 16-24 | no | Bigger celebratory effect |
| Leak warning | 6-10 | 10-14 | no | UI/gameplay alert |

### 8.5 Projectile Export Paths

```text
public/assets/projectiles/flame-bolt.png
public/assets/projectiles/stone-shard.png
public/assets/projectiles/arcane-lance.png
public/assets/particles/hit-spark.png
public/assets/particles/merge-burst.png
public/assets/particles/poison-tick.png
```

### 8.6 Phaser Projectile Notes

- Use Phaser Arcade movement or direct vector interpolation; do not use heavy physics.
- Rotate projectile sprites toward velocity if the sprite is directional.
- Destroy or return projectiles to a pool after hit or timeout.
- Use additive blend sparingly for magic effects.
- Damage is applied by combat code, not by particle completion.
- Hit FX should be spawned from an object pool during large waves.

## 9. Environment Creation

Environment art defines the board but must never obscure pathing.

### 9.1 Required Environment Assets

| ID | Type | Purpose |
| --- | --- | --- |
| `grass-floor` | Terrain tile | Buildable meadow (primary v1 terrain) |
| `path-floor` | Terrain tile | **Debug/editor only** — creep path is not visible in-game |
| `blocked-floor` | Terrain tile | Unbuildable board cells |
| `rock` | Object | Converted unused gems / maze walls |
| `spawn-gate` | Object | Enemy start |
| `goal-nexus` | Object | Enemy finish |
| `checkpoint-1` to `checkpoint-5` | Tile/object | Ordered route points |
| `selection-ring` | FX/object | Legal build hover |
| `invalid-ring` | FX/object | Illegal build hover |

### 9.2 Terrain Prompt Template

```text
top-down seamless 32x32 pixel art terrain tile for a GemTD-inspired fantasy crystal maze, <terrain description>, gameplay-readable grass meadow floor, subtle detail only, no tall objects, no path lane paint, no text, crisp pixel edges
```

Example:

```text
top-down seamless 32x32 pixel art terrain tile for a GemTD-inspired fantasy crystal maze, soft green grass meadow with tiny wildflower specks and subtle shade variation, gameplay-readable grass floor, subtle detail only, no tall objects, no path lane paint, no text, crisp pixel edges
```

### 9.3 Environment Object Prompt Template

```text
top-down pixel art map object for a GemTD-inspired fantasy crystal maze, <object description>, clean silhouette, readable at board scale, single-color dark outline, medium shading, transparent background, background removed, no square backdrop, isolated sprite
```

Example:

```text
top-down pixel art map object for a GemTD-inspired fantasy crystal maze, monster spawn gate made from cracked stone pillars with green portal core, clean silhouette, readable at board scale, single-color dark outline, medium shading, transparent background, background removed, no square backdrop, isolated sprite
```

### 9.4 Biome Expansion Rule

Create one complete default board first. Only then branch into biomes.

Default board order:

1. Grass floor tile (`grass-floor`).
2. Optional grass variant / edge tiles.
3. Blocked floor variant (editor/debug).
4. Rock object.
5. Spawn gate.
6. Goal nexus.
7. Checkpoints 1-5.
8. Selection and invalid placement indicators.

Later biome order:

1. New base floor.
2. Path floor.
3. Blocked/edge tile.
4. Matching rock.
5. Matching spawn/goal treatment only if needed.

### 9.5 Phaser Environment Notes

- Terrain tiles use `setOrigin(0, 0)` or Tilemap layers.
- Object landmarks use `setOrigin(0.5, 1.0)`.
- Checkpoint numbers must remain readable in screenshots at 100% zoom.
- Never use decoration to imply pathability. The data grid is authoritative.
- Keep tall environment objects outside playable cells unless they are intentional blockers.

## 10. Animation Metadata Contract

Every accepted spritesheet needs a small metadata record.

```ts
type SpriteAnimationMeta = {
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  fps: number;
  repeat: -1 | 0;
  origin: [number, number];
};
```

Example:

```ts
{
  key: "tower.flame-t1.idle",
  path: "assets/towers/flame-t1/idle.png",
  frameWidth: 64,
  frameHeight: 64,
  frames: 6,
  fps: 6,
  repeat: -1,
  origin: [0.5, 1.0]
}
```

## 11. Phaser Integration Checklist

For each accepted asset:

- [ ] Export PNG to the correct `public/assets/` path.
- [ ] Confirm transparent alpha where required.
- [ ] Confirm frame size and frame count.
- [ ] Add preload entry.
- [ ] Add animation creation entry if animated.
- [ ] Add content data reference.
- [ ] Verify render size on the board.
- [ ] Verify depth sorting against towers, monsters, and terrain.
- [ ] Verify no black/white background square appears in game.
- [ ] Verify the sprite remains readable during a wave.

Recommended Phaser config:

```ts
render: {
  pixelArt: true,
  roundPixels: true
}
```

Recommended texture settings:

```ts
this.textures.get("asset.key").setFilter(Phaser.Textures.FilterMode.NEAREST);
```

## 12. Batch Execution Order

Generate in this order to avoid wasting time on polished assets before the board is readable:

1. Default terrain tiles and core map objects.
2. Rock, spawn gate, goal nexus, and checkpoints.
3. One complete enemy with walk/hit/death.
4. One complete tower family tier 1-3 with projectile and hit FX.
5. Phaser integration smoke test.
6. Remaining base enemy set.
7. Remaining base tower families.
8. Special towers and merge/build FX.
9. Bosses and rare effects.
10. Biome variants.

## 13. Asset Acceptance Template

Copy this block into an asset tracker or PR notes when accepting an asset.

```md
## Asset Acceptance

- Asset ID:
- Category:
- PixelLab MCP tool:
- PixelLab job ID:
- Selected candidate/frame ID:
- Prompt:
- Export path:
- Phaser key:
- Frame size:
- Frame count:
- FPS:
- Origin:
- Runtime scale:
- Notes:
```

## 14. First Vertical Slice Asset List

The first playable slice should use a deliberately small art set:

### Environment

- `grass-floor`
- `blocked-floor` (debug/editor)
- `rock`
- `spawn-gate`
- `goal-nexus`
- `checkpoint-1` through `checkpoint-5`
- `selection-ring`
- `invalid-ring`

### Monsters

- `crystal-runner`
- `stone-grunt`
- `shield-bulwark`
- `sky-warden`
- `gate-colossus`

### Towers

- `flame-t1`, `flame-t2`, `flame-t3`
- `stone-t1`, `stone-t2`, `stone-t3`
- `thorn-t1`, `thorn-t2`, `thorn-t3`
- `magma-core`

### Projectiles and FX

- `flame-bolt`
- `stone-shard`
- `thorn-spore`
- `magma-core-shot`
- `hit-spark`
- `burn-tick`
- `poison-tick`
- `merge-burst`
- `build-flash`

## 15. Quality Bar

An asset is production-usable only when it works in-game, not when the generated preview looks good.

Reject and regenerate when:

- The sprite cannot be identified at gameplay scale.
- The generated angle conflicts with the rest of the set.
- The animation changes the character shape too much between frames.
- The tower hides pathing cells or makes rocks hard to read.
- The projectile is visually stronger than the tower or monster.
- The environment tile looks like a blocker when it is walkable.
- Transparent assets include an opaque background.

Keep accepted prompts and failed prompts. Failed prompts are useful because they prevent repeating vague language that produces unusable sprites.
