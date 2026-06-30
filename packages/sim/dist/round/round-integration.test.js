import { loadGameContent } from '@facet/content';
import { describe, expect, it, beforeEach } from 'vitest';
import { PLACEMENT_CHARGES_PER_ROUND, SIM_HZ } from '../constants.js';
import { RoundController, resetEntityIdCounter } from './round-controller.js';
function contentWithTinyWave() {
    const content = loadGameContent();
    return {
        ...content,
        waves: content.waves.map((w, i) => i === 0
            ? {
                ...w,
                clearCount: 1,
                spawn: {
                    entries: [{ enemyId: 'stone-grunt', count: 1 }],
                    spawnIntervalMs: 0,
                    groupDelayMs: 0,
                    concurrent: false,
                },
            }
            : w),
    };
}
describe('full round integration', () => {
    const content = contentWithTinyWave();
    beforeEach(() => {
        resetEntityIdCounter();
    });
    function placeFive(controller) {
        for (let gy = 24; gy < 120; gy += 4) {
            for (let gx = 24; gx < 120; gx += 4) {
                if (controller.phase !== 'placement')
                    return;
                const result = controller.placeCandidate(gx, gy);
                if (result.ok && controller.placementCharges === 0)
                    return;
            }
        }
        throw new Error('Could not place 5 candidates');
    }
    it('place → keep → combat → wave clear → next placement', () => {
        const controller = new RoundController(content, { seed: 42 });
        controller.skipCountdown();
        placeFive(controller);
        const keep = controller.getSelectionActions().find((a) => a.kind === 'keep');
        controller.resolveSelection(keep);
        expect(controller.phase).toBe('combat');
        expect(controller.combatSession).not.toBeNull();
        const startGold = controller.gold;
        let ticks = 0;
        while (controller.phase === 'combat' && ticks < 8000) {
            controller.tick(1 / SIM_HZ);
            ticks++;
        }
        expect(controller.phase).toBe('placement');
        expect(controller.level).toBe(2);
        expect(controller.placementCharges).toBe(PLACEMENT_CHARGES_PER_ROUND);
        expect(controller.gold).toBeGreaterThan(startGold);
        expect(controller.towers.length).toBeGreaterThanOrEqual(1);
        expect(controller.rocks.length).toBe(4);
    });
});
