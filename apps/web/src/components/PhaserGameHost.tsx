import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GemBoardScene } from '../phaser/GemBoardScene';
import { clearBridge, installBridge, type PhaserBridge } from '../phaser/bridge';

interface PhaserGameHostProps {
  bridge: PhaserBridge;
}

export function PhaserGameHost({ bridge }: PhaserGameHostProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const bridgeRef = useRef(bridge);

  useEffect(() => {
    bridgeRef.current = bridge;
  }, [bridge]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || gameRef.current) return;

    const stableBridge: PhaserBridge = {
      getState: () => bridgeRef.current.getState(),
      dispatch: (action) => bridgeRef.current.dispatch(action),
      previewRockPath: (x, y) => bridgeRef.current.previewRockPath(x, y),
      clearRockPathPreview: () => bridgeRef.current.clearRockPathPreview(),
      step: (dt) => bridgeRef.current.step(dt),
    };

    installBridge(stableBridge);
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      width: Math.max(960, host.clientWidth),
      height: Math.max(620, host.clientHeight),
      backgroundColor: '#050812',
      render: {
        antialias: true,
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.NO_CENTER,
      },
      scene: [GemBoardScene],
    });
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
      clearBridge(stableBridge);
    };
  }, []);

  return <div ref={hostRef} className="game-canvas" aria-label="Gem TD game board" />;
}
