export interface UserSettings {
  showWavePreview: boolean
  showRecipeDictionary: boolean
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  showWavePreview: true,
  showRecipeDictionary: true,
}

const STORAGE_KEY = 'facet.gemtd.settings'

export function loadUserSettings(): UserSettings {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_USER_SETTINGS }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_USER_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<UserSettings>
    return {
      showWavePreview: parsed.showWavePreview ?? DEFAULT_USER_SETTINGS.showWavePreview,
      showRecipeDictionary:
        parsed.showRecipeDictionary ?? DEFAULT_USER_SETTINGS.showRecipeDictionary,
    }
  } catch {
    return { ...DEFAULT_USER_SETTINGS }
  }
}

export function saveUserSettings(settings: UserSettings): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
