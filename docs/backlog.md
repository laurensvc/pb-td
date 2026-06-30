# Gem TD Development Backlog (`pb-td`)

Authoritative engineering backlog for the Gem TD vertical slice and beyond. Gameplay specs live in sibling docs; this file tracks **implementation status**.

**Conventions:** `P0` slice-critical · `P1` next-up · `P2` later · `P3` nice-to-have · `S1` v1 slice · `S2` slice 2 · `S3` slice 3 · `MP` multiplayer · `OPS` cross-cutting

**Status:** `done` · `partial` · `pending`

---

## Progress summary (S1)

| Epic | Done | Partial | Pending | Next up |
| --- | ---: | ---: | ---: | --- |
| FND Foundation | 5 | 0 | 0 | — |
| CNT Content | 8 | 0 | 0 | — |
| SIM Simulation | 4 | 0 | 1 | SIM-005 replay |
| BRD Board/path | 6 | 0 | 2 | — |
| BLD Build loop | 5 | 0 | 2 | — |
| CMB Combat | 5 | 2 | 2 | **CMB-006 kill milestones** |
| MON Monsters | 5 | 0 | 6 | — |
| ECO Economy | 2 | 0 | 1 | — |
| BRG Bridge | 2 | 1 | 0 | BRG-003 diffing |
| PHA Phaser | 5 | 1 | 2 | **PHA-007 debug overlays** |
| ART Assets | 2 | 0 | 5 | — |
| UI React | 4 | 0 | 5 | — |
| QA Testing | 3 | 1 | 2 | QA-005 CI |

**S1 slice:** ~52 / ~58 P0–P1 tickets done or partial. **Current focus:** complete remaining S1 partials, then SIM-005 / PHA-007.

---

## EP-00 Foundation & Tooling (FND)

| ID | Title | Pri | Status | Notes |
| --- | --- | --- | --- | --- |
| FND-001 | pnpm workspace + package skeletons | P0 | done | `@facet/protocol`, `content`, `sim`, `web` |
| FND-002 | Vite + React + Phaser boot | P0 | done | Dynamic Phaser import, pixelArt |
| FND-003 | ESLint + Prettier + sim boundary | P0 | done | `no-restricted-imports` in sim |
| FND-004 | Seeded RNG (`SeededRng`) | P0 | done | mulberry32, tests |
| FND-005 | Tick/time abstraction | P0 | done | `SIM_HZ=30`, fixed-step in `GameBridge` |

---

## EP-01 Content & Schemas (CNT)

| ID | Title | Pri | Status | Notes |
| --- | --- | --- | --- | --- |
| CNT-001 | Zod schemas + `validateContent()` | P0 | done | 14 content tests |
| CNT-002 | Board `crownfall-grass` + routes | P0 | done | simple + full legs |
| CNT-003 | Gem base stats + 24 defs (chipped–normal) | P0 | done | |
| CNT-004 | v1 specials + 3 recipes | P0 | done | silver, malachite, quartz |
| CNT-005 | Gem probability L1–3 | P0 | done | |
| CNT-006 | Armor/damage matrix | P0 | done | |
| CNT-007 | 5 enemy archetypes | P0 | done | |
| CNT-008 | Waves 1–10 | P0 | done | flying w5, boss w10 |
| CNT-009 | Qualities flawless–great + prob L4–8 | P1 | pending | S2 |
| CNT-010 | Full recipe + upgrade catalog | P1 | pending | S2/S3 |
| CNT-011 | Slate definitions | P1 | pending | S2 |
| CNT-012 | Ability definitions catalog | P1 | pending | S2 |
| CNT-013 | Waves 11–50 + repeat scaling | P1 | pending | S2/S3 |

---

## EP-02 Simulation Core (SIM)

| ID | Title | Pri | Status | Notes |
| --- | --- | --- | --- | --- |
| SIM-001 | Run state + phase machine | P0 | done | `RoundController` |
| SIM-002 | Entity model | P0 | done | candidate/tower/rock/creep |
| SIM-003 | Tick pipeline + events | P0 | done | `CombatSession` |
| SIM-004 | Command validation | P0 | done | reject w/ reason |
| SIM-005 | Deterministic replay harness | P1 | pending | golden state hash |

