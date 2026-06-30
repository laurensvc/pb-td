import { useEffect, useState, lazy, Suspense } from 'react';
import { isPlanningPhase } from './game/buildPhase';
import type { GameAction, Snapshot } from './game/types';
import { PhaserGameHost } from './components/PhaserGameHost';
import { ResourcePill, ResultPanel } from './components/cosmic/panels/hud';
import { useCosmicGame } from './hooks/useCosmicGame';

const BuildTab = lazy(() =>
  import('./components/cosmic/panels/BuildTab').then((m) => ({ default: m.BuildTab })),
);
const ShopTab = lazy(() =>
  import('./components/cosmic/panels/ShopTab').then((m) => ({ default: m.ShopTab })),
);
const ProgressTab = lazy(() =>
  import('./components/cosmic/panels/ProgressTab').then((m) => ({ default: m.ProgressTab })),
);

type SideTab = 'build' | 'shop' | 'progress';

export default function App() {
  const { snapshot, dispatch, bridge } = useCosmicGame();
  const save = snapshot.save;
  const planning = isPlanningPhase(snapshot.status);
  const [tab, setTab] = useState<SideTab>('build');

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === ' ' && snapshot.canStartWave) {
        event.preventDefault();
        dispatch({ type: 'startWave' });
      } else if (key === 'm' && planning && snapshot.buildStep === 'ready') {
        dispatch({ type: 'selectPlacementMode', mode: 'merge' });
      } else if (key === 'u' && planning && snapshot.mergeUndoCount > 0) {
        dispatch({ type: 'undoMerge' });
      } else if (key === '1') {
        dispatch({ type: 'setGameSpeed', speed: 1 });
      } else if (key === '2') {
        dispatch({ type: 'setGameSpeed', speed: 2 });
      } else if (key === '3') {
        dispatch({ type: 'setGameSpeed', speed: 4 });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, planning, snapshot.buildStep, snapshot.canStartWave, snapshot.mergeUndoCount]);

  return (
    <main className="app-shell">
      <PhaserGameHost bridge={bridge} />

      <GameHud snapshot={snapshot} dispatch={dispatch} />

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
          <Suspense fallback={<p className="hint">Loading panel…</p>}>
            {tab === 'build' && (
              <BuildTab snapshot={snapshot} planning={planning} dispatch={dispatch} save={save} />
            )}
            {tab === 'shop' && (
              <ShopTab snapshot={snapshot} planning={planning} dispatch={dispatch} save={save} />
            )}
            {tab === 'progress' && (
              <ProgressTab snapshot={snapshot} save={save} dispatch={dispatch} />
            )}
          </Suspense>
        </div>
      </aside>
    </main>
  );
}

function GameHud({
  snapshot,
  dispatch,
}: {
  snapshot: Snapshot;
  dispatch: (action: GameAction) => void;
}) {
  return (
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
        {snapshot.crystalDust > 0 && (
          <ResourcePill icon="gold" label="Dust" value={snapshot.crystalDust} />
        )}
      </div>

      <div className="hud-actions">
        <div className="wave-readout">
          <span>Path {snapshot.pathLength}</span>
          <span>
            Next +{snapshot.waveIncome}g · {snapshot.interestPreview}g interest
          </span>
          {snapshot.waveSpawnTracker ? (
            <span>
              Spawn {snapshot.waveSpawnTracker.spawned}/{snapshot.waveSpawnTracker.total} ·{' '}
              {snapshot.waveSpawnTracker.alive} alive · {snapshot.waveSpawnTracker.killed} killed
            </span>
          ) : (
            <span>
              Strike{' '}
              {snapshot.missileUnlocked
                ? snapshot.missileCooldownLeft <= 0
                  ? 'READY'
                  : `${snapshot.missileCooldownLeft.toFixed(1)}s`
                : 'LOCKED'}
            </span>
          )}
        </div>
        <div className="speed-controls">
          {([1, 2, 4] as const).map((speed) => (
            <button
              key={speed}
              type="button"
              className={
                snapshot.gameSpeed === speed ? 'game-button small active' : 'game-button small'
              }
              onClick={() => dispatch({ type: 'setGameSpeed', speed })}
            >
              {speed}x
            </button>
          ))}
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
  );
}
