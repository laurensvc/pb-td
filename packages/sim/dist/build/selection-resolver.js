import { GEM_QUALITY_ORDER, gemId, parseGemId, qualityAtIndex, qualityIndex } from '../constants.js';
function groupByGemId(candidates) {
    const groups = new Map();
    for (const c of candidates) {
        const list = groups.get(c.gemId) ?? [];
        list.push(c);
        groups.set(c.gemId, list);
    }
    return groups;
}
function resolveDuplicateResult(gemIdValue, count) {
    const { type, quality } = parseGemId(gemIdValue);
    const jump = count === 2 ? 1 : 2;
    const nextIndex = qualityIndex(quality) + jump;
    const nextQuality = qualityAtIndex(nextIndex);
    if (!nextQuality) {
        return 'stone_of_bryvx';
    }
    return gemId(type, nextQuality);
}
function recipeMatches(recipe, candidates) {
    if (!recipe.instantCombineInSingleRound)
        return { ok: false };
    const available = [...candidates];
    const matches = new Map();
    for (const input of recipe.inputs) {
        if (input.kind !== 'gem')
            return { ok: false };
        const idx = available.findIndex((c) => c.gemId === input.gemId);
        if (idx < 0)
            return { ok: false };
        const match = available.splice(idx, 1)[0];
        matches.set(input.gemId, match);
    }
    return { ok: true, matches };
}
export function computeSelectionActions(content, candidates) {
    const actions = [];
    for (const candidate of candidates) {
        actions.push({ kind: 'keep', candidateId: candidate.id });
        const qIdx = qualityIndex(candidate.quality);
        if (qIdx > 0) {
            const lower = GEM_QUALITY_ORDER[qIdx - 1];
            actions.push({
                kind: 'downgrade',
                candidateId: candidate.id,
                resultGemId: gemId(candidate.type, lower),
                resultType: candidate.type,
                resultQuality: lower,
            });
        }
    }
    const groups = groupByGemId(candidates);
    for (const [gemIdValue, group] of groups) {
        if (group.length < 2)
            continue;
        const counts = group.length >= 4 ? [2, 3, 4] : group.length === 3 ? [2, 3] : [2];
        for (const count of counts) {
            if (group.length < count)
                continue;
            const anchor = group[0];
            const consumed = group.slice(0, count).map((c) => c.id);
            const resultGemId = resolveDuplicateResult(gemIdValue, count);
            actions.push({
                kind: 'duplicate-combine',
                candidateId: anchor.id,
                count,
                resultGemId,
                consumedCandidateIds: consumed,
            });
        }
    }
    for (const recipe of content.recipes) {
        const match = recipeMatches(recipe, candidates);
        if (!match.ok)
            continue;
        for (const candidate of candidates) {
            if (!match.matches.has(candidate.gemId))
                continue;
            actions.push({
                kind: 'one-hit-special',
                candidateId: candidate.id,
                recipeId: recipe.id,
                outputTowerId: recipe.outputTowerId,
                consumedCandidateIds: [...match.matches.values()].map((c) => c.id),
            });
        }
    }
    return actions;
}
export function resolveSelection(content, candidates, action, nextEntityId) {
    const legal = computeSelectionActions(content, candidates);
    const isLegal = legal.some((a) => selectionActionsEqual(a, action));
    if (!isLegal) {
        throw new Error('Illegal selection action');
    }
    const candidateById = new Map(candidates.map((c) => [c.id, c]));
    const anchor = candidateById.get(action.kind === 'keep' ||
        action.kind === 'downgrade' ||
        action.kind === 'duplicate-combine' ||
        action.kind === 'one-hit-special'
        ? action.candidateId
        : '');
    if (!anchor)
        throw new Error('Anchor candidate not found');
    const consumed = new Set();
    let towerGemId;
    let specialId;
    switch (action.kind) {
        case 'keep':
            towerGemId = anchor.gemId;
            consumed.add(anchor.id);
            break;
        case 'downgrade':
            towerGemId = action.resultGemId;
            consumed.add(anchor.id);
            break;
        case 'duplicate-combine':
            towerGemId = action.resultGemId;
            for (const id of action.consumedCandidateIds)
                consumed.add(id);
            break;
        case 'one-hit-special':
            specialId = action.outputTowerId;
            for (const id of action.consumedCandidateIds)
                consumed.add(id);
            break;
    }
    const tower = specialId === 'stone_of_bryvx'
        ? undefined
        : {
            id: nextEntityId(),
            gemId: towerGemId,
            specialId,
            gx: anchor.gx,
            gy: anchor.gy,
        };
    const rocks = [];
    for (const candidate of candidates) {
        if (consumed.has(candidate.id))
            continue;
        rocks.push({
            id: nextEntityId(),
            gx: candidate.gx,
            gy: candidate.gy,
        });
    }
    return {
        tower,
        rocks,
        consumedCandidateIds: [...consumed],
    };
}
function selectionActionsEqual(a, b) {
    if (a.kind !== b.kind)
        return false;
    switch (a.kind) {
        case 'keep':
            return b.kind === 'keep' && a.candidateId === b.candidateId;
        case 'downgrade':
            return (b.kind === 'downgrade' && a.candidateId === b.candidateId && a.resultGemId === b.resultGemId);
        case 'duplicate-combine':
            return (b.kind === 'duplicate-combine' &&
                a.candidateId === b.candidateId &&
                a.count === b.count &&
                a.resultGemId === b.resultGemId);
        case 'one-hit-special':
            return (b.kind === 'one-hit-special' && a.candidateId === b.candidateId && a.recipeId === b.recipeId);
        default:
            return false;
    }
}
