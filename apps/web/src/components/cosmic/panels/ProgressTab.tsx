import { getRespecCost } from '../../../game/save';
import type { GameAction, SaveState, Snapshot } from '../../../game/types';
import { AreaPanel, RunMetaPanel, UpgradePanel } from './progress';

export function ProgressTab({
  snapshot,
  save,
  dispatch,
}: {
  snapshot: Snapshot;
  save: SaveState;
  dispatch: (action: GameAction) => void;
}) {
  const respecCost = getRespecCost(save);

  return (
    <>
      <AreaPanel save={save} dispatch={dispatch} />
      <RunMetaPanel snapshot={snapshot} />
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
  );
}
