import { useEffect, useState } from 'react'
import type { GameSnapshot } from '@facet/protocol'
import type { GameBridge } from './game-bridge.ts'
import {
  selectBuildControlsState,
  selectHudState,
  selectMinimapState,
  selectRecipeDictionaryState,
  selectWavePreviewState,
  type BuildControlsState,
  type HudState,
  type MinimapState,
  type RecipeDictionaryState,
  type WavePreviewState,
} from './selectors.ts'
import { jsonEqual, retainIfEqual, shallowEqual } from './snapshot-diff.ts'

export interface GameViewState {
  hud: HudState | null
  buildControls: BuildControlsState | null
  wavePreview: WavePreviewState | null
  recipeDictionary: RecipeDictionaryState | null
  minimap: MinimapState | null
}

export function deriveGameViewState(snapshot: GameSnapshot, prev: GameViewState): GameViewState {
  return {
    hud: retainIfEqual(prev.hud, selectHudState(snapshot), shallowEqual),
    buildControls: retainIfEqual(
      prev.buildControls,
      selectBuildControlsState(snapshot),
      jsonEqual,
    ),
    wavePreview: retainIfEqual(
      prev.wavePreview,
      selectWavePreviewState(snapshot),
      jsonEqual,
    ),
    recipeDictionary: retainIfEqual(
      prev.recipeDictionary,
      selectRecipeDictionaryState(snapshot),
      jsonEqual,
    ),
    minimap: retainIfEqual(prev.minimap, selectMinimapState(snapshot), jsonEqual),
  }
}

export function useGameViewState(bridge: GameBridge): GameViewState {
  const [state, setState] = useState<GameViewState>({
    hud: null,
    buildControls: null,
    wavePreview: null,
    recipeDictionary: null,
    minimap: null,
  })

  useEffect(() => {
    const unsubscribe = bridge.onSnapshot((snapshot) => {
      setState((prev) => deriveGameViewState(snapshot, prev))
    })
    return unsubscribe
  }, [bridge])

  return state
}
