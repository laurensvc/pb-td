import type { GameContent, GemType, QualityTier } from '@facet/content';
import type { SeededRng } from '../rng/seeded-rng.js';
export interface GemRoll {
    gemId: string;
    type: GemType;
    quality: QualityTier;
}
export declare class GemRoller {
    private readonly content;
    private readonly rng;
    constructor(content: GameContent, rng: SeededRng);
    roll(chanceLevel: number): GemRoll;
    private rollQuality;
}
//# sourceMappingURL=gem-roller.d.ts.map