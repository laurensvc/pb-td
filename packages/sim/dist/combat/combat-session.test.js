import { loadGameContent } from '@facet/content';
import { describe, expect, it } from 'vitest';
import { SeededRng } from '../rng/seeded-rng.js';
import { ensurePathCache } from '../pathfinding/path-cache.js';
import { createSimBoard } from '../board/sim-board.js';
import { CombatSession } from './combat-session.js';
function testContentWithSingleGrunt() {
    const content = loadGameContent();
    return {
        ...content,
        waves: [
            {
                ...content.waves[0],
                clearCount: 1,
                spawn: {
                    entries: [{ enemyId: 'stone-grunt', count: 1 }],
                    spawnIntervalMs: 100,
                    groupDelayMs: 0,
                    concurrent: false,
                },
            },
        ],
    };
}
describe('CombatSession integration', () => {
    it('spawns and clears a single-creep wave', () => {
        const content = testContentWithSingleGrunt();
        const board = createSimBoard(content.board);
        const pathCache = ensurePathCache(content.board, board, content.board.defaultRouteId, null);
        const rng = new SeededRng(99);
        const tower = {
            id: 'tower-1',
            gemId: 'diamond-normal',
            gx: 24,
            gy: 24,
            active: true,
            killCount: 0,
            targetingMode: 'closest_to_goal',
            holdFire: false,
            mvpStacks: 0,
        };
        const session = new CombatSession({
            content,
            level: 1,
            routeId: content.board.defaultRouteId,
            pathCache,
            towers: [tower],
            rng,
        });
        let cleared = false;
        const events = [];
        for (let i = 0; i < 5000 && !cleared; i++) {
            const result = session.tick(1 / 30, true);
            events.push(...result.events);
            if (result.waveCleared)
                cleared = true;
        }
        expect(cleared).toBe(true);
        expect(session.spawnerState.resolvedCount).toBe(1);
        expect(session.creeps).toHaveLength(0);
        expect(events.some((e) => e.type === 'creep_spawned')).toBe(true);
        expect(events.some((e) => e.type === 'creep_killed' || e.type === 'creep_leaked')).toBe(true);
    });
});
