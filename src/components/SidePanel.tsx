import { gameConfig, getGem } from '../game/config';
import { findRecipeAt } from '../game/engine';
import type { GameController } from '../hooks/useGameController';
import type { GameSnapshot, SaveState } from '../game/types';
import { useSaveStore } from '../stores/saveStore';

interface SidePanelProps {
  controller: GameController;
  snapshot: GameSnapshot;
  save: SaveState;
}

export function SidePanel({ controller, snapshot, save }: SidePanelProps) {
  const resetSave = useSaveStore((state) => state.resetSave);
  const selected = snapshot.selectedTile;
  const recipe = selected ? findRecipeAt(controller.game.current, selected.x, selected.y) : null;

  return (
    <aside className="grid max-h-[calc(100vh-40px)] gap-3 overflow-y-auto lg:sticky lg:top-5">
      <section className="forge-panel rounded-md p-4">
        <h2 className="font-display text-2xl font-bold text-vellum">Gem Draft</h2>
        <div className="mt-3 grid gap-2">
          {snapshot.pendingGemId ? (
            <PendingGem gemId={snapshot.pendingGemId} placed={snapshot.draft.length} />
          ) : snapshot.draft.length === 0 ? (
            <div className="rounded border border-brass/20 bg-black/16 p-3 text-sm text-vellum/75">
              Each round opens with five random gem candidates. After the fifth placement, keep one;
              the rest become maze stones.
            </div>
          ) : (
            snapshot.draft.map((choice) => {
              const gem = getGem(gameConfig, choice.gemId);
              return (
                <button
                  key={choice.id}
                  className="flex items-center justify-between rounded border border-brass/25 bg-black/20 p-3 text-left transition hover:border-brass/60"
                  onClick={() =>
                    controller.dispatch({
                      type: 'keepDraftCandidate',
                      x: choice.x,
                      y: choice.y,
                    })
                  }
                >
                  <span>
                    <span className="block font-bold text-vellum">{gem.name}</span>
                    <span className="text-sm text-vellum/68">
                      Tile {choice.x + 1},{choice.y + 1} · {gem.damage} dmg · tier {gem.tier}
                    </span>
                  </span>
                  <span
                    className="h-8 w-8 rotate-45 border border-vellum/45"
                    style={{ background: gem.color }}
                  />
                </button>
              );
            })
          )}
        </div>
      </section>

      <section className="forge-panel rounded-md p-4">
        <h2 className="font-display text-2xl font-bold text-vellum">Selected Sigil</h2>
        {snapshot.selectedTower ? (
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-3">
              <span
                className="h-10 w-10 rotate-45 border border-vellum/45"
                style={{ background: snapshot.selectedTower.color }}
              />
              <div>
                <div className="font-bold text-vellum">{snapshot.selectedTower.name}</div>
                <div className="text-sm text-vellum/68">
                  {snapshot.selectedTower.damage} dmg · {snapshot.selectedTower.cooldown.toFixed(2)}
                  s · {snapshot.selectedTower.kills} kills
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="forge-button rounded px-3 py-2 font-bold"
                disabled={!recipe}
                onClick={() =>
                  selected &&
                  controller.dispatch({ type: 'combineAt', x: selected.x, y: selected.y })
                }
              >
                {recipe ? `Fuse ${recipe.name}` : 'No Recipe'}
              </button>
              <button
                className="rounded border border-ruby/35 bg-ruby/10 px-3 py-2 font-bold text-vellum"
                onClick={() =>
                  selected &&
                  controller.dispatch({ type: 'sellTower', x: selected.x, y: selected.y })
                }
              >
                Sell
              </button>
            </div>
            {recipe ? (
              <p className="text-sm text-brass">{recipe.description}</p>
            ) : (
              <p className="text-sm text-vellum/62">
                Fuse three matching adjacent gems, or discover special adjacent trios.
              </p>
            )}
          </div>
        ) : (
          <p className="mt-3 rounded border border-brass/20 bg-black/16 p-3 text-sm text-vellum/72">
            Select a placed gem to inspect range, sell it, or fuse adjacent recipes.
          </p>
        )}
      </section>

      <section className="forge-panel rounded-md p-4">
        <h2 className="font-display text-2xl font-bold text-vellum">Recipe Ledger</h2>
        <div className="mt-3 grid gap-2">
          {gameConfig.recipes.map((recipeItem) => {
            const known =
              snapshot.discoveredRecipes.includes(recipeItem.id) ||
              save.discoveredRecipes.includes(recipeItem.id) ||
              !recipeItem.hidden;
            const gem = getGem(gameConfig, recipeItem.resultGemId);
            return (
              <div key={recipeItem.id} className="rounded border border-brass/20 bg-black/16 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-vellum">
                      {known ? recipeItem.name : 'Undiscovered Formula'}
                    </div>
                    <div className="text-sm text-vellum/62">
                      {known
                        ? recipeItem.description
                        : 'A rare adjacent fusion waits in the workshop.'}
                    </div>
                  </div>
                  <span
                    className="h-7 w-7 rotate-45 border border-vellum/40"
                    style={{ background: known ? gem.color : '#4d473e' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="forge-panel rounded-md p-4">
        <h2 className="font-display text-2xl font-bold text-vellum">Progression</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <Stat label="Wins" value={save.wins} />
          <Stat label="Recipes" value={save.discoveredRecipes.length} />
          <Stat label="Families" value={snapshot.unlockedFamilies.length} />
          <Stat label="Score" value={snapshot.score} />
        </div>
        <button
          className="mt-3 w-full rounded border border-brass/25 bg-black/20 px-3 py-2 text-sm font-bold text-vellum"
          onClick={resetSave}
        >
          Clear Local Records
        </button>
      </section>
    </aside>
  );
}

function PendingGem({ gemId, placed }: { gemId: string; placed: number }) {
  const gem = getGem(gameConfig, gemId);
  return (
    <div className="rounded border border-brass/25 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-brass/80">
            Candidate {placed + 1} / 5
          </div>
          <div className="font-bold text-vellum">{gem.name}</div>
          <div className="text-sm text-vellum/68">
            {gem.damage} dmg · {gem.range.toFixed(1)} range · tier {gem.tier}
          </div>
        </div>
        <span
          className="h-9 w-9 rotate-45 border border-vellum/45"
          style={{ background: gem.color }}
        />
      </div>
      <p className="mt-3 text-sm text-vellum/70">
        Click a buildable board tile to place this candidate.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-brass/15 bg-black/16 px-3 py-2">
      <div className="text-xs uppercase tracking-[0.16em] text-brass/80">{label}</div>
      <div className="font-display text-xl font-bold text-vellum">{value}</div>
    </div>
  );
}
