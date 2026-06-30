import { worldToHex } from '../../game/hexGrid';
import type { GameState, GemState, Vec2 } from '../../game/types';
import { isPlanningPhase } from '../boardInput';
import { cellCenter } from '../boardCoords';
import type { PhaserBridge } from '../bridge';
import { findRawGemAtCell } from '../render/placementGhost';

export function handleRightClick(bridge: PhaserBridge, state: GameState, cell: Vec2): void {
  const planning = isPlanningPhase(state.status);
  const raw = findRawGemAtCell(state, cell);
  if (planning && raw && (state.buildStep === 'rocks' || state.buildStep === 'prospect')) {
    bridge.dispatch({ type: 'removeRawGem', rawGemId: raw.id });
    return;
  }

  const rock = state.rocks.find((r) => r.x === cell.x && r.y === cell.y);
  if (rock) {
    const center = cellCenter(cell);
    bridge.dispatch({ type: 'sellRock', x: center.x, y: center.y });
    return;
  }
  const gem = findGemAtCell(state, cell);
  if (gem) {
    if (state.placementMode === 'gem' || planning) {
      bridge.dispatch({ type: 'pickUpGem', gemId: gem.id });
    } else {
      bridge.dispatch({ type: 'sellGem', gemId: gem.id });
    }
  }
}

export function findGemAtCell(state: GameState, cell: Vec2): GemState | undefined {
  return state.gems.find((g) => {
    const gemCell = worldToHex(g.x, g.y);
    return gemCell.x === cell.x && gemCell.y === cell.y;
  });
}
