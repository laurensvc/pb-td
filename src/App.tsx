import { BentoIntro } from './components/BentoIntro';
import { GameCanvas } from './components/GameCanvas';
import { Hud } from './components/Hud';
import { SidePanel } from './components/SidePanel';
import { useGameController } from './hooks/useGameController';
import { useSaveStore } from './stores/saveStore';
import { useUiStore } from './stores/uiStore';

export default function App() {
  const controller = useGameController();
  const snapshot = useUiStore((state) => state.snapshot);
  const speed = useUiStore((state) => state.speed);
  const setSpeed = useUiStore((state) => state.setSpeed);
  const save = useSaveStore((state) => state.save);

  return (
    <main className="min-h-screen overflow-hidden bg-[#071016] text-tactical-ink">
      <div className="pixel-backdrop absolute inset-0" />
      <BentoIntro />
      <div className="relative mx-auto grid min-h-screen max-w-[1760px] grid-cols-1 gap-3 p-2 sm:p-3 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-4 lg:p-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="flex min-h-[640px] flex-col gap-3">
          <Hud
            snapshot={snapshot}
            speed={speed}
            save={save}
            onStartWave={() => controller.dispatch({ type: 'startWave' })}
            onPauseToggle={() =>
              controller.dispatch({ type: snapshot.status === 'paused' ? 'resume' : 'pause' })
            }
            onReset={() => controller.dispatch({ type: 'resetRun' })}
            onSetSpeed={setSpeed}
          />
          <GameCanvas controller={controller} />
        </section>
        <SidePanel controller={controller} snapshot={snapshot} save={save} />
      </div>
    </main>
  );
}
