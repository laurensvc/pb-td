import { buildInitialBoardGrid, isWalkableCell, } from '@facet/content';
import { GEM_FOOTPRINT } from '../constants.js';
import { footprintCells, footprintInBounds, footprintsOverlap } from './footprint.js';
function blockingIndex(width, gx, gy) {
    return gy * width + gx;
}
export function createSimBoard(board) {
    const terrain = buildInitialBoardGrid(board);
    const blocking = new Uint8Array(board.width * board.height);
    return {
        board,
        terrain,
        blocking,
        structures: [],
        mazeVersion: 0,
    };
}
export function cloneBlocking(sim) {
    return new Uint8Array(sim.blocking);
}
export function isCellBlocked(sim, gx, gy, extraBlocking) {
    const blocked = sim.blocking[blockingIndex(sim.board.width, gx, gy)] === 1 ||
        extraBlocking?.[blockingIndex(sim.board.width, gx, gy)] === 1;
    return blocked;
}
export function terrainKind(sim, gx, gy) {
    return sim.terrain.cells[gy][gx];
}
export function isGroundWalkable(sim, gx, gy, extraBlocking) {
    const kind = terrainKind(sim, gx, gy);
    if (kind === 'forced_walkable')
        return true;
    if (isCellBlocked(sim, gx, gy, extraBlocking))
        return false;
    return isWalkableCell(kind);
}
export function isFootprintBuildable(sim, gx, gy, extraBlocking, footprint = GEM_FOOTPRINT) {
    if (!footprintInBounds(gx, gy, sim.board.width, sim.board.height, footprint)) {
        return false;
    }
    for (const cell of footprintCells(gx, gy, footprint)) {
        const kind = terrainKind(sim, cell.gx, cell.gy);
        if (kind !== 'buildable_grass')
            return false;
        if (isCellBlocked(sim, cell.gx, cell.gy, extraBlocking))
            return false;
    }
    return true;
}
export function overlapsStructure(sim, gx, gy, footprint = GEM_FOOTPRINT, ignoreId) {
    for (const structure of sim.structures) {
        if (ignoreId && structure.id === ignoreId)
            continue;
        if (footprintsOverlap(gx, gy, structure.gx, structure.gy, footprint)) {
            return true;
        }
    }
    return false;
}
export function setFootprintBlocked(blocking, width, gx, gy, footprint = GEM_FOOTPRINT, value = 1) {
    for (const cell of footprintCells(gx, gy, footprint)) {
        blocking[blockingIndex(width, cell.gx, cell.gy)] = value;
    }
}
export function rebuildBlocking(sim) {
    sim.blocking.fill(0);
    for (const structure of sim.structures) {
        setFootprintBlocked(sim.blocking, sim.board.width, structure.gx, structure.gy, structure.footprint, 1);
    }
}
export function addStructure(sim, structure) {
    sim.structures.push(structure);
    rebuildBlocking(sim);
    sim.mazeVersion += 1;
}
export function removeStructure(sim, id) {
    const before = sim.structures.length;
    sim.structures = sim.structures.filter((s) => s.id !== id);
    if (sim.structures.length !== before) {
        rebuildBlocking(sim);
        sim.mazeVersion += 1;
    }
}
export function removeStructures(sim, ids) {
    const before = sim.structures.length;
    sim.structures = sim.structures.filter((s) => !ids.has(s.id));
    if (sim.structures.length !== before) {
        rebuildBlocking(sim);
        sim.mazeVersion += 1;
    }
}
/** Trial-place footprint without mutating sim state. Returns a blocking overlay copy. */
export function trialFootprintBlocking(sim, gx, gy, footprint = GEM_FOOTPRINT) {
    const trial = cloneBlocking(sim);
    setFootprintBlocked(trial, sim.board.width, gx, gy, footprint, 1);
    return trial;
}
