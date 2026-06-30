import type { AbilityDefinition } from './schemas/ability.js';
import type { ArmorDamageMatrix } from './schemas/armor-damage-matrix.js';
import type { BoardDefinition } from './schemas/board.js';
import type { EnemyDefinition } from './schemas/enemy.js';
import type { GemDefinition, TowerDefinition } from './schemas/gem.js';
import type { GemProbabilityTable } from './schemas/gem-probability.js';
import type { RecipeDefinition } from './schemas/recipe.js';
import type { WaveDefinition } from './schemas/wave.js';
export interface GameContent {
    board: BoardDefinition;
    gems: GemDefinition[];
    towers: TowerDefinition[];
    recipes: RecipeDefinition[];
    gemProbability: GemProbabilityTable;
    armorDamageMatrix: ArmorDamageMatrix;
    enemies: EnemyDefinition[];
    waves: WaveDefinition[];
    abilities: AbilityDefinition[];
}
export interface ValidateContentOptions {
    /** When true, skip route connectivity (for malformed fixtures). */
    skipRouteValidation?: boolean;
}
export declare function validateContent(content: GameContent, options?: ValidateContentOptions): GameContent;
//# sourceMappingURL=validate.d.ts.map