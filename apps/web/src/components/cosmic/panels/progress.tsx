import { memo, type CSSProperties } from 'react';
import {
  areaDefinitions,
  areaTierKey,
  BASE_GEM_FAMILIES,
  gemDefinitions,
  upgrades,
} from '../../../game/content';
import { hybridRecipes } from '../../../game/recipes';
import { canBuyUpgrade, isTierUnlocked } from '../../../game/upgrades';
import type {
  GameAction,
  SaveState,
  Snapshot,
  TierId,
  UpgradeBranch,
  UpgradeDefinition,
} from '../../../game/types';
import { gemTooltip } from './shared';

const branchLabels: Record<UpgradeBranch, string> = {
  missile: 'Orbital',
  kinetic: 'Kinetic',
  verdant: 'Verdant',
  arcane: 'Arcane',
  nova: 'Nova',
  prism: 'Prism',
  ember: 'Ember',
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
  'ember',
];

export const AreaPanel = memo(function AreaPanel({
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
});

export const GreatGemsPanel = memo(function GreatGemsPanel({ snapshot }: { snapshot: Snapshot }) {
  return (
    <section className="game-card compact">
      <div className="card-header">
        <h2>Great gems</h2>
        <span className="hint">L7 unlocks</span>
      </div>
      <div className="chip-grid">
        {BASE_GEM_FAMILIES.map((family) => {
          const unlocked = snapshot.greatUnlocked.includes(family);
          const def = gemDefinitions[family];
          return (
            <div
              key={family}
              className={unlocked ? 'gem-chip great-unlocked' : 'gem-chip great-locked'}
              style={{ '--tower-color': def.color } as CSSProperties}
              title={
                unlocked ? `${def.name} great craft unlocked` : `Complete quest to unlock ${def.name} L7`
              }
            >
              <span className="tower-icon" />
              <strong>{def.name}</strong>
              <span className="hint">{unlocked ? 'Great ✓' : 'Locked'}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
});

export const RunMetaPanel = memo(function RunMetaPanel({ snapshot }: { snapshot: Snapshot }) {
  return (
    <section className="game-card compact">
      <div className="card-header">
        <h2>Run meta</h2>
      </div>
      <p className="hint mono">Seed {snapshot.runSeed}</p>
      <p className="hint">Speed {snapshot.gameSpeed}x · Space start · M merge · U undo</p>
      <p className="hint">Crystal dust: {snapshot.crystalDust} (cosmetic meta)</p>
    </section>
  );
});

export const RecipePanel = memo(function RecipePanel({ save }: { save: SaveState }) {
  return (
    <section className="game-card compact">
      <div className="card-header">
        <h2>Hybrids</h2>
      </div>
      <ul className="recipe-list">
        {hybridRecipes.map((recipe) => {
          const a = gemDefinitions[recipe.inputs[0].family];
          const b = gemDefinitions[recipe.inputs[1].family];
          const out = gemDefinitions[recipe.output.family];
          return (
            <li key={recipe.id} title={gemTooltip(save, recipe.output.family, recipe.output.level)}>
              <div className="recipe-row">
                <span className="tower-icon" style={{ '--tower-color': a.color } as CSSProperties} />
                <span className="tower-icon" style={{ '--tower-color': b.color } as CSSProperties} />
                <span className="recipe-arrow">→</span>
                <span className="tower-icon" style={{ '--tower-color': out.color } as CSSProperties} />
                <strong>{recipe.label}</strong>
              </div>
              <span className="hint">
                {a.name} L{recipe.inputs[0].level} + {b.name} L{recipe.inputs[1].level}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
});

const UpgradeNode = memo(function UpgradeNode({
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
});

export const UpgradePanel = memo(function UpgradePanel({
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
});
