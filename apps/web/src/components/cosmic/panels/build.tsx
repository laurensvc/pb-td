import { memo, type CSSProperties } from 'react';
import { gemDefinitions } from '../../../game/content';
import { buildStepLabel, ROCKS_PER_PHASE } from '../../../game/buildPhase';
import { gemDisplayName } from '../../../game/gems';
import type { GameAction, SaveState, Snapshot } from '../../../game/types';
import { GEM_LEVEL_COLORS, gemTooltip } from './shared';

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
              ? `Raw gems ${snapshot.rawGems.length}/${ROCKS_PER_PHASE}`
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
            Place raw gem ({snapshot.rocksRemaining} left)
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
        <p className="hint">Unused raw gems became stone blocks. Merge gems, then Start Wave.</p>
      )}
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
          className={
            snapshot.placementMode === 'merge' ? 'game-button small active' : 'game-button small'
          }
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
          Raw gem preview: {snapshot.rockPathDelta >= 0 ? '+' : ''}
          {snapshot.rockPathDelta} path tiles
        </p>
      )}
      <p className="hint">
        Commit one raw gem after all five are placed. The other four become stone blocks.
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
