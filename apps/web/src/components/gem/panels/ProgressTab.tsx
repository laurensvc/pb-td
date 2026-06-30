import type { GameAction, Snapshot } from '../../../game/types';
import { RunMetaPanel } from './progress';

export function ProgressTab({
  snapshot,
  dispatch,
}: {
  snapshot: Snapshot;
  dispatch: (action: GameAction) => void;
}) {
  return (
    <>
      <RunMetaPanel snapshot={snapshot} />
      <section className="game-card compact">
        <div className="card-header">
          <h2>Save</h2>
          <div className="card-actions">
            <button
              type="button"
              className="game-button ghost danger"
              onClick={() => dispatch({ type: 'resetSave' })}
            >
              Reset
            </button>
          </div>
        </div>
        <p className="hint">Local preferences and future replay history only. No account power.</p>
      </section>
    </>
  );
}
