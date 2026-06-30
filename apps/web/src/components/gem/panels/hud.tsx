import { memo } from 'react';
import type { GameAction, Snapshot } from '../../../game/types';

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
