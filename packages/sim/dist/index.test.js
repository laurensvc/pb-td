import { describe, expect, it } from 'vitest';
import { isValidBoardId } from './legacy.js';
describe('@facet/sim', () => {
    it('validates board ids via content schema', () => {
        expect(isValidBoardId('crownfall-grass')).toBe(true);
        expect(isValidBoardId('')).toBe(false);
    });
});
