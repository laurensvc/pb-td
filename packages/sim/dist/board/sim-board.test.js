import { loadGameContent } from '@facet/content';
import { describe, expect, it } from 'vitest';
import { addStructure, createSimBoard, isFootprintBuildable, isGroundWalkable, rebuildBlocking, } from './sim-board.js';
import { allLegsReachable } from '../pathfinding/astar.js';
import { findBuildableFootprint } from '../test-helpers.js';
describe('SimBoard', () => {
    const content = loadGameContent();
    it('starts with walkable interior grass', () => {
        const sim = createSimBoard(content.board);
        const { gx, gy } = findBuildableFootprint(sim);
        expect(isFootprintBuildable(sim, gx, gy)).toBe(true);
        expect(isGroundWalkable(sim, gx, gy)).toBe(true);
    });
    it('marks structure footprints as blocked', () => {
        const sim = createSimBoard(content.board);
        const { gx, gy } = findBuildableFootprint(sim);
        addStructure(sim, {
            id: 'rock-1',
            gx,
            gy,
            kind: 'rock',
            footprint: 2,
        });
        rebuildBlocking(sim);
        expect(isGroundWalkable(sim, gx, gy)).toBe(false);
        expect(isFootprintBuildable(sim, gx, gy)).toBe(false);
    });
    it('keeps forced_walkable bypass open when blocked nearby', () => {
        const sim = createSimBoard(content.board);
        addStructure(sim, {
            id: 'wall',
            gx: 10,
            gy: 118,
            kind: 'rock',
            footprint: 2,
        });
        expect(isGroundWalkable(sim, 5, 120)).toBe(true);
    });
    it('invalidates route when sealing a leg', () => {
        const sim = createSimBoard(content.board);
        const routeId = content.board.defaultRouteId;
        expect(allLegsReachable(content.board, sim, routeId)).toBe(true);
        for (let gy = 60; gy < 80; gy += 2) {
            for (let gx = 60; gx < 80; gx += 2) {
                addStructure(sim, {
                    id: `seal-${gx}-${gy}`,
                    gx,
                    gy,
                    kind: 'rock',
                    footprint: 2,
                });
            }
        }
        expect(allLegsReachable(content.board, sim, routeId)).toBe(false);
    });
});
