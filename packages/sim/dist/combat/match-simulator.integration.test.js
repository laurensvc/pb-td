import { loadGameContent } from '@facet/content';
import { describe, expect, it, beforeEach } from 'vitest';
import { PLACEMENT_CHARGES_PER_ROUND } from '../constants.js';
import { MatchSimulator, runCombatUntilWaveEnd } from './match-simulator.js';
import { resetCreepIdCounter } from './creep-factory.js';
import { RoundController, resetEntityIdCounter } from '../round/round-controller.js';
describe('MatchSimulator integration', () => {
    const content = loadGameContent();
    beforeEach(() => {
        resetEntityIdCounter();
        resetCreepIdCounter();
    });
    function placeFiveAndKeep(seed) {
        const match = new RoundController(content, { seed });
        match.skipCountdown();
        let placed = 0;
        outer: for (let gy = 24; gy < 120; gy += 4) {
            for (let gx = 24; gx < 120; gx += 4) {
                if (match.phase !== 'placement')
                    break outer;
                const result = match.placeCandidate(gx, gy);
                if (result.ok) {
                    placed += 1;
                    if (placed >= PLACEMENT_CHARGES_PER_ROUND)
                        break outer;
                }
            }
        }
        const keep = match.getSelectionActions().find((a) => a.kind === 'keep');
        match.resolveSelection(keep);
        return match;
    }
    it('runs a full round: place → keep → combat wave → placement', () => {
        const match = placeFiveAndKeep(42);
        expect(match.phase).toBe('combat');
        expect(match.towers).toHaveLength(1);
        expect(match.rocks).toHaveLength(4);
        expect(match.pathCache).not.toBeNull();
        const sim = new MatchSimulator(match, content);
        sim.startWave();
        const result = runCombatUntilWaveEnd(sim, 20_000);
        expect(result.waveComplete).toBe(true);
        expect(match.phase).toBe('placement');
        expect(match.level).toBe(2);
        expect(match.placementCharges).toBe(PLACEMENT_CHARGES_PER_ROUND);
    });
    it('emits spawn and combat events deterministically', () => {
        const match = placeFiveAndKeep(99);
        const sim = new MatchSimulator(match, content);
        sim.startWave();
        const events = [];
        for (let i = 0; i < 5000; i++) {
            const tick = sim.tick();
            events.push(...tick.events);
            if (tick.waveComplete)
                break;
        }
        expect(events.some((e) => e.type === 'creep_spawned')).toBe(true);
        expect(events.some((e) => e.type === 'wave_spawn_complete')).toBe(true);
    });
});
