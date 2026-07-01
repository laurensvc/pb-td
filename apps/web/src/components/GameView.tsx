import { useEffect, useState } from 'react'
import { gameContent } from '@facet/content'
import type { GameCommand, WorldInputCommand } from '@facet/protocol'
import { GameBridge } from '../bridge/game-bridge.ts'
import { useGameViewState } from '../bridge/use-game-view-state.ts'
import type { UserSettings } from '../settings/user-settings.ts'
import { BuildControls } from './BuildControls.tsx'
import { Hud } from './Hud.tsx'
import { Minimap } from './Minimap.tsx'
import { PhaserGame } from './PhaserGame.tsx'
import { RecipeDictionary } from './RecipeDictionary.tsx'
import { WavePreview } from './WavePreview.tsx'

interface GameViewProps {
  paused: boolean
  settings: UserSettings
  onPause: () => void
}

export function GameView({ paused, settings, onPause }: GameViewProps) {
  const [bridge] = useState(() => {
    const instance = new GameBridge(gameContent, { seed: 42 })
    if (import.meta.env.VITEST) {
      instance.dispatch({ type: 'game.skipCountdown' })
    }
    instance.start()
    return instance
  })
  const { hud, buildControls, wavePreview, recipeDictionary, minimap } = useGameViewState(bridge)

  useEffect(() => {
    bridge.dispatch({ type: 'game.pause', paused })
  }, [bridge, paused])

  const dispatch = (command: GameCommand | WorldInputCommand) => {
    bridge.dispatch(command)
  }

  return (
    <div
      className="game-view"
      data-testid="game-view"
      data-phase={hud?.phase ?? 'loading'}
    >
      {hud && <Hud hud={hud} onPause={onPause} />}
      <div className="game-view__body">
        <aside className="game-view__sidebar">
          {settings.showWavePreview && wavePreview && <WavePreview state={wavePreview} />}
          {settings.showRecipeDictionary && recipeDictionary && (
            <RecipeDictionary state={recipeDictionary} />
          )}
        </aside>
        <div className="game-view__canvas">
          <PhaserGame bridge={bridge} />
          {minimap && (
            <Minimap
              state={minimap}
              onFocusLandmark={(command) => bridge.dispatch(command)}
            />
          )}
        </div>
        <aside className="game-view__sidebar game-view__sidebar--right">
          {buildControls && <BuildControls state={buildControls} onCommand={dispatch} />}
        </aside>
      </div>
    </div>
  )
}
