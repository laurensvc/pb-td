import type { QualityTier } from '../schemas/common.js';
import type { GemDefinition } from '../schemas/gem.js';
import { gemTypes } from './base-stats.js';
export declare function generateGemDefinition(type: (typeof gemTypes)[number], quality: QualityTier): GemDefinition;
export declare function generateV1GemDefinitions(): GemDefinition[];
export declare const v1GemDefinitions: {
    type: "amethyst" | "aquamarine" | "diamond" | "emerald" | "opal" | "ruby" | "sapphire" | "topaz";
    id: string;
    displayName: string;
    quality: "chipped" | "flawed" | "normal" | "flawless" | "perfect" | "great";
    combat: {
        range: number;
        baseDamage: number;
        attackInterval: number;
        targets: number;
        primaryAttackType: "normal" | "pierce" | "siege" | "magic" | "chaos" | "pure";
        projectileSpeed?: number | undefined;
        critChance?: number | undefined;
        critMultiplier?: number | undefined;
    };
    abilities: ({
        type: "pierce";
        armorReduction: number;
    } | {
        type: "corrupt";
        armorReduction: number;
    } | {
        type: "slow";
        speedReduction: number;
        duration?: number | undefined;
    } | {
        type: "poison";
        duration: number;
        dps: number;
    } | {
        type: "cleave";
        percent: number;
        radius: number;
        damageType: "pure";
    } | {
        type: "split_shot";
        targets: number;
    } | {
        type: "burn";
        dps: number;
        radius: number;
    } | {
        type: "anti_fly";
        armorReduction: number;
        speedReduction: number;
        mrReduction?: number | undefined;
    } | {
        type: "stun";
        duration: number;
        chance: number;
    } | {
        type: "chain_lightning";
        chance: number;
        jumps: number;
        damage: number;
    } | {
        type: "aura_attack_speed";
        radius: number;
        bonus: number;
        stackGroup: string;
    } | {
        type: "aura_range";
        radius: number;
        bonus: number;
    } | {
        type: "inspire";
        radius: number;
        damagePercent: number;
    } | {
        type: "monkey_king_bar";
        radius: number;
    } | {
        type: "decadent";
        armorReduction: number;
        radius: number;
        mrReduction: number;
        ignoreMagicImmune?: boolean | undefined;
    })[];
    assetKey: string;
    footprint: 2;
    blocksPath: true;
    projectileKey?: string | undefined;
}[];
//# sourceMappingURL=generate-gems.d.ts.map