import { Play, RefreshCw, Gem, Mountain } from 'lucide-react';
import { useFacetGame } from '../hooks/useFacetGame';
import { FacetBoardView } from './FacetBoardView';

export default function FacetApp() {
  const { snapshot, dispatch } = useFacetGame(42);

  const handleCellClick = (x: number, y: number) => {
    if (snapshot.phase === 'build') {
      if (snapshot.buildStep === 'rocks' && snapshot.rocksRemaining > 0) {
        dispatch({ type: 'PLACE_ROCK', x, y });
      } else if (snapshot.buildStep === 'upgrade' && snapshot.canUpgrade) {
        dispatch({ type: 'UPGRADE_ROCK', rockX: x, rockY: y });
      }
    }
  };

  return (
    <div className="facet-app">
      <div className="facet-hud">
        <span>
          Wave {snapshot.wave}/{6}
        </span>
        <span>♥ {snapshot.lives}</span>
        <span>🪙 {snapshot.gold}</span>
        <span className="facet-phase">
          {snapshot.phase} · {snapshot.buildStep}
        </span>
      </div>
      <div className="facet-main">
        <div className="facet-board-panel">
          <FacetBoardView snapshot={snapshot} onCellClick={handleCellClick} />
        </div>
        <aside className="facet-sidebar">
          <section>
            <h2>
              <Mountain size={16} /> Rocks
            </h2>
            <p>{snapshot.rocksRemaining}/5 remaining this phase</p>
          </section>
          <section>
            <h2>
              <Gem size={16} /> Prospect
            </h2>
            <ul className="offer-list">
              {snapshot.offers.map((o, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className="offer-btn"
                    disabled={snapshot.phase !== 'build'}
                    onClick={() => dispatch({ type: 'CLAIM_OFFER', index: i })}
                  >
                    {o.family} T{o.tier}
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn-secondary"
              disabled={snapshot.gold < snapshot.rerollCost}
              onClick={() => dispatch({ type: 'REROLL_OFFER' })}
            >
              <RefreshCw size={14} /> Reroll ({snapshot.rerollCost}g)
            </button>
            {snapshot.claimedOffer && (
              <p className="claimed">
                Claimed: {snapshot.claimedOffer.family} T{snapshot.claimedOffer.tier} — click a rock
              </p>
            )}
          </section>
          <section>
            <h2>Next wave</h2>
            <p>{snapshot.wavePreview}</p>
          </section>
          <section>
            <h2>Towers ({snapshot.towers.length})</h2>
            <ul className="tower-list">
              {snapshot.towers.map((t) => (
                <li key={t.id}>
                  {t.comboId ?? `${t.family} T${t.tier}`} @ ({t.x},{t.y})
                </li>
              ))}
            </ul>
          </section>
          {snapshot.phase === 'build' && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => dispatch({ type: 'READY' })}
            >
              <Play size={16} /> Start wave
            </button>
          )}
          {snapshot.phase === 'ended' && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => dispatch({ type: 'START_MATCH', seed: 42 })}
            >
              New match
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
