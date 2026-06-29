import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { CosmicBoardScene } from '../phaser/CosmicBoardScene';
import { clearBridge, installBridge, type PhaserBridge } from '../phaser/bridge';

interface PhaserGameHostProps {
  bridge: PhaserBridge;
}

export function PhaserGameHost({ bridge }: PhaserGameHostProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || gameRef.current) return;

    installBridge(bridge);
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
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [CosmicBoardScene],
    });
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
      clearBridge(bridge);
    };
  }, [bridge]);

  return <div ref={hostRef} className="game-canvas" aria-label="Cosmic Siege game board" />;
}
