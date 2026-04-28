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
    <main className="min-h-screen overflow-hidden bg-[#090a14] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#161a3a,#090a14_42%,#210f2e_72%,#080812),repeating-linear-gradient(0deg,rgba(255,255,255,0.035)_0_1px,transparent_1px_8px)]" />
      <div className="relative mx-auto grid min-h-screen max-w-[1720px] grid-cols-1 gap-4 p-3 lg:grid-cols-[minmax(0,1fr)_380px] lg:p-5">
        <section className="flex min-h-[620px] flex-col gap-3">
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
