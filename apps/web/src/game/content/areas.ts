import type { AreaDefinition, TierId } from '../types';
import { buildPathNav } from '../pathNav';

const areaOnePath = [
  { x: 0, y: 5 },
  { x: 10, y: 5 },
  { x: 10, y: 8 },
  { x: 15, y: 8 },
];

const areaTwoPath = [
  { x: 0, y: 4 },
  { x: 9, y: 4 },
  { x: 9, y: 7 },
  { x: 15, y: 7 },
];

const areaThreePath = [
  { x: 0, y: 3 },
  { x: 11, y: 3 },
  { x: 11, y: 6 },
  { x: 15, y: 6 },
];

export const areaDefinitions: AreaDefinition[] = [
  {
    id: 'a1',
    name: 'Orion Breach',
    subtitle: 'Build your maze, merge gems, survive 50 waves.',
    path: areaOnePath,
    pathNav: buildPathNav(areaOnePath),
    tiers: {
      normal: {
        enemyHpMultiplier: 1,
        enemySpeedMultiplier: 1,
        starMultiplier: 1,
        goldMultiplier: 1,
        startingGold: 35,
      },
      hard: {
        enemyHpMultiplier: 1.45,
        enemySpeedMultiplier: 1.08,
        starMultiplier: 1.35,
        goldMultiplier: 1.15,
        startingGold: 30,
      },
    },
  },
  {
    id: 'a2',
    name: 'Lunar Causeway',
    subtitle: 'Tighter bends reward splash gems and maze choke points.',
    path: areaTwoPath,
    pathNav: buildPathNav(areaTwoPath),
    tiers: {
      normal: {
        enemyHpMultiplier: 1.15,
        enemySpeedMultiplier: 1.04,
        starMultiplier: 1.2,
        goldMultiplier: 1.05,
        startingGold: 38,
      },
      hard: {
        enemyHpMultiplier: 1.62,
        enemySpeedMultiplier: 1.12,
        starMultiplier: 1.48,
        goldMultiplier: 1.2,
        startingGold: 32,
      },
    },
  },
  {
    id: 'a3',
    name: 'Crownfall Gate',
    subtitle: 'Elite tides and boss rushes test your great gem builds.',
    path: areaThreePath,
    pathNav: buildPathNav(areaThreePath),
    tiers: {
      normal: {
        enemyHpMultiplier: 1.28,
        enemySpeedMultiplier: 1.06,
        starMultiplier: 1.35,
        goldMultiplier: 1.1,
        startingGold: 40,
      },
      hard: {
        enemyHpMultiplier: 1.78,
        enemySpeedMultiplier: 1.14,
        starMultiplier: 1.62,
        goldMultiplier: 1.25,
        startingGold: 35,
      },
    },
  },
];

export function getArea(areaId: string): AreaDefinition {
  const area = areaDefinitions.find((candidate) => candidate.id === areaId);
  if (!area) throw new Error(`Missing area: ${areaId}`);
  return area;
}

export function areaTierKey(areaId: string, tierId: TierId): string {
  return `${areaId}:${tierId}`;
}

export function rockPlacementCost(rocksPlaced: number): number {
  return 2 + rocksPlaced * 2;
}
