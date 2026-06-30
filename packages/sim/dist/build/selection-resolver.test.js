import { loadGameContent } from '@facet/content';
import { describe, expect, it } from 'vitest';
import { computeSelectionActions, resolveSelection } from './selection-resolver.js';
function candidate(id, gemId, gx, gy) {
    const dash = gemId.lastIndexOf('-');
    return {
        id,
        gemId,
        type: gemId.slice(0, dash),
        quality: gemId.slice(dash + 1),
        gx,
        gy,
    };
}
describe('SelectionResolver', () => {
    const content = loadGameContent();
    let id = 0;
    const nextId = () => `e-${++id}`;
    it('offers keep for each candidate', () => {
        const candidates = [
            candidate('c1', 'ruby-chipped', 0, 0),
            candidate('c2', 'sapphire-chipped', 4, 0),
        ];
        const actions = computeSelectionActions(content, candidates);
        expect(actions.filter((a) => a.kind === 'keep')).toHaveLength(2);
    });
    it('blocks downgrade at chipped', () => {
        const candidates = [candidate('c1', 'ruby-chipped', 0, 0)];
        const actions = computeSelectionActions(content, candidates);
        expect(actions.some((a) => a.kind === 'downgrade')).toBe(false);
    });
    it('offers duplicate combine for matching pair', () => {
        const candidates = [
            candidate('c1', 'ruby-chipped', 0, 0),
            candidate('c2', 'ruby-chipped', 4, 0),
            candidate('c3', 'sapphire-chipped', 8, 0),
        ];
        const actions = computeSelectionActions(content, candidates);
        const combine = actions.find((a) => a.kind === 'duplicate-combine' && a.count === 2);
        expect(combine).toBeDefined();
        expect(combine && combine.kind === 'duplicate-combine' ? combine.resultGemId : '').toBe('ruby-flawed');
    });
    it('detects one-hit silver recipe', () => {
        const candidates = [
            candidate('c1', 'sapphire-chipped', 0, 0),
            candidate('c2', 'diamond-chipped', 4, 0),
            candidate('c3', 'topaz-chipped', 8, 0),
            candidate('c4', 'ruby-chipped', 12, 0),
            candidate('c5', 'emerald-chipped', 16, 0),
        ];
        const actions = computeSelectionActions(content, candidates);
        expect(actions.some((a) => a.kind === 'one-hit-special' && a.recipeId === 'silver')).toBe(true);
    });
    it('resolve keep creates one tower and four rocks', () => {
        id = 0;
        const candidates = [
            candidate('c1', 'ruby-chipped', 0, 0),
            candidate('c2', 'sapphire-chipped', 4, 0),
            candidate('c3', 'diamond-chipped', 8, 0),
            candidate('c4', 'topaz-chipped', 12, 0),
            candidate('c5', 'emerald-chipped', 16, 0),
        ];
        const resolution = resolveSelection(content, candidates, { kind: 'keep', candidateId: 'c1' }, nextId);
        expect(resolution.tower?.gemId).toBe('ruby-chipped');
        expect(resolution.rocks).toHaveLength(4);
    });
});
