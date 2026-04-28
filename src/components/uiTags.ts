import type { EnemyDefinition, GemDefinition, TowerState, WaveDefinition } from '../game/types';

type TowerTagSource = Pick<GemDefinition | TowerState, 'damageType' | 'effects'>;

export function getTowerTags(source: TowerTagSource, maxTags = 5): string[] {
  const tags: string[] = [];
  if (source.damageType === 'pure') tags.push('Pure');
  else if (source.damageType === 'magic') tags.push('Magic');

  for (const effect of source.effects) {
    if (effect.type === 'poison') tags.push('Poison');
    else if (effect.type === 'slow') tags.push('Slow');
    else if (
      effect.type === 'speedAura' ||
      effect.type === 'damageAura' ||
      effect.type === 'mvpAura' ||
      effect.type === 'inspire'
    )
      tags.push('Aura');
    else if (effect.type === 'cleave') tags.push('Cleave');
    else if (effect.type === 'antiFly') tags.push('Anti-Fly');
    else if (effect.type === 'crit') tags.push('Crit');
    else if (effect.type === 'burn') tags.push('Burn');
    else if (effect.type === 'armorBreak') tags.push('Armor Break');
    else if (effect.type === 'stun') tags.push('Stun');
    else if (effect.type === 'lightning') tags.push('Lightning');
    else if (effect.type === 'split') tags.push('Multi');
    else if (effect.type === 'overlook') tags.push('Reveal');
    else if (effect.type === 'greedy') tags.push('Greedy');
  }

  return unique(tags).slice(0, maxTags);
}

export function getWaveTags(
  wave: WaveDefinition | null,
  enemy: EnemyDefinition | null,
  peers: readonly { wave: WaveDefinition; enemy: EnemyDefinition }[],
  maxTags = 6,
): string[] {
  if (!wave || !enemy) return [];
  const localPeers = peers.filter((peer) => Math.abs(peer.wave.wave - wave.wave) <= 3);
  const baseline = localPeers.length > 0 ? localPeers : peers;
  const avgHp = average(baseline.map((peer) => peer.enemy.hp));
  const avgArmor = average(baseline.map((peer) => peer.enemy.armor));
  const avgSpeed = average(baseline.map((peer) => peer.enemy.speed));
  const avgCount = average(baseline.map((peer) => peer.wave.count));
  const avgSpawn = average(baseline.map((peer) => peer.wave.spawnInterval));
  const skills = new Set([...enemy.skills, ...wave.skills]);
  const tags: string[] = [];

  if (wave.boss || enemy.boss) tags.push('Boss');
  if (enemy.hp > avgHp * 1.35 || enemy.boss) tags.push('High HP');
  if (enemy.armor >= Math.max(5, avgArmor * 1.4)) tags.push('High Armor');
  if (enemy.speed > avgSpeed * 1.18 || wave.spawnInterval < avgSpawn * 0.82) tags.push('Fast');
  if (wave.count > avgCount * 1.25 && !enemy.boss) tags.push('Swarm');
  if (enemy.flying || skills.has('flying')) tags.push('Flying');
  if (skills.has('permanentInvisibility') || skills.has('cloakAndDagger')) tags.push('Invisible');
  if (skills.has('magicImmune') || skills.has('physicalImmune')) tags.push('Immune');
  if (skills.has('evasion') || skills.has('untouchable') || skills.has('refraction'))
    tags.push('Evasive');
  if (skills.has('blink') || skills.has('rush')) tags.push('Blink/Rush');
  if (skills.has('krakenShell') || skills.has('reactiveArmor') || skills.has('recharge'))
    tags.push('Shell');

  return unique(tags).slice(0, maxTags);
}

function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  let total = 0;
  for (const value of values) total += value;
  return total / values.length;
}

function unique(values: readonly string[]): string[] {
  const result: string[] = [];
  for (const value of values) {
    if (!result.includes(value)) result.push(value);
  }
  return result;
}
