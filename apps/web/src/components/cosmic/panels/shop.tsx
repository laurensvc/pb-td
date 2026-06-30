import { memo, type CSSProperties } from 'react';
import { gemDefinitions } from '../../../game/content';
import { QUEST_REROLL_COST } from '../../../game/economy';
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
  const showOffers =
    planning && (snapshot.buildStep === 'prospect' || snapshot.buildStep === 'upgrade');
  return (
    <section className="game-card">
      <div className="card-header">
        <h2>Prospect</h2>
      </div>
      {!planning && <p className="hint">Offers appear between waves during build phase.</p>}
      {planning && snapshot.buildStep === 'rocks' && (
        <p className="hint">Place rocks first, then pick a gem offer.</p>
      )}
      {showOffers && (
        <>
          <div className="gem-shop-grid">
            {snapshot.offers.map((offer, index) => {
              const def = gemDefinitions[offer.family];
              const selected =
                snapshot.claimedOffer?.family === offer.family &&
                snapshot.claimedOffer.level === offer.level;
              return (
                <button
                  key={`${offer.family}-${offer.level}-${index}`}
                  type="button"
                  title={gemTooltip(save, offer.family, offer.level)}
                  className={
                    selected
                      ? 'game-button gem-buy offer-card selected'
                      : 'game-button gem-buy offer-card'
                  }
                  style={{ '--tower-color': def.color } as CSSProperties}
                  onClick={() => dispatch({ type: 'claimOffer', index })}
                >
                  <span className="tower-icon" />
                  <span>{def.name}</span>
                  <strong>L{offer.level}</strong>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="game-button shop"
            disabled={snapshot.gold < snapshot.prospectRerollCost}
            onClick={() => dispatch({ type: 'rerollOffers' })}
          >
            <span>Reroll offers</span>
            <strong>{snapshot.prospectRerollCost}g</strong>
          </button>
        </>
      )}
      {planning && snapshot.buildStep === 'ready' && (
        <p className="hint">Offer claimed. Merge towers, then start the wave.</p>
      )}
    </section>
  );
});

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
