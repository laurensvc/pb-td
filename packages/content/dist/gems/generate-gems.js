import { gemTypeTemplates, gemTypes, v1Qualities } from './base-stats.js';
import { qualityMultipliers, scaleAbilities, } from './quality-multipliers.js';
function titleCaseQuality(quality) {
    return quality.charAt(0).toUpperCase() + quality.slice(1);
}
export function generateGemDefinition(type, quality) {
    const template = gemTypeTemplates[type];
    const mult = qualityMultipliers[quality];
    return {
        id: `${type}-${quality}`,
        type,
        quality,
        displayName: `${titleCaseQuality(quality)} ${template.displayName}`,
        combat: {
            ...template.combat,
            baseDamage: template.combat.baseDamage * mult.damage,
            range: template.combat.range * mult.range,
            attackInterval: template.combat.attackInterval / mult.attackSpeed,
        },
        abilities: scaleAbilities(template.abilities, mult),
        projectileKey: template.projectileKey,
        assetKey: `tower.${type}.${quality}`,
        footprint: 2,
        blocksPath: true,
    };
}
export function generateV1GemDefinitions() {
    return gemTypes.flatMap((type) => v1Qualities.map((quality) => generateGemDefinition(type, quality)));
}
export const v1GemDefinitions = generateV1GemDefinitions();
