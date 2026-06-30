# Gem TD Clone - Complete Master Handover Document

**Project:** Web-based Tower Defense (Inspired by Warcraft 3: Gem TD)  
**Tech Stack:** React 18 (UI), Phaser 3 (Engine), Vite (Bundler), EasyStar.js (Pathfinding)  
**Asset Generation:** PixelLab MCP (Pro/v3 Models)

---

## 1. Project Vision & Core Identity

This project aims to recreate the iconic custom map **Gem Tower Defense** from _Warcraft 3_. Unlike traditional tower defense games where players build specific towers on predefined spots, Gem TD relies on **Mazing** (using towers to build the path) and **RNG-based Placement** (the "5-to-1" mechanic).

### 1.1 The Core Gameplay Loop

1. **Build Phase:** The player places 5 random gems on an open grid.
2. **Selection Phase:** The player selects 1 gem to keep.
3. **Resolution Phase:** The chosen gem activates as a defensive tower. The unselected 4 gems permanently turn into **Rocks** (impassable walls).
4. **Combat Phase:** A wave of enemies (creeps) spawns and attempts to navigate the maze. Towers automatically attack.
5. **Repeat:** The cycle continues, allowing the player to slowly build a massive maze out of rocks and gems.

---

## 2. Gameplay Mechanics in Detail

### 2.1 Gem Types & Qualities

Gems are defined by their **Type** (which dictates damage type/effects) and their **Quality** (tier level).

- **8 Base Types:** Amethyst (Anti-Air), Aquamarine (Attack Speed), Diamond (High Damage), Emerald (Poison), Opal (Aura/Support), Ruby (Splash Damage), Sapphire (Slow), Topaz (Multi-target).
- **6 Qualities (Tiers):** Chipped -> Flawed -> Normal -> Flawless -> Perfect -> Great.
- **Full tower/gem spec:** Stats, abilities, recipes, MVP, auras, and content schemas — see [`TOWER-AND-GEM-SYSTEMS.md`](./TOWER-AND-GEM-SYSTEMS.md).

### 2.2 The Recipe System (Special Towers)

Players can combine specific gems to create powerful Special Towers.

- **Mechanic:** If a player has the required base gems on the board, they can select one and "Combine". The other component gems are consumed, and the selected gem transforms into a Special Tower.
- _Example:_ Silver Knight = Chipped Sapphire + Chipped Topaz + Chipped Diamond.
- **Recipe catalog and combine rules:** [`TOWER-AND-GEM-SYSTEMS.md`](./TOWER-AND-GEM-SYSTEMS.md) §7.

### 2.3 Waypoint Mazing

Unlike standard TDs with a single Start and End, Gem TD uses waypoints.

- Enemies spawn at **Start**, must walk to **Waypoint 1** (usually center), then **Waypoint 2** (top right), back to **Waypoint 1**, and finally to the **End**.
- This forces players to build a complex, winding maze that hits multiple checkpoints.
- **Flying Waves:** Every few waves, flying creeps spawn. They ignore the maze (Rocks/Gems) and follow a fixed aerial route through the checkpoints (not drawn on the ground).
- **Full board spec:** Map size, camera pan, grass terrain, hidden path, landmark placement, and route legs — see [`BOARD-AND-MAZE-SPEC.md`](./BOARD-AND-MAZE-SPEC.md).

---

## 3. Technical Architecture (React + Phaser)

Do not mix UI state and Game loop state. Keep them strictly separated.

- **React (Overlay):** Handles the main menu, the player's Gold, the "Extra Chance" upgrade buttons, the recipe dictionary UI, and phase announcements.
- **Phaser (Canvas):** Handles grid rendering, sprite animations, pathfinding, projectile physics, and combat math.
- **Event Bus:** Use Phaser's built-in event emitter to bridge them.
  - _Phaser emits:_ `game.events.emit('updateGold', 15)`
  - _React listens:_ `useEffect(() => { game.events.on('updateGold', setGold) }, [])`

---

## 4. Asset Generation & Handling Pipeline

### 4.1 PixelLab MCP Prompts

Use these exact prompt structures for your local PixelLab MCP to ensure consistency in the Phaser engine.

- **Standard Gems:** `"Use PixelLab MCP Pro. Isometric top-down view of a small, jagged [COLOR] [GEM_TYPE] crystal resting on a dark stone tile. 16-bit arcade style. Action: 'idle pulsing glow'. Size: 128x128. no_background: true."`
- **Special Towers:** `"Use PixelLab MCP Pro. Isometric top-down view of an ornate, glowing magical tower made of [MATERIAL], intricate details. Action: 'idle pulse'. Size: 128x128. no_background: true."`
- **Creeps (Ground):** `"Use PixelLab MCP Pro. Small [MONSTER_TYPE], top-down perspective, 16-bit arcade style. Action: 'walk'. Size: 64x64. no_background: true."`
- **Creeps (Flying):** `"Use PixelLab MCP Pro. A flying [BIRD/DRAGON], top-down view, casting a small shadow. Action: 'fly'. Size: 64x64. no_background: true."`

