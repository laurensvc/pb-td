import { abilityDefinitionSchema } from './schemas/ability.js';
import { armorDamageMatrixSchema } from './schemas/armor-damage-matrix.js';
import { boardDefinitionSchema } from './schemas/board.js';
import { enemyDefinitionSchema } from './schemas/enemy.js';
import { gemDefinitionSchema, towerDefinitionSchema } from './schemas/gem.js';
import { assertProbabilityWeightsSumTo100, gemProbabilityTableSchema, } from './schemas/gem-probability.js';
import { recipeDefinitionSchema } from './schemas/recipe.js';
import { waveDefinitionSchema } from './schemas/wave.js';
import { validateAllRoutesConnected } from './boards/route-validation.js';
function assertUniqueIds(ids, label) {
    const seen = new Set();
    for (const id of ids) {
        if (seen.has(id)) {
            throw new Error(`Duplicate ${label} id: ${id}`);
        }
        seen.add(id);
    }
}
export function validateContent(content, options = {}) {
    const board = boardDefinitionSchema.parse(content.board);
    const gems = content.gems.map((g) => gemDefinitionSchema.parse(g));
    const towers = content.towers.map((t) => towerDefinitionSchema.parse(t));
    const recipes = content.recipes.map((r) => recipeDefinitionSchema.parse(r));
    const gemProbability = gemProbabilityTableSchema.parse(content.gemProbability);
    const armorMatrix = armorDamageMatrixSchema.parse(content.armorDamageMatrix);
    const enemies = content.enemies.map((e) => enemyDefinitionSchema.parse(e));
    const waves = content.waves.map((w) => waveDefinitionSchema.parse(w));
    const abilities = content.abilities.map((a) => abilityDefinitionSchema.parse(a));
    assertUniqueIds(gems.map((g) => g.id), 'gem');
    assertUniqueIds(towers.map((t) => t.id), 'tower');
    assertUniqueIds(recipes.map((r) => r.id), 'recipe');
    assertUniqueIds(enemies.map((e) => e.id), 'enemy');
    assertUniqueIds(abilities.map((a) => a.id), 'ability');
    const waveNumbers = waves.map((w) => w.waveNumber);
    assertUniqueIds(waveNumbers.map(String), 'wave');
    for (const level of gemProbability.levels) {
        assertProbabilityWeightsSumTo100(level);
    }
    const gemIds = new Set(gems.map((g) => g.id));
    const towerIds = new Set(towers.map((t) => t.id));
    const enemyIds = new Set(enemies.map((e) => e.id));
    const abilityIds = new Set(abilities.map((a) => a.id));
    const landmarkIds = new Set(board.landmarks.map((lm) => lm.id));
    for (const route of board.routes) {
        for (const leg of route.groundLegs) {
            if (!landmarkIds.has(leg.from)) {
                throw new Error(`Route ${route.id} leg references unknown landmark: ${leg.from}`);
            }
            if (!landmarkIds.has(leg.to)) {
                throw new Error(`Route ${route.id} leg references unknown landmark: ${leg.to}`);
            }
        }
        for (const nodeId of route.flyingNodes) {
            if (!landmarkIds.has(nodeId)) {
                throw new Error(`Route ${route.id} flying node references unknown landmark: ${nodeId}`);
            }
        }
    }
    if (!board.routes.some((r) => r.id === board.defaultRouteId)) {
        throw new Error(`Board defaultRouteId "${board.defaultRouteId}" not found in routes`);
    }
    for (const recipe of recipes) {
        if (!towerIds.has(recipe.outputTowerId)) {
            throw new Error(`Recipe ${recipe.id} output tower missing: ${recipe.outputTowerId}`);
        }
        for (const input of recipe.inputs) {
            if (input.kind === 'gem' && !gemIds.has(input.gemId)) {
                throw new Error(`Recipe ${recipe.id} references missing gem: ${input.gemId}`);
            }
            if (input.kind === 'tower' && !towerIds.has(input.towerId)) {
                throw new Error(`Recipe ${recipe.id} references missing tower: ${input.towerId}`);
            }
        }
    }
    for (const wave of waves) {
        for (const entry of wave.spawn.entries) {
            if (!enemyIds.has(entry.enemyId)) {
                throw new Error(`Wave ${wave.waveNumber} references missing enemy: ${entry.enemyId}`);
            }
        }
        if (!enemyIds.has(wave.defaultEnemyId)) {
            throw new Error(`Wave ${wave.waveNumber} defaultEnemyId missing: ${wave.defaultEnemyId}`);
        }
        for (const abilityId of wave.abilities) {
            if (!abilityIds.has(abilityId)) {
                throw new Error(`Wave ${wave.waveNumber} references missing ability: ${abilityId}`);
            }
        }
    }
    if (!options.skipRouteValidation) {
        const routeResult = validateAllRoutesConnected(board);
        if (!routeResult.ok) {
            throw new Error(`Route ${routeResult.routeId} leg ${routeResult.leg.from} → ${routeResult.leg.to} disconnected on empty board`);
        }
    }
    return {
        board,
        gems,
        towers,
        recipes,
        gemProbability,
        armorDamageMatrix: armorMatrix,
        enemies,
        waves,
        abilities,
    };
}
