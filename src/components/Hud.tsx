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
    <header className="arcade-panel rounded-md px-4 py-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-arcade-yellow">
            PB TD · {snapshot.phase.toUpperCase()}
          </p>
          <h1 className="font-display text-3xl font-black leading-none text-white md:text-4xl">
            Gem Castle Defense
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5 xl:min-w-[600px]">
          <Metric label="Gold" value={snapshot.gold} tone="gold" />
          <Metric label="Lives" value={snapshot.lives} tone="red" />
          <Metric label="Wave" value={`${snapshot.wave} / ${snapshot.totalWaves}`} tone="violet" />
          <Metric label="Best" value={save.bestWave} tone="green" />
          <Metric label="MVPs" value={snapshot.selectedTower?.mvpAwards ?? 0} tone="gold" />
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <p className="min-h-6 text-base font-bold text-white">{snapshot.message}</p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="arcade-button px-4 py-2 font-black"
            onClick={onStartWave}
            disabled={!snapshot.canStartWave}
          >
            START WAVE
          </button>
          <button className="arcade-button-secondary px-3 py-2 font-bold" onClick={onPauseToggle}>
            {snapshot.status === 'paused' ? 'RESUME' : 'PAUSE'}
          </button>
          <label className="flex items-center gap-2 border-2 border-white/20 bg-black/30 px-3 py-2 text-sm font-bold text-white">
            SPD
            <select
              className="bg-black font-black text-arcade-yellow"
              value={speed}
              onChange={(event) => onSetSpeed(Number(event.target.value))}
            >
              <option value={1}>1x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
              <option value={3}>3x</option>
            </select>
          </label>
          <button className="arcade-button-danger px-3 py-2 font-bold" onClick={onReset}>
            RESET RUN
          </button>
        </div>
      </div>
    </header>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: 'gold' | 'cyan' | 'red' | 'violet' | 'green';
}) {
  const toneClass = {
    gold: 'text-arcade-yellow',
    cyan: 'text-arcade-cyan',
    red: 'text-arcade-red',
    violet: 'text-arcade-violet',
    green: 'text-arcade-green',
  }[tone];

  return (
    <div className="border-2 border-white/15 bg-black/35 px-3 py-2 shadow-arcade">
      <div className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-white/60">
        {label}
      </div>
      <div className={`font-display text-2xl font-black leading-none ${toneClass}`}>{value}</div>
    </div>
  );
}
