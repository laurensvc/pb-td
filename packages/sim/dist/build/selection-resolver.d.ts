import type { GameContent } from '@facet/content';
import type { CandidateGem } from '../round/types.js';
export type SelectionAction = {
    kind: 'keep';
    candidateId: string;
} | {
    kind: 'downgrade';
    candidateId: string;
    resultGemId: string;
    resultType: string;
    resultQuality: string;
} | {
    kind: 'duplicate-combine';
    candidateId: string;
    count: 2 | 3 | 4;
    resultGemId: string;
    consumedCandidateIds: string[];
} | {
    kind: 'one-hit-special';
    candidateId: string;
    recipeId: string;
    outputTowerId: string;
    consumedCandidateIds: string[];
};
export interface SelectionResolution {
    tower?: {
        id: string;
        gemId?: string;
        specialId?: string;
        gx: number;
        gy: number;
    };
    rocks: Array<{
        id: string;
        gx: number;
        gy: number;
    }>;
    consumedCandidateIds: string[];
}
export declare function computeSelectionActions(content: GameContent, candidates: CandidateGem[]): SelectionAction[];
export declare function resolveSelection(content: GameContent, candidates: CandidateGem[], action: SelectionAction, nextEntityId: () => string): SelectionResolution;
//# sourceMappingURL=selection-resolver.d.ts.map