---

## EP-03 Board & Pathfinding (BRD)

| ID | Title | Pri | Status | Notes |
| --- | --- | --- | --- | --- |
| BRD-001 | Grid + footprint helpers | P0 | done | |
| BRD-002 | Sync A* (4-dir) | P0 | done | |
| BRD-003 | Path cache + versioning | P0 | done | |
| BRD-004 | Anti-block validation | P0 | done | |
| BRD-005 | Flying route spline | P0 | done | |
| BRD-006 | Path progress metric | P0 | done | targeting + leaks |
| BRD-007 | Border-exploit zones | P1 | pending | S2 |
| BRD-008 | Multi-board / N-waypoint | P2 | pending | S2 |

---

## EP-04 Build Loop (BLD)

| ID | Title | Pri | Status | Notes |
| --- | --- | --- | --- | --- |
| BLD-001 | Placement charges + candidates | P0 | done | |
| BLD-002 | Gem roller | P0 | done | |
| BLD-003 | Selection action computation | P0 | done | |
| BLD-004 | Resolution + rock conversion | P0 | done | |
| BLD-005 | One-hit special detection | P0 | done | |
| BLD-006 | Persistent recipe tracker | P1 | pending | S2 |
| BLD-007 | Special upgrade chains | P2 | pending | S3 |

---

## EP-05 Combat (CMB)

| ID | Title | Pri | Status | Notes |
| --- | --- | --- | --- | --- |
| CMB-001 | Stat resolution | P0 | done | |
| CMB-002 | Target acquisition + modes | P0 | done | hold fire |
| CMB-003 | Attack cadence + projectiles | P0 | done | sim-owned hits |
| CMB-004 | Damage resolver | P0 | done | armor/MR/evasion |
| CMB-005 | On-hit effects (v1 set) | P0 | done | pierce/slow/poison/cleave/split/aura |
| CMB-006 | Kill credit + kill milestones | P0 | **partial** | kill count yes; milestone bonuses no |
| CMB-007 | MVP system | P1 | **partial** | stacks + damage; full aura debuff TBD |
| CMB-008 | Aura stacking resolver | P1 | pending | S2 |
| CMB-009 | Advanced abilities | P2 | pending | S2/S3 |

---

## EP-06 Monsters (MON)

| ID | Title | Pri | Status | Notes |
| --- | --- | --- | --- | --- |
| MON-001 | Ground creep movement | P0 | done | |
| MON-002 | Flying movement | P0 | done | |
| MON-003 | Wave spawner | P0 | done | |
| MON-004 | Leak + life rules | P0 | done | lethal L10+ |
| MON-005 | Poison + slow status | P0 | done | |
| MON-006 | Wave scaling + cadence | P1 | pending | S2 |
| MON-007 | Split-on-death | P1 | pending | S2 |
| MON-008 | Advanced defenses | P1 | pending | S2 |
| MON-009 | Movement abilities | P2 | pending | S3 |
| MON-010 | Invisibility + reveal | P2 | pending | S3 |
| MON-011 | Alternative wave opponents | P2 | pending | S3 |

---

## EP-07 Economy (ECO)

| ID | Title | Pri | Status | Notes |
| --- | --- | --- | --- | --- |
| ECO-001 | Gold + reward formula | P0 | done | |
| ECO-002 | Gem probability upgrade | P0 | done | |
| ECO-003 | Probability levels 4–8 | P1 | pending | S2 |

---

## EP-08 Slates & Extra Chance (SLT)

| ID | Title | Pri | Status |
| --- | --- | --- | --- |
| SLT-001 | Basic slate detection | P1 | pending |
| SLT-002 | Advanced slates | P2 | pending |
| SLT-003 | Extra Chance system | P2 | pending |

---

