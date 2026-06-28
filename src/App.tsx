import {
  Coins,
  Crown,
  Gem,
  Gauge,
  Gift,
  Merge,
  Mountain,
  MousePointer2,
  Play,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Target,
  Undo2,
  Zap,
} from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import {
  LUCKY_BOX_COST,
  RANDOM_GEM_COST,
  areaDefinitions,
  areaTierKey,
  gemDefinitions,
  upgrades,
} from './game/content';
import { canBuyUpgrade, isTierUnlocked } from './game/engine';
import { gemDisplayName } from './game/gems';
import { getRespecCost } from './game/save';
import type {
  GameAction,
  GemFamilyId,
  GemLevel,
  InventoryGem,
  SaveState,
  Snapshot,
  TierId,
  UpgradeBranch,
  UpgradeDefinition,
} from './game/types';
import { PhaserGameHost } from './components/PhaserGameHost';
import { useCosmicGame } from './hooks/useCosmicGame';

const branchLabels: Record<UpgradeBranch, string> = {
  missile: 'Orbital Barrage',
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

const GEM_FAMILIES: GemFamilyId[] = ['kinetic', 'verdant', 'arcane', 'nova', 'prism'];

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

  return (
    <main className="app-shell">
      <PhaserGameHost bridge={controller.bridge} />

      <section className="hud top-hud" aria-label="Run status">
        <div className="brand-block">
          <span className="eyebrow">Cosmic Gem Siege</span>
          <strong>{snapshot.areaName}</strong>
          <span>
            GemTD · {snapshot.tierId.toUpperCase()} · Wave {snapshot.wave}/{snapshot.totalWaves}
            {snapshot.isBossWave ? ' · BOSS' : ''}
          </span>
        </div>
        <StatChip icon={<Coins size={16} />} label="Gold" value={snapshot.gold} />
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
        <ShopPanel snapshot={snapshot} planning={planning} dispatch={dispatch} />
        <MazePanel snapshot={snapshot} planning={planning} dispatch={dispatch} />
        <InventoryPanel snapshot={snapshot} planning={planning} dispatch={dispatch} />
        <PlacedGemsPanel snapshot={snapshot} planning={planning} dispatch={dispatch} />
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

function ShopPanel({
  snapshot,
  planning,
  dispatch,
}: {
  snapshot: Snapshot;
  planning: boolean;
  dispatch: (action: GameAction) => void;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Shop</h2>
        <ShoppingBag size={16} />
      </div>
      <div className="shop-grid">
        <button
          type="button"
          disabled={!planning || snapshot.gold < RANDOM_GEM_COST}
          className="shop-button"
          onClick={() => dispatch({ type: 'buyRandomGem' })}
        >
          <Gift size={15} />
          <span>Random gem</span>
          <strong>{RANDOM_GEM_COST}g</strong>
        </button>
        <button
          type="button"
          disabled={!planning || snapshot.gold < LUCKY_BOX_COST}
          className="shop-button"
          onClick={() => dispatch({ type: 'buyLuckyBox' })}
        >
          <Sparkles size={15} />
          <span>Lucky box</span>
          <strong>{LUCKY_BOX_COST}g</strong>
        </button>
      </div>
      <div className="gem-shop-row">
        {GEM_FAMILIES.map((family) => {
          const def = gemDefinitions[family];
          const unlocked = snapshot.unlockedGemFamilies.includes(family);
          return (
            <button
              key={family}
              type="button"
              disabled={!planning || !unlocked || snapshot.gold < def.shopCost}
              className="gem-shop-button"
              style={{ '--tower-color': def.color } as CSSProperties}
              onClick={() => dispatch({ type: 'buyGem', family })}
            >
              <span className="tower-swatch" />
              <span>{def.name}</span>
              <strong>{unlocked ? `${def.shopCost}g` : 'Locked'}</strong>
            </button>
          );
        })}
      </div>
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
    <section className="panel">
      <div className="panel-heading">
        <h2>Maze</h2>
        <Mountain size={16} />
      </div>
      <div className="tier-row">
        <button
          type="button"
          disabled={!planning}
          className={snapshot.placementMode === 'rock' ? 'tier-button cleared' : 'tier-button'}
          onClick={() => dispatch({ type: 'selectPlacementMode', mode: 'rock' })}
        >
          Place rock ({snapshot.rockCost}g)
        </button>
        <button
          type="button"
          disabled={!planning}
          className={snapshot.placementMode === 'gem' ? 'tier-button cleared' : 'tier-button'}
          onClick={() => dispatch({ type: 'selectPlacementMode', mode: 'gem' })}
        >
          Place gem
        </button>
        <button
          type="button"
          disabled={!planning}
          className={snapshot.placementMode === 'merge' ? 'tier-button cleared' : 'tier-button'}
          onClick={() => dispatch({ type: 'selectPlacementMode', mode: 'merge' })}
        >
          <Merge size={14} />
          Merge
        </button>
      </div>
      <p className="microcopy">
        Rocks: {snapshot.rockCount}. Right-click rocks/gems on board to sell. Merge same family +
        level gems.
      </p>
    </section>
  );
}

function InventoryPanel({
  snapshot,
  planning,
  dispatch,
}: {
  snapshot: Snapshot;
  planning: boolean;
  dispatch: (action: GameAction) => void;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Inventory</h2>
        <Gem size={16} />
      </div>
      {snapshot.inventory.length === 0 ? (
        <p className="microcopy">No gems in inventory. Buy from shop between waves.</p>
      ) : (
        <div className="inventory-grid">
          {snapshot.inventory.map((gem) => (
            <InventoryGemButton
              key={gem.id}
              gem={gem}
              selected={snapshot.selectedInventoryGemId === gem.id}
              disabled={!planning}
              onSelect={() => dispatch({ type: 'selectInventoryGem', gemId: gem.id })}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function InventoryGemButton({
  gem,
  selected,
  disabled,
  onSelect,
}: {
  gem: InventoryGem;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const def = gemDefinitions[gem.family];
  return (
    <button
      type="button"
      disabled={disabled}
      className={selected ? 'gem-chip selected' : 'gem-chip'}
      style={
        {
          '--tower-color': def.color,
          '--gem-level-opacity': GEM_LEVEL_COLORS[gem.level],
        } as CSSProperties
      }
      onClick={onSelect}
    >
      <span className="tower-swatch" />
      <strong>{gemDisplayName(gem.family, gem.level)}</strong>
    </button>
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
    <section className="panel compact">
      <div className="panel-heading">
        <h2>Placed Gems</h2>
        <span className="microcopy">{snapshot.placedGems.length} on board</span>
      </div>
      <div className="inventory-grid">
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
                  dispatch({ type: 'sellGem', gemId: gem.id });
                }
              }}
            >
              <span className="tower-swatch" />
              <strong>{gemDisplayName(gem.family, gem.level)}</strong>
              <span className="microcopy">
                {snapshot.placementMode === 'merge' ? 'Merge target' : 'Sell'}
              </span>
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
