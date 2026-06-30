# GemTD parity — agent loop

Repeat until the checklist is complete.

## Each iteration

1. **Pick next phase**
   ```bash
   pnpm gemtd:next-phase
   ```
   - If output is `ALL_DONE`, stop.
   - Otherwise note the phase number and title.

2. **Mark in progress**  
   In [`GEMTD-PARITY-CHECKLIST.md`](./GEMTD-PARITY-CHECKLIST.md), set that phase’s `**Status:**` to `in_progress`.

3. **Implement**  
   Complete every unchecked `- [ ]` under that phase. Prefer `apps/web/src/game/` + `App.tsx` + `CosmicBoardScene.ts`. Reuse patterns from `packages/sim/` when helpful.

4. **Verify**
   ```bash
   pnpm test
   pnpm lint
   pnpm build
   ```
   Playtest on `pnpm dev --filter @facet/web` if UI changed.

5. **Mark done**  
   Check all boxes `- [x]` and set `**Status:**` to `done`.

6. **Commit & push**
   ```bash
   git checkout -b cursor/gemtd-phase-N-97e9   # or continue existing branch
   git add -A
   git commit -m "GemTD parity phase N: <short title>"
   git push -u origin HEAD
   ```

7. **Open/update PR** with phase number in title.

8. **Go to step 1** (next agent turn or same session).

## Branch naming

`cursor/gemtd-phase-<n>-<slug>-97e9`

## Do not skip phases

Phases are ordered by dependency. Phase 4+ assumes 1–3 are `done`.

## Minimal “feels like GemTD” milestone

Phases **0–3 done** = 5 free rocks, prospect, one upgrade, ready, start wave.
