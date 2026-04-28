import { useState } from 'react';
import type React from 'react';
import {
  BookOpen,
  Box,
  Crosshair,
  Map,
  Medal,
  RadioTower,
  ScanLine,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { gameConfig, getEnemy } from '../game/config';
import type {
  DamageType,
  EnemySkill,
  GameSnapshot,
  SaveState,
  TargetMode,
  TowerEffect,
  TowerEffectDefinition,
  TowerUpgradeStat,
} from '../game/types';
import type { GameController } from '../hooks/useGameController';
import { useSaveStore } from '../stores/saveStore';
import { getTowerTags } from './uiTags';

interface SidePanelProps {
  controller: GameController;
  snapshot: GameSnapshot;
  save: SaveState;
}

type Tab = 'intel' | 'quests' | 'help';
type IconComponent = React.ComponentType<{ size?: number; className?: string }>;

const tabs: readonly { id: Tab; label: string; icon: IconComponent }[] = [
  { id: 'intel', label: 'Intel', icon: ScanLine },
  { id: 'quests', label: 'Quests', icon: Medal },
  { id: 'help', label: 'Help', icon: BookOpen },
];

const targetModeOptions: readonly { id: TargetMode; label: string }[] = [
  { id: 'first', label: 'First' },
  { id: 'last', label: 'Last' },
  { id: 'strongest', label: 'Strongest' },
  { id: 'weakest', label: 'Weakest' },
  { id: 'closest', label: 'Closest' },
  { id: 'flyingOnly', label: 'Flying' },
  { id: 'bossOnly', label: 'Boss' },
];

const targetModeLabels: Record<TargetMode, string> = {
  first: 'First',
  last: 'Last',
  strongest: 'Strongest',
  weakest: 'Weakest',
  closest: 'Closest',
  flyingOnly: 'Flying',
  bossOnly: 'Boss',
};

const damageLabels: Record<DamageType, string> = {
  physical: 'Physical',
  magic: 'Magic',
  pure: 'Pure',
};

const effectLabels: Record<TowerEffect, string> = {
  armorBreak: 'Armor Break',
  speedAura: 'Speed Aura',
  damageAura: 'Damage Aura',
  poison: 'Poison',
  cleave: 'Cleave',
  slow: 'Slow',
  split: 'Split',
  crit: 'Crit',
  burn: 'Burn',
  antiFly: 'Anti-Fly',
  corrupt: 'Corrupt',
  stun: 'Stun',
  lightning: 'Lightning',
  radiation: 'Radiation',
  inspire: 'Inspire',
  resist: 'Resist',
  greedy: 'Greedy',
  overlook: 'Overlook',
  recover: 'Recover',
  mvpAura: 'MVP Aura',
  decadent: 'Decadent',
};

const enemySkillLabels: Record<EnemySkill, string> = {
  magicImmune: 'Magic Immune',
  physicalImmune: 'Physical Immune',
  disarm: 'Disarm',
  flying: 'Flying',
  evasion: 'Evasion',
  refraction: 'Refraction',
  blink: 'Blink',
  rush: 'Rush',
  thief: 'Thief',
  permanentInvisibility: 'Invisible',
  vitality: 'Vitality',
  untouchable: 'Untouchable',
  highArmor: 'High Armor',
  reactiveArmor: 'Reactive Armor',
  recharge: 'Recharge',
  cloakAndDagger: 'Cloak',
  krakenShell: 'Shell',
};

export function SidePanel({ controller, snapshot, save }: SidePanelProps) {
  const [tab, setTab] = useState<Tab>('intel');
  const resetSave = useSaveStore((state) => state.resetSave);
  const selected = snapshot.selectedTile;

  return (
    <aside className="grid max-h-none gap-3 overflow-visible lg:sticky lg:top-4 lg:max-h-[calc(100vh-32px)] lg:overflow-y-auto lg:pr-1">
      <section className="pixel-panel p-2">
        <div className="grid grid-cols-3 gap-1">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`pixel-tab ${tab === item.id ? 'pixel-tab-active' : ''}`}
                onClick={() => setTab(item.id)}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {tab === 'intel' ? (
        <>
          <SelectedPanel controller={controller} snapshot={snapshot} selected={selected} />
          <WavePanel snapshot={snapshot} />
        </>
      ) : null}

      {tab === 'quests' ? (
        <QuestsPanel
          snapshot={snapshot}
          save={save}
          onClaim={() => controller.dispatch({ type: 'claimSeasonReward' })}
          onClear={resetSave}
        />
      ) : null}
      {tab === 'help' ? <HelpPanel /> : null}
    </aside>
  );
}

