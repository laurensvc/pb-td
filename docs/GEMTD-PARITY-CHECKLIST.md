# GemTD parity checklist

Track progress toward real GemTD rules in `apps/web`. Cloud agents and humans use [`GEMTD-PHASE-LOOP.md`](./GEMTD-PHASE-LOOP.md) to pick the next item.

**Status values:** `pending` · `in_progress` · `done`

---

## Phase 0 — Scope lock

**Status:** `done`

- [x] Target: classic solo GemTD build loop (prospect → upgrade → merge), not shop-first TD
- [x] Gems block path (Facet-style dual blockers)
- [x] Keep missile + star meta until Phase 12 cleanup (optional removal)
- [x] Hex board + checkpoints stay

**Done when:** Rules documented here and in loop doc.

---

## Phase 1 — Build phase FSM

**Status:** `done`

- [x] `BuildStep`: `rocks | prospect | upgrade | ready`
- [x] Step order enforced in engine actions
- [x] `beginBuildPhase()` on new run and after each cleared wave
- [x] Start wave only from `ready`
- [x] Build-step UI stepper in `App.tsx`

**Done when:** UI shows current step; wave cannot start from wrong step.

---

## Phase 2 — Rock economy

**Status:** `done`

- [x] 5 free rocks per build phase (`ROCKS_PER_PHASE`)
- [x] Counter resets each build phase
- [x] `finishRocks` skips remaining rock slots → prospect
- [x] Rocks persist across waves
- [x] No gold cost for phase rocks (legacy paid rocks removed from placement)

**Done when:** Maze growth is “5 free rocks per wave,” not gold-limited.

---

## Phase 3 — Prospect & one upgrade

**Status:** `done`

- [x] 5 gem offers per build phase (seeded by run + wave)
- [x] Claim exactly one offer
- [x] Escalating reroll: 10 → 20 → 40 → 80…
- [x] One free rock → gem upgrade per phase
- [x] Shop buys disabled during build (buy gem / random / lucky box)

**Done when:** One new tower per wave via upgrade, not shop.

---

## Phase 4 — Hold slot & swap

**Status:** `done`

- [x] Single hold buffer gem (off board)
- [x] Swap hold ↔ board gem
- [x] Hold UI widget

**Done when:** Player can stage a gem in hold like classic GemTD.

---

## Phase 5 — Merge depth

**Status:** `done`

- [x] Merge only in build phase (audit all paths)
- [x] 4 identical → +2 levels
- [x] Merge undo before ready
- [x] Hybrid merge consumes adjacent ingredients

**Done when:** Merge rules match checklist in design doc.

---

## Phase 6 — Path & maze UX

**Status:** `done`

- [x] Checkpoint waypoints (S → 1 → 2 → F)
- [x] Path length delta preview when placing rock
- [x] Invalid rock toast when route breaks
- [ ] More maps / larger board (optional stretch)

**Done when:** Rock hover shows +N/−N path tiles.

---

## Phase 7 — Combat & targeting

**Status:** `done`

- [x] Targeting modes per gem (first/last/strong/weak)
- [x] Ground-only vs anti-air tags
- [x] Detection for invisible units
- [x] Hard immunities vs soft reduction

**Done when:** Gem roles differ by enemy type.

---

## Phase 8 — Waves & preview

**Status:** `done`

- [x] Next wave preview panel (types, counts, tags)
- [x] Current wave spawn tracker
- [x] Author wave tables per area (blend with procedural)

**Done when:** Player reads next wave before ready.

---

## Phase 9 — Economy tuning

**Status:** `done`

- [x] Interest formula vs classic
- [x] Gold sinks = rerolls + combos (not shop power)
- [x] Crystal Dust (optional)

**Done when:** Gold mainly pays rerolls, not direct power.

---

## Phase 10 — UI polish

**Status:** `done`

- [x] Offer cards with gem art
- [x] Recipe book with icons
- [x] Gem stat tooltips
- [x] Great-gem unlock list
- [x] Merge partner highlights
- [x] Hotkeys + speed controls

**Done when:** New player learns loop without external docs.

---

## Phase 11 — Content expansion

**Status:** `done`

- [x] 6th base gem family
- [x] Full hybrid recipe set
- [x] More areas / checkpoint layouts
- [x] Quest board vs great unlocks

**Done when:** 3+ maps feel routing-different.

---

## Phase 12 — Simulation & cleanup

**Status:** `done`

- [x] Seeded RNG for offers/combat
- [x] Remove or gate missile strike
- [x] Remove or gate persistent combat meta (optional)
- [x] Extract sim tests for build FSM
- [x] Replay / seed display

**Done when:** Same seed → same offers and outcomes.

---

## Phase 13 — Multiplayer (Facet)

**Status:** `in_progress`

- [x] Shared offer seed
- [ ] Colyseus rooms + Firebase auth
- [ ] Standard Race ranking
- [ ] Replays & match history

**Done when:** 2–4 player race without desync.
