import type { ValidatedCommand } from '@facet/protocol';
import { dispatchGameAction } from './engine';
import type { GameAction, GameState, UiFeedback } from './types';

export function protocolCommandToActions(command: ValidatedCommand): GameAction[] {
  switch (command.commandType) {
    case 'PLACE_RAW_GEM': {
      const { x, y } = command.payload as { x: number; y: number };
      return [{ type: 'placeRawGem', x, y }];
    }
    case 'PLACE_ROCK': {
      const { x, y } = command.payload as { x: number; y: number };
      return [{ type: 'placeRock', x, y }];
    }
    case 'FINISH_ROCKS':
      return [{ type: 'finishRocks' }];
    case 'CLAIM_OFFER': {
      const { index } = command.payload as { index: number };
      return [{ type: 'claimOffer', index }];
    }
    case 'REROLL_OFFER':
    case 'REROLL_OFFERS':
      return [{ type: 'rerollOffers' }];
    case 'COMMIT_RAW_GEM': {
      const { rawGemId } = command.payload as { rawGemId: number };
      return [{ type: 'commitRawGem', rawGemId }];
    }
    case 'COMMIT_RAW_RECIPE':
    case 'CREATE_COMBINATION': {
      const { recipeId } = command.payload as { recipeId: string };
      return [{ type: 'commitRawRecipe', recipeId }];
    }
    case 'MERGE_GEMS': {
      const { sourceGemId, targetGemId } = command.payload as {
        sourceGemId: number;
        targetGemId: number;
      };
      return [
        { type: 'selectMergeSource', gemId: sourceGemId },
        { type: 'mergeGems', targetGemId },
      ];
    }
    case 'MERGE_TOWERS': {
      const { sourceId, targetId } = command.payload as { sourceId: number; targetId: number };
      return [
        { type: 'selectMergeSource', gemId: sourceId },
        { type: 'mergeGems', targetGemId: targetId },
      ];
    }
    case 'SELL_GEM':
    case 'SELL_TOWER': {
      const { gemId } = command.payload as { gemId: number };
      return [{ type: 'sellGem', gemId }];
    }
    case 'SELL_ROCK': {
      const { x, y } = command.payload as { x: number; y: number };
      return [{ type: 'sellRock', x, y }];
    }
    case 'UPGRADE_ROCK': {
      const { x, y } = command.payload as { x: number; y: number };
      return [{ type: 'upgradeRock', x, y }];
    }
    case 'SET_TARGETING': {
      const { gemId, mode } = command.payload as {
        gemId: number;
        mode: 'first' | 'last' | 'strong' | 'weak';
      };
      return [{ type: 'setGemTargeting', gemId, mode }];
    }
    case 'READY_FOR_WAVE':
      return [{ type: 'startWave' }];
    case 'REQUEST_SPEED': {
      const { speed } = command.payload as { speed: 1 | 2 | 4 };
      return [{ type: 'setGameSpeed', speed }];
    }
    case 'VOTE_PAUSE':
    case 'PING_TILE':
      return [];
    default:
      return [];
  }
}

export function applyProtocolCommand(state: GameState, command: ValidatedCommand): UiFeedback {
  let feedback: UiFeedback = {};
  for (const action of protocolCommandToActions(command)) {
    feedback = { ...feedback, ...dispatchGameAction(state, action) };
  }
  return feedback;
}
