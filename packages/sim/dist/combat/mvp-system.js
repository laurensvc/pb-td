import { MVP_MAX_STACKS, towerWorldCenter } from './tower-stats.js';
export const MVP_MR_DEBUFF_RADIUS = 64;
export const MVP_MR_DEBUFF_PER_STACK = 10;
export const MVP_AURA_RADIUS = 192;
export const MVP_AURA_ALLY_DAMAGE_BONUS = 0.75;
function distance(ax, ay, bx, by) {
    return Math.hypot(bx - ax, by - ay);
}
function towerMvpStacks(tower, mvpStacks) {
    return mvpStacks.get(tower.id) ?? tower.mvpStacks;
}
/** −10% MR per MVP stack on creeps within 64px of the MVP tower. */
export function computeMvpMrDebuffForCreep(towers, creep, mvpStacks) {
    let total = 0;
    for (const tower of towers) {
        if (!tower.active)
            continue;
        const stacks = towerMvpStacks(tower, mvpStacks);
        if (stacks <= 0)
            continue;
        const center = towerWorldCenter(tower.gx, tower.gy);
        if (distance(center.x, center.y, creep.worldPos.x, creep.worldPos.y) > MVP_MR_DEBUFF_RADIUS) {
            continue;
        }
        total += stacks * MVP_MR_DEBUFF_PER_STACK;
    }
    return total;
}
/** +75% damage from a nearby tower with 10 MVP stacks (6-tile radius). */
export function computeMvpAuraAllyDamageMultiplier(towers, attackingTower, mvpStacks) {
    const center = towerWorldCenter(attackingTower.gx, attackingTower.gy);
    let hasAura = false;
    for (const tower of towers) {
        if (!tower.active || tower.id === attackingTower.id)
            continue;
        if (towerMvpStacks(tower, mvpStacks) < MVP_MAX_STACKS)
            continue;
        const auraCenter = towerWorldCenter(tower.gx, tower.gy);
        if (distance(center.x, center.y, auraCenter.x, auraCenter.y) <= MVP_AURA_RADIUS) {
            hasAura = true;
            break;
        }
    }
    return hasAura ? 1 + MVP_AURA_ALLY_DAMAGE_BONUS : 1;
}
export function computeMrReductionForCreep(towers, creep, mvpStacks, magicBoundsMrReduction) {
    return magicBoundsMrReduction + computeMvpMrDebuffForCreep(towers, creep, mvpStacks);
}
