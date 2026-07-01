import { describe, expect, it, beforeEach } from 'vitest'
import {
  DEFAULT_USER_SETTINGS,
  loadUserSettings,
  saveUserSettings,
} from './user-settings.js'

describe('user settings', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns defaults when storage is empty', () => {
    expect(loadUserSettings()).toEqual(DEFAULT_USER_SETTINGS)
  })

  it('round-trips preferences through localStorage', () => {
    saveUserSettings({ showWavePreview: false, showRecipeDictionary: true })
    expect(loadUserSettings()).toEqual({
      showWavePreview: false,
      showRecipeDictionary: true,
    })
  })
})
