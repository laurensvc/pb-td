# GEM TD Gameplay Reference

A practical gameplay design document for a Gem TD-inspired tower defense game.

This file explains the core loop, tower logic, merging, combining, enemy waves, MVP bonuses, skills, and implementation notes. It is written as a usable reference for building a browser-game MVP, not as a strict clone specification.

---

## 1. High-level concept

Gem TD is a maze-building tower defense game where the player does not simply buy fixed towers from a shop. Instead, every build turn gives the player a small random set of gems. The player chooses which gem to keep, while the other placements become stones that shape the maze.

The tension comes from three linked decisions:

1. **Maze building**  
   Stones block the path and force enemies to walk farther.

2. **Tower placement**  
   The kept gem becomes a tower or part of a future tower recipe.

3. **Recipe planning**  
   Strong named towers require specific gem combinations, so the player must plan around randomness.

---

## 2. Core game loop

A full game is split into repeated build and attack cycles.

```text
Start game
↓
Build phase
  - place random gems
  - choose one gem to keep
  - other placed gems become stones
  - optionally merge, combine, downgrade, or remove
↓
Attack phase
  - enemy wave enters the maze
  - towers attack automatically
  - player may manually focus or stop towers
  - MVP bonuses are awarded after the wave
↓
Repeat until wave 50+
```

The normal victory target is to survive the required waves, commonly 50 waves. After that, extra or repeated waves can be used for endless mode, ranking, or challenge runs.

---

## 3. Map and maze rules

### 3.1 Gem Castle

The Gem Castle is the player’s life pool. Enemies that reach the castle cause leak damage.

Typical implementation:

```json
{
  "castleHealth": 100,
  "leakDamagePerEnemy": 1,
  "bossLeakDamage": 5
}
```

Some skills may reduce leak damage, heal the castle, or give the castle a chance to evade leak damage.

### 3.2 Checkpoints

Enemies do not simply walk in a straight line to the castle. They move through a sequence of checkpoints and take the shortest valid path between them.

A simplified route:

```text
Spawn → Checkpoint 1 → Checkpoint 2 → Checkpoint 3 → Checkpoint 4 → Checkpoint 5 → Castle
```

### 3.3 Stones

Stones are non-attacking blockers. Their purpose is to form a maze.

Rules:

- Stones block ground enemies.
- Stones should not make the path impossible.
- Stones may be removable during the build phase.
- Flying enemies ignore the ground maze.
- Towers can also occupy map cells and may act as blockers depending on the implementation.

### 3.4 Path validity

Every time a stone or tower is placed, removed, or transformed, the game should validate that ground enemies still have a path.

Recommended logic:

```text
onCellChanged():
  path = findPath(spawn, castle, blockers)
  if no path:
    reject placement
  else:
    accept placement
```

For an MVP, use A\* or BFS on a grid.

---

## 4. Build phase

The build phase is the strategic planning phase.

### 4.1 Standard build action

A standard build phase gives the player 5 random gem placements.

Example:

```text
Build phase starts
↓
Player places 5 random gems
↓
Player selects 1 gem to keep
↓
The 4 unselected gems become stones
```

The selected gem remains active and can attack in later waves. The other four become part of the maze.

### 4.2 Why this matters

This system forces the player to choose between:

- the best gem type
- the best gem level
- the best tower position
- the best maze shape
- the best future recipe

A bad gem in a great location may still be useful. A perfect gem in a bad location may be hard to use.

### 4.3 Build phase actions

| Action              | Purpose                                                                |
| ------------------- | ---------------------------------------------------------------------- |
| **Select / Check**  | Keep the selected gem. The other newly placed gems become stones.      |
| **Remove / Stone**  | Remove a selected stone if the rules allow it.                         |
| **Merge / ^**       | Upgrade the selected gem by one quality level.                         |
| **Merge / ^^**      | Upgrade the selected gem by two quality levels.                        |
| **Combine / Tower** | Convert a valid recipe into a named tower.                             |
| **Downgrade / Gem** | Convert a gem into a lower random quality, usually at a gold cost.     |
| **Swap**            | Move or exchange tower positions if the player has the relevant skill. |

---

## 5. Gem system

Base gems are the primitive tower pieces. They can attack by themselves, but they are also ingredients for named towers.

### 5.1 Base gem types

