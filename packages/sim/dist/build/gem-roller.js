import { v1ProbabilityQualities } from '@facet/content';
import { GEM_TYPES, gemId } from '../constants.js';
export class GemRoller {
    content;
    rng;
    constructor(content, rng) {
        this.content = content;
        this.rng = rng;
    }
    roll(chanceLevel) {
        const type = this.rng.pickUniform(GEM_TYPES);
        const quality = this.rollQuality(chanceLevel);
        return { gemId: gemId(type, quality), type, quality };
    }
    rollQuality(chanceLevel) {
        const table = this.content.gemProbability;
        const levelDef = table.levels.find((l) => l.level === chanceLevel) ?? table.levels[0];
        if (!levelDef) {
            throw new Error(`No gem probability level configured`);
        }
        const entries = v1ProbabilityQualities
            .filter((q) => levelDef.weights[q] > 0)
            .map((q) => ({ item: q, weight: levelDef.weights[q] }));
        if (entries.length === 0) {
            return 'chipped';
        }
        return this.rng.pickWeighted(entries);
    }
}
