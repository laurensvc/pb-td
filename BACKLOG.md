# PB TD Gameplay Backlog

This backlog tracks the remaining work needed to make the implementation fully match
`gameplay_info.md`. The current game is a playable local v1; several systems are still
simplified, partially wired, or missing exact rule behavior.

## Recently completed

The following were implemented in code (engine, pathfinding, UI shell, tests) and can be
treated as done for backlog planning:

- **P0 — Repeat mode:** After wave 50 the run continues with repeat waves; extra enemy
  skills rotate from a fixed pool (`REPEAT_WAVE_SKILLS` in `engine.ts`).
- **P0 — MVP:** Nearby magic vulnerability (+10% magic damage taken, i.e. −10% MR
  effect), aura range ≈2 tiles, combined tower/gem aura bonus capped at +75%, +10%
  damage per MVP award capped at 10 awards.
- **P0 — Aura stacking:** Different Opal speed aura levels stack; identical levels do
  not. Same idea for Sapphire slow (see `engine.test.ts`).
- **P0 — Manual targeting:** Select a tower, click an enemy to lock target, clear
  target from the side panel; `stopped` still gates firing for MVP control.
- **P0 — One-build-phase recipes:** Full draft grid required, no mixing draft with
  settled towers for that path; instant combine onto the chosen tile; non-recipe draft
  gems become stones when the recipe consumes the draft (`combineAt` in `engine.ts`).
- **Tests:** MVP/aura/stacking/repeat/one-build-phase coverage in `engine.test.ts`;
  pathfinding tests; sprite metadata bounds/sync tests in `spriteMetadata.test.ts`.
- **P3 — Base tower art:** Tier portraits for all eight base gem families are implemented
  (authoring under `public/assets/towers/base/{family}/`, in-game via `public/assets/sprites/gems.png`
  and `spriteMetadata`).

## P0 Gameplay Correctness

- [x] Implement post-wave-50 repeat mode with varying enemy skills instead of ending immediately at wave 50.
- [x] Fix MVP system:
  - [x] Add nearby enemy magic resistance `-10%`.
  - [x] Change MVP aura range to about 2 tiles.
  - [x] Cap nearby tower/gem aura effect at `+75%`.
  - [x] Verify MVP damage bonus stays `+10%` per award, max 10.
- [x] Implement aura stacking rules:
  - [x] Different Opal aura levels stack.
  - [x] Identical Opal aura levels do not stack.
  - [x] Apply equivalent non-stacking behavior to Sapphire slow aura/effects where relevant.
- [x] Add real manual targeting UI:
  - [x] Select tower.
  - [x] Select enemy target.
  - [x] Clear target.
  - [x] Preserve stop/fire behavior for MVP control.
- [x] Make one-build-phase tower creation exact:
  - [x] Detect when all required gems/towers are from the current build phase.
  - [x] Allow instant tower creation onto the desired gem.
  - [x] Convert unused placed gems to stones correctly.

## P1 Tower And Combat Effects

- [ ] Fully implement tower `crit` effects, not only temporary Crit skill.
- [ ] Implement magic resistance aura/resist behavior from Deepsea Pearl, Red Coral, etc.
- [ ] Implement `decadent` behavior for Tourmaline line.
- [ ] Implement `Otomad` for Ehome/Carmen-Lucia.
- [ ] Implement `Stone Gaze` for Emerald Golem.
- [ ] Implement `Melancholy` for Fantastic Miss Shrimp.
- [ ] Implement Wings Stone random damage on build.
- [ ] Improve `radiation` so Uranium-235 behaves like damage to up to 10 targets over time.
- [ ] Tune top/secret tower damage and effects closer to the spec roles.
- [ ] Add explicit physical/magic/pure balance display in UI.

## P1 Enemy Skills

- [ ] Implement `disarm` so affected waves can disable or interrupt tower attacks.
- [ ] Expand `cloakAndDagger` beyond simple invisibility if desired.
- [ ] Improve `refraction` to match intended shield/hit absorption behavior.
- [ ] Improve `reactiveArmor` behavior and visual feedback.
- [ ] Improve `krakenShell` behavior and visual feedback.
- [ ] Add status icons/tooltips for every enemy skill in wave and enemy UI.
- [ ] Validate waves 31, 35, 36, and 38 where the spec allows alternate skill variants.