| Gem        | Code | Primary role                               |
| ---------- | ---: | ------------------------------------------ |
| Amethyst   |    P | Armor reduction and piercing support       |
| Aquamarine |    Q | Very fast attacks and attack speed utility |
| Diamond    |    D | Direct single-target damage                |
| Emerald    |    G | Poison and damage-over-time                |
| Opal       |    E | Attack speed aura                          |
| Ruby       |    R | Cleave and area damage                     |
| Sapphire   |    B | Slow and crowd control                     |
| Topaz      |    Y | Multi-target split attacks                 |

### 5.2 Gem quality / level

Each base gem has levels 1 to 6.

```text
Level 1 → weak
Level 2 → better
Level 3 → useful recipe material
Level 4 → strong
Level 5 → rare / advanced recipe material
Level 6 → perfect / top-tier recipe material
```

Suggested internal naming:

```text
ruby-1
ruby-2
ruby-3
ruby-4
ruby-5
ruby-6
```

### 5.3 Gem identity

A gem has two key properties:

```json
{
  "type": "ruby",
  "level": 3
}
```

The **type** determines the role.  
The **level** determines power and recipe eligibility.

---

## 6. Merging

Merging upgrades a gem while preserving its type.

```text
Ruby level 2 → Ruby level 3
Sapphire level 4 → Sapphire level 5
Diamond level 5 → Diamond level 6
```

### 6.1 Merge / ^

`MERGE / ^` upgrades the selected gem by one level.

```text
selected gem: emerald-3
after merge:  emerald-4
```

### 6.2 Merge / ^^

`MERGE / ^^` upgrades the selected gem by two levels.

```text
selected gem: emerald-3
after merge:  emerald-5
```

### 6.3 Recommended limits

Gem levels should not exceed 6.

```text
ruby-5 + merge ^  = ruby-6
ruby-5 + merge ^^ = ruby-6
ruby-6 + merge ^  = blocked
```

### 6.4 Merge cost model

The source gameplay uses merge actions, but an MVP should define a clear cost model.

Recommended options:

#### Option A: Gold cost

```json
{
  "mergeOneLevelCost": 200,
  "mergeTwoLevelsCost": 450
}
```

Simple and easy to implement.

#### Option B: Duplicate material

Require another gem of the same type and level.

```text
ruby-3 + ruby-3 → ruby-4
```

More strategic, but harder to manage with random placement.

#### Option C: Limited charges

Give the player a small number of merge charges per game or per several waves.

```json
{
  "mergeCharges": 3,
  "gainMergeChargeEveryNWaves": 10
}
```

Good for preventing brute-force upgrades.

### 6.5 Recommended MVP rule

For a first browser MVP, use **gold cost merging**.

Reason:

- easiest to understand
- easiest to balance
- no complicated inventory required
- still gives the player agency against bad randomness

---

## 7. Combining towers

Combining is different from merging.

### 7.1 Merge vs combine

| System  | Input                | Output                      | Purpose                |
| ------- | -------------------- | --------------------------- | ---------------------- |
| Merge   | One gem              | Same gem type, higher level | Upgrade quality        |
| Combine | Multiple gems/towers | New named tower             | Unlock special effects |

Example:

```text
Merge:
ruby-2 → ruby-3

Combine:
sapphire-1 + diamond-1 + topaz-1 → Silver
```

### 7.2 Combination rules

A named tower has a recipe.

Example data structure:

```json
{
  "id": "silver",
  "displayName": "Silver",
  "tier": "basic",
  "requires": [
    { "type": "sapphire", "level": 1 },
    { "type": "diamond", "level": 1 },
    { "type": "topaz", "level": 1 }
  ],
  "effects": ["slow"]
}
```

### 7.3 Consuming ingredients

When a combination is performed:

1. Required ingredients are consumed.
2. One target cell becomes the new tower.
3. The new tower inherits or replaces the selected gem’s location.
4. The resulting tower gains its own stats and abilities.

Recommended MVP rule:

```text
The combined tower appears on the selected ingredient's cell.
All other ingredients are removed.
```

This makes positioning important.

### 7.4 Same-build instant tower

If the player receives all required ingredients in one build phase, the player can immediately create that tower before the unselected gems become stones.

This creates high-impact moments where random rolls produce a powerful tower quickly.

MVP implementation:

```text
During build phase:
  if currentPlacedGems contain recipe:
    enable Combine button
```

---

## 8. Tower tiers

