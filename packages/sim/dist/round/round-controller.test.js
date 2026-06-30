import { loadGameContent } from '@facet/content';
import { describe, expect, it, beforeEach } from 'vitest';
import { PLACEMENT_CHARGES_PER_ROUND } from '../constants.js';
import { RoundController, resetEntityIdCounter } from './round-controller.js';
describe('RoundController', () => {
    const content = loadGameContent();
    beforeEach(() => {
        resetEntityIdCounter();
    });
    function legalPlacementSlots(controller) {
        const slots = [];
        for (let gy = 24; gy < 120; gy += 4) {
            for (let gx = 24; gx < 120; gx += 4) {
                const phase = controller.phase;
                if (phase === 'selection')
                    return slots;
                if (phase !== 'placement')
                    return slots;
                const result = controller.placeCandidate(gx, gy);
                if (result.ok) {
                    slots.push({ gx, gy });
                }
                if (controller.phase === 'selection')
                    return slots;
            }
        }
        throw new Error('Could not place 5 candidates');
    }
    it('starts in countdown and moves to placement', () => {
        const controller = new RoundController(content, { seed: 1 });
        expect(controller.phase).toBe('countdown');
        controller.skipCountdown();
        expect(controller.phase).toBe('placement');
        expect(controller.placementCharges).toBe(PLACEMENT_CHARGES_PER_ROUND);
    });
    it('transitions placement → selection after 5 placements', () => {
        const controller = new RoundController(content, { seed: 2 });
        controller.skipCountdown();
        legalPlacementSlots(controller);
        expect(controller.phase).toBe('selection');
        expect(controller.candidates).toHaveLength(5);
    });
    it('resolve keep → combat with rocks and path cache', () => {
        const controller = new RoundController(content, { seed: 3 });
        controller.skipCountdown();
        legalPlacementSlots(controller);
        const keep = controller.getSelectionActions().find((a) => a.kind === 'keep');
        controller.resolveSelection(keep);
        expect(controller.phase).toBe('combat');
        expect(controller.towers).toHaveLength(1);
        expect(controller.rocks).toHaveLength(4);
        expect(controller.pathCache).not.toBeNull();
    });
    it('rejects illegal phase transitions', () => {
        const controller = new RoundController(content, { seed: 4 });
        expect(() => controller.resolveSelection({ kind: 'keep', candidateId: 'x' })).toThrow();
    });
    it('completeWave advances level and returns to placement', () => {
        const controller = new RoundController(content, { seed: 5 });
        controller.skipCountdown();
        legalPlacementSlots(controller);
        controller.resolveSelection(controller.getSelectionActions().find((a) => a.kind === 'keep'));
        controller.completeWave();
        expect(controller.level).toBe(2);
        expect(controller.phase).toBe('placement');
        expect(controller.gold).toBeGreaterThan(10);
    });
});
