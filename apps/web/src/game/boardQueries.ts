import { BOARD_HEIGHT, BOARD_WIDTH, getArea } from './content';
import { acceptsRock, parityMatchesPlacement } from './boardParity';
import { ROCKS_PER_PHASE, isPlanningPhase } from './buildPhase';
import { isOnBoard, worldToHex } from './hexGrid';
import { cellsAlongPath } from './pathBuild';
import { buildMazePathNav, canPlaceRock, createMazeLayout, hasValidPath } from './maze';
import { resolveCheckpoints } from './pathNav';
import type { GameState, Vec2 } from './types';

export function toCell(x: number, y: number): Vec2 {
  return worldToHex(x, y);
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function rockAtCell(state: GameState, x: number, y: number): boolean {
  return state.rocks.some((rock) => rock.x === x && rock.y === y);
}

export function gemAtCell(state: GameState, q: number, r: number): boolean {
  return state.gems.some((gem) => {
    const cell = worldToHex(gem.x, gem.y);
    return cell.x === q && cell.y === r;
  });
}

export function rawGemAtCell(state: GameState, q: number, r: number): boolean {
  return state.rawGems.some((raw) => raw.x === q && raw.y === r);
}

export function mazeLayoutFromState(state: GameState): ReturnType<typeof createMazeLayout> {
  const area = getArea(state.areaId);
  const corridorCells = cellsAlongPath(area.path);
  const checkpoints =
    area.pathNav.checkpoints.length > 0
      ? area.pathNav.checkpoints
      : resolveCheckpoints(area.path, corridorCells);
  return createMazeLayout(
    BOARD_WIDTH,
    BOARD_HEIGHT,
    checkpoints[0]!,
    checkpoints[checkpoints.length - 1]!,
    [...state.rocks, ...state.rawGems.map((raw) => ({ x: raw.x, y: raw.y, costPaid: 0 }))],
    state.gems.map((gem) => toCell(gem.x, gem.y)),
    checkpoints,
  );
}

export function rebuildPathNav(state: GameState): void {
  state.pathNav = buildMazePathNav(mazeLayoutFromState(state));
}

export function canPlaceRockAt(state: GameState, x: number, y: number): boolean {
  if (!isPlanningPhase(state.status)) return false;
  if (state.buildStep !== 'rocks') return false;
  if (state.rocksPlacedThisPhase >= ROCKS_PER_PHASE) return false;
  const cell = toCell(x, y);
  if (!isOnBoard(cell.x, cell.y, BOARD_WIDTH, BOARD_HEIGHT)) return false;
  if (!acceptsRock(cell.x, cell.y) || rockAtCell(state, cell.x, cell.y)) return false;
  if (rawGemAtCell(state, cell.x, cell.y)) return false;
  return canPlaceRock(mazeLayoutFromState(state), cell.x, cell.y);
}

export function canPlaceRawGemAt(state: GameState, x: number, y: number): boolean {
  if (!isPlanningPhase(state.status)) return false;
  if (state.buildStep !== 'rocks') return false;
  if (state.rawGems.length >= ROCKS_PER_PHASE) return false;
  const cell = toCell(x, y);
  if (!isOnBoard(cell.x, cell.y, BOARD_WIDTH, BOARD_HEIGHT)) return false;
  if (rockAtCell(state, cell.x, cell.y) || gemAtCell(state, cell.x, cell.y)) return false;
  if (rawGemAtCell(state, cell.x, cell.y)) return false;
  return canPlaceRock(mazeLayoutFromState(state), cell.x, cell.y);
}

export function canPlaceHoldGemAt(state: GameState, x: number, y: number): boolean {
  if (!isPlanningPhase(state.status) || !state.holdGem) return false;
  const cell = toCell(x, y);
  if (!isOnBoard(cell.x, cell.y, BOARD_WIDTH, BOARD_HEIGHT)) return false;
  return (
    parityMatchesPlacement(cell.x, cell.y, 'gem') &&
    !rockAtCell(state, cell.x, cell.y) &&
    !rawGemAtCell(state, cell.x, cell.y) &&
    !gemAtCell(state, cell.x, cell.y)
  );
}

export function canPlaceGemAt(state: GameState, x: number, y: number): boolean {
  if (!isPlanningPhase(state.status)) return false;
  const cell = toCell(x, y);
  if (!isOnBoard(cell.x, cell.y, BOARD_WIDTH, BOARD_HEIGHT)) return false;
  return (
    parityMatchesPlacement(cell.x, cell.y, 'gem') &&
    !rockAtCell(state, cell.x, cell.y) &&
    !rawGemAtCell(state, cell.x, cell.y) &&
    !gemAtCell(state, cell.x, cell.y) &&
    state.selectedInventoryGemId !== null
  );
}

export function rockPathLengthDelta(state: GameState, x: number, y: number): number | null {
  if (!isPlanningPhase(state.status) || state.buildStep !== 'rocks') return null;
  const cell = toCell(x, y);
  if (rockAtCell(state, cell.x, cell.y) || rawGemAtCell(state, cell.x, cell.y)) return null;
  const layout = mazeLayoutFromState(state);
  if (!canPlaceRock(layout, cell.x, cell.y)) return null;
  const before = state.pathNav.maxProgress;
  const area = getArea(state.areaId);
  const corridorCells = cellsAlongPath(area.path);
  const checkpoints =
    area.pathNav.checkpoints.length > 0
      ? area.pathNav.checkpoints
      : resolveCheckpoints(area.path, corridorCells);
  const newRocks = [
    ...state.rocks,
    ...state.rawGems.map((raw) => ({ x: raw.x, y: raw.y, costPaid: 0 })),
    { x: cell.x, y: cell.y, costPaid: 0 },
  ];
  const newLayout = createMazeLayout(
    BOARD_WIDTH,
    BOARD_HEIGHT,
    checkpoints[0]!,
    checkpoints[checkpoints.length - 1]!,
    newRocks,
    state.gems.map((gem) => toCell(gem.x, gem.y)),
    checkpoints,
  );
  if (!hasValidPath(newLayout)) return null;
  const after = buildMazePathNav(newLayout).maxProgress;
  return after - before;
}

export function previewRockPath(state: GameState, x: number, y: number): number | null {
  return rockPathLengthDelta(state, x, y);
}