Named towers can be grouped into tiers.

| Tier         | Role                                                      |
| ------------ | --------------------------------------------------------- |
| Basic        | First recipes made from low-level gems                    |
| Intermediate | Stronger recipes using basic towers or mid-level gems     |
| Advanced     | Major power spikes with multiple effects                  |
| Top          | Endgame towers requiring advanced towers and level 6 gems |
| Secret       | Special one-hit or challenge towers                       |

---

## 9. Example tower branches

### 9.1 Silver branch

```text
Silver
↓
Silver Knight
↓
Huge Pink Diamond
↓
Koh-i-noor Diamond
```

Gameplay identity:

- slows enemies
- adds cleave and damage
- becomes a high-damage endgame branch

Example recipes:

| Tower              | Example requirement                        |
| ------------------ | ------------------------------------------ |
| Silver             | Sapphire 1 + Diamond 1 + Topaz 1           |
| Silver Knight      | Silver + Aquamarine 2 + Ruby 3             |
| Pink Diamond       | Diamond 5 + Diamond 3 + Topaz 3            |
| Huge Pink Diamond  | Pink Diamond + Silver Knight + Silver      |
| Koh-i-noor Diamond | Huge Pink Diamond + Amethyst 6 + Diamond 6 |

### 9.2 Malachite / Uranium branch

```text
Malachite
↓
Vivid Malachite
↓
Uranium-235
```

Gameplay identity:

- split attacks
- multi-target pressure
- strong against dense waves

Example recipes:

| Tower           | Example requirement                       |
| --------------- | ----------------------------------------- |
| Malachite       | Opal 1 + Emerald 1 + Aquamarine 1         |
| Vivid Malachite | Malachite + Diamond 2 + Topaz 3           |
| Uranium-238     | Topaz 5 + Sapphire 3 + Opal 2             |
| Uranium-235     | Uranium-238 + Malachite + Vivid Malachite |

### 9.3 Ruby / Bloodstone branch

```text
Asteriated Ruby
↓
Volcano
↓
Bloodstone
↓
Antique Bloodstone
↓
The Crown Prince
```

Gameplay identity:

- burn damage
- chain lightning
- high area damage
- strong against grouped enemies

Example recipes:

| Tower              | Example requirement                     |
| ------------------ | --------------------------------------- |
| Asteriated Ruby    | Ruby 2 + Ruby 1 + Amethyst 1            |
| Volcano            | Asteriated Ruby + Ruby 4 + Amethyst 3   |
| Bloodstone         | Ruby 5 + Aquamarine 4 + Amethyst 3      |
| Antique Bloodstone | Bloodstone + Volcano + Ruby 2           |
| The Crown Prince   | Antique Bloodstone + Ruby 6 + Emerald 6 |

### 9.4 Jade branch

```text
Jade
↓
Grey Jade
↓
Monkey King Jade
↓
Diamond Cullinan
```

Gameplay identity:

- poison
- accuracy / anti-evasion style effects
- strong scaling into late game

Example recipes:

| Tower            | Example requirement                       |
| ---------------- | ----------------------------------------- |
| Jade             | Emerald 3 + Opal 3 + Sapphire 2           |
| Grey Jade        | Jade + Sapphire 4 + Aquamarine 3          |
| Monkey King Jade | Grey Jade + Emerald 4 + Amethyst 2        |
| Diamond Cullinan | Monkey King Jade + Diamond 6 + Sapphire 6 |

### 9.5 Anti-flying branch

```text
Quartz
↓
Lucky Chinese Jade
↓
Charming Lazurite
↓
Golden Jubilee
```

Gameplay identity:

- anti-flying damage
- poison support
- specialized answer to flying waves

Example recipes:

| Tower              | Example requirement                  |
| ------------------ | ------------------------------------ |
| Quartz             | Emerald 4 + Ruby 3 + Amethyst 2      |
| Lucky Chinese Jade | Quartz + Jade + Emerald 3            |
| Charming Lazurite  | Quartz + Amethyst 4 + Topaz 2        |
| Golden Jubilee     | Charming Lazurite + Topaz 6 + Ruby 6 |

### 9.6 Aura branch

```text
Deepsea Pearl
↓
Chrysoberyl Cat's Eye
↓
Red Coral
↓
Carmen-Lucia
```

Gameplay identity:

- aura support
- attack speed
- magic resistance utility
- makes nearby damage towers stronger

