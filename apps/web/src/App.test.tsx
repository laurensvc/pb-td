import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App.tsx'

vi.mock('./phaser/boot.ts', () => ({
  createPhaserGame: vi.fn(() => ({ destroy: vi.fn() })),
}))

describe('App', () => {
  it('shows main menu then enters the game session', () => {
    render(<App />)

    expect(screen.getByTestId('main-menu')).toBeTruthy()
    expect(screen.queryByTestId('game-view')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))

    expect(screen.getByTestId('game-session')).toBeTruthy()
    expect(screen.getByTestId('game-view')).toBeTruthy()
    expect(screen.getByTestId('game-hud')).toBeTruthy()
  })

  it('opens settings from the main menu', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    expect(screen.getByTestId('settings-panel')).toBeTruthy()
  })
})
