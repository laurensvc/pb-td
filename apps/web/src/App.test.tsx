import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App.tsx'

vi.mock('./phaser/boot.ts', () => ({
  createPhaserGame: vi.fn(() => ({ destroy: vi.fn() })),
}))

describe('App', () => {
  it('renders the GemTD shell', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'GemTD' })).toBeTruthy()
    expect(screen.getByTestId('game-view')).toBeTruthy()
    expect(screen.getByTestId('game-hud')).toBeTruthy()
  })
})
