import { isPlanningPhase } from '../game/buildPhase';
import { canPlaceGemAt, canPlaceHoldGemAt, canPlaceRockAt } from '../game/boardQueries';
import type { GameState } from '../game/types';

export { isPlanningPhase };

export function canPlaceAtBoardPoint(state: GameState, x: number, y: number): boolean {
  if (state.status === 'running') return false;
  switch (state.placementMode) {
    case 'rock':
      return canPlaceRockAt(state, x, y);
    case 'hold':
      return canPlaceHoldGemAt(state, x, y);
    case 'gem':
      return canPlaceGemAt(state, x, y);
    default:
      return false;
  }
}
