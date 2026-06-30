import type { AbilityDefinition } from '../schemas/ability.js'

export const v1AbilityDefinitions: AbilityDefinition[] = [
  {
    id: 'high_armor',
    displayName: 'High Armor',
    description: 'Bonus flat armor on all creeps in this wave.',
    icon: 'ui.ability.high-armor',
    params: { armorBonus: 15 },
    tags: ['defensive'],
  },
  {
    id: 'evasion',
    displayName: 'Evasion',
    description: 'Chance to dodge attacks entirely.',
    icon: 'ui.ability.evasion',
    params: { chance: 0.25 },
    tags: ['defensive'],
  },
]
