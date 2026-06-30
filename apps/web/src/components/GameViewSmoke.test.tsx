import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GameView } from './GameView.tsx'

const destroySpy = vi.fn()

vi.mock('../phaser/boot.ts', () => ({
  createPhaserGame: vi.fn((parent: HTMLElement) => {
    const stub = document.createElement('canvas')
    stub.dataset.testid = 'phaser-canvas'
    parent.appendChild(stub)
    return { destroy: destroySpy }
  }),
}))

describe('GameView smoke', () => {
  afterEach(() => {
    destroySpy.mockClear()
  })

  it('mounts, shows HUD in build phase, and unmounts cleanly', async () => {
    const { unmount } = render(<GameView />)

    await waitFor(() => {
      expect(screen.getByTestId('game-hud')).toBeTruthy()
      expect(screen.getByTestId('game-view').getAttribute('data-phase')).toBe('placement')
    })

    expect(screen.getByText('10')).toBeTruthy()
    expect(screen.getByText('Build')).toBeTruthy()
    expect(screen.getByText('5/5')).toBeTruthy()
    expect(screen.getByTestId('phaser-game')).toBeTruthy()
    expect(screen.getByTestId('phaser-canvas')).toBeTruthy()
    expect(screen.getByTestId('build-controls')).toBeTruthy()

    await act(async () => {
      unmount()
    })

    expect(destroySpy).toHaveBeenCalledWith(true)
    expect(screen.queryByTestId('game-hud')).toBeNull()
  })
})