### 4.2 Phaser Asset Configuration

To achieve the crisp Warcraft 3 / Arcade aesthetic without blurriness:

```javascript
// 1. Global Game Config
render: {
    pixelArt: true,   // Crucial: Stops anti-aliasing
    roundPixels: true // Stops half-pixel blurring on movement
}

// 2. Sprite Origins & Y-Sorting (Pseudo-3D)
tower.setOrigin(0.5, 1.0); // Anchor to bottom-center of the tile
tower.setDepth(tower.y);   // Sort based on Y coordinate so front towers hide back towers
```

---

## 5. Grid Math & Pathfinding

Board dimensions, 2×2 footprints, camera pan, and grid visibility rules are defined in [`BOARD-AND-MAZE-SPEC.md`](./BOARD-AND-MAZE-SPEC.md).

### 5.1 Grid Snapping

When the player hovers their mouse to place a gem, use this formula to snap the "Ghost" sprite to the grid:

```javascript
const worldPoint = pointer.positionToCamera(this.cameras.main)
const gridX = Math.floor(worldPoint.x / TILE_SIZE)
const gridY = Math.floor(worldPoint.y / TILE_SIZE)
const snappedX = gridX * TILE_SIZE + TILE_SIZE / 2 // Assuming 0.5 X origin
```

### 5.2 Anti-Blocking Logic (A\* Validation)

Players **cannot** be allowed to trap enemies completely.

1. Maintain a 2D array representation of your map (0 = walkable, 1 = rock/gem).
2. When hovering over a tile in the Build Phase, temporarily set that tile to `1`.
3. Run `EasyStar.js` from _Start -> WP1_, _WP1 -> WP2_, etc.
4. If ANY path returns `null`, the placement is invalid. Turn the Ghost Cursor RED and disable clicking.

---

## 6. Combat & Targeting

Tower combat, abilities, damage types, and targeting modes are specified in [`TOWER-AND-GEM-SYSTEMS.md`](./TOWER-AND-GEM-SYSTEMS.md). Summary below for quick reference.

### 6.1 Target Prioritization

Towers need to know _who_ to shoot. Implement a targeting array:

1.  Filter creeps within attack range.
2.  Sort by player preference (Closest to Tower, Closest to End Waypoint, or Highest HP).
3.  Target `array[0]`.

### 6.2 Rotation Math (Facing the Target)

Top-down towers must rotate to face the creep.

```javascript
// Calculate the angle in radians
const angle = Phaser.Math.Angle.Between(tower.x, tower.y, target.x, target.y)

// PixelLab sprites generated facing UP need a 90-degree offset (Math.PI / 2)
tower.rotation = angle + Math.PI / 2
```

### 6.3 Projectile Physics

Do not use complex Box2D physics for TD projectiles; it kills performance.

- Use Phaser Arcade Physics.
- Use `this.physics.moveToObject(projectile, target, speed)`.
- Check for impact by calculating distance: `if (Phaser.Math.Distance.Between(proj, target) < 10) { hit(); }`
- **Splash Damage (Ruby):** Upon hit, iterate through all creeps. If `distance(target, otherCreep) < splashRadius`, apply partial damage.

---

## 7. Upgrades & Probability

A major part of Gem TD is upgrading the _chances_ of getting higher-tier gems during the 5-to-1 phase.

- Player spends Gold in the React UI to upgrade their "Gem Probability Level".
- Pass this level to your Phaser randomizer logic.

| Upgrade Level   | Chipped | Flawed | Normal | Flawless | Perfect |
| :-------------- | :------ | :----- | :----- | :------- | :------ |
| Level 1 (Start) | 100%    | 0%     | 0%     | 0%       | 0%      |
| Level 2         | 70%     | 30%    | 0%     | 0%       | 0%      |
| Level 3         | 40%     | 40%    | 20%    | 0%       | 0%      |

---

## 8. Crucial Attention Points & Pitfalls

- **Memory Leaks (Projectiles):** Ensure projectiles are actually `destroyed()` on impact or when flying out of bounds. Do not just make them invisible. Use a Phaser `Group` with object pooling if the wave gets massive.
- **Pathfinding Bottlenecks:** Re-calculating the A\* path for 100 creeps every frame will crash the browser window. Calculate the path **once** when the maze changes, save it as an array of coordinates, and have the creeps simply follow the array indices.
- **Wave Stacking:** If a player's maze is extremely long, Wave 2 might spawn while Wave 1 is still walking. Ensure your game loop can handle multiple active waves simultaneously.
- **Armor Types:** If you implement standard WC3 armor types (e.g., Magic damage does 150% to Heavy Armor but 75% to Fortified), map this out in a clear JSON config file, not hardcoded in the attack loop.
