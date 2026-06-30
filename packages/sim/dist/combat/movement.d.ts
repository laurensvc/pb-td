import type { PathCache } from '../pathfinding/path-cache.js';
import type { FlyingPath } from './flying-path.js';
import type { CreepEntity } from './types.js';
export declare function advanceGroundCreep(creep: CreepEntity, pathCache: PathCache, dt: number): boolean;
export declare function advanceFlyingCreep(creep: CreepEntity, flyingPath: FlyingPath, dt: number): boolean;
export declare function initCreepPosition(creep: CreepEntity, pathCache: PathCache | null, flyingPath: FlyingPath | null): void;
//# sourceMappingURL=movement.d.ts.map