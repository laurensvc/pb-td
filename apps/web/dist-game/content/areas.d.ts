import type { AreaDefinition, TierId } from '../types';
export declare const areaDefinitions: AreaDefinition[];
export declare function getArea(areaId: string): AreaDefinition;
export declare function areaTierKey(areaId: string, tierId: TierId): string;
export declare function rockPlacementCost(rocksPlaced: number): number;