## P1 Skills System

- [ ] Add character skill attachment/slots instead of global owned skills only.
- [ ] Add Gem Pray UI to choose the desired gem type.
- [ ] Add Gem Quality Pray UI to choose desired quality.
- [ ] Add real gem quality categories such as chipped/flawed/normal/flawless/perfect, or equivalent.
- [ ] Make Flawless Pray and Perfect Pray affect those exact quality categories.
- [ ] Implement Swap skill UI with two tower selections.
- [ ] Implement Candy Maker as candy/enemy attachment, not just placing a blocking stone.
- [ ] Add active skill cooldown/availability feedback.
- [ ] Show gold and shell costs before buying/upgrading/using skills.

## P2 Ranks And Shell Economy

- [ ] Add Solo/Co-op rank name table from ranks 1-25.
- [ ] Add Race rank name table from ranks 1-25.
- [ ] Show combined season rank derived from Solo/Co-op plus Race.
- [ ] Add monthly reset simulation.
- [ ] Add end-of-month reward claim timing instead of always-available local claim.
- [ ] Add local purchase-shells placeholder/link behavior with clear non-real-money labeling.

## P2 Quests

- [ ] Add missing random quests:
  - [ ] Complete within 50 minutes.
  - [ ] Complete without any Asteriated Ruby.
  - [ ] Complete without any Silver.
  - [ ] Complete all levels in Bush Challenge.
- [ ] Add fixed quest:
  - [ ] First purchase in ebay / Juggernout reward as local placeholder.
- [ ] Implement quest cooldowns.
- [ ] Implement random quest rotation/selection.
- [ ] Track without-X settled/built accurately for Amethyst, Malachite, Silver, and Asteriated Ruby.
- [ ] Implement Finish 4 Random Quests reward as extra slot/tool, not just shells.
- [ ] Implement Secret Tower reward for single-round-only quest.

## P2 Data And Balance

- [ ] Audit all gem values against the tables in `gameplay_info.md`:
  - [ ] Diamond D4/D5 currently include aura-like bonus in base damage.
  - [ ] Aquamarine/Opal attack speed values are approximated.
  - [ ] Ranges are converted from 500/600 to tile units and need a documented scale.
- [ ] Audit all wave HP/speed/reward scaling for playability.
- [ ] Add tests for every enemy skill behavior.
- [ ] Add tests for every tower effect category.
- [x] Add tests for aura stacking and MVP caps.
- [ ] Add tests for quest completion conditions.

## P3 UI / UX Polish

- [ ] Add enemy selection and target indicators on canvas.
- [ ] Add tower effect list in selected tower panel.
- [ ] Add recipe ingredient display instead of only descriptions.
- [ ] Add build-phase one-round recipe suggestions.
- [ ] Add wave timeline or next-wave queue.
- [ ] Add quest progress bars/counters.
- [ ] Add rank names and reward status.
- [ ] Add clearer indicators for flying, invisible, immune, boss, rush, thief, etc.
- [ ] Add settings/help panel explaining PB TD-specific mechanics.
- [ ] Add responsive pass for the denser arcade panels on narrow screens.

## P3 Visual Assets

- [ ] Expand sprite metadata/generator for all new enemies.
- [x] Add unique or generated sprites for all base gem levels.
- [ ] Add unique or generated sprites for recipe/secret towers.
- [ ] Add visual effects for poison, burn, slow, stun, lightning, radiation, and MVP aura.
- [ ] Add castle/checkpoint visual polish.

## P3 Persistence / Saves

- [ ] Persist more run history:
  - [ ] Best clear time.
  - [ ] Highest MVP tower.
  - [ ] Completed quest timestamps.
  - [ ] Season/month marker.
- [ ] Add save migration tests.
- [ ] Add reset run vs clear progression confirmation UI.
- [ ] Preserve settings during `resetRun`; current helper uses default settings internally.

## Recommended Next Milestone

Focus shifts to **P1** depth and **P2** data fidelity now that P0 correctness above is in place:

- [ ] Swap skill UI and richer skills economy (P1).
- [ ] `disarm` and other enemy skill combat hooks (P1).
- [ ] Gem/wave audits and documented tile/range scale (P2).
- [ ] Canvas target indicators and tower effect readout (P3).