function SelectedPanel({
  controller,
  snapshot,
  selected,
}: {
  controller: GameController;
  snapshot: GameSnapshot;
  selected: GameSnapshot['selectedTile'];
}) {
  const costs = snapshot.selectedTowerUpgradeCosts;
  return (
    <section className="pixel-panel p-4">
      <PanelTitle icon={<Target size={18} />} eyebrow="Focus" title="Selected" />
      {snapshot.selectedTower ? (
        <div className="mt-3 grid gap-3">
          <div className="pixel-row">
            <div className="flex min-w-0 items-center gap-3">
              <GemChip color={snapshot.selectedTower.color} large />
              <div className="min-w-0">
                <div className="truncate font-black text-tactical-ink">
                  {snapshot.selectedTower.name}
                </div>
                <div className="text-sm text-tactical-muted">
                  {snapshot.selectedTower.damage} dmg | {snapshot.selectedTower.cooldown.toFixed(2)}
                  s | {snapshot.selectedTower.range.toFixed(1)} range
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Stat label="Class" value={snapshot.selectedTower.classification} />
            <Stat label="Damage" value={damageLabels[snapshot.selectedTower.damageType]} />
            <Stat label="Kills" value={snapshot.selectedTower.kills} />
            <Stat label="Target" value={snapshot.selectedTowerTarget?.name ?? 'auto'} />
            <Stat label="Mode" value={targetModeLabels[snapshot.selectedTower.targetMode]} />
            <Stat label="Tier" value={snapshot.selectedTower.tier} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {getTowerTags(snapshot.selectedTower).map((tag) => (
              <Badge key={tag} tone="effect">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <UpgradeButton
              icon={<Sparkles size={15} />}
              label="Tier"
              level={snapshot.selectedTower.tier}
              cost={costs?.tier ?? null}
              onClick={() =>
                selected &&
                controller.dispatch({ type: 'upgradeTowerTier', x: selected.x, y: selected.y })
              }
            />
            <UpgradeButton
              icon={<TrendingUp size={15} />}
              label="Damage"
              level={snapshot.selectedTower.upgradeLevels.damage}
              cost={costs?.damage ?? null}
              onClick={() => selected && upgradeStat(controller, selected, 'damage')}
            />
            <UpgradeButton
              icon={<Zap size={15} />}
              label="Speed"
              level={snapshot.selectedTower.upgradeLevels.speed}
              cost={costs?.speed ?? null}
              onClick={() => selected && upgradeStat(controller, selected, 'speed')}
            />
            <UpgradeButton
              icon={<Crosshair size={15} />}
              label="Range"
              level={snapshot.selectedTower.upgradeLevels.range}
              cost={costs?.range ?? null}
              onClick={() => selected && upgradeStat(controller, selected, 'range')}
            />
          </div>
          <div className="grid gap-1.5">
            <label
              className="font-display text-xs uppercase text-tactical-cyan"
              htmlFor="tower-target-mode"
            >
              Target Mode
            </label>
            <select
              id="tower-target-mode"
              className="border border-tactical-cyan/25 bg-[#071016] px-3 py-2 font-display text-sm text-tactical-ink outline-none focus:border-tactical-cyan"
              value={snapshot.selectedTower.targetMode}
              onChange={(event) =>
                selected &&
                controller.dispatch({
                  type: 'setTowerTargetMode',
                  x: selected.x,
                  y: selected.y,
                  targetMode: event.currentTarget.value as TargetMode,
                })
              }
            >
              {targetModeOptions.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {snapshot.selectedTower.effects.length ? (
              snapshot.selectedTower.effects.map((effect, index) => (
                <Badge key={`${effect.type}-${index}`} tone="effect">
                  {formatEffect(effect)}
                </Badge>
              ))
            ) : (
              <Badge tone="muted">No effects</Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ActionButton
              icon={<RadioTower size={15} />}
              disabled={!selected}
              onClick={() =>
                selected &&
                controller.dispatch({ type: 'toggleTowerStop', x: selected.x, y: selected.y })
              }
            >
              STOP / FIRE
            </ActionButton>
            <ActionButton
              icon={<Crosshair size={15} />}
              disabled={!selected || !snapshot.selectedTower.targetId}
              onClick={() =>
                selected &&
                controller.dispatch({
                  type: 'setTowerTarget',
                  x: selected.x,
                  y: selected.y,
                  targetId: null,
                })
              }
            >
              CLEAR TARGET
            </ActionButton>
          </div>
        </div>
      ) : snapshot.canRemoveStone && selected ? (
        <div className="mt-3 grid gap-2">
          <p className="font-black text-tactical-ink">Maze block</p>
          <p className="flex gap-2 text-sm text-tactical-muted">
            <ShieldAlert size={15} className="mt-0.5 shrink-0 text-tactical-amber" />
            Towers can replace this block. You can also remove it manually.
          </p>
          <ActionButton
            icon={<Trash2 size={15} />}
            disabled={!selected}
            onClick={() =>
              selected && controller.dispatch({ type: 'removeStone', x: selected.x, y: selected.y })
            }
          >
            REMOVE BLOCK
          </ActionButton>
        </div>
      ) : (
        <Info text="Select a tower or maze block. Pick a shop tower or block mode, then click the board to build." />
      )}
    </section>
  );
}

function upgradeStat(
  controller: GameController,
  selected: { x: number; y: number },
  stat: TowerUpgradeStat,
) {
  controller.dispatch({ type: 'upgradeTowerStat', x: selected.x, y: selected.y, stat });
}

function UpgradeButton({
  cost,
  icon,
  label,
  level,
  onClick,
}: {
  cost: number | null;
  icon: React.ReactNode;
  label: string;
  level: number;
  onClick: () => void;
}) {
  return (
    <button
      className="arcade-button-secondary min-h-12 px-3 py-2 text-sm font-black"
      disabled={cost === null}
      onClick={onClick}
    >
      {icon}
      {label} {level}
      <span className="text-tactical-amber">{cost === null ? 'MAX' : `${cost}G`}</span>
    </button>
  );
}

function WavePanel({ snapshot }: { snapshot: GameSnapshot }) {
  const wave = snapshot.currentWave;
  const enemy = wave ? getEnemy(gameConfig, wave.enemyId) : null;

  return (
    <section className="pixel-panel p-4">
      <PanelTitle icon={<ScanLine size={18} />} eyebrow="Scout" title="Wave Intel" />
      {wave && enemy ? (
        <div className="mt-3 grid gap-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Stat label="Now" value={`${wave.wave}. ${wave.name}`} />
            <Stat label="Count" value={wave.count} />
            <Stat label="Enemy" value={enemy.name} />
            <Stat label="Reward" value={`${enemy.reward}g`} />
            <Stat label="Boss" value={wave.boss || enemy.boss ? 'yes' : 'no'} />
            <Stat label="Next" value={snapshot.nextWave ? snapshot.nextWave.name : 'none'} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(snapshot.currentWaveSkills.length ? snapshot.currentWaveSkills : enemy.skills).map(
              (skill) => (
                <Badge key={skill} tone="danger">
                  {enemySkillLabels[skill]}
                </Badge>
              ),
            )}
            {snapshot.requiredWavesCleared ? <Badge tone="muted">Repeat mode</Badge> : null}
          </div>
        </div>
      ) : (
        <Info text="No further waves." />
      )}
    </section>
  );
}

function QuestsPanel({
  snapshot,
  save,
  onClaim,
  onClear,
}: {
  snapshot: GameSnapshot;
  save: SaveState;
  onClaim: () => void;
  onClear: () => void;
}) {
  const rank = gameConfig.ranks.find((item) => item.id === snapshot.rank.seasonRankId);
  return (
    <>
      <section className="pixel-panel p-4">
        <PanelTitle icon={<Medal size={18} />} eyebrow="League" title="Rank" />
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <Stat label="Season" value={rank?.name ?? snapshot.rank.seasonRankId} />
          <Stat label="Bracket" value={rank?.percentage ?? 'n/a'} />
          <Stat label="Solo" value={snapshot.rank.soloRank} />
          <Stat label="Race" value={snapshot.rank.raceRank} />
        </div>
        <button
          className="arcade-button mt-3 w-full px-3 py-2 font-black"
          disabled={snapshot.rank.claimedSeasonReward}
          onClick={onClaim}
        >
          <Box size={16} />
          CLAIM LOCAL SEASON
        </button>
      </section>
      <section className="pixel-panel p-4">
        <PanelTitle icon={<Map size={18} />} eyebrow="Run Log" title="Quests" />
        <div className="mt-3 grid gap-2">
          {gameConfig.quests.map((quest) => {
            const progress = snapshot.quests.find((item) => item.id === quest.id);
            const complete = Boolean(progress?.completed);
            const amount = complete ? 100 : Math.round((progress?.progress ?? 0) * 100);
            return (
              <div key={quest.id} className="pixel-row items-start">
                <div className="min-w-0 flex-1">
                  <div className="font-black leading-tight text-tactical-ink">{quest.name}</div>
                  <div className="mt-2 h-2 border border-tactical-cyan/20 bg-[#071016]">
                    <div
                      className={`h-full ${complete ? 'bg-tactical-green' : 'bg-tactical-amber'}`}
                      style={{ width: `${amount}%` }}
                    />
                  </div>
                </div>
                <Badge tone={complete ? 'success' : 'muted'}>{complete ? 'Done' : 'Open'}</Badge>
              </div>
            );
          })}
        </div>
        <div className="mt-3">
          <Stat label="Wins" value={save.wins} />
        </div>
        <button className="arcade-button-danger mt-3 w-full px-3 py-2 font-bold" onClick={onClear}>
          <Trash2 size={16} />
          CLEAR LOCAL PROGRESSION
        </button>
      </section>
    </>
  );
}

function HelpPanel() {
  return (
    <section className="pixel-panel p-4">
      <PanelTitle icon={<BookOpen size={18} />} eyebrow="Manual" title="Field Guide" />
      <div className="mt-3 grid gap-3">
        <HelpBlock
          title="Build Flow"
          text="Each build phase grants five free maze blocks, banked up to fifteen. Buy towers from the shop and start the wave when ready."
        />
        <HelpBlock
          title="Tower Placement"
          text="Shop towers can be placed on empty valid tiles or directly over maze blocks, replacing the block."
        />
        <HelpBlock
          title="Upgrades"
          text="Selected towers can buy tier upgrades plus separate damage, speed, and range upgrades."
        />
        <HelpBlock
          title="Damage"
          text="Physical cares about armor, magic handles many utility towers, and pure damage ignores normal defenses."
        />
      </div>
    </section>
  );
}

function ActionButton({
  children,
  disabled,
  icon,
  onClick,
}: {
  children: React.ReactNode;
  disabled: boolean;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className="arcade-button-secondary min-h-11 px-3 py-2 text-sm font-black"
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}

function PanelTitle({
  eyebrow,
  icon,
  title,
}: {
  eyebrow: string;
  icon?: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-tactical-cyan">{icon}</span>
      <div className="min-w-0">
        <div className="font-display text-xs uppercase text-tactical-amber">{eyebrow}</div>
        <h2 className="truncate font-display text-2xl leading-none text-tactical-ink">{title}</h2>
      </div>
    </div>
  );
}

function HelpBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="border border-tactical-cyan/18 bg-[#071016]/68 p-3">
      <div className="font-black text-tactical-ink">{title}</div>
      <div className="mt-1 text-sm leading-snug text-tactical-muted">{text}</div>
    </div>
  );
}

function Info({ text }: { text: string }) {
  return (
    <div className="border border-tactical-cyan/18 bg-[#071016]/68 p-3 text-sm leading-snug text-tactical-muted">
      {text}
    </div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: 'danger' | 'effect' | 'gold' | 'muted' | 'success';
}) {
  const toneClass = {
    danger: 'border-tactical-red/70 bg-tactical-red/10 text-[#ffd4dc]',
    effect: 'border-tactical-cyan/60 bg-tactical-cyan/10 text-tactical-cyan',
    gold: 'border-tactical-amber/70 bg-tactical-amber/10 text-[#ffe2a1]',
    muted: 'border-tactical-cyan/20 bg-[#071016]/70 text-tactical-muted',
    success: 'border-tactical-green/60 bg-tactical-green/10 text-[#c6ffd6]',
  }[tone];

  return (
    <span
      className={`inline-flex max-w-full items-center border px-1.5 py-0.5 font-display text-[0.68rem] uppercase leading-tight ${toneClass}`}
    >
      {children}
    </span>
  );
}

function GemChip({ color, large = false }: { color: string; large?: boolean }) {
  return (
    <span
      className={`${large ? 'h-10 w-10' : 'h-7 w-7'} gem-chip shrink-0`}
      style={{ background: color }}
    />
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="pixel-stat min-w-0 px-3 py-2">
      <div className="truncate font-display text-xs uppercase text-tactical-cyan">{label}</div>
      <div className="break-words font-bold leading-tight text-tactical-ink">{value}</div>
    </div>
  );
}

function formatEffect(effect: TowerEffectDefinition): string {
  const parts = [effectLabels[effect.type]];
  if (effect.value !== 1) parts.push(formatEffectValue(effect));
  if (effect.radius) parts.push(`R${effect.radius}`);
  if (effect.duration) parts.push(`${effect.duration}s`);
  if (effect.maxTargets) parts.push(`${effect.maxTargets}x`);
  return parts.join(' ');
}

function formatEffectValue(effect: TowerEffectDefinition): string {
  if (
    effect.type === 'speedAura' ||
    effect.type === 'damageAura' ||
    effect.type === 'slow' ||
    effect.type === 'crit' ||
    effect.type === 'cleave' ||
    effect.type === 'corrupt' ||
    effect.type === 'greedy' ||
    effect.type === 'inspire' ||
    effect.type === 'resist' ||
    effect.type === 'decadent'
  ) {
    return `${Math.round(effect.value * 100)}%`;
  }
  return `${effect.value}`;
}