Example recipes:

| Tower                 | Example requirement                            |
| --------------------- | ---------------------------------------------- |
| Deepsea Pearl         | Aquamarine 4 + Diamond 4 + Opal 2              |
| Chrysoberyl Cat's Eye | Opal 5 + Diamond 4 + Aquamarine 3              |
| Red Coral             | Deepsea Pearl + Chrysoberyl Cat's Eye + Opal 4 |
| Carmen-Lucia          | Red Coral + Opal 6 + Aquamarine 6              |

---

## 10. Tower roles and combat identity

### 10.1 Damage towers

Damage towers are used to kill enemies directly.

Examples:

- Diamond
- Ruby
- Pink Diamond
- Huge Pink Diamond
- Koh-i-noor Diamond

### 10.2 Crowd-control towers

Crowd-control towers slow, stun, or disrupt enemies.

Examples:

- Sapphire
- Silver
- Silver Knight
- Dark Emerald
- Emerald Golem

### 10.3 Area damage towers

Area damage towers punish grouped enemies.

Examples:

- Ruby
- Volcano
- Bloodstone
- Antique Bloodstone
- The Burning Stone

### 10.4 Multi-target towers

Multi-target towers split attacks across several enemies.

Examples:

- Topaz
- Malachite
- Vivid Malachite
- Uranium-235

### 10.5 Aura towers

Aura towers boost nearby towers or weaken nearby enemies.

Examples:

- Opal
- Deepsea Pearl
- Chrysoberyl Cat's Eye
- Red Coral
- Carmen-Lucia

### 10.6 Specialist towers

Specialist towers answer specific wave types.

Examples:

- Quartz against flying enemies
- Amethyst against armor-heavy enemies
- anti-evasion towers against evasive enemies
- magic or physical damage towers against immunity waves

---

## 11. Auras and stacking

Auras are passive effects that apply in a radius.

Examples:

```json
{
  "type": "attackSpeedAura",
  "radius": 500,
  "value": 40
}
```

Recommended stacking rule:

```text
Different aura levels stack.
Identical aura levels do not stack.
```

Example:

```text
Opal level 2 aura + Opal level 2 aura = only one Opal level 2 aura applies
Opal level 2 aura + Opal level 3 aura = both can apply
```

This prevents players from spamming the same cheap aura tower.

---

## 12. Targeting

Towers should support automatic and manual targeting.

### 12.1 Automatic targeting modes

Recommended targeting modes:

| Mode        | Behavior                                 |
| ----------- | ---------------------------------------- |
| First       | Target enemy closest to the castle       |
| Last        | Target enemy farthest from the castle    |
| Strongest   | Target enemy with highest current health |
| Weakest     | Target enemy with lowest current health  |
| Closest     | Target nearest enemy                     |
| Flying only | Target flying enemies if possible        |
| Boss only   | Target boss enemies if possible          |

### 12.2 Manual focus

Players may manually command towers to attack a specific enemy. This is useful for:

- killing leaks
- controlling boss damage
- giving MVP bonuses to the desired tower
- focusing immune or high-priority enemies

### 12.3 Stop command

A stop command prevents a tower from attacking.

This matters because players may want to control which tower deals the most damage in a wave.

---

## 13. MVP system

After each attack phase, the tower or gem that dealt the most damage can receive an MVP bonus.

### 13.1 MVP bonus

Recommended interpretation:

```text
Most damage in a wave → +10% permanent damage
Maximum MVP stacks → 10
```

Example:

```text
Tower base damage: 100
MVP stacks: 3
Final damage: 130
```

### 13.2 MVP aura

At high MVP count, a tower may gain an aura that improves nearby towers or weakens nearby enemies.

Suggested implementation:

```json
{
  "mvpStacks": 10,
  "auraRadius": 600,
  "nearbyTowerDamageBonus": 0.75
}
```

### 13.3 Why MVP matters

The MVP system creates a second layer of progression. A mediocre tower can become important if it receives repeated MVPs, and a strong tower can become the centerpiece of the defense.

### 13.4 MVP strategy

Players can manipulate MVP by:

- stopping stronger towers temporarily
- manually focusing weaker towers
- placing a tower where it sees more enemies
- using slow towers to keep enemies in range longer
- using auras to help one tower dominate damage charts

---

## 14. Enemy waves

### 14.1 Wave structure

The standard mode uses 50 required waves.

