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
