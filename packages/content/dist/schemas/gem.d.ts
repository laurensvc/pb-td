import { z } from 'zod';
export declare const towerCombatStatsSchema: z.ZodObject<{
    range: z.ZodNumber;
    baseDamage: z.ZodNumber;
    attackInterval: z.ZodNumber;
    projectileSpeed: z.ZodOptional<z.ZodNumber>;
    targets: z.ZodDefault<z.ZodNumber>;
    critChance: z.ZodOptional<z.ZodNumber>;
    critMultiplier: z.ZodOptional<z.ZodNumber>;
    primaryAttackType: z.ZodDefault<z.ZodEnum<["normal", "pierce", "siege", "magic", "chaos", "pure"]>>;
}, "strip", z.ZodTypeAny, {
    range: number;
    baseDamage: number;
    attackInterval: number;
    targets: number;
    primaryAttackType: "normal" | "pierce" | "siege" | "magic" | "chaos" | "pure";
    projectileSpeed?: number | undefined;
    critChance?: number | undefined;
    critMultiplier?: number | undefined;
}, {
    range: number;
    baseDamage: number;
    attackInterval: number;
    projectileSpeed?: number | undefined;
    targets?: number | undefined;
    critChance?: number | undefined;
    critMultiplier?: number | undefined;
    primaryAttackType?: "normal" | "pierce" | "siege" | "magic" | "chaos" | "pure" | undefined;
}>;
export declare const towerAbilitySchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"pierce">;
    armorReduction: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "pierce";
    armorReduction: number;
}, {
    type: "pierce";
    armorReduction: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"corrupt">;
    armorReduction: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "corrupt";
    armorReduction: number;
}, {
    type: "corrupt";
    armorReduction: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"slow">;
    speedReduction: z.ZodNumber;
    duration: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "slow";
    speedReduction: number;
    duration?: number | undefined;
}, {
    type: "slow";
    speedReduction: number;
    duration?: number | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"poison">;
    dps: z.ZodNumber;
    duration: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "poison";
    duration: number;
    dps: number;
}, {
    type: "poison";
    duration: number;
    dps: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"cleave">;
    percent: z.ZodNumber;
    radius: z.ZodNumber;
    damageType: z.ZodLiteral<"pure">;
}, "strip", z.ZodTypeAny, {
    type: "cleave";
    percent: number;
    radius: number;
    damageType: "pure";
}, {
    type: "cleave";
    percent: number;
    radius: number;
    damageType: "pure";
}>, z.ZodObject<{
    type: z.ZodLiteral<"split_shot">;
    targets: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "split_shot";
    targets: number;
}, {
    type: "split_shot";
    targets: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"burn">;
    dps: z.ZodNumber;
    radius: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "burn";
    dps: number;
    radius: number;
}, {
    type: "burn";
    dps: number;
    radius: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"anti_fly">;
    armorReduction: z.ZodNumber;
    speedReduction: z.ZodNumber;
    mrReduction: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "anti_fly";
    armorReduction: number;
    speedReduction: number;
    mrReduction?: number | undefined;
}, {
    type: "anti_fly";
    armorReduction: number;
    speedReduction: number;
    mrReduction?: number | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"stun">;
    chance: z.ZodNumber;
    duration: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "stun";
    duration: number;
    chance: number;
}, {
    type: "stun";
    duration: number;
    chance: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"chain_lightning">;
    chance: z.ZodNumber;
    jumps: z.ZodNumber;
    damage: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "chain_lightning";
    chance: number;
    jumps: number;
    damage: number;
}, {
    type: "chain_lightning";
    chance: number;
    jumps: number;
    damage: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"aura_attack_speed">;
    bonus: z.ZodNumber;
    radius: z.ZodNumber;
    stackGroup: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "aura_attack_speed";
    radius: number;
    bonus: number;
    stackGroup: string;
}, {
    type: "aura_attack_speed";
    radius: number;
    bonus: number;
    stackGroup: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"aura_range">;
    bonus: z.ZodNumber;
    radius: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "aura_range";
    radius: number;
    bonus: number;
}, {
    type: "aura_range";
    radius: number;
    bonus: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"inspire">;
    damagePercent: z.ZodNumber;
    radius: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "inspire";
    radius: number;
    damagePercent: number;
}, {
    type: "inspire";
    radius: number;
    damagePercent: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"monkey_king_bar">;
    radius: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "monkey_king_bar";
    radius: number;
}, {
    type: "monkey_king_bar";
    radius: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"decadent">;
    armorReduction: z.ZodNumber;
    mrReduction: z.ZodNumber;
    radius: z.ZodNumber;
    ignoreMagicImmune: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "decadent";
    armorReduction: number;
    radius: number;
    mrReduction: number;
    ignoreMagicImmune?: boolean | undefined;
}, {
    type: "decadent";
    armorReduction: number;
    radius: number;
    mrReduction: number;
    ignoreMagicImmune?: boolean | undefined;
}>]>;
export declare const gemDefinitionSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["amethyst", "aquamarine", "diamond", "emerald", "opal", "ruby", "sapphire", "topaz"]>;
    quality: z.ZodEnum<["chipped", "flawed", "normal", "flawless", "perfect", "great"]>;
    displayName: z.ZodString;
    combat: z.ZodObject<{
        range: z.ZodNumber;
        baseDamage: z.ZodNumber;
        attackInterval: z.ZodNumber;
        projectileSpeed: z.ZodOptional<z.ZodNumber>;
        targets: z.ZodDefault<z.ZodNumber>;
        critChance: z.ZodOptional<z.ZodNumber>;
        critMultiplier: z.ZodOptional<z.ZodNumber>;
        primaryAttackType: z.ZodDefault<z.ZodEnum<["normal", "pierce", "siege", "magic", "chaos", "pure"]>>;
    }, "strip", z.ZodTypeAny, {
        range: number;
        baseDamage: number;
        attackInterval: number;
        targets: number;
        primaryAttackType: "normal" | "pierce" | "siege" | "magic" | "chaos" | "pure";
        projectileSpeed?: number | undefined;
        critChance?: number | undefined;
        critMultiplier?: number | undefined;
    }, {
        range: number;
        baseDamage: number;
        attackInterval: number;
        projectileSpeed?: number | undefined;
        targets?: number | undefined;
        critChance?: number | undefined;
        critMultiplier?: number | undefined;
        primaryAttackType?: "normal" | "pierce" | "siege" | "magic" | "chaos" | "pure" | undefined;
    }>;
    abilities: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"pierce">;
        armorReduction: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "pierce";
        armorReduction: number;
    }, {
        type: "pierce";
        armorReduction: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"corrupt">;
        armorReduction: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "corrupt";
        armorReduction: number;
    }, {
        type: "corrupt";
        armorReduction: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"slow">;
        speedReduction: z.ZodNumber;
        duration: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "slow";
        speedReduction: number;
        duration?: number | undefined;
    }, {
        type: "slow";
        speedReduction: number;
        duration?: number | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"poison">;
        dps: z.ZodNumber;
        duration: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "poison";
        duration: number;
        dps: number;
    }, {
        type: "poison";
        duration: number;
        dps: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"cleave">;
        percent: z.ZodNumber;
        radius: z.ZodNumber;
        damageType: z.ZodLiteral<"pure">;
    }, "strip", z.ZodTypeAny, {
        type: "cleave";
        percent: number;
        radius: number;
        damageType: "pure";
    }, {
        type: "cleave";
        percent: number;
        radius: number;
        damageType: "pure";
    }>, z.ZodObject<{
        type: z.ZodLiteral<"split_shot">;
        targets: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "split_shot";
        targets: number;
    }, {
        type: "split_shot";
        targets: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"burn">;
        dps: z.ZodNumber;
        radius: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "burn";
        dps: number;
        radius: number;
    }, {
        type: "burn";
        dps: number;
        radius: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"anti_fly">;
        armorReduction: z.ZodNumber;
        speedReduction: z.ZodNumber;
        mrReduction: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "anti_fly";
        armorReduction: number;
        speedReduction: number;
        mrReduction?: number | undefined;
    }, {
        type: "anti_fly";
        armorReduction: number;
        speedReduction: number;
        mrReduction?: number | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"stun">;
        chance: z.ZodNumber;
        duration: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "stun";
        duration: number;
        chance: number;
    }, {
        type: "stun";
        duration: number;
        chance: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"chain_lightning">;
        chance: z.ZodNumber;
        jumps: z.ZodNumber;
        damage: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "chain_lightning";
        chance: number;
        jumps: number;
        damage: number;
    }, {
        type: "chain_lightning";
        chance: number;
        jumps: number;
        damage: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"aura_attack_speed">;
        bonus: z.ZodNumber;
        radius: z.ZodNumber;
        stackGroup: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "aura_attack_speed";
        radius: number;
        bonus: number;
        stackGroup: string;
    }, {
        type: "aura_attack_speed";
        radius: number;
        bonus: number;
        stackGroup: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"aura_range">;
        bonus: z.ZodNumber;
        radius: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "aura_range";
        radius: number;
        bonus: number;
    }, {
        type: "aura_range";
        radius: number;
        bonus: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"inspire">;
        damagePercent: z.ZodNumber;
        radius: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "inspire";
        radius: number;
        damagePercent: number;
    }, {
        type: "inspire";
        radius: number;
        damagePercent: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"monkey_king_bar">;
        radius: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "monkey_king_bar";
        radius: number;
    }, {
        type: "monkey_king_bar";
        radius: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"decadent">;
        armorReduction: z.ZodNumber;
        mrReduction: z.ZodNumber;
        radius: z.ZodNumber;
        ignoreMagicImmune: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        type: "decadent";
        armorReduction: number;
        radius: number;
        mrReduction: number;
        ignoreMagicImmune?: boolean | undefined;
    }, {
        type: "decadent";
        armorReduction: number;
        radius: number;
        mrReduction: number;
        ignoreMagicImmune?: boolean | undefined;
    }>]>, "many">;
    projectileKey: z.ZodOptional<z.ZodString>;
    assetKey: z.ZodString;
    footprint: z.ZodLiteral<2>;
    blocksPath: z.ZodLiteral<true>;
}, "strip", z.ZodTypeAny, {
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
}, {
    type: "amethyst" | "aquamarine" | "diamond" | "emerald" | "opal" | "ruby" | "sapphire" | "topaz";
    id: string;
    displayName: string;
    quality: "chipped" | "flawed" | "normal" | "flawless" | "perfect" | "great";
    combat: {
        range: number;
        baseDamage: number;
        attackInterval: number;
        projectileSpeed?: number | undefined;
        targets?: number | undefined;
        critChance?: number | undefined;
        critMultiplier?: number | undefined;
        primaryAttackType?: "normal" | "pierce" | "siege" | "magic" | "chaos" | "pure" | undefined;
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
}>;
export declare const towerDefinitionSchema: z.ZodObject<{
    id: z.ZodString;
    displayName: z.ZodString;
    classification: z.ZodEnum<["basic", "intermediate", "advanced", "top", "secret"]>;
    combat: z.ZodObject<{
        range: z.ZodNumber;
        baseDamage: z.ZodNumber;
        attackInterval: z.ZodNumber;
        projectileSpeed: z.ZodOptional<z.ZodNumber>;
        targets: z.ZodDefault<z.ZodNumber>;
        critChance: z.ZodOptional<z.ZodNumber>;
        critMultiplier: z.ZodOptional<z.ZodNumber>;
        primaryAttackType: z.ZodDefault<z.ZodEnum<["normal", "pierce", "siege", "magic", "chaos", "pure"]>>;
    }, "strip", z.ZodTypeAny, {
        range: number;
        baseDamage: number;
        attackInterval: number;
        targets: number;
        primaryAttackType: "normal" | "pierce" | "siege" | "magic" | "chaos" | "pure";
        projectileSpeed?: number | undefined;
        critChance?: number | undefined;
        critMultiplier?: number | undefined;
    }, {
        range: number;
        baseDamage: number;
        attackInterval: number;
        projectileSpeed?: number | undefined;
        targets?: number | undefined;
        critChance?: number | undefined;
        critMultiplier?: number | undefined;
        primaryAttackType?: "normal" | "pierce" | "siege" | "magic" | "chaos" | "pure" | undefined;
    }>;
    abilities: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"pierce">;
        armorReduction: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "pierce";
        armorReduction: number;
    }, {
        type: "pierce";
        armorReduction: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"corrupt">;
        armorReduction: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "corrupt";
        armorReduction: number;
    }, {
        type: "corrupt";
        armorReduction: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"slow">;
        speedReduction: z.ZodNumber;
        duration: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "slow";
        speedReduction: number;
        duration?: number | undefined;
    }, {
        type: "slow";
        speedReduction: number;
        duration?: number | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"poison">;
        dps: z.ZodNumber;
        duration: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "poison";
        duration: number;
        dps: number;
    }, {
        type: "poison";
        duration: number;
        dps: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"cleave">;
        percent: z.ZodNumber;
        radius: z.ZodNumber;
        damageType: z.ZodLiteral<"pure">;
    }, "strip", z.ZodTypeAny, {
        type: "cleave";
        percent: number;
        radius: number;
        damageType: "pure";
    }, {
        type: "cleave";
        percent: number;
        radius: number;
        damageType: "pure";
    }>, z.ZodObject<{
        type: z.ZodLiteral<"split_shot">;
        targets: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "split_shot";
        targets: number;
    }, {
        type: "split_shot";
        targets: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"burn">;
        dps: z.ZodNumber;
        radius: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "burn";
        dps: number;
        radius: number;
    }, {
        type: "burn";
        dps: number;
        radius: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"anti_fly">;
        armorReduction: z.ZodNumber;
        speedReduction: z.ZodNumber;
        mrReduction: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "anti_fly";
        armorReduction: number;
        speedReduction: number;
        mrReduction?: number | undefined;
    }, {
        type: "anti_fly";
        armorReduction: number;
        speedReduction: number;
        mrReduction?: number | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"stun">;
        chance: z.ZodNumber;
        duration: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "stun";
        duration: number;
        chance: number;
    }, {
        type: "stun";
        duration: number;
        chance: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"chain_lightning">;
        chance: z.ZodNumber;
        jumps: z.ZodNumber;
        damage: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "chain_lightning";
        chance: number;
        jumps: number;
        damage: number;
    }, {
        type: "chain_lightning";
        chance: number;
        jumps: number;
        damage: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"aura_attack_speed">;
        bonus: z.ZodNumber;
        radius: z.ZodNumber;
        stackGroup: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "aura_attack_speed";
        radius: number;
        bonus: number;
        stackGroup: string;
    }, {
        type: "aura_attack_speed";
        radius: number;
        bonus: number;
        stackGroup: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"aura_range">;
        bonus: z.ZodNumber;
        radius: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "aura_range";
        radius: number;
        bonus: number;
    }, {
        type: "aura_range";
        radius: number;
        bonus: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"inspire">;
        damagePercent: z.ZodNumber;
        radius: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "inspire";
        radius: number;
        damagePercent: number;
    }, {
        type: "inspire";
        radius: number;
        damagePercent: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"monkey_king_bar">;
        radius: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "monkey_king_bar";
        radius: number;
    }, {
        type: "monkey_king_bar";
        radius: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"decadent">;
        armorReduction: z.ZodNumber;
        mrReduction: z.ZodNumber;
        radius: z.ZodNumber;
        ignoreMagicImmune: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        type: "decadent";
        armorReduction: number;
        radius: number;
        mrReduction: number;
        ignoreMagicImmune?: boolean | undefined;
    }, {
        type: "decadent";
        armorReduction: number;
        radius: number;
        mrReduction: number;
        ignoreMagicImmune?: boolean | undefined;
    }>]>, "many">;
    projectileKey: z.ZodOptional<z.ZodString>;
    assetKey: z.ZodString;
    recipeId: z.ZodOptional<z.ZodString>;
    footprint: z.ZodLiteral<2>;
    blocksPath: z.ZodDefault<z.ZodLiteral<true>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    displayName: string;
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
    classification: "basic" | "intermediate" | "advanced" | "top" | "secret";
    projectileKey?: string | undefined;
    recipeId?: string | undefined;
}, {
    id: string;
    displayName: string;
    combat: {
        range: number;
        baseDamage: number;
        attackInterval: number;
        projectileSpeed?: number | undefined;
        targets?: number | undefined;
        critChance?: number | undefined;
        critMultiplier?: number | undefined;
        primaryAttackType?: "normal" | "pierce" | "siege" | "magic" | "chaos" | "pure" | undefined;
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
    classification: "basic" | "intermediate" | "advanced" | "top" | "secret";
    projectileKey?: string | undefined;
    blocksPath?: true | undefined;
    recipeId?: string | undefined;
}>;
export type TowerCombatStats = z.infer<typeof towerCombatStatsSchema>;
export type TowerAbility = z.infer<typeof towerAbilitySchema>;
export type GemDefinition = z.infer<typeof gemDefinitionSchema>;
export type TowerDefinition = z.infer<typeof towerDefinitionSchema>;
//# sourceMappingURL=gem.d.ts.map