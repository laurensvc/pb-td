import { memo, type CSSProperties } from 'react';
import { gemDefinitions } from '../../../game/content';
import { QUEST_REROLL_COST } from '../../../game/economy';
import { gemDisplayName, qualityName } from '../../../game/gems';
import { findMatchingRecipe, hybridRecipes } from '../../../game/recipes';
import type { GameAction, SaveState, Snapshot } from '../../../game/types';
import { gemTooltip } from './shared';

export const ProspectPanel = memo(function ProspectPanel({
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
  const showRoll =
    planning && (snapshot.buildStep === 'rocks' || snapshot.buildStep === 'prospect');
  const recipeMatches = rawRecipeMatches(snapshot);
  return (
    <section className="game-card">
      <div className="card-header">
        <h2>Raw gem roll</h2>
      </div>
      {!planning && <p className="hint">Five raw gems appear between waves.</p>}
      {planning && snapshot.buildStep === 'rocks' && (
        <p className="hint">
          Place all five raw gems. Commit one gem or upgrade; the rest become stone blocks.
        </p>
      )}
      {showRoll && (
        <>
          <div className="odds-strip" aria-label="Raw gem quality odds">
            <span>Level {snapshot.rawGemBuildLevel} odds</span>
            {snapshot.rawGemQualityOdds.map((entry) => (
              <strong key={entry.level}>
                {qualityName(entry.level)} {entry.chance}%
              </strong>
            ))}
          </div>
          <div className="gem-shop-grid">
            {snapshot.offers.map((offer, index) => {
              const def = gemDefinitions[offer.family];
              const raw = snapshot.rawGems[index];
              const placed = Boolean(raw);
              return (
                <button
                  key={`${offer.family}-${offer.level}-${index}`}
                  type="button"
                  title={gemTooltip(save, offer.family, offer.level)}
                  disabled={snapshot.buildStep === 'rocks' || !raw}
                  className={
                    placed
                      ? 'game-button gem-buy offer-card selected'
                      : 'game-button gem-buy offer-card'
                  }
                  style={{ '--tower-color': def.color } as CSSProperties}
                  onClick={() => {
                    if (raw) dispatch({ type: 'commitRawGem', rawGemId: raw.id });
                  }}
                >
                  <span className="tower-icon" />
                  <span>{def.name}</span>
                  <strong>{qualityName(offer.level)}</strong>
                  <span className="hint">{placed ? 'Commit' : 'Place on board'}</span>
                </button>
              );
            })}
          </div>
          {recipeMatches.length > 0 && (
            <div className="button-column">
              {recipeMatches.map((recipe) => (
                <button
                  key={recipe.id}
                  type="button"
                  className="game-button shop"
                  disabled={snapshot.buildStep !== 'prospect'}
                  onClick={() => dispatch({ type: 'commitRawRecipe', recipeId: recipe.id })}
                >
                  <span>Build upgrade</span>
                  <strong>{gemDisplayName(recipe.output.family, recipe.output.level)}</strong>
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            className="game-button shop"
            disabled={snapshot.rawGems.length > 0 || snapshot.gold < snapshot.prospectRerollCost}
            onClick={() => dispatch({ type: 'rerollOffers' })}
          >
            <span>Reroll raw gems</span>
            <strong>{snapshot.prospectRerollCost}g</strong>
          </button>
        </>
      )}
      {planning && snapshot.buildStep === 'ready' && (
        <p className="hint">Gem committed. The unused raw gems are now stone blocks.</p>
      )}
    </section>
  );
});

function rawRecipeMatches(snapshot: Snapshot) {
  if (snapshot.rawGems.length < 5) return [];
  const matches = new Map<string, (typeof hybridRecipes)[number]>();
  for (let i = 0; i < snapshot.rawGems.length; i++) {
    for (let j = i + 1; j < snapshot.rawGems.length; j++) {
      const recipe = findMatchingRecipe(snapshot.rawGems[i]!, snapshot.rawGems[j]!);
      if (recipe) matches.set(recipe.id, recipe);
    }
  }
  return [...matches.values()];
}

export const QuestPanel = memo(function QuestPanel({
  snapshot,
  planning,
  dispatch,
}: {
  snapshot: Snapshot;
  planning: boolean;
  dispatch: (action: GameAction) => void;
}) {
  return (
    <section className="game-card compact">
      <div className="card-header">
        <h2>Quests</h2>
      </div>
      <div className="quest-list">
        {snapshot.quests.map((quest) => (
          <article key={quest.id} className={quest.completed ? 'quest-row done' : 'quest-row'}>
            <div>
              <strong>{quest.label}</strong>
              <span>
                {Math.min(quest.progress, quest.target)}/{quest.target}
              </span>
            </div>
            <div className="quest-meta">
              <strong>{quest.completed ? 'Done' : `+${quest.rewardGold}g`}</strong>
              {!quest.completed && (
                <button
                  type="button"
                  className="game-button ghost"
                  disabled={!planning || snapshot.gold < QUEST_REROLL_COST}
                  onClick={() => dispatch({ type: 'rerollQuest', questId: quest.id })}
                >
                  Reroll {QUEST_REROLL_COST}g
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
});
