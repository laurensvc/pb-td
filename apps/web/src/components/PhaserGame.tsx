import { useEffect, useRef } from 'react'
import type { GameBridge } from '../bridge/game-bridge.ts'

interface PhaserGameProps {
  bridge: GameBridge
}

export function PhaserGame({ bridge }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let game: { destroy: (removeCanvas: boolean) => void } | undefined
    let cancelled = false

    void import('../phaser/boot.ts').then(({ createPhaserGame }) => {
      const parent = containerRef.current
      if (cancelled || !parent) return
      game = createPhaserGame(parent, bridge)
    })

    return () => {
      cancelled = true
      game?.destroy(true)
    }
  }, [bridge])

  return <div ref={containerRef} className="phaser-game" data-testid="phaser-game" />
}
