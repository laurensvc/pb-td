import type { GameSnapshot, SaveState } from '../game/types';

interface HudProps {
  snapshot: GameSnapshot;
  save: SaveState;
  speed: number;
  onStartWave: () => void;
  onPauseToggle: () => void;
  onReset: () => void;
  onSetSpeed: (speed: number) => void;
}

export function Hud({
  snapshot,
  save,
  speed,
  onStartWave,
  onPauseToggle,
  onReset,
  onSetSpeed,
}: HudProps) {
  return (
    <header className="forge-panel rounded-md px-4 py-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brass">PB TD</p>
          <h1 className="font-display text-3xl font-bold leading-none text-vellum md:text-4xl">
            Gem Foundry
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 xl:min-w-[520px]">
          <Metric label="Gold" value={snapshot.gold} />
          <Metric label="Lives" value={snapshot.lives} />
          <Metric
            label="Wave"
            value={`${Math.min(snapshot.wave, snapshot.totalWaves)} / ${snapshot.totalWaves}`}
          />
          <Metric label="Best" value={save.bestWave} />
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <p className="min-h-6 text-base font-medium text-[#f2dfb8]">{snapshot.message}</p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="forge-button rounded px-4 py-2 font-bold"
            onClick={onStartWave}
            disabled={!snapshot.canStartWave}
          >
            Start Wave
          </button>
          <button
            className="rounded border border-brass/35 bg-vellum/10 px-3 py-2 text-sm font-bold text-vellum"
            onClick={onPauseToggle}
          >
            {snapshot.status === 'paused' ? 'Resume' : 'Pause'}
          </button>
          <label className="flex items-center gap-2 rounded border border-brass/25 bg-black/15 px-3 py-2 text-sm text-vellum/85">
            Speed
            <select
              className="bg-transparent font-bold text-vellum"
              value={speed}
              onChange={(event) => onSetSpeed(Number(event.target.value))}
            >
              <option value={1}>1x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          </label>
          <button
            className="rounded border border-ruby/35 bg-ruby/10 px-3 py-2 text-sm font-bold text-vellum"
            onClick={onReset}
          >
            Reset
          </button>
        </div>
      </div>
    </header>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded border border-brass/20 bg-black/18 px-3 py-2 shadow-insetGlow">
      <div className="text-xs uppercase tracking-[0.18em] text-brass/85">{label}</div>
      <div className="font-display text-2xl font-bold leading-none text-vellum">{value}</div>
    </div>
  );
}
