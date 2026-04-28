import { useState } from 'react';
import type React from 'react';
import { gameConfig, getEnemy, getGem } from '../game/config';
import { findRecipeAt } from '../game/engine';
import type { GameController } from '../hooks/useGameController';
import type {
  DamageType,
  EnemySkill,
  GameSnapshot,
  RecipeIngredient,
  SaveState,
  TargetMode,
  TowerEffect,
  TowerEffectDefinition,
} from '../game/types';
import { useSaveStore } from '../stores/saveStore';

interface SidePanelProps {
  controller: GameController;
  snapshot: GameSnapshot;
  save: SaveState;
}

type Tab = 'build' | 'recipes' | 'quests' | 'help';

const tabs: readonly { id: Tab; label: string }[] = [
  { id: 'build', label: 'Build' },
  { id: 'recipes', label: 'Recipes' },
  { id: 'quests', label: 'Quests' },
  { id: 'help', label: 'Help' },
];

const targetModeOptions: readonly { id: TargetMode; label: string }[] = [
  { id: 'first', label: 'First' },
  { id: 'last', label: 'Last' },
  { id: 'strongest', label: 'Strongest' },
  { id: 'weakest', label: 'Weakest' },
  { id: 'closest', label: 'Closest' },
  { id: 'flyingOnly', label: 'Flying' },
  { id: 'bossOnly', label: 'Boss' },
];

const targetModeLabels: Record<TargetMode, string> = {
  first: 'First',
  last: 'Last',
  strongest: 'Strongest',
  weakest: 'Weakest',
  closest: 'Closest',
  flyingOnly: 'Flying',
  bossOnly: 'Boss',
};

const damageLabels: Record<DamageType, string> = {
  physical: 'Physical',
  magic: 'Magic',
  pure: 'Pure',
};

const effectLabels: Record<TowerEffect, string> = {
  armorBreak: 'Armor Break',
  speedAura: 'Speed Aura',
  damageAura: 'Damage Aura',
  poison: 'Poison',
  cleave: 'Cleave',
  slow: 'Slow',
  split: 'Split',
  crit: 'Crit',
  burn: 'Burn',
  antiFly: 'Anti-Fly',
  corrupt: 'Corrupt',
  stun: 'Stun',
  lightning: 'Lightning',
  radiation: 'Radiation',
  inspire: 'Inspire',
  resist: 'Resist',
  greedy: 'Greedy',
  overlook: 'Overlook',
  recover: 'Recover',
  mvpAura: 'MVP Aura',
  decadent: 'Decadent',
};

const enemySkillLabels: Record<EnemySkill, string> = {
  magicImmune: 'Magic Immune',
  physicalImmune: 'Physical Immune',
  disarm: 'Disarm',
  flying: 'Flying',
  evasion: 'Evasion',
  refraction: 'Refraction',
  blink: 'Blink',
  rush: 'Rush',
  thief: 'Thief',
  permanentInvisibility: 'Invisible',
  vitality: 'Vitality',
  untouchable: 'Untouchable',
  highArmor: 'High Armor',
  reactiveArmor: 'Reactive Armor',
  recharge: 'Recharge',
  cloakAndDagger: 'Cloak',
  krakenShell: 'Shell',
};

