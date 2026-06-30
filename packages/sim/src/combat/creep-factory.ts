import type {
  AbilityDefinition,
  EnemyDefinition,
  GameContent,
  WaveDefinition,
} from '@facet/content'
import type { CreepEntity } from './types.js'

let creepCounter = 0

export function resetCreepIdCounter(): void {
  creepCounter = 0
}

function nextCreepId(): string {
  creepCounter += 1
  return `creep-${creepCounter}`
}

function resolveAbilityParams(content: GameContent, abilityIds: string[]): Record<string, number> {
  const merged: Record<string, number> = {}
  for (const id of abilityIds) {
    const def = content.abilities.find((a) => a.id === id)
    if (!def) continue
    for (const [key, value] of Object.entries(def.params)) {
      if (typeof value === 'number') merged[key] = value
    }
  }
  return merged
}

export function createCreepFromWave(
  content: GameContent,
  enemyId: string,
  wave: WaveDefinition,
  entryHpMultiplier: number,
  entrySpeedMultiplier: number,
  waveNumber: number,
): CreepEntity {
  const enemy = content.enemies.find((e) => e.id === enemyId)
  if (!enemy) throw new Error(`Unknown enemy: ${enemyId}`)

  const waveHpMult = wave.modifiers?.hpMultiplier ?? 1
  const waveSpeedMult = wave.modifiers?.speedMultiplier ?? 1
  const armorBonus = wave.modifiers?.armorBonus ?? 0
  const abilityParams = resolveAbilityParams(content, wave.abilities)

  const maxHp = Math.floor(enemy.stats.baseHp * waveHpMult * entryHpMultiplier)
  const baseSpeed = enemy.stats.baseSpeed * waveSpeedMult * entrySpeedMultiplier

  let armor = enemy.stats.baseArmor + armorBonus
  if (abilityParams.armorBonus) {
    armor += abilityParams.armorBonus
  }

  const evasion = abilityParams.chance ?? 0

  return {
    id: nextCreepId(),
    enemyId: enemy.id,
    waveNumber,
    mobility: enemy.mobility,
    hp: maxHp,
    maxHp,
    baseSpeed,
    speedMultiplier: 1,
    armorType: enemy.stats.armorType,
    armor,
    magicResist: enemy.stats.magicResist,
    evasion,
    magicImmune: enemy.flags?.magicImmune ?? false,
    physicalImmune: enemy.flags?.physicalImmune ?? false,
    slowImmune: enemy.flags?.slowImmune ?? false,
    pathIndex: 0,
    distanceAlongSegment: 0,
    legIndex: 0,
    pathProgress: 0,
    worldPos: { x: 0, y: 0 },
    slowEffects: [],
    poisonEffects: [],
    state: 'moving',
    goldReward: enemy.stats.goldReward,
    lifeCost: enemy.stats.lifeCost,
  }
}

export function getEnemyDef(content: GameContent, enemyId: string): EnemyDefinition {
  const enemy = content.enemies.find((e) => e.id === enemyId)
  if (!enemy) throw new Error(`Unknown enemy: ${enemyId}`)
  return enemy
}

export function getAbilityDef(
  content: GameContent,
  abilityId: string,
): AbilityDefinition | undefined {
  return content.abilities.find((a) => a.id === abilityId)
}