## EP-09 Presentation: Phaser (PHA)

| ID | Title | Pri | Status | Notes |
| --- | --- | --- | --- | --- |
| PHA-001 | Scene structure | P0 | done | Preload + BoardScene |
| PHA-002 | Terrain + landmarks | P0 | done | placeholder art |
| PHA-003 | Structures/units/FX layers | P0 | done | basic pooling |
| PHA-004 | Camera controller | P0 | **done** | pan, zoom 0.5–2, Home/End/C, space-drag, `focusLandmark` |
| PHA-005 | Build overlay | P0 | done | phase-gated grid |
| PHA-006 | Animation controller | P1 | partial | hit FX; no sprite sheets yet |
| PHA-007 | Debug overlays (`?debugPaths=1`) | P1 | **pending** | **next P1** |
| PHA-008 | Minimap | P2 | pending | S2 |

### PHA-004 acceptance (completed 2026-06-30)

- Middle-mouse + WASD/arrow pan
- Space + left-drag pan (placement clicks blocked while Space held)
- Mouse wheel zoom toward cursor (0.5–2.0)
- `+`/`-`/PageUp/PageDown` zoom
- `Home` → spawn, `End` → goal, `C` → checkpoint-1
- `camera.focusLandmark` command → `GameBridge.onCameraFocus` → `CameraController`

---

## EP-10 UI: React (UI)

| ID | Title | Pri | Status | Notes |
| --- | --- | --- | --- | --- |
| UI-001 | HUD | P0 | done | |
| UI-002 | Build controls | P0 | done | |
| UI-003 | Probability + targeting controls | P0 | done | |
| UI-004 | Wave preview | P0 | done | |
| UI-005 | Recipe dictionary | P1 | done | |
| UI-006 | Main menu / pause / settings | P1 | pending | |
| UI-007 | Extra Chance UI | P2 | pending | |
| UI-008 | Tower inspector | P2 | pending | |
| UI-009 | Range-ring toggle | P3 | pending | |

---

## EP-11 Bridge & Protocol (BRG)

| ID | Title | Pri | Status | Notes |
| --- | --- | --- | --- | --- |
| BRG-001 | Protocol types | P0 | done | |
| BRG-002 | Typed bridge + lifecycle | P0 | done | + `onCameraFocus` |
| BRG-003 | Snapshot selectors + diffing | P1 | partial | `selectHudState` only |

---

## EP-12 Art & Assets (ART)

| ID | Title | Pri | Status | Notes |
| --- | --- | --- | --- | --- |
| ART-001 | Asset manifest contract | P0 | done | |
| ART-002 | Placeholder generator | P0 | done | |
| ART-003 | PixelLab environment | P1 | pending | |
| ART-004 | PixelLab monsters | P1 | pending | |
| ART-005 | PixelLab towers | P1 | pending | |
| ART-006 | PixelLab projectiles/FX | P1 | pending | |
| ART-007 | Asset tracker automation | P2 | pending | |

---

## EP-13–22 (S2+ / MP / OPS)

Deferred epics: **AUD** Audio, **PER** Persistence/replay, **MP** Multiplayer, **RNK** Ranking, **ADM** Admin tools, **PRF** Performance, **QA** CI (QA-005 pending), **AX** Accessibility, **OPS** Deploy, **GM** Tutorial/modes.

See ticket IDs in the [v1 plan backlog](.cursor/plans/gemtd_v1_vertical_slice_ae83cc0f.plan.md) (Development Backlog section) for full descriptions.

---

## Suggested execution order (remaining S1)

1. **CMB-006** — kill milestone bonuses at thresholds + transfer on combine
2. **PHA-007** — debug path/range overlays behind `?debugPaths=1`
3. **SIM-005** — replay harness + golden hash in CI
4. **QA-005** — GitHub Actions lint/test/build
5. **CMB-007** — complete MVP aura debuff behavior

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-06-30 | Initial `docs/backlog.md` from implementation audit. PHA-004 completed (camera jumps, space-drag, focusLandmark). |
