import { describe, expect, it } from 'vitest'
import { PROTOCOL_VERSION, type GameCommand } from './index.js'

describe('@facet/protocol', () => {
  it('exports a protocol version', () => {
    expect(PROTOCOL_VERSION).toBe(1)
  })

  it('accepts serializable game commands', () => {
    const command: GameCommand = { type: 'economy.upgradeGemChance' }
    expect(JSON.parse(JSON.stringify(command))).toEqual(command)
  })
})
