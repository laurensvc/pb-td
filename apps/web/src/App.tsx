import { useState, type CSSProperties } from 'react';
import {
  areaDefinitions,
  areaTierKey,
  gemDefinitions,
  upgrades,
} from './game/content';
import { QUEST_REROLL_COST } from './game/economy';
import { hybridRecipes } from './game/recipes';
import { buildStepLabel } from './game/buildPhase';
import { canBuyUpgrade, isTierUnlocked } from './game/engine';
import { gemDisplayName } from './game/gems';
import { getRespecCost } from './game/save';
import type {
  GameAction,
  GemLevel,
  SaveState,
  Snapshot,
  TierId,
  UpgradeBranch,
  UpgradeDefinition,
} from './game/types';
import { PhaserGameHost } from './components/PhaserGameHost';
import { useCosmicGame } from './hooks/useCosmicGame';

type SideTab = 'build' | 'shop' | 'progress';

const branchLabels: Record<UpgradeBranch, string> = {
  missile: 'Orbital',
  kinetic: 'Kinetic',
  verdant: 'Verdant',
  arcane: 'Arcane',
  nova: 'Nova',
  prism: 'Prism',
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

export default function App() {
  const controller = useCosmicGame();
  const { snapshot, dispatch, game } = controller;
  const save = game.current.save;
  const respecCost = getRespecCost(save);
  const planning = snapshot.status === 'idle' || snapshot.status === 'betweenWaves';
  const [tab, setTab] = useState<SideTab>('build');

  return (
    <main className="app-shell">
      <PhaserGameHost bridge={controller.bridge} />

      <header className="game-hud" aria-label="Run status">
        <div className="hud-title">
          <span className="game-logo">Cosmic Gem Siege</span>
          <span className="hud-subtitle">
            {snapshot.areaName} · {snapshot.tierId.toUpperCase()} · Wave {snapshot.wave}/
            {snapshot.totalWaves}
            {snapshot.isBossWave ? ' · BOSS' : ''}
          </span>
        </div>

        <div className="resource-bar">
          <ResourcePill icon="gold" label="Gold" value={snapshot.gold} />
          <ResourcePill icon="heart" label="Lives" value={`${snapshot.lives}/${snapshot.maxLives}`} />
          <ResourcePill icon="star" label="Stars" value={snapshot.stars} />
          <ResourcePill icon="crown" label="Crowns" value={snapshot.crowns} />
        </div>

        <div className="hud-actions">
          <div className="wave-readout">
            <span>Path {snapshot.pathLength}</span>
            <span>
              Next +{snapshot.waveIncome}g · {snapshot.interestPreview} interest
            </span>
            <span>
              Strike{' '}
              {snapshot.missileCooldownLeft <= 0
                ? 'READY'
                : `${snapshot.missileCooldownLeft.toFixed(1)}s`}
            </span>
          </div>
          <button
            className="game-button primary"
            type="button"
            disabled={!snapshot.canStartWave}
            onClick={() => dispatch({ type: 'startWave' })}
          >
            Start Wave
          </button>
        </div>
      </header>

      <aside className="game-panel" aria-label="Game controls">
        <ResultPanel snapshot={snapshot} dispatch={dispatch} />

        <nav className="panel-tabs" aria-label="Panel sections">
          {(
            [
              ['build', 'Build'],
              ['shop', 'Shop'],
              ['progress', 'Progress'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={tab === id ? 'panel-tab active' : 'panel-tab'}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="panel-body">
          {snapshot.toast && <p className="game-toast">{snapshot.toast}</p>}
          {tab === 'build' && (
            <>
              <BuildPhasePanel snapshot={snapshot} planning={planning} dispatch={dispatch} />
              <HoldPanel snapshot={snapshot} planning={planning} dispatch={dispatch} />
              <WavePreviewPanel snapshot={snapshot} planning={planning} />
              <MazePanel snapshot={snapshot} planning={planning} dispatch={dispatch} />
              <PlacedGemsPanel snapshot={snapshot} planning={planning} dispatch={dispatch} />
              <RecipePanel />
            </>
          )}
          {tab === 'shop' && (
            <>
              <ProspectPanel snapshot={snapshot} planning={planning} dispatch={dispatch} />
              <QuestPanel snapshot={snapshot} planning={planning} dispatch={dispatch} />
            </>
          )}
          {tab === 'progress' && (
            <>
              <AreaPanel save={save} dispatch={dispatch} />
              <UpgradePanel save={save} dispatch={dispatch} />
              <section className="game-card compact">
                <div className="card-header">
                  <h2>Save</h2>
                  <div className="card-actions">
                    <button
                      type="button"
                      className="game-button ghost"
                      disabled={respecCost > save.stars}
                      onClick={() => dispatch({ type: 'respecUpgrades' })}
                    >
                      Respec {respecCost}★
                    </button>
                    <button
                      type="button"
                      className="game-button ghost danger"
                      onClick={() => dispatch({ type: 'resetSave' })}
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <p className="hint">
                  Run rewards: +{snapshot.attemptStars}★ · +{snapshot.attemptCrowns}♛
                </p>
              </section>
            </>
          )}
        </div>
      </aside>
    </main>
  );
}

function ResourcePill({
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
}

function BuildPhasePanel({
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
}

function ProspectPanel({
  snapshot,
  planning,
  dispatch,
}: {
  snapshot: Snapshot;
  planning: boolean;
  dispatch: (action: GameAction) => void;
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
                  className={selected ? 'game-button gem-buy selected' : 'game-button gem-buy'}
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
}

function ResultPanel({
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
}

function AreaPanel({
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
}

function HoldPanel({
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
}

function WavePreviewPanel({
  snapshot,
  planning,
}: {
  snapshot: Snapshot;
  planning: boolean;
}) {
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
            <strong>{row.count}× {row.name}</strong>
            {row.tags.length > 0 && <span className="hint">{row.tags.join(' · ')}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function MazePanel({
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
}

function PlacedGemsPanel({
  snapshot,
  planning,
  dispatch,
}: {
  snapshot: Snapshot;
  planning: boolean;
  dispatch: (action: GameAction) => void;
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
}

function QuestPanel({
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
}

function RecipePanel() {
  return (
    <section className="game-card compact">
      <div className="card-header">
        <h2>Hybrids</h2>
      </div>
      <ul className="recipe-list">
        {hybridRecipes.map((recipe) => (
          <li key={recipe.id}>
            <strong>{recipe.label}</strong>
            <span className="hint">
              {gemDefinitions[recipe.inputs[0].family].name} L{recipe.inputs[0].level} +{' '}
              {gemDefinitions[recipe.inputs[1].family].name} L{recipe.inputs[1].level}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function UpgradePanel({
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
}

function UpgradeNode({
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
}