Recommended structure:

```text
Waves 1–9: normal enemies
Wave 10: boss
Waves 11–19: stronger normal enemies
Wave 20: boss
Waves 21–29: enemies with more complex abilities
Wave 30: boss
Waves 31–39: heavy immunity and specialist waves
Wave 40: boss
Waves 41–49: late-game mixed threats
Wave 50: final boss
```

### 14.2 Enemy movement types

| Type   | Behavior                             |
| ------ | ------------------------------------ |
| Ground | Follows the maze                     |
| Flying | Ignores the maze                     |
| Boss   | High health, often special abilities |

### 14.3 Enemy abilities

| Ability                | Gameplay effect                                 |
| ---------------------- | ----------------------------------------------- |
| Magic Immunity         | Ignores or reduces magic damage                 |
| Physical Immunity      | Ignores or reduces physical damage              |
| Disarm                 | Temporarily prevents some towers from attacking |
| Flying                 | Ignores ground maze pathing                     |
| Evasion                | Has a chance to avoid attacks                   |
| Refraction             | Blocks or reduces incoming damage instances     |
| Blink                  | Teleports forward or dodges path pressure       |
| Rush                   | Moves faster than normal                        |
| Thief                  | Steals or reduces player resources              |
| Permanent Invisibility | Requires detection or specific counters         |
| High Armor             | Strong against physical attacks                 |
| Reactive Armor         | Becomes harder to kill under repeated hits      |
| Recharge               | Regenerates or restores defenses                |
| Kraken Shell           | Reduces disables or incoming debuffs            |

### 14.4 Why wave variety matters

Wave variety prevents one build from solving the whole game. The player should need:

- single-target damage for bosses
- area damage for dense waves
- anti-flying towers
- slows and stuns
- poison or damage-over-time
- anti-armor
- anti-evasion
- both physical and magical damage

---

## 15. Economy

### 15.1 Gold

Gold is the main in-run currency.

Use gold for:

- merging
- downgrading
- temporary skills
- tower manipulation
- emergency actions

Sources of gold:

- killing enemies
- clearing waves
- bonus objectives
- interest, if implemented
- selling or refunding, if implemented

---

## 16. Skills

Skills add controlled player agency to a random game.

### 16.1 Defensive skills

| Skill   | Purpose                                          |
| ------- | ------------------------------------------------ |
| Heal    | Restores castle health                           |
| Guard   | Reduces leak damage                              |
| Evade   | Gives the castle a chance to ignore leak damage  |
| Revenge | Increases tower damage when castle health is low |

### 16.2 Gem-control skills

| Skill            | Purpose                                      |
| ---------------- | -------------------------------------------- |
| Gem Pray         | Improves chance for a chosen gem type        |
| Gem Quality Pray | Improves chance for a chosen quality         |
| Flawless Pray    | Improves chance for high-quality gems        |
| Perfect Pray     | Improves chance for perfect gems             |
| Timelapse        | Rerolls or replaces current build-phase gems |
| Hammer           | Downgrades a gem by one level                |

### 16.3 Position-control skills

| Skill         | Purpose                         |
| ------------- | ------------------------------- |
| Adjacent Swap | Swaps a gem with a nearby stone |
| Swap          | Swaps two tower positions       |

### 16.4 Combat skills

| Skill        | Purpose                                             |
| ------------ | --------------------------------------------------- |
| Attack Speed | Temporarily boosts one tower                        |
| Aim          | Temporarily increases one tower's range             |
| Crit         | Temporarily gives one tower critical hits           |
| Fatal Bonds  | Links enemies so shared damage becomes bonus damage |
| Candy Maker  | Places a lure that pulls or attaches enemies        |

---

## 17. Boss design

Bosses should appear every 10 waves.

Recommended boss wave pattern:

| Wave | Boss concept                    |
| ---: | ------------------------------- |
|   10 | First durability check          |
|   20 | First mechanic check            |
|   30 | Flying or alternate boss        |
|   40 | Heavy resistance boss           |
|   50 | Final boss with multiple traits |

Bosses should test whether the player has enough focused damage, not just a long maze.

---

## 18. Player strategy

### 18.1 Early game

Priorities:

1. Create a long maze.
2. Keep useful low-level gems.
3. Build one or two basic named towers.
4. Add slow or aura support.

Good early tower goals:

- Silver
- Malachite
- Asteriated Ruby
- Jade
- Quartz

