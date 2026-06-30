import { hexAreAdjacent, worldToHex } from './hexGrid';
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

export const hybridRecipes: Recipe[] = [
  {
    id: 'hybrid-toxic-shot',
    kind: 'hybrid',
    inputs: [
      { family: 'kinetic', level: 1 },
      { family: 'verdant', level: 1 },
    ],
    output: { family: 'toxic_shot', level: 1 },
    label: 'Toxic Shot',
  },
  {
    id: 'hybrid-plasma-mortar',
    kind: 'hybrid',
    inputs: [
      { family: 'arcane', level: 1 },
      { family: 'nova', level: 1 },
    ],
    output: { family: 'plasma_mortar', level: 1 },
    label: 'Plasma Mortar',
  },
  {
    id: 'hybrid-pierce-crystal',
    kind: 'hybrid',
    inputs: [
      { family: 'kinetic', level: 2 },
      { family: 'arcane', level: 2 },
    ],
    output: { family: 'pierce_crystal', level: 2 },
    label: 'Pierce Crystal',
  },
  {
    id: 'hybrid-spore-bomb',
    kind: 'hybrid',
    inputs: [
      { family: 'verdant', level: 2 },
      { family: 'nova', level: 2 },
    ],
    output: { family: 'spore_bomb', level: 2 },
    label: 'Spore Bomb',
  },
  {
    id: 'hybrid-slayer-shard',
    kind: 'hybrid',
    inputs: [
      { family: 'prism', level: 2 },
      { family: 'kinetic', level: 2 },
    ],
    output: { family: 'slayer_shard', level: 2 },
    label: 'Slayer Shard',
  },
  {
    id: 'hybrid-venom-lens',
    kind: 'hybrid',
    inputs: [
      { family: 'arcane', level: 3 },
      { family: 'verdant', level: 3 },
    ],
    output: { family: 'venom_lens', level: 3 },
    label: 'Venom Lens',
  },
  {
    id: 'hybrid-shatter-star',
    kind: 'hybrid',
    inputs: [
      { family: 'nova', level: 3 },
      { family: 'prism', level: 3 },
    ],
    output: { family: 'shatter_star', level: 3 },
    label: 'Shatter Star',
  },
  {
    id: 'hybrid-executioner',
    kind: 'hybrid',
    inputs: [
      { family: 'kinetic', level: 4 },
      { family: 'prism', level: 4 },
    ],
    output: { family: 'executioner', level: 4 },
    label: 'Executioner',
  },
  {
    id: 'hybrid-ember-lance',
    kind: 'hybrid',
    inputs: [
      { family: 'ember', level: 1 },
      { family: 'kinetic', level: 1 },
    ],
    output: { family: 'ember_lance', level: 1 },
    label: 'Ember Lance',
  },
  {
    id: 'hybrid-solar-flare',
    kind: 'hybrid',
    inputs: [
      { family: 'ember', level: 2 },
      { family: 'nova', level: 2 },
    ],
    output: { family: 'solar_flare', level: 2 },
    label: 'Solar Flare',
  },
];

export function findMatchingRecipe(
  a: RecipeInput,
  b: RecipeInput,
): Recipe | undefined {
  for (const recipe of hybridRecipes) {
    const [i0, i1] = recipe.inputs;
    if (inputsMatch(i0, i1, a, b)) return recipe;
  }
  return undefined;
}

function inputsMatch(
  i0: RecipeInput,
  i1: RecipeInput,
  a: RecipeInput,
  b: RecipeInput,
): boolean {
  return (
    (match(i0, a) && match(i1, b)) ||
    (match(i0, b) && match(i1, a))
  );
}

function match(expected: RecipeInput, actual: RecipeInput): boolean {
  return expected.family === actual.family && expected.level === actual.level;
}

export function areAdjacentGems(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): boolean {
  const a = worldToHex(ax, ay);
  const b = worldToHex(bx, by);
  return hexAreAdjacent(a, b);
}
