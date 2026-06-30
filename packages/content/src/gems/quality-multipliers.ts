import type { QualityTier } from '../schemas/common.js'
import type { TowerAbility } from '../schemas/gem.js'

export interface QualityMultipliers {
  damage: number
  dotDebuff: number
  range: number
  attackSpeed: number
}

export const qualityMultipliers: Record<QualityTier, QualityMultipliers> = {
  chipped: { damage: 1.0, dotDebuff: 1.0, range: 1.0, attackSpeed: 1.0 },
  flawed: { damage: 2.0, dotDebuff: 1.75, range: 1.0, attackSpeed: 1.0 },
  normal: { damage: 3.0, dotDebuff: 2.5, range: 1.05, attackSpeed: 1.0 },
  flawless: { damage: 4.5, dotDebuff: 3.5, range: 1.1, attackSpeed: 1.05 },
  perfect: { damage: 7.0, dotDebuff: 5.0, range: 1.15, attackSpeed: 1.1 },
  great: { damage: 12.0, dotDebuff: 8.0, range: 1.2, attackSpeed: 1.15 },
}

export function scaleAbilities(
  abilities: TowerAbility[],
  mult: QualityMultipliers,
): TowerAbility[] {
  return abilities.map((ability) => {
    switch (ability.type) {
      case 'pierce':
      case 'corrupt':
        return { ...ability, armorReduction: ability.armorReduction * mult.dotDebuff }
      case 'slow':
        return {
          ...ability,
          speedReduction: ability.speedReduction * mult.dotDebuff,
        }
      case 'poison':
        return { ...ability, dps: ability.dps * mult.dotDebuff }
      case 'cleave':
        return { ...ability, percent: ability.percent * mult.dotDebuff }
      case 'aura_attack_speed':
        return { ...ability, bonus: ability.bonus * mult.dotDebuff }
      case 'anti_fly':
        return {
          ...ability,
          armorReduction: ability.armorReduction * mult.dotDebuff,
          speedReduction: ability.speedReduction * mult.dotDebuff,
          mrReduction: ability.mrReduction ? ability.mrReduction * mult.dotDebuff : undefined,
        }
      default:
        return { ...ability }
    }
  })
}
