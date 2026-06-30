import { gridToWorldCenter } from '../board/coordinates.js';
import { GEM_FOOTPRINT } from '../constants.js';
const MVP_DAMAGE_BONUS_PER_STACK = 0.1;
const MAX_MVP_STACKS = 10;
export function towerWorldCenter(gx, gy) {
    const centerGx = gx + GEM_FOOTPRINT / 2;
    const centerGy = gy + GEM_FOOTPRINT / 2;
    return gridToWorldCenter(centerGx, centerGy);
}
export function resolveTowerCombat(content, tower, mvpStacks) {
    if (!tower.active)
        return null;
    let stats;
    let abilities;
    if (tower.specialId) {
        const special = content.towers.find((t) => t.id === tower.specialId);
        if (!special)
            return null;
        stats = special.combat;
        abilities = special.abilities;
    }
    else if (tower.gemId) {
        const gem = content.gems.find((g) => g.id === tower.gemId);
        if (!gem)
            return null;
        stats = gem.combat;
        abilities = gem.abilities;
    }
    else {
        return null;
    }
    const damageMultiplier = 1 + mvpStacks * MVP_DAMAGE_BONUS_PER_STACK;
    const center = towerWorldCenter(tower.gx, tower.gy);
    return {
        towerId: tower.id,
        gx: tower.gx,
        gy: tower.gy,
        worldX: center.x,
        worldY: center.y,
        stats: {
            ...stats,
            baseDamage: stats.baseDamage * damageMultiplier,
        },
        abilities,
        damageMultiplier,
    };
}
export function awardMvpStack(currentStacks) {
    return Math.min(MAX_MVP_STACKS, currentStacks + 1);
}
export const MVP_MAX_STACKS = MAX_MVP_STACKS;
