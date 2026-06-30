import type { GemProbabilityTable } from '../schemas/gem-probability.js'

/** Quality weights from TOWER-AND-GEM-SYSTEMS.md §14.1 levels 1-3 */
export const gemProbabilityTable: GemProbabilityTable = {
  typeRollUniform: true,
  levels: [
    {
      level: 1,
      weights: {
        chipped: 100,
        flawed: 0,
        normal: 0,
        flawless: 0,
        perfect: 0,
        great: 0,
      },
    },
    {
      level: 2,
      weights: {
        chipped: 70,
        flawed: 30,
        normal: 0,
        flawless: 0,
        perfect: 0,
        great: 0,
      },
    },
    {
      level: 3,
      weights: {
        chipped: 40,
        flawed: 40,
        normal: 20,
        flawless: 0,
        perfect: 0,
        great: 0,
      },
    },
  ],
}
