import type { UserSettings } from '../settings/user-settings.ts'

interface SettingsPanelProps {
  settings: UserSettings
  onChange: (settings: UserSettings) => void
  onClose: () => void
}

export function SettingsPanel({ settings, onChange, onClose }: SettingsPanelProps) {
  return (
    <div className="menu-overlay" data-testid="settings-panel" role="dialog" aria-modal="true" aria-label="Settings">
      <div className="menu-screen__card menu-screen__card--wide">
        <h2 className="menu-screen__title">Settings</h2>
        <div className="settings-panel__options">
          <label className="settings-panel__option">
            <input
              type="checkbox"
              checked={settings.showWavePreview}
              onChange={(e) => onChange({ ...settings, showWavePreview: e.target.checked })}
            />
            Show wave preview panel
          </label>
          <label className="settings-panel__option">
            <input
              type="checkbox"
              checked={settings.showRecipeDictionary}
              onChange={(e) => onChange({ ...settings, showRecipeDictionary: e.target.checked })}
            />
            Show recipe dictionary
          </label>
        </div>
        <div className="menu-screen__actions">
          <button type="button" className="menu-screen__button menu-screen__button--primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