export function SidePanel({ controller, snapshot, save }: SidePanelProps) {
  const [tab, setTab] = useState<Tab>('build');
  const resetSave = useSaveStore((state) => state.resetSave);
  const selected = snapshot.selectedTile;
  const recipe = selected ? findRecipeAt(controller.game.current, selected.x, selected.y) : null;

  return (
    <aside className="grid max-h-none gap-3 overflow-visible lg:sticky lg:top-4 lg:max-h-[calc(100vh-32px)] lg:overflow-y-auto lg:pr-1">
      <section className="pixel-panel p-2">
        <div className="grid grid-cols-4 gap-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`pixel-tab ${tab === item.id ? 'pixel-tab-active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {tab === 'build' ? (
        <>
          <section className="pixel-panel p-4">
            <PanelTitle eyebrow="Command" title="Build Actions" />
            <div className="mt-3 grid gap-2">
              {snapshot.pendingGemId ? (
                <PendingGem gemId={snapshot.pendingGemId} placed={snapshot.draft.length} />
              ) : snapshot.draft.length === 0 ? (
                <Info text="Place five candidates, keep one gem, and convert the rest into maze stones." />
              ) : (
                <div
                  className="grid gap-2"
                  onPointerLeave={() => controller.dispatch({ type: 'clearDraftRowHover' })}
                >
                  <p className="pixel-callout text-sm font-extrabold">
                    Keep one candidate. Pick from this list or click the matching gem on the board.
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
                        className={`pixel-row text-left ${rowActive ? 'pixel-row-active' : ''}`}
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
                        aria-label={`Keep ${gem.name} at cell ${choice.x + 1},${choice.y + 1}. The rest become maze stones.`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-black text-[#fff7d6]">
                            {gem.name}
                          </span>
                          <span className="text-sm text-[#d8c991]/75">
                            {choice.x + 1},{choice.y + 1} | {gem.damage} dmg | L{gem.tier} | keep
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
                REMOVE STONE
              </ActionButton>
              <ActionButton
                disabled={!selected || !snapshot.canMerge}
                onClick={() =>
                  selected &&
                  controller.dispatch({ type: 'mergeAt', x: selected.x, y: selected.y, levels: 1 })
                }
              >
                MERGE +1 200G
              </ActionButton>
              <ActionButton
                disabled={!selected || !snapshot.canMergePlus}
                onClick={() =>
                  selected &&
                  controller.dispatch({ type: 'mergeAt', x: selected.x, y: selected.y, levels: 2 })
                }
              >
                MERGE +2 450G
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

          <SelectedPanel controller={controller} snapshot={snapshot} selected={selected} />
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
      {tab === 'help' ? <HelpPanel /> : null}
    </aside>
  );
}

function SelectedPanel({
  controller,
  snapshot,
  selected,
}: {
  controller: GameController;
  snapshot: GameSnapshot;
  selected: GameSnapshot['selectedTile'];
}) {
  return (
    <section className="pixel-panel p-4">
      <PanelTitle eyebrow="Focus" title="Selected" />
      {snapshot.selectedTower ? (
        <div className="mt-3 grid gap-3">
          <div className="pixel-row">
            <div className="flex min-w-0 items-center gap-3">
              <GemChip color={snapshot.selectedTower.color} large />
              <div className="min-w-0">
                <div className="truncate font-black text-[#fff7d6]">
                  {snapshot.selectedTower.name}
                </div>
                <div className="text-sm text-[#d8c991]/75">
                  {snapshot.selectedTower.damage} dmg | {snapshot.selectedTower.cooldown.toFixed(2)}
                  s | MVP {snapshot.selectedTower.mvpAwards}/10
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Stat label="Class" value={snapshot.selectedTower.classification} />
            <Stat label="Damage" value={damageLabels[snapshot.selectedTower.damageType]} />
            <Stat label="Kills" value={snapshot.selectedTower.kills} />
            <Stat label="Target" value={snapshot.selectedTowerTarget?.name ?? 'auto'} />
            <Stat label="Mode" value={targetModeLabels[snapshot.selectedTower.targetMode]} />
            <Stat label="Round" value={Math.round(snapshot.selectedTower.roundDamage)} />
            <Stat label="Total" value={Math.round(snapshot.selectedTower.totalDamage)} />
          </div>
          <div className="grid gap-1.5">
            <label
              className="text-xs font-black uppercase tracking-[0.12em] text-arcade-cyan"
              htmlFor="tower-target-mode"
            >
              Target Mode
            </label>
            <select
              id="tower-target-mode"
              className="border-2 border-[#5f5130] bg-[#171713] px-3 py-2 text-sm font-black text-[#fff7d6] outline-none focus:border-arcade-yellow"
              value={snapshot.selectedTower.targetMode}
              onChange={(event) =>
                selected &&
                controller.dispatch({
                  type: 'setTowerTargetMode',
                  x: selected.x,
                  y: selected.y,
                  targetMode: event.currentTarget.value as TargetMode,
                })
              }
            >
              {targetModeOptions.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {snapshot.selectedTower.effects.length ? (
              snapshot.selectedTower.effects.map((effect, index) => (
                <Badge key={`${effect.type}-${index}`} tone="effect">
                  {formatEffect(effect)}
                </Badge>
              ))
            ) : (
              <Badge tone="muted">No effects</Badge>
            )}
          </div>
        </div>
      ) : snapshot.canRemoveStone && selected ? (
        <div className="mt-3 grid gap-2">
          <p className="font-black text-[#fff7d6]">Maze stone</p>
          <p className="text-sm text-[#d8c991]/75">
            Destroy this stone to open the tile. Refund: 0 gold.
          </p>
        </div>
      ) : (
        <Info text="Select a gem, tower, draft candidate, or stone on the board." />
      )}
    </section>
  );
}

function WavePanel({ snapshot }: { snapshot: GameSnapshot }) {
  const wave = snapshot.currentWave;
  const enemy = wave ? getEnemy(gameConfig, wave.enemyId) : null;
  const nextEnemy = snapshot.nextWave ? getEnemy(gameConfig, snapshot.nextWave.enemyId) : null;

  return (
    <section className="pixel-panel p-4">
      <PanelTitle eyebrow="Scout" title="Wave Intel" />
      {wave && enemy ? (
        <div className="mt-3 grid gap-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Stat label="Now" value={`${wave.wave}. ${wave.name}`} />
            <Stat label="Count" value={wave.count} />
            <Stat label="Enemy" value={enemy.name} />
            <Stat label="Reward" value={`${enemy.reward}g`} />
            <Stat label="Boss" value={wave.boss || enemy.boss ? 'yes' : 'no'} />
            <Stat label="Next" value={snapshot.nextWave ? snapshot.nextWave.name : 'none'} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(snapshot.currentWaveSkills.length ? snapshot.currentWaveSkills : enemy.skills).map(
              (skill) => (
                <Badge key={skill} tone="danger">
                  {enemySkillLabels[skill]}
                </Badge>
              ),
            )}
            {nextEnemy?.boss ? <Badge tone="gold">Boss next</Badge> : null}
            {snapshot.requiredWavesCleared ? <Badge tone="muted">Repeat mode</Badge> : null}
          </div>
        </div>
      ) : (
        <Info text="No further waves." />
      )}
    </section>
  );
}

function RecipesPanel({ snapshot }: { snapshot: GameSnapshot }) {
  return (
    <section className="pixel-panel p-4">
      <PanelTitle eyebrow="Forge" title="Recipe Tree" />
      <div className="mt-3 grid gap-2">
        {gameConfig.recipes.map((recipe) => {
          const known =
            snapshot.discoveredRecipes.includes(recipe.id) ||
            !recipe.hidden ||
            snapshot.unlockedSecrets.includes(recipe.id);
          const gem = getGem(gameConfig, recipe.resultGemId);
          return (
            <div key={recipe.id} className="pixel-row items-start">
              <div className="min-w-0">
                <div className="truncate font-black text-[#fff7d6]">
                  {known ? recipe.name : 'Secret Formula'}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {known ? (
                    recipe.ingredients.map((ingredient, index) => (
                      <Badge key={`${recipe.id}-${index}`} tone="muted">
                        {formatIngredient(ingredient)}
                      </Badge>
                    ))
                  ) : (
                    <Badge tone="muted">{recipe.ingredients.length} hidden pieces</Badge>
                  )}
                </div>
              </div>
              <div className="grid shrink-0 justify-items-end gap-1">
                <GemChip color={known ? gem.color : '#3f3f35'} />
                <Badge tone={recipe.hidden ? 'gold' : 'effect'}>{recipe.classification}</Badge>
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
      <section className="pixel-panel p-4">
        <PanelTitle eyebrow="League" title="Rank" />
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <Stat label="Season" value={rank?.name ?? snapshot.rank.seasonRankId} />
          <Stat label="Bracket" value={rank?.percentage ?? 'n/a'} />
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
      <section className="pixel-panel p-4">
        <PanelTitle eyebrow="Run Log" title="Quests" />
        <div className="mt-3 grid gap-2">
          {gameConfig.quests.map((quest) => {
            const progress = snapshot.quests.find((item) => item.id === quest.id);
            const complete = Boolean(progress?.completed);
            const amount = complete ? 100 : Math.round((progress?.progress ?? 0) * 100);
            return (
              <div key={quest.id} className="pixel-row items-start">
                <div className="min-w-0 flex-1">
                  <div className="font-black leading-tight text-[#fff7d6]">{quest.name}</div>
                  <div className="mt-2 h-2 border border-[#5f5130] bg-[#171713]">
                    <div
                      className={`h-full ${complete ? 'bg-arcade-green' : 'bg-arcade-yellow'}`}
                      style={{ width: `${amount}%` }}
                    />
                  </div>
                </div>
                <Badge tone={complete ? 'success' : 'muted'}>{complete ? 'Done' : 'Open'}</Badge>
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

function HelpPanel() {
  return (
    <section className="pixel-panel p-4">
      <PanelTitle eyebrow="Manual" title="Field Guide" />
      <div className="mt-3 grid gap-3">
        <HelpBlock
          title="Build Flow"
          text="Place five candidates, keep the strongest fit, then use the rest of the draft to bend the maze."
        />
        <HelpBlock
          title="Damage"
          text="Physical cares about armor, magic handles many utility towers, and pure damage ignores normal defenses."
        />
        <HelpBlock
          title="Combines"
          text="Select a tower tile and use Combine when a known recipe is available. Secret recipes reveal after discovery."
        />
        <div className="grid gap-2">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-arcade-yellow">
            Enemy Marks
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(['flying', 'magicImmune', 'physicalImmune', 'rush', 'blink', 'krakenShell'] as const).map(
              (skill) => (
                <Badge key={skill} tone="danger">
                  {enemySkillLabels[skill]}
                </Badge>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function PendingGem({ gemId, placed }: { gemId: string; placed: number }) {
  const gem = getGem(gameConfig, gemId);
  return (
    <div className="border-2 border-arcade-yellow bg-[#171713] p-3 shadow-pixel">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-arcade-yellow">
            Candidate {placed + 1} / 5
          </div>
          <div className="truncate font-black text-[#fff7d6]">{gem.name}</div>
          <div className="text-sm text-[#d8c991]/75">
            {gem.damage} dmg | {gem.range.toFixed(1)} range | L{gem.tier}
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
      className="arcade-button-secondary min-h-11 px-3 py-2 text-sm font-black"
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function PanelTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <div className="text-xs font-black uppercase tracking-[0.18em] text-arcade-yellow">
        {eyebrow}
      </div>
      <h2 className="font-display text-2xl font-black leading-none text-[#fff7d6]">{title}</h2>
    </div>
  );
}

function HelpBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="border-2 border-[#3c3323] bg-[#171713] p-3">
      <div className="font-black text-[#fff7d6]">{title}</div>
      <div className="mt-1 text-sm leading-snug text-[#d8c991]/75">{text}</div>
    </div>
  );
}

function Info({ text }: { text: string }) {
  return (
    <div className="border-2 border-[#3c3323] bg-[#171713] p-3 text-sm leading-snug text-[#d8c991]/78">
      {text}
    </div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: 'danger' | 'effect' | 'gold' | 'muted' | 'success';
}) {
  const toneClass = {
    danger: 'border-arcade-red/70 bg-[#32171a] text-[#ffb3bf]',
    effect: 'border-arcade-cyan/60 bg-[#10292a] text-[#a8f5ff]',
    gold: 'border-arcade-yellow/70 bg-[#332711] text-[#ffeaa0]',
    muted: 'border-[#5f5130] bg-[#171713] text-[#d8c991]',
    success: 'border-arcade-green/60 bg-[#12301a] text-[#b7ffc8]',
  }[tone];

  return (
    <span
      className={`inline-flex max-w-full items-center border px-1.5 py-0.5 text-[0.68rem] font-black uppercase leading-tight tracking-[0.08em] ${toneClass}`}
    >
      {children}
    </span>
  );
}

function GemChip({ color, large = false }: { color: string; large?: boolean }) {
  return (
    <span
      className={`${large ? 'h-10 w-10' : 'h-7 w-7'} gem-chip shrink-0`}
      style={{ background: color }}
    />
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="pixel-stat min-w-0 px-3 py-2">
      <div className="truncate text-xs font-black uppercase tracking-[0.12em] text-arcade-cyan">
        {label}
      </div>
      <div className="break-words font-bold leading-tight text-[#fff7d6]">{value}</div>
    </div>
  );
}

function formatIngredient(ingredient: RecipeIngredient): string {
  if (ingredient.gemId) return getGem(gameConfig, ingredient.gemId).code;
  if (ingredient.towerId) return getGem(gameConfig, ingredient.towerId).name;
  const family = ingredient.family ? ingredient.family.slice(0, 3).toUpperCase() : 'Any';
  return ingredient.tier ? `${family} L${ingredient.tier}` : family;
}

function formatEffect(effect: TowerEffectDefinition): string {
  const parts = [effectLabels[effect.type]];
  if (effect.value !== 1) parts.push(formatEffectValue(effect));
  if (effect.radius) parts.push(`R${effect.radius}`);
  if (effect.duration) parts.push(`${effect.duration}s`);
  if (effect.maxTargets) parts.push(`${effect.maxTargets}x`);
  return parts.join(' ');
}

function formatEffectValue(effect: TowerEffectDefinition): string {
  if (
    effect.type === 'speedAura' ||
    effect.type === 'damageAura' ||
    effect.type === 'slow' ||
    effect.type === 'crit' ||
    effect.type === 'cleave' ||
    effect.type === 'corrupt' ||
    effect.type === 'greedy' ||
    effect.type === 'inspire' ||
    effect.type === 'resist' ||
    effect.type === 'decadent'
  ) {
    return `${Math.round(effect.value * 100)}%`;
  }
  return `${effect.value}`;
}
