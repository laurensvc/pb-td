import { gemDefinitions } from '../../game/content';
import { getGemCombatStats } from '../../game/gems';
import type { GameState, GemFamilyId, GemLevel, Vec2 } from '../../game/types';
import { gemTextureKey } from '../assetManifest';
import { canPlaceAtBoardPoint } from '../boardInput';
import { cellCenter } from '../boardCoords';

export interface PlacementGhostInfo {
  textureKey: string;
  family: GemFamilyId;
  level: GemLevel;
  canPlace: boolean;
  showRange: boolean;
  range: number;
  rangeColor: string;
}

export function resolvePlacementGhost(
  state: GameState,
  hoverCell: Vec2 | null,
): PlacementGhostInfo | null {
  if (!hoverCell || state.status === 'running') return null;
  const boardPoint = cellCenter(hoverCell);

  if (state.buildStep === 'prospect') {
    const raw = state.rawGems.find((gem) => gem.x === hoverCell.x && gem.y === hoverCell.y);
    if (!raw) return null;
    const def = gemDefinitions[raw.family];
    const stats = getGemCombatStats(state.save, raw.family, raw.level);
    return {
      textureKey: gemTextureKey(raw.family, raw.level),
      family: raw.family,
      level: raw.level,
      canPlace: true,
      showRange: true,
      range: stats.range,
      rangeColor: def.color,
    };
  }

  if (state.buildStep === 'rocks' && state.placementMode === 'rock') {
    const offer = state.offers[state.rawGems.length];
    if (!offer) return null;
    return {
      textureKey: gemTextureKey(offer.family, offer.level),
      family: offer.family,
      level: offer.level,
      canPlace: canPlaceAtBoardPoint(state, boardPoint.x, boardPoint.y),
      showRange: false,
      range: 0,
      rangeColor: gemDefinitions[offer.family].color,
    };
  }

  if (state.placementMode === 'gem' && state.selectedInventoryGemId !== null) {
    const inv = state.inventory.find((item) => item.id === state.selectedInventoryGemId);
    if (!inv) return null;
    const def = gemDefinitions[inv.family];
    const stats = getGemCombatStats(state.save, inv.family, inv.level);
    return {
      textureKey: gemTextureKey(inv.family, inv.level),
      family: inv.family,
      level: inv.level,
      canPlace: canPlaceAtBoardPoint(state, boardPoint.x, boardPoint.y),
      showRange: true,
      range: stats.range,
      rangeColor: def.color,
    };
  }

  if (state.placementMode === 'hold' && state.holdGem) {
    const hold = state.holdGem;
    return {
      textureKey: gemTextureKey(hold.family, hold.level),
      family: hold.family,
      level: hold.level,
      canPlace: canPlaceAtBoardPoint(state, boardPoint.x, boardPoint.y),
      showRange: false,
      range: 0,
      rangeColor: gemDefinitions[hold.family].color,
    };
  }

  return null;
}

export function findRawGemAtCell(
  state: GameState,
  cell: Vec2,
): GameState['rawGems'][number] | undefined {
  return state.rawGems.find((raw) => raw.x === cell.x && raw.y === cell.y);
}
