import { useState } from 'react';
import type React from 'react';
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

type Tab = 'build' | 'recipes' | 'quests';

export function SidePanel({ controller, snapshot, save }: SidePanelProps) {
  const [tab, setTab] = useState<Tab>('build');
  const resetSave = useSaveStore((state) => state.resetSave);
  const selected = snapshot.selectedTile;
  const recipe = selected ? findRecipeAt(controller.game.current, selected.x, selected.y) : null;

  return (
    <aside className="grid max-h-[calc(100vh-40px)] gap-3 overflow-y-auto lg:sticky lg:top-5">
      <section className="arcade-panel rounded-md p-3">
        <div className="grid grid-cols-3 gap-1">
          {(['build', 'recipes', 'quests'] as const).map((item) => (
            <button
              key={item}
              className={`px-2 py-2 text-xs font-black uppercase ${
                tab === item ? 'bg-arcade-yellow text-black' : 'bg-black/35 text-white'
              }`}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {tab === 'build' ? (
        <>
          <section className="arcade-panel rounded-md p-4">
            <h2 className="font-display text-2xl font-black text-white">Build Actions</h2>
            <div className="mt-3 grid gap-2">
              {snapshot.pendingGemId ? (
                <PendingGem gemId={snapshot.pendingGemId} placed={snapshot.draft.length} />
              ) : snapshot.draft.length === 0 ? (
                <Info text="Place five candidates, keep one gem, and turn the rest into maze stones." />
              ) : (
                <div
                  className="grid gap-2"
                  onPointerLeave={() => controller.dispatch({ type: 'clearDraftRowHover' })}
                >
                  <p className="text-xs font-bold leading-snug text-arcade-yellow/90">
                    Choose one gem to keep — click a row here or the gem on the board.
                  </p>
                  {snapshot.draft.map((choice) => {
                    const gem = getGem(gameConfig, choice.gemId);
                    const panelHighlightsThis =
                      snapshot.draftRowHover?.x === choice.x &&
                      snapshot.draftRowHover?.y === choice.y;
                    const boardSelectsThis = selected?.x === choice.x && selected?.y === choice.y;
                    const rowActive = panelHighlightsThis || boardSelectsThis;
                    return (
                      <button
                        key={choice.id}
                        type="button"
                        className={`arcade-row text-left transition-colors ${
                          rowActive
                            ? 'bg-arcade-yellow/10 ring-2 ring-arcade-yellow ring-offset-2 ring-offset-[#0f1018]'
                            : ''
                        }`}
                        onPointerEnter={() =>
                          controller.dispatch({ type: 'hoverDraftRow', x: choice.x, y: choice.y })
                        }
                        onClick={() =>
                          controller.dispatch({
                            type: 'keepDraftCandidate',
                            x: choice.x,
                            y: choice.y,
                          })
                        }
                        aria-label={`Keep ${gem.name} at cell ${choice.x + 1},${choice.y + 1} — the rest become maze stones.`}
                      >
                        <span>
                          <span className="block font-black text-white">{gem.name}</span>
                          <span className="text-sm text-white/65">
                            {choice.x + 1},{choice.y + 1} · {gem.damage} dmg · L{gem.tier} ·{' '}
                            <span className="text-arcade-yellow/90">Click to keep</span>
                          </span>
                        </span>
                        <GemChip color={gem.color} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <ActionButton
                disabled={!selected || !recipe}
                onClick={() =>
                  selected &&
                  controller.dispatch({ type: 'combineAt', x: selected.x, y: selected.y })
                }
              >
                {recipe ? `COMBINE ${recipe.name}` : 'COMBINE'}
              </ActionButton>
              <ActionButton
                disabled={!selected || !snapshot.canRemoveStone}
                onClick={() =>
                  selected &&
                  controller.dispatch({ type: 'removeStone', x: selected.x, y: selected.y })
                }
              >
                REMOVE STONE (0g)
              </ActionButton>
              <ActionButton
                disabled={!selected || !snapshot.canMerge}
                onClick={() =>
                  selected &&
                  controller.dispatch({ type: 'mergeAt', x: selected.x, y: selected.y, levels: 1 })
                }
              >
                MERGE ^
              </ActionButton>
              <ActionButton
                disabled={!selected || !snapshot.canMergePlus}
                onClick={() =>
                  selected &&
                  controller.dispatch({ type: 'mergeAt', x: selected.x, y: selected.y, levels: 2 })
                }
              >
                MERGE ^^
              </ActionButton>
              <ActionButton
                disabled={!selected || !snapshot.canDowngrade}
                onClick={() =>
                  selected &&
                  controller.dispatch({ type: 'downgradeAt', x: selected.x, y: selected.y })
                }
              >
                DOWNGRADE 200G
              </ActionButton>
              <ActionButton
                disabled={!selected || !snapshot.selectedTower}
                onClick={() =>
                  selected &&
                  controller.dispatch({ type: 'toggleTowerStop', x: selected.x, y: selected.y })
                }
              >
                STOP / FIRE
              </ActionButton>
              <ActionButton
                disabled={!selected || !snapshot.selectedTower || !snapshot.selectedTower.targetId}
                onClick={() =>
                  selected &&
                  controller.dispatch({
                    type: 'setTowerTarget',
                    x: selected.x,
                    y: selected.y,
                    targetId: null,
                  })
                }
              >
                CLEAR TARGET
              </ActionButton>
            </div>
          </section>

          <section className="arcade-panel rounded-md p-4">
            <h2 className="font-display text-2xl font-black text-white">Selected</h2>
            {snapshot.selectedTower ? (
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-3">
                  <GemChip color={snapshot.selectedTower.color} large />
                  <div>
                    <div className="font-black text-white">{snapshot.selectedTower.name}</div>
                    <div className="text-sm text-white/65">
                      {snapshot.selectedTower.damage} dmg ·{' '}
                      {snapshot.selectedTower.cooldown.toFixed(2)}s · MVP{' '}
                      {snapshot.selectedTower.mvpAwards}/10
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Stat label="Class" value={snapshot.selectedTower.classification} />
                  <Stat label="Kills" value={snapshot.selectedTower.kills} />
                  <Stat label="Round" value={Math.round(snapshot.selectedTower.roundDamage)} />
                  <Stat label="Total" value={Math.round(snapshot.selectedTower.totalDamage)} />
                  <Stat label="Target" value={snapshot.selectedTowerTarget?.name ?? 'auto'} />
                </div>
              </div>
            ) : snapshot.canRemoveStone && selected ? (
              <div className="mt-3 space-y-2">
                <p className="font-black text-white">Maze stone</p>
                <p className="text-sm text-white/70">
                  Destroys this stone to open the tile. Refund: 0 gold. Use &quot;REMOVE STONE&quot;
                  above.
                </p>
              </div>
            ) : (
              <Info text="Select a gem, tower, draft candidate, or stone on the board." />
            )}
          </section>

          <WavePanel snapshot={snapshot} />
        </>
      ) : null}

      {tab === 'recipes' ? <RecipesPanel snapshot={snapshot} /> : null}
      {tab === 'quests' ? (
        <QuestsPanel
          snapshot={snapshot}
          save={save}
          onClaim={() => controller.dispatch({ type: 'claimSeasonReward' })}
          onClear={resetSave}
        />
      ) : null}
    </aside>
  );
}

function WavePanel({ snapshot }: { snapshot: GameSnapshot }) {
  const wave = snapshot.currentWave;
  return (
    <section className="arcade-panel rounded-md p-4">
      <h2 className="font-display text-2xl font-black text-white">Wave Intel</h2>
      {wave ? (
        <div className="mt-3 grid gap-2 text-sm">
          <Stat label="Now" value={`${wave.wave}. ${wave.name}`} />
          <Stat label="Run Wave" value={snapshot.wave} />
          <Stat label="Enemy" value={wave.enemyId} />
          <Stat
            label="Skills"
            value={
              snapshot.currentWaveSkills.length ? snapshot.currentWaveSkills.join(', ') : 'none'
            }
          />
          {snapshot.nextWave ? <Stat label="Next" value={snapshot.nextWave.name} /> : null}
          {snapshot.requiredWavesCleared ? <Stat label="Mode" value="repeat" /> : null}
        </div>
      ) : (
        <Info text="No further waves." />
      )}
    </section>
  );
}

function RecipesPanel({ snapshot }: { snapshot: GameSnapshot }) {
  return (
    <section className="arcade-panel rounded-md p-4">
      <h2 className="font-display text-2xl font-black text-white">Recipe Tree</h2>
      <div className="mt-3 grid gap-2">
        {gameConfig.recipes.map((recipe) => {
          const known =
            snapshot.discoveredRecipes.includes(recipe.id) ||
            !recipe.hidden ||
            snapshot.unlockedSecrets.includes(recipe.id);
          const gem = getGem(gameConfig, recipe.resultGemId);
          return (
            <div key={recipe.id} className="arcade-row">
              <div>
                <div className="font-black text-white">
                  {known ? recipe.name : 'SECRET FORMULA'}
                </div>
                <div className="text-sm text-white/62">
                  {known ? recipe.description : `${recipe.ingredients.length} hidden pieces`}
                </div>
              </div>
              <GemChip color={known ? gem.color : '#334155'} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function QuestsPanel({
  snapshot,
  save,
  onClaim,
  onClear,
}: {
  snapshot: GameSnapshot;
  save: SaveState;
  onClaim: () => void;
  onClear: () => void;
}) {
  const rank = gameConfig.ranks.find((item) => item.id === snapshot.rank.seasonRankId);
  return (
    <>
      <section className="arcade-panel rounded-md p-4">
        <h2 className="font-display text-2xl font-black text-white">Rank</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <Stat label="Season" value={rank?.name ?? snapshot.rank.seasonRankId} />
          <Stat label="Bracket" value={rank?.percentage ?? '—'} />
          <Stat label="Solo" value={snapshot.rank.soloRank} />
          <Stat label="Race" value={snapshot.rank.raceRank} />
        </div>
        <button
          className="arcade-button mt-3 w-full px-3 py-2 font-black"
          disabled={snapshot.rank.claimedSeasonReward}
          onClick={onClaim}
        >
          CLAIM LOCAL SEASON
        </button>
      </section>
      <section className="arcade-panel rounded-md p-4">
        <h2 className="font-display text-2xl font-black text-white">Quests</h2>
        <div className="mt-3 grid gap-2">
          {gameConfig.quests.map((quest) => {
            const progress = snapshot.quests.find((item) => item.id === quest.id);
            return (
              <div key={quest.id} className="arcade-row">
                <div>
                  <div className="font-black text-white">{quest.name}</div>
                </div>
                <span className={progress?.completed ? 'text-arcade-green' : 'text-white/40'}>
                  {progress?.completed ? 'DONE' : 'OPEN'}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3">
          <Stat label="Wins" value={save.wins} />
        </div>
        <button className="arcade-button-danger mt-3 w-full px-3 py-2 font-bold" onClick={onClear}>
          CLEAR LOCAL PROGRESSION
        </button>
      </section>
    </>
  );
}

function PendingGem({ gemId, placed }: { gemId: string; placed: number }) {
  const gem = getGem(gameConfig, gemId);
  return (
    <div className="border-2 border-arcade-yellow bg-black/30 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-arcade-yellow">
            Candidate {placed + 1} / 5
          </div>
          <div className="font-black text-white">{gem.name}</div>
          <div className="text-sm text-white/68">
            {gem.damage} dmg · {gem.range.toFixed(1)} range · L{gem.tier}
          </div>
        </div>
        <GemChip color={gem.color} large />
      </div>
    </div>
  );
}

function ActionButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="arcade-button-secondary px-3 py-2 text-sm font-black"
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Info({ text }: { text: string }) {
  return (
    <div className="border-2 border-white/15 bg-black/25 p-3 text-sm text-white/72">{text}</div>
  );
}

function GemChip({ color, large = false }: { color: string; large?: boolean }) {
  return (
    <span
      className={`${large ? 'h-10 w-10' : 'h-7 w-7'} shrink-0 rotate-45 border-2 border-white/65`}
      style={{ background: color }}
    />
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border-2 border-white/15 bg-black/22 px-3 py-2">
      <div className="text-xs font-black uppercase tracking-[0.14em] text-arcade-cyan">{label}</div>
      <div className="break-words font-bold text-white">{value}</div>
    </div>
  );
}
