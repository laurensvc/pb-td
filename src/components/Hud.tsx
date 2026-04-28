import {
  Activity,
  Gauge,
  HeartPulse,
  Medal,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { gameConfig, getEnemy } from '../game/config';
import type { GameSnapshot, SaveState } from '../game/types';
import { getWaveTags } from './uiTags';

interface HudProps {
  snapshot: GameSnapshot;
  save: SaveState;
  speed: number;
  onStartWave: () => void;
  onPauseToggle: () => void;
  onReset: () => void;
  onSetSpeed: (speed: number) => void;
}

const wavePeers = gameConfig.waves.map((wave) => ({
  wave,
  enemy: getEnemy(gameConfig, wave.enemyId),
}));

export function Hud({
  snapshot,
  save,
  speed,
  onStartWave,
  onPauseToggle,
  onReset,
  onSetSpeed,
}: HudProps) {
  const phaseTone = snapshot.phase === 'attack' ? 'text-tactical-red' : 'text-tactical-green';
  const statusLabel = snapshot.status === 'running' ? 'LIVE' : snapshot.status.toUpperCase();
  const nextEnemy = snapshot.nextWave ? getEnemy(gameConfig, snapshot.nextWave.enemyId) : null;
  const nextWaveTags = getWaveTags(snapshot.nextWave, nextEnemy, wavePeers, 5);

  return (
    <header className="pixel-panel h-[17rem] overflow-hidden px-3 py-3 sm:h-[14rem] sm:px-4 xl:h-[11.5rem]">
      <div className="grid gap-3 xl:grid-cols-[minmax(260px,0.8fr)_minmax(520px,1.2fr)] xl:items-center">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2 overflow-hidden">
            <span className="pixel-tag border-tactical-cyan/70 bg-tactical-cyan text-[#041016]">
              <Shield size={14} />
              PB TD
            </span>
            <span className={`pixel-tag ${phaseTone}`}>
              <Activity size={14} />
              {snapshot.phase}
            </span>
            <span className="pixel-tag text-tactical-muted">
              <Zap size={14} />
              {statusLabel}
            </span>
          </div>
          <h1 className="mt-2 truncate font-display text-2xl leading-none text-tactical-ink sm:text-3xl xl:text-4xl">
            Gem Castle Defense
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
          <Metric icon={<Sparkles size={16} />} label="Gold" value={snapshot.gold} tone="gold" />
          <Metric icon={<HeartPulse size={16} />} label="Lives" value={snapshot.lives} tone="red" />
          <Metric
            icon={<Gauge size={16} />}
            label="Wave"
            value={`${snapshot.wave} / ${snapshot.totalWaves}`}
            tone="violet"
          />
          <Metric icon={<Trophy size={16} />} label="Best" value={save.bestWave} tone="green" />
          <Metric
            icon={<Medal size={16} />}
            label="MVPs"
            value={snapshot.selectedTower?.mvpAwards ?? 0}
            tone="gold"
          />
        </div>
      </div>
      <div className="mt-3 grid gap-2 xl:grid-cols-[minmax(260px,1fr)_auto] xl:items-center">
        <p className="min-h-7 truncate border border-tactical-cyan/20 bg-[#071016]/70 px-3 py-2 font-display text-sm leading-tight text-tactical-ink sm:text-base">
          {snapshot.message}
        </p>
        <div className="flex items-center gap-2 overflow-hidden xl:justify-end">
          <button
            className="arcade-button shrink-0 px-4 py-2 font-black"
            onClick={onStartWave}
            disabled={!snapshot.canStartWave}
          >
            <Play size={16} />
            START WAVE
          </button>
          <button
            className="arcade-button-secondary shrink-0 px-3 py-2 font-bold"
            onClick={onPauseToggle}
          >
            {snapshot.status === 'paused' ? <Play size={16} /> : <Pause size={16} />}
            {snapshot.status === 'paused' ? 'RESUME' : 'PAUSE'}
          </button>
          <label className="flex shrink-0 items-center gap-2 border border-tactical-cyan/20 bg-[#071016]/70 px-3 py-2 font-display text-sm text-tactical-ink">
            <Gauge size={16} />
            SPD
            <select
              className="cursor-pointer bg-[#071016] font-display text-tactical-cyan focus:outline-none"
              value={speed}
              onChange={(event) => onSetSpeed(Number(event.target.value))}
            >
              <option value={1}>1x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
              <option value={3}>3x</option>
            </select>
          </label>
          <button className="arcade-button-danger shrink-0 px-3 py-2 font-bold" onClick={onReset}>
            <RotateCcw size={16} />
            RESET RUN
          </button>
        </div>
      </div>
      <div className="mt-2 flex min-w-0 items-center gap-2 overflow-hidden border border-tactical-cyan/15 bg-[#071016]/50 px-3 py-1.5">
        <span className="shrink-0 font-display text-xs uppercase text-tactical-cyan">Next</span>
        <span className="min-w-0 truncate text-sm font-bold text-tactical-ink">
          {snapshot.nextWave ? `${snapshot.nextWave.wave}. ${snapshot.nextWave.name}` : 'None'}
        </span>
        <span className="flex min-w-0 items-center gap-1 overflow-hidden">
          {nextWaveTags.map((tag) => (
            <span
              key={tag}
              className="shrink-0 border border-tactical-amber/45 bg-tactical-amber/10 px-1.5 py-0.5 font-display text-[0.64rem] uppercase leading-none text-tactical-amber"
            >
              {tag}
            </span>
          ))}
        </span>
      </div>
    </header>
  );
}

function Metric({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone: 'gold' | 'cyan' | 'red' | 'violet' | 'green';
}) {
  const toneClass = {
    gold: 'text-tactical-amber',
    cyan: 'text-tactical-cyan',
    red: 'text-tactical-red',
    violet: 'text-tactical-violet',
    green: 'text-tactical-green',
  }[tone];

  return (
    <div className="pixel-stat min-w-0 px-3 py-2">
      <div className="flex items-center gap-1.5 truncate font-display text-[0.68rem] uppercase text-tactical-muted">
        <span className={toneClass}>{icon}</span>
        {label}
      </div>
      <div className={`truncate font-display text-xl leading-none sm:text-2xl ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}
