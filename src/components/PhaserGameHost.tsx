import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import type { GameController } from '../hooks/useGameController';
import { useSaveStore } from '../stores/saveStore';
import { useUiStore } from '../stores/uiStore';
import {
  clearSceneBridge,
  installSceneBridge,
  type PhaserSceneBridge,
} from '../phaser/adapters/sceneBridge';
import { BootScene } from '../phaser/scenes/BootScene';
import { BoardScene } from '../phaser/scenes/BoardScene';
import { BuildBarScene } from '../phaser/scenes/BuildBarScene';
import { HudScene } from '../phaser/scenes/HudScene';
import { InspectorScene } from '../phaser/scenes/InspectorScene';

interface PhaserGameHostProps {
  controller: GameController;
}

export function PhaserGameHost({ controller }: PhaserGameHostProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || gameRef.current) return;

    const bridge: PhaserSceneBridge = {
      game: controller.game,
      dispatch: controller.dispatch,
      getSnapshot: () => useUiStore.getState().snapshot,
      getSave: () => useSaveStore.getState().save,
      getSpeed: () => useUiStore.getState().speed,
      setSpeed: (speed) => useUiStore.getState().setSpeed(speed),
      resetSave: () => useSaveStore.getState().resetSave(),
    };
    installSceneBridge(bridge);

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      width: Math.max(960, host.clientWidth),
      height: Math.max(640, host.clientHeight),
      backgroundColor: '#071016',
      render: {
        antialias: false,
        pixelArt: true,
        roundPixels: true,
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [BootScene, BoardScene, HudScene, InspectorScene, BuildBarScene],
    });
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
      clearSceneBridge(bridge);
    };
  }, [controller.dispatch, controller.game]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#071016]">
      <div ref={hostRef} className="h-screen w-screen" aria-label="PB TD Phaser game" />
    </div>
  );
}
