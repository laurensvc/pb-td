import { useEffect, useState } from 'react'
import { gameContent } from '@facet/content'
import type { GameCommand, GameSnapshot } from '@facet/protocol'
import { GameBridge } from '../bridge/game-bridge.ts'
import { selectHudState } from '../bridge/selectors.ts'
import { BuildControls } from './BuildControls.tsx'
import { Hud } from './Hud.tsx'
import { PhaserGame } from './PhaserGame.tsx'
import { RecipeDictionary } from './RecipeDictionary.tsx'
import { WavePreview } from './WavePreview.tsx'

export function GameView() {
  const [bridge, setBridge] = useState<GameBridge | null>(null)
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null)

  useEffect(() => {
    const instance = new GameBridge(gameContent, { seed: 42 })
    if (import.meta.env.VITEST) {
      instance.dispatch({ type: 'game.skipCountdown' })
    }
    instance.start()
    setBridge(instance)
    const unsubscribe = instance.onSnapshot(setSnapshot)
    return () => {
      unsubscribe()
      instance.destroy()
      setBridge(null)
      setSnapshot(null)
    }
  }, [])

  const hud = snapshot ? selectHudState(snapshot) : null

  const dispatch = (command: GameCommand) => {
    bridge?.dispatch(command)
  }

  return (
    <div className="game-view" data-testid="game-view" data-phase={snapshot?.phase ?? 'loading'}>
      {hud && <Hud hud={hud} />}
      <div className="game-view__body">
        <aside className="game-view__sidebar">
          {snapshot && <WavePreview snapshot={snapshot} />}
          {snapshot && <RecipeDictionary snapshot={snapshot} />}
        </aside>
        <div className="game-view__canvas">{bridge && <PhaserGame bridge={bridge} />}</div>
        <aside className="game-view__sidebar game-view__sidebar--right">
          {snapshot && <BuildControls snapshot={snapshot} onCommand={dispatch} />}
        </aside>
      </div>
    </div>
  )
}
