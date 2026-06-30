import { v1AbilityDefinitions } from './abilities/v1-abilities.js';
import { crownfallGrassBoard } from './boards/crownfall-grass.js';
import { armorDamageMatrix } from './combat/armor-damage-matrix.js';
import { gemProbabilityTable } from './economy/gem-probability.js';
import { v1EnemyDefinitions } from './enemies/v1-enemies.js';
import { v1GemDefinitions } from './gems/generate-gems.js';
import { v1Recipes } from './recipes/v1-recipes.js';
import { v1SpecialTowers } from './towers/v1-specials.js';
import { validateContent } from './validate.js';
import { v1Waves } from './waves/v1-waves.js';
const rawContent = {
    board: crownfallGrassBoard,
    gems: v1GemDefinitions,
    towers: v1SpecialTowers,
    recipes: v1Recipes,
    gemProbability: gemProbabilityTable,
    armorDamageMatrix,
    enemies: v1EnemyDefinitions,
    waves: v1Waves,
    abilities: v1AbilityDefinitions,
};
/** Validated vertical-slice content bundle. */
export const gameContent = validateContent(rawContent);
export function loadGameContent() {
    return gameContent;
}
