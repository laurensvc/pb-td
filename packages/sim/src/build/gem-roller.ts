import type { GameContent, GemType, QualityTier } from '@facet/content'
import { v1ProbabilityQualities } from '@facet/content'
import { GEM_TYPES, gemId } from '../constants.js'
import type { SeededRng } from '../rng/seeded-rng.js'

export interface GemRoll {
  gemId: string
  type: GemType
  quality: QualityTier
}

export class GemRoller {
  constructor(
    private readonly content: GameContent,
    private readonly rng: SeededRng,
  ) {}

  roll(chanceLevel: number): GemRoll {
    const type = this.rng.pickUniform(GEM_TYPES)
    const quality = this.rollQuality(chanceLevel)
    return { gemId: gemId(type, quality), type, quality }
  }

  private rollQuality(chanceLevel: number): QualityTier {
    const table = this.content.gemProbability
    const levelDef = table.levels.find((l) => l.level === chanceLevel) ?? table.levels[0]
    if (!levelDef) {
      throw new Error(`No gem probability level configured`)
    }

    const entries = v1ProbabilityQualities
      .filter((q) => levelDef.weights[q] > 0)
      .map((q) => ({ item: q as QualityTier, weight: levelDef.weights[q] }))

    if (entries.length === 0) {
      return 'chipped'
    }

    return this.rng.pickWeighted(entries)
  }
}
