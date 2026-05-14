import {
  Crown,
  Gauge,
  MousePointer2,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Undo2,
  Zap,
} from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { areaDefinitions, areaTierKey, getTower, upgrades } from './game/content';
import { canBuyUpgrade, isTierUnlocked } from './game/engine';
import { getRespecCost } from './game/save';
import type {
  GameAction,
  SaveState,
  Snapshot,
  TierId,
  TowerId,
  UpgradeBranch,
  UpgradeDefinition,
} from './game/types';
import { PhaserGameHost } from './components/PhaserGameHost';
import { useCosmicGame } from './hooks/useCosmicGame';

const branchLabels: Record<UpgradeBranch, string> = {
  missile: 'Orbital Barrage',
  kinetic: 'Kinetic',
  nature: 'Nature',
  arcane: 'Arcane',
  nova: 'Nova',
  unlock: 'Unlocks',
};

const branchOrder: UpgradeBranch[] = ['missile', 'kinetic', 'unlock', 'nature', 'arcane', 'nova'];

export default function App() {
  const controller = useCosmicGame();
  const { snapshot, dispatch, game } = controller;
  const save = game.current.save;
  const respecCost = getRespecCost(save);

  return (
    <main className="app-shell">
      <PhaserGameHost bridge={controller.bridge} />

      <section className="hud top-hud" aria-label="Run status">
        <div className="brand-block">
          <span className="eyebrow">Cosmic Siege</span>
          <strong>{snapshot.areaName}</strong>
          <span>
            Horde TD · {snapshot.tierId.toUpperCase()} · Wave {snapshot.wave}/{snapshot.totalWaves}
          </span>
        </div>
        <StatChip
          icon={<Target size={16} />}
          label="Lives"
          value={`${snapshot.lives}/${snapshot.maxLives}`}
        />
        <StatChip icon={<Sparkles size={16} />} label="Stars" value={snapshot.stars} />
        <StatChip icon={<Crown size={16} />} label="Crowns" value={snapshot.crowns} />
        <StatChip
          icon={<MousePointer2 size={16} />}
          label="Orbital strike"
          value={
            snapshot.missileCooldownLeft <= 0
              ? 'Ready'
              : `${snapshot.missileCooldownLeft.toFixed(1)}s`
          }
        />
        <button
          className="primary-action"
          type="button"
          disabled={!snapshot.canStartWave}
          onClick={() => dispatch({ type: 'startWave' })}
        >
          <Play size={17} />
          Start Wave
        </button>
      </section>

      <aside className="control-panel" aria-label="Progression and controls">
        <ResultPanel snapshot={snapshot} dispatch={dispatch} />
        <AreaPanel save={save} dispatch={dispatch} />
        <TowerPanel
          selectedTowerId={snapshot.selectedTowerId}
          loadout={snapshot.loadout}
          unlockedTowerIds={snapshot.unlockedTowerIds}
          dispatch={dispatch}
        />
        <UpgradePanel save={save} dispatch={dispatch} />
        <section className="panel compact">
          <div className="panel-heading">
            <h2>Save</h2>
            <button
              type="button"
              className="ghost-button"
              disabled={respecCost > save.stars}
              onClick={() => dispatch({ type: 'respecUpgrades' })}
              title="Refund upgrades, paying the respec fee."
            >
              <Undo2 size={15} />
              Respec {respecCost}
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={() => dispatch({ type: 'resetSave' })}
              title="Reset save"
            >
              <RotateCcw size={15} />
            </button>
          </div>
          <p className="microcopy">
            Attempt rewards: +{snapshot.attemptStars} stars, +{snapshot.attemptCrowns} crowns.
          </p>
        </section>
      </aside>
    </main>
  );
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="stat-chip">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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
    <section className="panel result-panel">
      <div>
        <h2>{snapshot.resultTitle}</h2>
        <p>{snapshot.resultMessage}</p>
      </div>
      <button type="button" className="primary-action" onClick={() => dispatch({ type: 'retry' })}>
        <RotateCcw size={17} />
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
    <section className="panel">
      <div className="panel-heading">
        <h2>Areas</h2>
        <Gauge size={16} />
      </div>
      <div className="area-list">
        {areaDefinitions.map((area) => (
          <article key={area.id} className="area-card">
            <div>
              <strong>{area.name}</strong>
              <span>{area.subtitle}</span>
            </div>
            <div className="tier-row">
              {(['normal', 'hard'] as const satisfies readonly TierId[]).map((tierId) => {
                const unlocked = isTierUnlocked(save, area.id, tierId);
                const cleared = save.clearedAreaTiers.includes(areaTierKey(area.id, tierId));
                return (
                  <button
                    key={tierId}
                    type="button"
                    disabled={!unlocked}
                    className={cleared ? 'tier-button cleared' : 'tier-button'}
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

function TowerPanel({
  selectedTowerId,
  loadout,
  unlockedTowerIds,
  dispatch,
}: {
  selectedTowerId: TowerId | null;
  loadout: TowerId[];
  unlockedTowerIds: TowerId[];
  dispatch: (action: GameAction) => void;
}) {
  const towerIds = Object.keys({
    kinetic: true,
    nature: true,
    arcane: true,
    nova: true,
  }) as TowerId[];
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Towers</h2>
        <span className="microcopy">Loadout {loadout.length}/3</span>
      </div>
      <div className="tower-grid">
        {towerIds.map((towerId) => {
          const tower = getTower(towerId);
          const unlocked = unlockedTowerIds.includes(towerId);
          const loaded = loadout.includes(towerId);
          const selected = selectedTowerId === towerId;
          return (
            <button
              key={towerId}
              type="button"
              disabled={!unlocked}
              className={selected ? 'tower-button selected' : 'tower-button'}
              onClick={() => {
                if (!loaded) {
                  dispatch({ type: 'selectLoadout', towerIds: [...loadout, towerId] });
                }
                dispatch({ type: 'selectTower', towerId });
              }}
              style={{ '--tower-color': tower.color } as CSSProperties}
            >
              <span className="tower-swatch" />
              <strong>{tower.name}</strong>
              <span>{unlocked ? tower.role : 'Locked in upgrade tree'}</span>
            </button>
          );
        })}
      </div>
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
    <section className="panel upgrade-panel">
      <div className="panel-heading">
        <h2>Upgrade Tree</h2>
        <Zap size={16} />
      </div>
      <div className="upgrade-tree">
        {grouped.map(({ branch, nodes }) => (
          <div key={branch} className={`upgrade-branch branch-${branch}`}>
            <h3>{branchLabels[branch]}</h3>
            <div className="node-list">
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
