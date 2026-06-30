import { getGemDefinition } from './gems';
export function gemDamageType(family) {
    const def = getGemDefinition(family);
    if (def.damageType)
        return def.damageType;
    if (family === 'arcane' || family === 'verdant' || family === 'venom_lens')
        return 'magic';
    if (family === 'kinetic' || family === 'prism' || family === 'slayer_shard')
        return 'physical';
    return 'pure';
}
export function effectiveDamageMultiplier(damageType, resistances) {
    if (damageType === 'physical' && resistances.physicalImmune)
        return 0.12;
    if (damageType === 'magic' && resistances.magicImmune)
        return 0.12;
    if (damageType === 'pure')
        return 1;
    return 1;
}
export function isEnemyVisible(revealedUntil, time, gemDetectionRange, enemy, gems, invisible) {
    if (!invisible)
        return true;
    if (revealedUntil > time)
        return true;
    for (const gem of gems) {
        if (Math.hypot(gem.x - enemy.x, gem.y - enemy.y) <= gemDetectionRange + gem.range) {
            return true;
        }
    }
    return false;
}
