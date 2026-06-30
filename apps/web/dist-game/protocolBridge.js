import { dispatchGameAction } from './engine';
export function protocolCommandToActions(command) {
    switch (command.commandType) {
        case 'PLACE_RAW_GEM': {
            const { x, y } = command.payload;
            return [{ type: 'placeRawGem', x, y }];
        }
        case 'PLACE_ROCK': {
            const { x, y } = command.payload;
            return [{ type: 'placeRock', x, y }];
        }
        case 'FINISH_ROCKS':
            return [{ type: 'finishRocks' }];
        case 'CLAIM_OFFER': {
            const { index } = command.payload;
            return [{ type: 'claimOffer', index }];
        }
        case 'REROLL_OFFER':
        case 'REROLL_OFFERS':
            return [{ type: 'rerollOffers' }];
        case 'COMMIT_RAW_GEM': {
            const { rawGemId } = command.payload;
            return [{ type: 'commitRawGem', rawGemId }];
        }
        case 'COMMIT_RAW_RECIPE':
        case 'CREATE_COMBINATION': {
            const { recipeId } = command.payload;
            return [{ type: 'commitRawRecipe', recipeId }];
        }
        case 'MERGE_GEMS': {
            const { sourceGemId, targetGemId } = command.payload;
            return [
                { type: 'selectMergeSource', gemId: sourceGemId },
                { type: 'mergeGems', targetGemId },
            ];
        }
        case 'MERGE_TOWERS': {
            const { sourceId, targetId } = command.payload;
            return [
                { type: 'selectMergeSource', gemId: sourceId },
                { type: 'mergeGems', targetGemId: targetId },
            ];
        }
        case 'SELL_GEM':
        case 'SELL_TOWER': {
            const { gemId } = command.payload;
            return [{ type: 'sellGem', gemId }];
        }
        case 'SELL_ROCK': {
            const { x, y } = command.payload;
            return [{ type: 'sellRock', x, y }];
        }
        case 'UPGRADE_ROCK': {
            const { x, y } = command.payload;
            return [{ type: 'upgradeRock', x, y }];
        }
        case 'SET_TARGETING': {
            const { gemId, mode } = command.payload;
            return [{ type: 'setGemTargeting', gemId, mode }];
        }
        case 'READY_FOR_WAVE':
            return [{ type: 'startWave' }];
        case 'REQUEST_SPEED': {
            const { speed } = command.payload;
            return [{ type: 'setGameSpeed', speed }];
        }
        case 'VOTE_PAUSE':
        case 'PING_TILE':
            return [];
        default:
            return [];
    }
}
export function applyProtocolCommand(state, command) {
    let feedback = {};
    for (const action of protocolCommandToActions(command)) {
        feedback = { ...feedback, ...dispatchGameAction(state, action) };
    }
    return feedback;
}
