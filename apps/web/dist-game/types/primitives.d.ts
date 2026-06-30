export type PlacementMode = 'gem' | 'rock' | 'merge' | 'hold';
export type BuildStep = 'rocks' | 'prospect' | 'upgrade' | 'ready';
export type TargetingMode = 'first' | 'last' | 'strong' | 'weak';
export type TierId = 'normal' | 'hard';
export type GameStatus = 'idle' | 'running' | 'betweenWaves' | 'lost' | 'cleared';
export type BaseGemFamilyId = 'kinetic' | 'verdant' | 'arcane' | 'nova' | 'prism' | 'ember';
export type HybridGemFamilyId = 'toxic_shot' | 'plasma_mortar' | 'pierce_crystal' | 'spore_bomb' | 'slayer_shard' | 'venom_lens' | 'shatter_star' | 'executioner' | 'ember_lance' | 'solar_flare';
export type GemFamilyId = BaseGemFamilyId | HybridGemFamilyId;
export type DamageType = 'physical' | 'magic' | 'pure';
export type GemLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type EnemyId = 'scout' | 'trooper' | 'bulwark' | 'striker' | 'warden' | 'vanguard' | 'runner' | 'brute' | 'shifter' | 'mystic' | 'colossus' | 'dreadnought';
export type GameSpeed = 1 | 2 | 4;
/** @deprecated Use GemFamilyId */
export type TowerId = GemFamilyId;
export interface Vec2 {
    x: number;
    y: number;
}
