import { memo, type CSSProperties } from 'react';
import {
  areaDefinitions,
  areaTierKey,
  BASE_GEM_FAMILIES,
  gemDefinitions,
  upgrades,
} from '../../game/content';
import { QUEST_REROLL_COST } from '../../game/economy';
import { hybridRecipes } from '../../game/recipes';
import { buildStepLabel } from '../../game/buildPhase';
import { canBuyUpgrade, isTierUnlocked } from '../../game/engine';
import { gemDisplayName, getGemCombatStats } from '../../game/gems';
import type {
  GameAction,
  GemFamilyId,
  GemLevel,
  SaveState,
  Snapshot,
  TierId,
  UpgradeBranch,
  UpgradeDefinition,
} from '../../game/types';

const branchLabels: Record<UpgradeBranch, string> = {
  missile: 'Orbital',
  kinetic: 'Kinetic',
  verdant: 'Verdant',
  arcane: 'Arcane',
  nova: 'Nova',
  prism: 'Prism',
  ember: 'Ember',
  unlock: 'Unlocks',
};

const branchOrder: UpgradeBranch[] = [
  'missile',
  'kinetic',
  'unlock',
  'verdant',
  'arcane',
  'nova',
  'prism',
  'ember',
];

const GEM_LEVEL_COLORS: Record<GemLevel, string> = {
  1: '0.55',
  2: '0.65',
  3: '0.75',
  4: '0.85',
  5: '0.92',
  6: '0.98',
  7: '1',
};

function gemTooltip(save: SaveState, family: string, level: GemLevel): string {
  const stats = getGemCombatStats(save, family as GemFamilyId, level);
  const def = gemDefinitions[family as GemFamilyId];
  return `${def.name} L${level}: ${Math.round(stats.damage)} dmg · ${stats.range.toFixed(1)} rng · ${stats.cooldown.toFixed(2)}s · ${def.role}`;
}

export const ResourcePill = memo(function ResourcePill({
  icon,
  label,
  value,
}: {
  icon: 'gold' | 'heart' | 'star' | 'crown';
  label: string;
  value: string | number;
}) {
  return (
    <div className={`resource-pill resource-${icon}`}>
      <span className="resource-icon" aria-hidden />
      <span className="resource-label">{label}</span>
      <strong>{value}</strong>
    </div>
  );
});

export const BuildPhasePanel = memo(function BuildPhasePanel({
  snapshot,
  planning,
  dispatch,
}: {
  snapshot: Snapshot;
  planning: boolean;
  dispatch: (action: GameAction) => void;
}) {
  if (!planning) return null;
  const steps = ['rocks', 'prospect', 'upgrade', 'ready'] as const;
  return (
    <section className="game-card build-phase-card">
      <div className="card-header">
        <h2>Build phase</h2>
        <span className="hint">{buildStepLabel(snapshot.buildStep)}</span>
      </div>
      <div className="build-stepper">
        {steps.map((step) => (
          <span
            key={step}
            className={
              snapshot.buildStep === step
                ? 'build-step active'
                : steps.indexOf(step) < steps.indexOf(snapshot.buildStep)
                  ? 'build-step done'
                  : 'build-step'
            }
          >
            {step === 'rocks'
              ? `Rocks ${snapshot.rocksPlacedThisPhase}/5`
              : step === 'prospect'
                ? 'Prospect'
                : step === 'upgrade'
                  ? 'Upgrade'
                  : 'Ready'}
          </span>
        ))}
      </div>
      {snapshot.buildStep === 'rocks' && (
        <div className="button-row">
          <button
            type="button"
            className="game-button small active"
            onClick={() => dispatch({ type: 'selectPlacementMode', mode: 'rock' })}
          >
            Place rock ({snapshot.rocksRemaining} left)
          </button>
          <button
            type="button"
            className="game-button small"
            onClick={() => dispatch({ type: 'finishRocks' })}
          >
            Done with rocks
          </button>
        </div>
      )}
      {snapshot.buildStep === 'upgrade' && snapshot.claimedOffer && (
        <p className="hint">
          Click a rock on the board to upgrade it to{' '}
          {gemDefinitions[snapshot.claimedOffer.family].name} L{snapshot.claimedOffer.level}.
        </p>
      )}
      {snapshot.buildStep === 'ready' && (
        <p className="hint">Merge gems if needed, then Start Wave when ready.</p>
      )}
    </section>
  );
});

