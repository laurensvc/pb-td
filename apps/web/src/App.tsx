import { useState } from 'react'
import { GameSession } from './components/GameSession.tsx'
import { MainMenu } from './components/MainMenu.tsx'
import { SettingsPanel } from './components/SettingsPanel.tsx'
import {
  loadUserSettings,
  saveUserSettings,
  type UserSettings,
} from './settings/user-settings.ts'

export default function App() {
  const [inGame, setInGame] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<UserSettings>(() => loadUserSettings())

  const updateSettings = (next: UserSettings) => {
    setSettings(next)
    saveUserSettings(next)
  }

  if (!inGame) {
    return (
      <>
        <MainMenu onPlay={() => setInGame(true)} onSettings={() => setSettingsOpen(true)} />
        {settingsOpen && (
          <SettingsPanel
            settings={settings}
            onChange={updateSettings}
            onClose={() => setSettingsOpen(false)}
          />
        )}
      </>
    )
  }

  return <GameSession onExit={() => setInGame(false)} />
}
