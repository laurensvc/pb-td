# Project Facet — Core Game Design

Binding rules document for simulation, UI, and multiplayer. Overrides ambiguous notes elsewhere.  
**Companion:** [backlog.md](./backlog.md)

---

## 1. Match overview

- **Mode (v1):** Standard Race — 1–4 players, identical board layout, shared seed, shared prospect offers, independent boards and lives.
- **Length:** 24 waves (12-wave short mode optional).
- **Lives:** 20 per player. Zero lives = eliminated (spectator in multiplayer).
- **Win ranking:** highest wave → lives → boss time → enemies killed → efficient gold → fewest leaks.

---

## 2. Board

| Property | Value |
|----------|------:|
| Grid | 28 columns × 20 rows |
| Coordinates | Integer `(x, y)`, origin top-left |
| Spawn | Fixed cell; enemies enter here |
| Exit | Fixed cell; leaks count here |
| Terrain | `buildable`, `blocked` (permanent), `spawn`, `exit` |

**Layout file:** `packages/content/data/boards/default-28x20.json`

Players may not build on `spawn`, `exit`, or `blocked` cells.

---

## 3. Build phase FSM

Phases repeat until wave 24 completes or player is eliminated.

```text
BUILD → WAVE → RESOLUTION → BUILD …
```

### 3.1 Build phase steps (strict order)

1. **Place rocks** — up to **5 new rocks** this phase (free). Rocks placed in prior phases persist.
2. **Prospect** — reveal **5 gem offers** from shared seed. Player may **claim one** family+tier offer.
3. **Reroll** (optional) — pay escalating gold to reroll all 5 offers (see §8).
4. **Upgrade** — convert **exactly one** owned rock to the claimed gem (free). This is the **only** way to add a new tower this phase.
5. **Merge / sell / combine / targeting** — optional actions before ready.
6. **Ready** — player locks board; wave starts when all ready or build timer expires (default 30s).

### 3.2 Wave phase

- Maze frozen: no place/sell rocks or towers.
- Towers fire; enemies move.
- Targeting changes allowed.
- Speed vote (multiplayer): 1×/2×/3× when unanimous.

### 3.3 Resolution

- Award gold (and Crystal Dust from Phase 2).
- Apply leak damage to lives.
- Preview next wave.
- Eliminated players become spectators.

---

## 4. Placement rules

### 4.1 Rocks

- Occupy one `buildable` cell.
- Block **ground** enemies.
- Max **5 new placements** per build phase.
- **Sell** during build phase only → partial gold refund (50% of implicit rock value = **0 gold** refund in Phase 1; refund table in Phase 2 economy doc).
- Cannot place on spawn, exit, blocked, existing rock, or tower.

### 4.2 Towers (gems)

- Created only via **rock upgrade** (1/phase) or **combination** (consumes ingredients).
- Occupy one cell; block ground path like rocks.
- **Sell** during build phase → refund per tier table (Phase 1: 70% of ingredient value proxy).
- Cannot move during wave.

### 4.3 Path validity

Every placement (rock or tower) is validated **before** acceptance:

- Ground path from spawn → exit must exist.
- Pathfinding: **A\*** for validation; **BFS distance field** for movement.
- Neighbour expansion order: **up, right, down, left** (fixed for determinism).
- Server (or local sim) is authoritative; client may preview only.

---

## 5. Prospect and RNG

- Each build phase: 5 offers, each `{ family, tier }`.
- Standard Race: **identical offer pool** for all players (order may differ cosmetically).
- RNG: seeded PRNG; seed revealed at match start.
- Claim: take one offer into “pending upgrade” state.
- **No hidden rarity** — uniform tier weights per wave band (see wave data).

### Reroll costs (escalating, unlimited while gold lasts)

| Reroll # | Cost |
|---------:|-----:|
| 1 | 10 |
| 2 | 20 |
| 3 | 40 |
| 4 | 80 |
| 5+ | previous × 2 |

Reroll counter resets each build phase.

---

## 6. Merge rules

### Phase 1

- **2 identical** on-board towers (same family, same tier) → **1 tower** at **tier + 1**.
- Merge anytime in build phase.
- No merge during wave.

### Phase 2 additions

- **4 identical** → **1** at **tier + 2**.
- Merge undo allowed until next wave starts.

### Restrictions

- Tier 5 cannot merge further.
- Both inputs must be on the same player's board.
- Combination towers follow separate recipes (§7).

