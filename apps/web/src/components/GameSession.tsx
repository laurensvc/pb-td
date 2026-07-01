import { useCallback, useEffect, useState } from 'react'
import type { UserSettings } from '../settings/user-settings.ts'
import { loadUserSettings, saveUserSettings } from '../settings/user-settings.ts'
import { GameView } from './GameView.tsx'
import { PauseMenu } from './PauseMenu.tsx'
import { SettingsPanel } from './SettingsPanel.tsx'

interface GameSessionProps {
  onExit: () => void
}

export function GameSession({ onExit }: GameSessionProps) {
  const [paused, setPaused] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<UserSettings>(() => loadUserSettings())

  const openSettings = useCallback(() => setSettingsOpen(true), [])
  const closeSettings = useCallback(() => setSettingsOpen(false), [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (settingsOpen) {
        closeSettings()
        return
      }
      setPaused((value) => !value)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeSettings, settingsOpen])

  const updateSettings = (next: UserSettings) => {
    setSettings(next)
    saveUserSettings(next)
  }

  return (
    <div className="game-session" data-testid="game-session">
      <GameView paused={paused} settings={settings} onPause={() => setPaused(true)} />
      {paused && !settingsOpen && (
        <PauseMenu
          onResume={() => setPaused(false)}
          onSettings={openSettings}
          onMainMenu={onExit}
        />
      )}
      {settingsOpen && (
        <SettingsPanel settings={settings} onChange={updateSettings} onClose={closeSettings} />
      )}
    </div>
  )
}