export const ProspectPanel = memo(function ProspectPanel({
  snapshot,
  planning,
  dispatch,
  save,
}: {
  snapshot: Snapshot;
  planning: boolean;
  dispatch: (action: GameAction) => void;
  save: SaveState;
}) {
  const showOffers =
    planning && (snapshot.buildStep === 'prospect' || snapshot.buildStep === 'upgrade');
  return (
    <section className="game-card">
      <div className="card-header">
        <h2>Prospect</h2>
      </div>
      {!planning && <p className="hint">Offers appear between waves during build phase.</p>}
      {planning && snapshot.buildStep === 'rocks' && (
        <p className="hint">Place rocks first, then pick a gem offer.</p>
      )}
      {showOffers && (
        <>
          <div className="gem-shop-grid">
            {snapshot.offers.map((offer, index) => {
              const def = gemDefinitions[offer.family];
              const selected =
                snapshot.claimedOffer?.family === offer.family &&
                snapshot.claimedOffer.level === offer.level;
              return (
                <button
                  key={`${offer.family}-${offer.level}-${index}`}
                  type="button"
                  title={gemTooltip(save, offer.family, offer.level)}
                  className={
                    selected
                      ? 'game-button gem-buy offer-card selected'
                      : 'game-button gem-buy offer-card'
                  }
                  style={{ '--tower-color': def.color } as CSSProperties}
                  onClick={() => dispatch({ type: 'claimOffer', index })}
                >
                  <span className="tower-icon" />
                  <span>{def.name}</span>
                  <strong>L{offer.level}</strong>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="game-button shop"
            disabled={snapshot.gold < snapshot.prospectRerollCost}
            onClick={() => dispatch({ type: 'rerollOffers' })}
          >
            <span>Reroll offers</span>
            <strong>{snapshot.prospectRerollCost}g</strong>
          </button>
        </>
      )}
      {planning && snapshot.buildStep === 'ready' && (
        <p className="hint">Offer claimed. Merge towers, then start the wave.</p>
      )}
    </section>
  );
});

export const ResultPanel = memo(function ResultPanel({
  snapshot,
  dispatch,
}: {
  snapshot: Snapshot;
  dispatch: (action: GameAction) => void;
}) {
  if (!snapshot.resultTitle) return null;
  return (
    <section className="game-card result-banner">
      <div>
        <h2>{snapshot.resultTitle}</h2>
        <p>{snapshot.resultMessage}</p>
      </div>
      <button type="button" className="game-button primary" onClick={() => dispatch({ type: 'retry' })}>
        Retry
      </button>
    </section>
  );
});

export const AreaPanel = memo(function AreaPanel({
  save,
  dispatch,
}: {
  save: SaveState;
  dispatch: (action: GameAction) => void;
}) {
  return (
    <section className="game-card">
      <div className="card-header">
        <h2>Areas</h2>
      </div>
      <div className="area-list">
        {areaDefinitions.map((area) => (
          <article key={area.id} className="area-row">
            <div>
              <strong>{area.name}</strong>
              <span>{area.subtitle}</span>
            </div>
            <div className="button-row">
              {(['normal', 'hard'] as const satisfies readonly TierId[]).map((tierId) => {
                const unlocked = isTierUnlocked(save, area.id, tierId);
                const cleared = save.clearedAreaTiers.includes(areaTierKey(area.id, tierId));
                return (
                  <button
                    key={tierId}
                    type="button"
                    disabled={!unlocked}
                    className={cleared ? 'game-button small cleared' : 'game-button small'}
                    onClick={() => dispatch({ type: 'startArea', areaId: area.id, tierId })}
                  >
                    {tierId}
                    {cleared ? ' ✓' : ''}
                  </button>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
});

export const HoldPanel = memo(function HoldPanel({
  snapshot,
  planning,
  dispatch,
}: {
  snapshot: Snapshot;
  planning: boolean;
  dispatch: (action: GameAction) => void;
}) {
  if (!planning) return null;
  const hold = snapshot.holdGem;
  return (
    <section className="game-card hold-card">
      <div className="card-header">
        <h2>Hold</h2>
        <span className="hint">Stage one gem off-board</span>
      </div>
      <button
        type="button"
        className={
          hold
            ? snapshot.placementMode === 'hold'
              ? 'hold-slot filled selected'
              : 'hold-slot filled'
            : 'hold-slot empty'
        }
        disabled={!hold}
        onClick={() => {
          if (hold) dispatch({ type: 'selectHoldGem' });
        }}
      >
        {hold ? (
          <>
            <span
              className="tower-icon"
              style={{ '--tower-color': gemDefinitions[hold.family].color } as CSSProperties}
            />
            <strong>{gemDisplayName(hold.family, hold.level)}</strong>
            <span className="hint">
              {snapshot.placementMode === 'hold' ? 'Click board to place' : 'Click to place'}
            </span>
          </>
        ) : (
          <span className="hint">Right-click a gem to stash or swap</span>
        )}
      </button>
      {hold && (
        <button
          type="button"
          className="game-button ghost small"
          onClick={() => dispatch({ type: 'clearHold' })}
        >
          Clear hold
        </button>
      )}
    </section>
  );
});

export const WavePreviewPanel = memo(function WavePreviewPanel({
  snapshot,
  planning,
}: {
  snapshot: Snapshot;
  planning: boolean;
}) {
  const tracker = snapshot.waveSpawnTracker;
  if (tracker) {
    return (
      <section className="game-card compact">
        <div className="card-header">
          <h2>Wave in progress</h2>
          <span className="hint">
            {tracker.spawned}/{tracker.total} spawned
          </span>
        </div>
        <div className="spawn-tracker-bar">
          <div
            className="spawn-tracker-fill"
            style={{ width: `${(tracker.spawned / Math.max(1, tracker.total)) * 100}%` }}
          />
        </div>
        <p className="hint">
          {tracker.remaining} left to spawn · {tracker.alive} on board · {tracker.killed} killed
          {tracker.currentSegment ? ` · now: ${tracker.currentSegment.name}` : ''}
        </p>
      </section>
    );
  }
  if (!planning || snapshot.nextWavePreview.length === 0) return null;
  return (
    <section className="game-card compact">
      <div className="card-header">
        <h2>Next wave</h2>
        <span className="hint">Wave {snapshot.wave}</span>
      </div>
      <ul className="wave-preview-list">
        {snapshot.nextWavePreview.map((row, index) => (
          <li key={`${row.enemyId}-${index}`}>
            <strong>
              {row.count}× {row.name}
            </strong>
            {row.tags.length > 0 && <span className="hint">{row.tags.join(' · ')}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
});

export const MazePanel = memo(function MazePanel({
  snapshot,
  planning,
  dispatch,
}: {
  snapshot: Snapshot;
  planning: boolean;
  dispatch: (action: GameAction) => void;
}) {
  return (
    <section className="game-card">
      <div className="card-header">
        <h2>Maze & merge</h2>
      </div>
      <div className="button-row">
        <button
          type="button"
          disabled={!planning || snapshot.buildStep !== 'ready'}
          className={snapshot.placementMode === 'merge' ? 'game-button small active' : 'game-button small'}
          onClick={() => dispatch({ type: 'selectPlacementMode', mode: 'merge' })}
        >
          Merge
        </button>
        <button
          type="button"
          disabled={!planning || snapshot.mergeUndoCount === 0}
          className="game-button small"
          onClick={() => dispatch({ type: 'undoMerge' })}
        >
          Undo merge ({snapshot.mergeUndoCount})
        </button>
      </div>
      {snapshot.buildStep === 'rocks' && snapshot.rockPathDelta !== null && (
        <p className="hint path-delta">
          Rock preview: {snapshot.rockPathDelta >= 0 ? '+' : ''}
          {snapshot.rockPathDelta} path tiles
        </p>
      )}
      <p className="hint">
        Right-click rocks to sell, gems to hold/swap. Merge adjacent gems in build phase.
      </p>
    </section>
  );
});

export const PlacedGemsPanel = memo(function PlacedGemsPanel({
  snapshot,
  planning,
  dispatch,
  save,
}: {
  snapshot: Snapshot;
  planning: boolean;
  dispatch: (action: GameAction) => void;
  save: SaveState;
}) {
  if (snapshot.placedGems.length === 0) return null;

  return (
    <section className="game-card compact">
      <div className="card-header">
        <h2>On Board</h2>
        <span className="hint">{snapshot.placedGems.length} gems</span>
      </div>
      <div className="chip-grid">
        {snapshot.placedGems.map((gem) => {
          const def = gemDefinitions[gem.family];
          const isMergeSource = snapshot.mergeSourceGemId === gem.id;
          return (
            <button
              key={gem.id}
              type="button"
              title={gemTooltip(save, gem.family, gem.level)}
              disabled={!planning}
              className={isMergeSource ? 'gem-chip selected' : 'gem-chip'}
              style={
                {
                  '--tower-color': def.color,
                  '--gem-level-opacity': GEM_LEVEL_COLORS[gem.level],
                } as CSSProperties
              }
              onClick={() => {
                if (snapshot.placementMode === 'merge') {
                  if (snapshot.mergeSourceGemId === null) {
                    dispatch({ type: 'selectMergeSource', gemId: gem.id });
                  } else if (snapshot.mergeSourceGemId !== gem.id) {
                    dispatch({ type: 'mergeGems', targetGemId: gem.id });
                  }
                } else {
                  dispatch({ type: 'cycleGemTargeting', gemId: gem.id });
                }
              }}
            >
              <span className="tower-icon" />
              <strong>{gemDisplayName(gem.family, gem.level)}</strong>
              <span className="hint">{gem.targeting}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
});

export const QuestPanel = memo(function QuestPanel({
  snapshot,
  planning,
  dispatch,
}: {
  snapshot: Snapshot;
  planning: boolean;
  dispatch: (action: GameAction) => void;
}) {
  return (
    <section className="game-card compact">
      <div className="card-header">
        <h2>Quests</h2>
      </div>
      <div className="quest-list">
        {snapshot.quests.map((quest) => (
          <article key={quest.id} className={quest.completed ? 'quest-row done' : 'quest-row'}>
            <div>
              <strong>{quest.label}</strong>
              <span>
                {Math.min(quest.progress, quest.target)}/{quest.target}
              </span>
            </div>
            <div className="quest-meta">
              <strong>{quest.completed ? 'Done' : `+${quest.rewardGold}g`}</strong>
              {!quest.completed && (
                <button
                  type="button"
                  className="game-button ghost"
                  disabled={!planning || snapshot.gold < QUEST_REROLL_COST}
                  onClick={() => dispatch({ type: 'rerollQuest', questId: quest.id })}
                >
                  Reroll {QUEST_REROLL_COST}g
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
});

export const GreatGemsPanel = memo(function GreatGemsPanel({ snapshot }: { snapshot: Snapshot }) {
  return (
    <section className="game-card compact">
      <div className="card-header">
        <h2>Great gems</h2>
        <span className="hint">L7 unlocks</span>
      </div>
      <div className="chip-grid">
        {BASE_GEM_FAMILIES.map((family) => {
          const unlocked = snapshot.greatUnlocked.includes(family);
          const def = gemDefinitions[family];
          return (
            <div
              key={family}
              className={unlocked ? 'gem-chip great-unlocked' : 'gem-chip great-locked'}
              style={{ '--tower-color': def.color } as CSSProperties}
              title={
                unlocked ? `${def.name} great craft unlocked` : `Complete quest to unlock ${def.name} L7`
              }
            >
              <span className="tower-icon" />
              <strong>{def.name}</strong>
              <span className="hint">{unlocked ? 'Great ✓' : 'Locked'}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
});

export const RunMetaPanel = memo(function RunMetaPanel({ snapshot }: { snapshot: Snapshot }) {
  return (
    <section className="game-card compact">
      <div className="card-header">
        <h2>Run meta</h2>
      </div>
      <p className="hint mono">Seed {snapshot.runSeed}</p>
      <p className="hint">Speed {snapshot.gameSpeed}x · Space start · M merge · U undo</p>
      <p className="hint">Crystal dust: {snapshot.crystalDust} (cosmetic meta)</p>
    </section>
  );
});

export const RecipePanel = memo(function RecipePanel({ save }: { save: SaveState }) {
  return (
    <section className="game-card compact">
      <div className="card-header">
        <h2>Hybrids</h2>
      </div>
      <ul className="recipe-list">
        {hybridRecipes.map((recipe) => {
          const a = gemDefinitions[recipe.inputs[0].family];
          const b = gemDefinitions[recipe.inputs[1].family];
          const out = gemDefinitions[recipe.output.family];
          return (
            <li key={recipe.id} title={gemTooltip(save, recipe.output.family, recipe.output.level)}>
              <div className="recipe-row">
                <span className="tower-icon" style={{ '--tower-color': a.color } as CSSProperties} />
                <span className="tower-icon" style={{ '--tower-color': b.color } as CSSProperties} />
                <span className="recipe-arrow">→</span>
                <span className="tower-icon" style={{ '--tower-color': out.color } as CSSProperties} />
                <strong>{recipe.label}</strong>
              </div>
              <span className="hint">
                {a.name} L{recipe.inputs[0].level} + {b.name} L{recipe.inputs[1].level}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
});

const UpgradeNode = memo(function UpgradeNode({
  upgrade,
  bought,
  canBuy,
  dispatch,
}: {
  upgrade: UpgradeDefinition;
  bought: boolean;
  canBuy: boolean;
  dispatch: (action: GameAction) => void;
}) {
  const price = `${upgrade.costStars}★${upgrade.costCrowns ? ` ${upgrade.costCrowns}♛` : ''}`;
  return (
    <button
      type="button"
      className={bought ? 'upgrade-node bought' : 'upgrade-node'}
      disabled={bought || !canBuy}
      onClick={() => dispatch({ type: 'buyUpgrade', upgradeId: upgrade.id })}
    >
      <span>{upgrade.label}</span>
      <strong>{bought ? 'Owned' : price}</strong>
    </button>
  );
});

export const UpgradePanel = memo(function UpgradePanel({
  save,
  dispatch,
}: {
  save: SaveState;
  dispatch: (action: GameAction) => void;
}) {
  const grouped = branchOrder.map((branch) => ({
    branch,
    nodes: upgrades.filter((upgrade) => upgrade.branch === branch),
  }));
  return (
    <section className="game-card upgrade-card">
      <div className="card-header">
        <h2>Upgrades</h2>
      </div>
      <div className="upgrade-tree">
        {grouped.map(({ branch, nodes }) => (
          <div key={branch} className={`upgrade-branch branch-${branch}`}>
            <h3>{branchLabels[branch]}</h3>
            <div className="upgrade-grid">
              {nodes.map((upgrade) => (
                <UpgradeNode
                  key={upgrade.id}
                  upgrade={upgrade}
                  bought={save.purchasedUpgradeIds.includes(upgrade.id)}
                  canBuy={canBuyUpgrade(save, upgrade)}
                  dispatch={dispatch}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});