---

## 7. Combination towers

**Formula:** Tier II+ gem A + Tier II+ gem B + gold cost (+ Crystal Dust Phase 2) → special tower at **lower** input tier.

**Launch recipes (4):**

| ID | Name | Inputs | Gold |
|----|------|--------|-----:|
| magma-core | Magma Core | Flame T2+ + Stone T2+ | 120 |
| tempest-coil | Tempest Coil | Tide T2+ + Gale T2+ | 120 |
| wildfire-grove | Wildfire Grove | Flame T2+ + Thorn T2+ | 140 |
| prism-array | Prism Array | Radiant T2+ + Arcane T2+ | 140 |

Ingredients are consumed from the board. Result placed on a buildable empty cell adjacent to at least one ingredient cell (Phase 1 simplification: any empty buildable cell).

---

## 8. Economy

### Phase 1 resources

| Resource | Earned | Spent |
|----------|--------|-------|
| Gold | Kills, wave clear, boss | Rerolls, combinations |

Starting gold: **40**.

### Phase 2 additions

| Resource | Earned | Spent |
|----------|--------|-------|
| Crystal Dust | Bosses, milestones | High-tier combos, upgrades |

No compounding interest. No random gold jackpots.

---

## 9. Combat

### Damage model

- Internal: **integer milli-damage** (12.5 → 12500).
- Soft resistances: unfavourable element → **20–40%** reduction, never immunity.

### Tower stats (content-driven)

Each gem tier defines: damage, attacks/sec, range (tiles), targeting modes, damage tags, effects.

### Enemy stats

Health, armour, speed, resistances, bounty gold, leak life damage, special traits.

### Leak damage

| Archetype | Lives lost |
|-----------|----------:|
| Standard | 1 |
| Bulwark | 2 |
| Flyer | 1 |
| Siege Beast | 3 |
| Boss | 5 |

---

## 10. Enemy movement

### Ground

- Follow BFS distance field on walkable cells (not blocked, not tower/rock).
- Recalculate field only after build-phase placement changes.

### Flyers (Phase 2)

- **Straight line** from spawn to exit in screen space (ignores maze).
- Separate targeting layer for anti-air.

---

## 11. Waves

24 waves in four acts (see `packages/content/data/waves/standard-24.json`).

| Wave | Milestone |
|-----:|-----------|
| 3 | First swarm |
| 5 | First flyer |
| 6 | Mini-boss (The Burrower) |
| 9 | Heavy armour |
| 12 | Major boss (The Tempest) |
| 15 | Mixed resistances |
| 18 | Multi-lane pressure |
| 20 | Elite flyers |
| 24 | Final boss (The Final Colossus) |

---

## 12. Simulation

| Property | Value |
|----------|-------|
| Sim tick | 20 per second |
| State sync (MP) | 10 per second |
| Client render | Display refresh |
| Ordering | Stable entity iteration; versioned content pack |

---

## 13. Multiplayer commands

See `packages/protocol` for Zod schemas.

`PLACE_ROCK`, `SELL_ROCK`, `UPGRADE_ROCK`, `SELL_TOWER`, `CLAIM_OFFER`, `REROLL_OFFER`, `MERGE_TOWERS`, `CREATE_COMBINATION`, `SET_TARGETING`, `READY_FOR_WAVE`, `REQUEST_SPEED`, `VOTE_PAUSE`, `PING_TILE`

Envelope: `{ playerId, roomId, clientSequence, commandType, payload }`.

---

## 14. Auth and infra (locked)

| Concern | Choice |
|---------|--------|
| Auth | Firebase Google OAuth from Phase 1 |
| Web host | Firebase Hosting |
| Game server | Colyseus on Cloud Run or homelab |
| Match DB | **PostgreSQL** preferred for command logs + replay; Firestore acceptable for MVP metadata only |

---

## 15. Vertical slice (Phase 1 content lock)

- Board: `default-28x20`
- Families: **Flame, Stone, Thorn** only
- Combo: **Magma Core** only
- Waves: **6** (subset of act I)
- Boss: **The Burrower** on wave 6
- Ground enemies only

---

## 16. Open balance knobs (tunable in content JSON)

- Reroll base costs and multiplier
- Combination gold costs
- Starting gold / wave rewards
- Enemy HP/speed scalars per act
- Prospect tier weights per wave band

No open mechanics — all player actions are specified above.
