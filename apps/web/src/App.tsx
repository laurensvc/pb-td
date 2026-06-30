import { useEffect, useState } from 'react';
import { isPlanningPhase } from './game/buildPhase';
import { getRespecCost } from './game/save';
import type { GameAction, Snapshot } from './game/types';
import { PhaserGameHost } from './components/PhaserGameHost';
import {
  AreaPanel,
  BuildPhasePanel,
  GreatGemsPanel,
  HoldPanel,
  MazePanel,
  PlacedGemsPanel,
  ProspectPanel,
  QuestPanel,
  RecipePanel,
  ResourcePill,
  ResultPanel,
  RunMetaPanel,
  UpgradePanel,
  WavePreviewPanel,
} from './components/cosmic/panels';
import { useCosmicGame } from './hooks/useCosmicGame';

type SideTab = 'build' | 'shop' | 'progress';

export default function App() {
  const { snapshot, dispatch, bridge } = useCosmicGame();
  const save = snapshot.save;
  const respecCost = getRespecCost(save);
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
          {tab === 'build' && (
            <>
              <BuildPhasePanel snapshot={snapshot} planning={planning} dispatch={dispatch} />
              <HoldPanel snapshot={snapshot} planning={planning} dispatch={dispatch} />
              <WavePreviewPanel snapshot={snapshot} planning={planning} />
              <MazePanel snapshot={snapshot} planning={planning} dispatch={dispatch} />
              <PlacedGemsPanel
                snapshot={snapshot}
                planning={planning}
                dispatch={dispatch}
                save={save}
              />
              <GreatGemsPanel snapshot={snapshot} />
              <RecipePanel save={save} />
            </>
          )}
          {tab === 'shop' && (
            <>
              <ProspectPanel
                snapshot={snapshot}
                planning={planning}
                dispatch={dispatch}
                save={save}
              />
              <QuestPanel snapshot={snapshot} planning={planning} dispatch={dispatch} />
            </>
          )}
          {tab === 'progress' && (
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
          )}
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
