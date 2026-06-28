# Project Facet — UI Wireframes

ASCII wireframes for Phase 0 / PF-0.2. Desktop-first layout.  
**Companion:** [game-design.md](./game-design.md)

---

## Main game screen

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ W12  ⏱ 0:24   ♥ 18   🪙 142   [1×][2×][3×]   Ready: 2/4   [Firebase avatar] │
├────────────────────────────────────────────┬─────────────────────────────────┤
│                                            │  PROSPECT (5 offers)            │
│                                            │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ …  │
│                                            │  │Flm │ │Stn │ │Flm │ │Thr │    │
│         BOARD (Phaser canvas)              │  │ T2 │ │ T1 │ │ T1 │ │ T3 │    │
│         pan · zoom · placement ghost       │  └────┘ └────┘ └────┘ └────┘    │
│         path heatmap toggle                │  [Claim]  [Reroll 40g]           │
│                                            ├─────────────────────────────────┤
│                                            │  SELECTED TOWER                 │
│                                            │  Flame T3 · 24 dmg · 1.2/s      │
│                                            │  Range 3 · Burn · Merge → T4    │
│                                            ├─────────────────────────────────┤
│                                            │  NEXT WAVE                      │
│                                            │  12× Runner · 4× Bulwark        │
│                                            ├─────────────────────────────────┤
│                                            │  SCOREBOARD (Tab)               │
│                                            │  P1 ♥18 W12  P2 ♥14 W12         │
├────────────────────────────────────────────┴─────────────────────────────────┤
│ Rocks left: 3/5  │  [Merge] [Combine] [Sell]  │  Space=Ready  R=Reroll      │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Build phase step indicator

```text
[ 1 Rocks ] ──► [ 2 Prospect ] ──► [ 3 Upgrade ] ──► [ 4 Ready ]
     ●                  ○                  ○                 ○
```

Active step highlighted. Skipping rock placement allowed (0–5 rocks).

---

## Lobby (Phase 3)

```text
┌─────────────────────────────────────┐
│  PROJECT FACET — Room ABCD12        │
│  Invite: https://facet.example/r/…  │
├─────────────────────────────────────┤
│  Host (you)        ✓ Ready          │
│  Friend A          ○ Not ready      │
│  Friend B          ✓ Ready          │
├─────────────────────────────────────┤
│  Waves: [24 ▼]  Difficulty: Standard│
│  Build timer: 30s                   │
│  [ Copy link ]  [ Start when ready ]│
└─────────────────────────────────────┘
```

---

## Auth gate (Phase 1)

```text
┌─────────────────────────────────────┐
│         PROJECT FACET               │
│   Maze · Gems · Shared-seed races   │
│                                     │
│   [ Continue with Google ]          │
│                                     │
│   Desktop browser recommended       │
└─────────────────────────────────────┘
```

---

## Combination modal (C)

```text
┌─ Create combination ─────────────────┐
│ Magma Core — splash + armour shred   │
│ Needs: Flame T2+  Stone T2+  120g    │
│ [ Create ]  [ Cancel ]               │
└──────────────────────────────────────┘
```

---

## Visual direction notes

| Element | Direction |
|---------|-----------|
| Theme | Facet/crystal — prismatic accents, readable dark UI chrome |
| Board | Pixel art tiles 32×32; transparent unit sprites |
| Gems | Distinct silhouette + icon per family (not colour alone) |
| Typography | System UI stack; scalable 100–125% |
| Motion | Reduced-motion setting disables screen shake / flash |

---

## Accessibility checklist

- [ ] Colour-blind palette toggle
- [ ] Family icons on every gem/enemy tooltip
- [ ] Contrast ≥ 4.5:1 on tooltip text
- [ ] Keyboard: all hotkeys in [backlog.md](./backlog.md)
- [ ] Simplified combat FX toggle
