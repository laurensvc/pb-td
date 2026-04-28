import { useState } from 'react';
import type React from 'react';
import { gameConfig, getGem } from '../game/config';
import { findRecipeAt } from '../game/engine';
import type { GameController } from '../hooks/useGameController';
import type { GameSnapshot, SaveState, SkillId } from '../game/types';
import { useSaveStore } from '../stores/saveStore';

interface SidePanelProps {
  controller: GameController;
  snapshot: GameSnapshot;
  save: SaveState;
}

type Tab = 'build' | 'recipes' | 'skills' | 'quests';

export function SidePanel({ controller, snapshot, save }: SidePanelProps) {
  const [tab, setTab] = useState<Tab>('build');
  const resetSave = useSaveStore((state) => state.resetSave);
  const selected = snapshot.selectedTile;
  const recipe = selected ? findRecipeAt(controller.game.current, selected.x, selected.y) : null;

  return (
    <aside className="grid max-h-[calc(100vh-40px)] gap-3 overflow-y-auto lg:sticky lg:top-5">
      <section className="arcade-panel rounded-md p-3">
        <div className="grid grid-cols-4 gap-1">
          {(['build', 'recipes', 'skills', 'quests'] as const).map((item) => (
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
                snapshot.draft.map((choice) => {
                  const gem = getGem(gameConfig, choice.gemId);
                  return (
                    <button
                      key={choice.id}
                      className="arcade-row text-left"
                      onClick={() =>
                        controller.dispatch({
                          type: 'keepDraftCandidate',
                          x: choice.x,
                          y: choice.y,
                        })
                      }
                    >
                      <span>
                        <span className="block font-black text-white">{gem.name}</span>
                        <span className="text-sm text-white/65">
                          {choice.x + 1},{choice.y + 1} · {gem.damage} dmg · L{gem.tier}
                        </span>
                      </span>
                      <GemChip color={gem.color} />
                    </button>
                  );
                })
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <ActionButton
                disabled={!selected || !recipe}
                onClick={() =>
                  selected && controller.dispatch({ type: 'combineAt', x: selected.x, y: selected.y })
                }
              >
                {recipe ? `COMBINE ${recipe.name}` : 'COMBINE'}
              </ActionButton>
              <ActionButton
                disabled={!selected || !snapshot.canRemoveStone}
                onClick={() =>
                  selected && controller.dispatch({ type: 'removeStone', x: selected.x, y: selected.y })
                }
              >
                REMOVE STONE
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
                  controller.dispatch({ type: 'setTowerTarget', x: selected.x, y: selected.y, targetId: null })
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
                      {snapshot.selectedTower.damage} dmg · {snapshot.selectedTower.cooldown.toFixed(2)}
                      s · MVP {snapshot.selectedTower.mvpAwards}/10
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
            ) : (
              <Info text="Select a gem, tower, draft candidate, or stone on the board." />
            )}
          </section>

          <WavePanel snapshot={snapshot} />
        </>
      ) : null}

      {tab === 'recipes' ? <RecipesPanel snapshot={snapshot} /> : null}
      {tab === 'skills' ? <SkillsPanel controller={controller} snapshot={snapshot} /> : null}
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
          <Stat label="Skills" value={snapshot.currentWaveSkills.length ? snapshot.currentWaveSkills.join(', ') : 'none'} />
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
            snapshot.discoveredRecipes.includes(recipe.id) || !recipe.hidden || snapshot.unlockedSecrets.includes(recipe.id);
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

function SkillsPanel({
  controller,
  snapshot,
}: {
  controller: GameController;
  snapshot: GameSnapshot;
}) {
  const selected = snapshot.selectedTile;
  const levels = new Map<SkillId, number>();
  for (const skill of snapshot.skills) levels.set(skill.id, skill.level);
  return (
    <section className="arcade-panel rounded-md p-4">
      <h2 className="font-display text-2xl font-black text-white">Shell Skills</h2>
      <div className="mt-3 grid gap-2">
        {gameConfig.skills.map((skill) => {
          const level = levels.get(skill.id) ?? 0;
          const maxed = level >= 4;
          return (
            <div key={skill.id} className="border-2 border-white/15 bg-black/25 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-black text-white">
                    {skill.name} <span className="text-arcade-yellow">L{level}</span>
                  </div>
                  <div className="text-sm text-white/62">{skill.description}</div>
                </div>
                <div className="flex gap-1">
                  <button
                    className="arcade-mini"
                    disabled={maxed}
                    onClick={() => controller.dispatch({ type: 'buySkill', skillId: skill.id })}
                  >
                    BUY
                  </button>
                  <button
                    className="arcade-mini"
                    disabled={!skill.active || level <= 0}
                    onClick={() =>
                      controller.dispatch({
                        type: 'activateSkill',
                        skillId: skill.id,
                        x: selected?.x,
                        y: selected?.y,
                      })
                    }
                  >
                    USE
                  </button>
                </div>
              </div>
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
          <Stat label="Reward" value={`${rank?.shells ?? 0} shells`} />
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
                  <div className="text-sm text-white/62">
                    {quest.rewardShells[0]}-{quest.rewardShells[1]} shells
                  </div>
                </div>
                <span className={progress?.completed ? 'text-arcade-green' : 'text-white/40'}>
                  {progress?.completed ? 'DONE' : 'OPEN'}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stat label="Wins" value={save.wins} />
          <Stat label="Saved Shells" value={save.shells} />
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
    <button className="arcade-button-secondary px-3 py-2 text-sm font-black" disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

function Info({ text }: { text: string }) {
  return <div className="border-2 border-white/15 bg-black/25 p-3 text-sm text-white/72">{text}</div>;
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
