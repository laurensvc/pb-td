import type { GemFamilyId, GemLevel } from './types';
export type RecipeKind = 'pure' | 'hybrid' | 'great';
export interface RecipeInput {
    family: GemFamilyId;
    level: GemLevel;
}
export interface Recipe {
    id: string;
    kind: RecipeKind;
    inputs: [RecipeInput, RecipeInput];
    output: RecipeInput;
    label: string;
}
export declare const hybridRecipes: Recipe[];
export declare function findMatchingRecipe(a: RecipeInput, b: RecipeInput): Recipe | undefined;
export declare function listHybridRecipes(): readonly Recipe[];
export declare function describeRecipeInputs(recipe: Recipe): string;
export declare function findRawRecipeMatches(rawGems: readonly RecipeInput[]): Recipe[];
export declare function areAdjacentGems(ax: number, ay: number, bx: number, by: number): boolean;