### 18.2 Mid game

Priorities:

1. Start building toward advanced recipes.
2. Prepare anti-flying coverage.
3. Add armor reduction or poison.
4. Build enough AoE for dense waves.
5. Control MVP bonuses.

Good mid-game goals:

- Silver Knight
- Volcano
- Bloodstone
- Grey Jade
- Dark Emerald
- Paraiba Tourmaline
- Deepsea Pearl

### 18.3 Late game

Priorities:

1. Complete at least one top tower.
2. Stack useful auras.
3. Keep slows near the longest path section.
4. Add counters for immunities.
5. Use manual targeting on bosses.

Good late-game goals:

- Koh-i-noor Diamond
- Diamond Cullinan
- Golden Jubilee
- The Crown Prince
- Sapphire Star of Adam
- Carmen-Lucia

---

## 19. Suggested browser-game MVP

### 19.1 MVP scope

Build only the following first:

- 8 base gems
- 10 named towers
- 20 waves
- 1 boss every 10 waves
- basic build phase
- simple merge system
- simple combine system
- basic pathfinding
- MVP bonus

### 19.2 MVP tower set

Recommended first named towers:

| Tower           | Reason                           |
| --------------- | -------------------------------- |
| Silver          | Introduces recipes and slow      |
| Silver Knight   | Introduces recipe chains         |
| Malachite       | Introduces split attacks         |
| Vivid Malachite | Introduces stronger multi-target |
| Asteriated Ruby | Introduces burn                  |
| Volcano         | Introduces upgraded burn         |
| Jade            | Introduces poison                |
| Grey Jade       | Introduces upgraded poison       |
| Quartz          | Introduces anti-flying           |
| Deepsea Pearl   | Introduces aura/support          |

### 19.3 MVP data model

#### Gem

```ts
type Gem = {
  id: string;
  type: 'amethyst' | 'aquamarine' | 'diamond' | 'emerald' | 'opal' | 'ruby' | 'sapphire' | 'topaz';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  position: GridPosition;
};
```

#### Tower

```ts
type Tower = {
  id: string;
  towerType: string;
  tier: 'base' | 'basic' | 'intermediate' | 'advanced' | 'top' | 'secret';
  position: GridPosition;
  damage: number;
  range: number;
  attackCooldownMs: number;
  effects: TowerEffect[];
  mvpStacks: number;
};
```

#### Recipe

```ts
type Recipe = {
  id: string;
  outputTowerId: string;
  requirements: RecipeRequirement[];
};
```

#### Requirement

```ts
type RecipeRequirement =
  | { kind: 'gem'; type: string; level: number }
  | { kind: 'tower'; towerType: string };
```

#### Enemy

```ts
type Enemy = {
  id: string;
  wave: number;
  type: 'ground' | 'flying' | 'boss';
  health: number;
  maxHealth: number;
  armor: number;
  speed: number;
  abilities: string[];
  position: Vector2;
};
```

---

## 20. Suggested algorithms

### 20.1 Build phase algorithm

```text
startBuildPhase():
  buildSlots = []
  repeat 5 times:
    cell = playerChoosesCell()
    gem = generateRandomGem()
    placeTemporaryGem(cell, gem)
    buildSlots.push(gem)

  selectedGem = playerSelectsOneGem(buildSlots)

  for each gem in buildSlots:
    if gem == selectedGem:
      settleGem(gem)
    else:
      convertToStone(gem.position)
```

### 20.2 Random gem generation

```text
generateRandomGem():
  type = weightedRandom(baseGemTypes)
  level = weightedRandom(gemLevels)
  return Gem(type, level)
```

Example level weights:

| Level | Chance |
| ----: | -----: |
|     1 |    45% |
|     2 |    25% |
|     3 |    15% |
|     4 |     9% |
|     5 |     5% |
|     6 |     1% |

### 20.3 Merge algorithm

```text
mergeGem(gem, amount):
  if gem.level >= 6:
    return blocked

  newLevel = min(6, gem.level + amount)

  if player.gold < mergeCost(gem.level, amount):
    return blocked

  player.gold -= mergeCost(gem.level, amount)
  gem.level = newLevel
  recalculateGemStats(gem)
```

### 20.4 Combine algorithm

