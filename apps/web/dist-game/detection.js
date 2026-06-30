import { getGemCombatStats } from './gems';
export function buildDetectionGems(state) {
    return state.gems.map((gem) => ({
        x: gem.x,
        y: gem.y,
        range: getGemCombatStats(state.save, gem.family, gem.level).range,
    }));
}
