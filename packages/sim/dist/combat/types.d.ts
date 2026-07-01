import type { ArmorType, AttackType } from '@facet/content';
export type TargetingMode = 'closest_to_goal' | 'closest_to_tower' | 'highest_hp' | 'first_in_range';
export type CreepLifecycleState = 'spawning' | 'moving' | 'dying' | 'dead';
export interface WorldPos {
    x: number;
    y: number;
}
export interface SlowEffect {
    sourceId: string;
    speedReduction: number;
    remaining: number;
}
export interface PoisonEffect {
    sourceId: string;
    dps: number;
    remaining: number;
}
export interface CreepEntity {
    id: string;
    enemyId: string;
    waveNumber: number;
    mobility: 'ground' | 'flying';
    hp: number;
    maxHp: number;
    baseSpeed: number;
    speedMultiplier: number;
    armorType: ArmorType;
    armor: number;
    magicResist: number;
    evasion: number;
    magicImmune: boolean;
    physicalImmune: boolean;
    slowImmune: boolean;
    pathIndex: number;
    distanceAlongSegment: number;
    legIndex: number;
    pathProgress: number;
    worldPos: WorldPos;
    slowEffects: SlowEffect[];
    poisonEffects: PoisonEffect[];
    state: CreepLifecycleState;
    goldReward: number;
    lifeCost: number;
}
/** Stub for split-on-death (deferred to slice 2). */
export interface SplitOnDeathBehavior {
    childEnemyId: string;
    childCount: number;
    childHpFraction: number;
    childSpeedMultiplier: number;
    maxSplitDepth: number;
    depth: number;
}
export interface TowerRuntimeState {
    towerId: string;
    targetingMode: TargetingMode;
    holdFire: boolean;
    attackCooldown: number;
    waveDamageDealt: number;
    mvpStacks: number;
}
export interface AttackPacket {
    baseDamage: number;
    attackType: AttackType;
    sourceTowerId: string;
    armorReduction?: number;
    /** Magic bounds aura MR reduction (stackable across magic towers in range). */
    magicResistReduction?: number;
    /** Bypass evasion (monkey king bar — deferred). */
    trueStrike?: boolean;
}
export type CombatEvent = {
    type: 'creep_spawned';
    creepId: string;
    enemyId: string;
    waveNumber: number;
} | {
    type: 'creep_killed';
    creepId: string;
    killerTowerId: string;
    gold: number;
} | {
    type: 'creep_leaked';
    creepId: string;
    waveNumber: number;
    lifeCost: number;
} | {
    type: 'attack_missed';
    creepId: string;
    towerId: string;
} | {
    type: 'tower_fired';
    towerId: string;
    creepId: string;
    damage: number;
} | {
    type: 'wave_spawn_complete';
    waveNumber: number;
} | {
    type: 'wave_cleared';
    waveNumber: number;
} | {
    type: 'mvp_awarded';
    towerId: string;
    stacks: number;
};
export interface CombatSnapshot {
    tick: number;
    waveNumber: number;
    activeCreepCount: number;
    spawnComplete: boolean;
    leaksThisWave: number;
    killsThisWave: number;
    mvpTowerId: string | null;
    creeps: Array<{
        id: string;
        enemyId: string;
        hp: number;
        maxHp: number;
        pathProgress: number;
        worldPos: WorldPos;
        mobility: 'ground' | 'flying';
    }>;
}
//# sourceMappingURL=types.d.ts.map