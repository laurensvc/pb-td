import { describe, expect, it } from 'vitest'
import { generatePlaceholderCanvas } from './placeholder-generator.js'
import { getManifestEntry } from './manifest.js'
import { resolvePlaceholderStyle } from './placeholder-styles.js'

describe('placeholder generator', () => {
  it('renders a canvas for manifest entries', () => {
    const entry = getManifestEntry('tower.ruby.chipped')
    expect(entry).toBeDefined()
    const canvas = generatePlaceholderCanvas(entry!)
    expect(canvas.width).toBe(entry!.frameWidth * entry!.frames)
    expect(canvas.height).toBe(entry!.frameHeight)
  })

  it('resolves distinct styles per family', () => {
    const flame = resolvePlaceholderStyle('tower.flame-t1.idle')
    const stone = resolvePlaceholderStyle('tower.stone-t1.idle')
    expect(flame.fill).not.toBe(stone.fill)
  })

  it('maps tracker paths to readable placeholder shapes', () => {
    expect(resolvePlaceholderStyle('env.rock').shape).toBe('rock')
    expect(resolvePlaceholderStyle('fx.selection-ring').shape).toBe('ring')
    expect(resolvePlaceholderStyle('enemy.crystal-runner.walk').shape).toBe('enemy')
  })
})
