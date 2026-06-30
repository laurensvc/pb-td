function armorTypeMultiplier(matrix, attackType, armorType) {
    const row = matrix.multipliers[attackType];
    if (!row)
        return 1;
    return (row[armorType] ?? 100) / 100;
}
function armorValueMultiplier(matrix, armor, attackType) {
    if (matrix.bypassAttackTypes.includes(attackType))
        return 1;
    const { positiveFactor, negativeBase, negativeFactor, minPositiveMultiplier, minArmorFloor } = matrix.armorValue;
    const clampedArmor = Math.max(armor, minArmorFloor);
    if (clampedArmor >= 0) {
        return Math.max(minPositiveMultiplier, 1 - positiveFactor * clampedArmor);
    }
    return negativeBase - Math.pow(negativeFactor, -clampedArmor);
}
function magicResistMultiplier(mr, matrix) {
    const clamped = Math.max(matrix.magicResist.min, Math.min(matrix.magicResist.max, mr));
    return 1 - clamped / 100;
}
export function resolveDamage(creep, attack, config) {
    const { matrix, rng } = config;
    if (attack.attackType === 'magic' && creep.magicImmune) {
        return { damage: 0, missed: false, blocked: true };
    }
    if (attack.attackType !== 'magic' &&
        attack.attackType !== 'pure' &&
        attack.attackType !== 'chaos' &&
        creep.physicalImmune) {
        return { damage: 0, missed: false, blocked: true };
    }
    if (!attack.trueStrike && creep.evasion > 0 && rng.next() < creep.evasion) {
        return { damage: 0, missed: true, blocked: false };
    }
    let damage = attack.baseDamage;
    const effectiveArmor = creep.armor - (attack.armorReduction ?? 0);
    if (!matrix.bypassAttackTypes.includes(attack.attackType)) {
        damage *= armorTypeMultiplier(matrix, attack.attackType, creep.armorType);
        damage *= armorValueMultiplier(matrix, effectiveArmor, attack.attackType);
    }
    if (attack.attackType === 'magic') {
        damage *= magicResistMultiplier(creep.magicResist, matrix);
    }
    return {
        damage: Math.max(0, Math.floor(damage)),
        missed: false,
        blocked: false,
    };
}
