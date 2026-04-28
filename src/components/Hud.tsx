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
  const phaseTone = snapshot.phase === 'attack' ? 'text-arcade-red' : 'text-arcade-green';
  const statusLabel = snapshot.status === 'running' ? 'LIVE' : snapshot.status.toUpperCase();

  return (
    <header className="pixel-panel px-3 py-3 sm:px-4">
      <div className="grid gap-3 xl:grid-cols-[minmax(260px,0.8fr)_minmax(520px,1.2fr)] xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pixel-tag bg-arcade-yellow text-[#19170e]">PB TD</span>
            <span className={`pixel-tag bg-[#171713] ${phaseTone}`}>{snapshot.phase}</span>
            <span className="pixel-tag bg-[#171713] text-[#d9c994]">{statusLabel}</span>
          </div>
          <h1 className="mt-2 truncate font-display text-2xl font-black leading-none text-[#fff7d6] sm:text-3xl xl:text-4xl">
            Gem Castle Defense
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
          <Metric label="Gold" value={snapshot.gold} tone="gold" />
          <Metric label="Lives" value={snapshot.lives} tone="red" />
          <Metric label="Wave" value={`${snapshot.wave} / ${snapshot.totalWaves}`} tone="violet" />
          <Metric label="Best" value={save.bestWave} tone="green" />
          <Metric label="MVPs" value={snapshot.selectedTower?.mvpAwards ?? 0} tone="gold" />
        </div>
      </div>
      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(260px,1fr)_auto] xl:items-center">
        <p className="min-h-7 border-2 border-[#3c3323] bg-[#171713] px-3 py-2 text-sm font-extrabold leading-tight text-[#f7f0d2] sm:text-base">
          {snapshot.message}
        </p>
        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
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
              className="cursor-pointer bg-[#171713] font-black text-arcade-yellow focus:outline-none"
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
    <div className="pixel-stat min-w-0 px-3 py-2">
      <div className="truncate text-[0.66rem] font-black uppercase tracking-[0.12em] text-[#d8c991]/75">
        {label}
      </div>
      <div
        className={`truncate font-display text-xl font-black leading-none sm:text-2xl ${toneClass}`}
      >
        {value}
      </div>
    </div>
  );
}
