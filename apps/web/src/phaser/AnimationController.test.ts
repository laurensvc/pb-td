import { describe, expect, it, vi } from 'vitest'
import { AnimationController } from './AnimationController.js'

function createMockSprite() {
  return {
    anims: {
      play: vi.fn(),
      stop: vi.fn(),
    },
    once: vi.fn(),
    setTint: vi.fn(),
    clearTint: vi.fn(),
    scaleX: 1,
    scaleY: 1,
    setScale: vi.fn(),
  }
}

describe('AnimationController', () => {
  it('plays looping manifest animations when registered', () => {
    const sprite = createMockSprite()
    const scene = {
      anims: { exists: () => true },
      tweens: { add: vi.fn() },
      time: { delayedCall: vi.fn() },
    }
    const controller = new AnimationController(scene as never)

    expect(controller.playLoop(sprite as never, 'tower.ruby.chipped')).toBe(true)
    expect(sprite.anims.play).toHaveBeenCalledWith({ key: 'tower.ruby.chipped', repeat: -1 }, true)
  })

  it('pulses sprite scale on attack feedback', () => {
    const sprite = createMockSprite()
    const scene = {
      anims: { exists: () => false },
      tweens: { add: vi.fn() },
      time: { delayedCall: vi.fn() },
    }
    const controller = new AnimationController(scene as never)
    controller.pulseScale(sprite as never)

    expect(scene.tweens.add).toHaveBeenCalled()
  })
})
