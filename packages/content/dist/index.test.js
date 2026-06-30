import { describe, expect, it } from 'vitest';
import { armorDamageMatrix, attackTypeSchema, armorTypeSchema, contentIdSchema, crownfallGrassBoard, gameContent, gemProbabilityTable, generateV1GemDefinitions, loadGameContent, qualityMultipliers, validateAllRoutesConnected, validateContent, v1EnemyDefinitions, v1GemDefinitions, v1Recipes, v1SpecialTowers, v1Waves, } from './index.js';
describe('@facet/content schemas', () => {
    it('validates non-empty content ids', () => {
        expect(contentIdSchema.parse('crownfall-grass')).toBe('crownfall-grass');
        expect(() => contentIdSchema.parse('')).toThrow();
    });
});
describe('v1 gem definitions', () => {
    it('produces 24 chipped/flawed/normal gems across 8 types', () => {
        const gems = generateV1GemDefinitions();
        expect(gems).toHaveLength(24);
        const ids = new Set(gems.map((g) => g.id));
        expect(ids.size).toBe(24);
        for (const gem of gems) {
            expect(['chipped', 'flawed', 'normal']).toContain(gem.quality);
        }
    });
    it('applies quality multipliers to sapphire slow', () => {
        const chipped = v1GemDefinitions.find((g) => g.id === 'sapphire-chipped');
        const flawed = v1GemDefinitions.find((g) => g.id === 'sapphire-flawed');
        const normal = v1GemDefinitions.find((g) => g.id === 'sapphire-normal');
        expect(chipped.combat.baseDamage).toBe(2);
        expect(flawed.combat.baseDamage).toBe(4);
        expect(normal.combat.baseDamage).toBe(6);
        const chippedSlow = chipped.abilities.find((a) => a.type === 'slow');
        const flawedSlow = flawed.abilities.find((a) => a.type === 'slow');
        const normalSlow = normal.abilities.find((a) => a.type === 'slow');
        if (chippedSlow.type !== 'slow' || flawedSlow.type !== 'slow' || normalSlow.type !== 'slow') {
            throw new Error('expected slow abilities');
        }
        expect(chippedSlow.speedReduction).toBe(60);
        expect(flawedSlow.speedReduction).toBe(105);
        expect(normalSlow.speedReduction).toBe(150);
        expect(normal.combat.range).toBeCloseTo(192 * qualityMultipliers.normal.range);
    });
});
describe('gem probability table', () => {
    it('levels 1-3 weights sum to 100', () => {
        for (const level of gemProbabilityTable.levels) {
            const sum = Object.values(level.weights).reduce((a, b) => a + b, 0);
            expect(sum).toBe(100);
        }
        expect(gemProbabilityTable.levels).toHaveLength(3);
    });
});
describe('armor damage matrix', () => {
    it('covers all attack and armor type pairs', () => {
        const attacks = attackTypeSchema.options;
        const armors = armorTypeSchema.options;
        for (const attack of attacks) {
            const row = armorDamageMatrix.multipliers[attack];
            for (const armor of armors) {
                expect(row[armor]).toBeTypeOf('number');
            }
        }
    });
});
describe('board routes', () => {
    it('connects all legs on empty crownfall-grass board', () => {
        const result = validateAllRoutesConnected(crownfallGrassBoard);
        expect(result.ok).toBe(true);
    });
    it('ships crownfall-simple and crownfall-full profiles', () => {
        const ids = crownfallGrassBoard.routes.map((r) => r.id);
        expect(ids).toContain('crownfall-simple');
        expect(ids).toContain('crownfall-full');
        expect(crownfallGrassBoard.defaultRouteId).toBe('crownfall-simple');
    });
});
describe('validateContent', () => {
    it('validates the bundled v1 game content', () => {
        const content = validateContent({
            board: crownfallGrassBoard,
            gems: v1GemDefinitions,
            towers: v1SpecialTowers,
            recipes: v1Recipes,
            gemProbability: gemProbabilityTable,
            armorDamageMatrix,
            enemies: v1EnemyDefinitions,
            waves: v1Waves,
            abilities: gameContent.abilities,
        });
        expect(content.gems).toHaveLength(24);
        expect(content.towers).toHaveLength(3);
        expect(content.recipes).toHaveLength(3);
        expect(content.enemies).toHaveLength(5);
        expect(content.waves).toHaveLength(10);
    });
    it('rejects duplicate gem ids', () => {
        expect(() => validateContent({
            ...gameContent,
            gems: [v1GemDefinitions[0], v1GemDefinitions[0]],
        })).toThrow(/Duplicate gem id/);
    });
    it('rejects recipe referencing missing gem', () => {
        expect(() => validateContent({
            ...gameContent,
            recipes: [
                {
                    ...v1Recipes[0],
                    inputs: [{ kind: 'gem', gemId: 'missing-gem' }, ...v1Recipes[0].inputs.slice(1)],
                },
            ],
        })).toThrow(/missing gem/);
    });
    it('rejects wave referencing missing enemy', () => {
        expect(() => validateContent({
            ...gameContent,
            waves: [
                {
                    ...v1Waves[0],
                    spawn: {
                        ...v1Waves[0].spawn,
                        entries: [{ enemyId: 'missing-enemy', count: 1 }],
                    },
                },
            ],
        })).toThrow(/missing enemy/);
    });
    it('rejects disconnected route legs', () => {
        const walledBoard = {
            ...crownfallGrassBoard,
            zones: {
                ...crownfallGrassBoard.zones,
                unbuildable: [
                    ...crownfallGrassBoard.zones.unbuildable,
                    { gx: 0, gy: 95, w: 148, h: 12 },
                ],
            },
        };
        expect(() => validateContent({ ...gameContent, board: walledBoard })).toThrow(/disconnected/);
    });
});
describe('waves 1-10', () => {
    it('marks wave 5 flying and wave 10 boss', () => {
        const wave5 = v1Waves.find((w) => w.waveNumber === 5);
        const wave10 = v1Waves.find((w) => w.waveNumber === 10);
        expect(wave5.isFlying).toBe(true);
        expect(wave10.isBoss).toBe(true);
        expect(wave10.clearCount).toBe(11);
    });
});
describe('loadGameContent', () => {
    it('returns validated content singleton', () => {
        expect(loadGameContent()).toBe(gameContent);
        expect(gameContent.board.id).toBe('crownfall-grass');
    });
});