```text
combineTower(recipe, selectedIngredient):
  ingredients = findMatchingIngredients(recipe.requirements)

  if ingredients missing:
    return blocked

  outputPosition = selectedIngredient.position

  remove all ingredients
  create recipe.outputTowerId at outputPosition
  validatePath()
```

### 20.5 Attack phase algorithm

```text
startAttackPhase(wave):
  spawn enemies for wave

  while enemies remain and castleHealth > 0:
    move enemies
    towers acquire targets
    towers attack when cooldown ready
    apply effects
    handle leaks

  awardGold()
  awardMVP()
  startNextBuildPhase()
```

---

## 21. Balancing principles

### 21.1 Avoid pure stat inflation

Do not make later towers only “same tower but more damage.” Give towers different jobs.

Bad progression:

```text
tower does 10 damage
later tower does 100 damage
enemy has 10x health
```

Better progression:

```text
early tower: simple damage
mid tower: damage + slow
late tower: damage + slow + anti-evasion
special tower: solves flying or immunity waves
```

### 21.2 Make recipes meaningful

Recipes should push players into different branches.

Example:

- A player going Ruby/Bloodstone gets area damage.
- A player going Jade gets poison and anti-evasion.
- A player going Silver gets slow and boss control.
- A player going Malachite gets multi-target damage.

### 21.3 Keep randomness controlled

The game should feel random but not unfair.

Useful tools:

- reroll skill
- pray skill for gem type
- merge system
- downgrade system
- recipe preview
- highlight available combinations

### 21.4 Make placement matter

A tower’s value should depend on where it is placed.

Good locations:

- near corners
- near long path sections
- where it can hit multiple lanes
- near aura towers
- near slow towers

Bad locations:

- at short path segments
- far from the maze
- isolated from support auras
- unable to hit flying paths

---

## 22. UI requirements

### 22.1 Build UI

Must show:

- current build phase number
- 5 placed gems
- selected gem
- available recipes
- merge buttons
- downgrade button
- remove stone button
- path validity warning

### 22.2 Tower tooltip

Must show:

```text
Tower name
Type / tier
Damage
Range
Attack speed
Effects
MVP stacks
Recipe path
```

### 22.3 Recipe book

Must show:

- all discovered towers
- missing ingredients
- available ingredients
- possible upgrades
- final branch destination

### 22.4 Wave preview

Must show:

- next enemy
- ground or flying
- boss indicator
- enemy abilities
- recommended counters

Example:

```text
Wave 15
Enemy: Flying
Traits: Vitality
Recommended: anti-flying, high single-target damage
```

---

## 23. Asset integration

Use the asset folder IDs as stable game IDs.

Example tower asset path:

```text
assets/towers/base/ruby/sprite.png
assets/towers/named/silver/sprite.png
```

Example monster asset path:

```text
assets/monsters/baby-roshan/sprite.png
```

Recommended naming:

```text
sprite.png       main game sprite
icon.png         UI icon
portrait.png     tooltip or collection image
animation.json   frame metadata
metadata.json    gameplay + visual metadata
```

---

## 24. Open design questions

Decide these before implementation:

1. Are towers also blockers, or only stones?
2. Can players sell towers?
3. Can combinations use towers anywhere on the map, or only nearby?
4. Does merging cost gold, duplicate gems, or charges?
5. Do flying enemies follow a separate fixed path?
6. Are damage types physical/magical/pure?
7. Do tower auras affect the tower itself?
8. Can one tower receive unlimited MVP bonuses, or max 10?
9. Does a combined tower inherit MVP stacks?
10. Can a tower be moved after placement?

Recommended MVP answers:

| Question           | MVP answer                                        |
| ------------------ | ------------------------------------------------- |
| Towers block path? | Yes                                               |
| Sell towers?       | No                                                |
| Combine range?     | Global ingredients, output on selected ingredient |
| Merge cost?        | Gold                                              |
| Flying path?       | Fixed direct route                                |
| Damage types?      | Physical, magical, pure                           |
| Aura self-affect?  | No                                                |
| MVP max?           | 10                                                |
| Inherit MVP?       | No                                                |
| Move towers?       | Only through rare swap skill                      |

---

## 25. Summary

Gem TD works because every decision has multiple consequences.

- Picking a gem affects tower power.
- Rejecting gems creates the maze.
- Merging improves base pieces.
- Combining creates specialized named towers.
- Enemy waves force different counters.
- MVP bonuses make damage control important.
- Skills soften randomness without removing it.
