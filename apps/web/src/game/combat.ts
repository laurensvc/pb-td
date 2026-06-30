import {
  areaTierKey,
  gemDefinitions,
  getArea,
  getEnemy,
  getUpgrade,
  getWave,
  getWaveCount,
} from './content';
import { distance } from './boardQueries';
import { beginBuildPhase } from './attempt';
import { effectiveDamageMultiplier, gemDamageType, isEnemyVisible } from './damage';
import { buildDetectionGems } from './detection';
import { goldInterest, CRYSTAL_DUST_PER_WAVE, waveIncome } from './economy';
import { getGemCombatStats } from './gems';
import { hexWorldCenter } from './hexGrid';
import { LEAK_EPSILON, pathProgressAt, stepEnemyOnPath } from './pathNav';
import { nextCombatRoll } from './rng';
import { pushFx, trackQuestProgress } from './runProgress';
import { getRespecCost } from './save';
import {
  canBuyUpgrade,
  getMissileStats,
  hasMissileUnlocked,
  purchasedUpgrades,
} from './upgrades';
import type {
  DamageType,
  EnemyState,
  GameState,
  GemFamilyId,
  GemState,
  MissileState,
  ProjectileState,
  TierId,
  WaveSegment,
} from './types';

export const MAX_DT = 0.05;
export const MISSILE_IMPACT_DELAY = 0.24;
export const MISSILE_FX_LIFE = 0.42;
export const PROJECTILE_HIT_DISTANCE = 0.12;

export function fireMissile(state: GameState, x: number, y: number): void {
  if (state.status !== 'running' || state.missileCooldownLeft > 0) return;
  if (!hasMissileUnlocked(state.save)) return;
  const stats = getMissileStats(state);
  state.missiles.push({
    id: state.nextMissileId++,
    x,
    y,
    damage: stats.damage,
    radius: stats.radius,
    impactIn: MISSILE_IMPACT_DELAY,
    life: MISSILE_FX_LIFE,
    active: true,
  });
  state.missileCooldownLeft = stats.cooldown;
}

export function buyUpgrade(state: GameState, upgradeId: string): void {
  const upgrade = getUpgrade(upgradeId);
  if (!canBuyUpgrade(state.save, upgrade)) return;
  state.save.stars -= upgrade.costStars;
  state.save.crowns -= upgrade.costCrowns ?? 0;
  state.save.spentStars += upgrade.costStars;
  state.save.purchasedUpgradeIds.push(upgrade.id);
  if (
    upgrade.unlockGemFamily &&
    !state.save.unlockedGemFamilies.includes(upgrade.unlockGemFamily)
  ) {
    state.save.unlockedGemFamilies.push(upgrade.unlockGemFamily);
  }
}

export function respecUpgrades(state: GameState): void {
  const cost = getRespecCost(state.save);
  if (state.save.stars < cost) return;
  const purchased = purchasedUpgrades(state.save);
  const starRefund = purchased.reduce((total, upgrade) => total + upgrade.costStars, 0) - cost;
  const crownRefund = purchased.reduce((total, upgrade) => total + (upgrade.costCrowns ?? 0), 0);
  state.save.stars += Math.max(0, starRefund);
  state.save.crowns += crownRefund;
  state.save.spentStars = 0;
  state.save.purchasedUpgradeIds = [];
  state.save.unlockedGemFamilies = ['kinetic', 'verdant'];
}

export function spawnEnemies(state: GameState, dt: number): void {
  if (state.enemiesToSpawn <= 0) return;
  const area = getArea(state.areaId);
  const tier = area.tiers[state.tierId];
  const wave = getWave(state.areaId, state.tierId, state.waveIndex);
  if (!wave) return;

  state.spawnTimer -= dt;
  while (state.enemiesToSpawn > 0 && state.spawnTimer <= 0) {
    const segment = wave.segments[state.segmentIndex];
    if (!segment) break;
    spawnEnemy(state, segment.enemyId, tier);
    state.enemiesToSpawn -= 1;
    state.spawnTimer += wave.spawnInterval;

    if (state.enemiesToSpawn <= 0) {
      advanceSegment(state, wave.segments);
    }
  }
}

export function advanceSegment(state: GameState, segments: WaveSegment[]): void {
  if (state.segmentIndex < segments.length - 1) {
    state.segmentIndex += 1;
    state.enemiesToSpawn = segments[state.segmentIndex].count;
  }
}

export function spawnEnemy(
  state: GameState,
  enemyId: string,
  tier: ReturnType<typeof getArea>['tiers'][TierId],
): void {
  const definition = getEnemy(enemyId);
  const spawn = state.pathNav.spawnCell;
  const spawnCenter = hexWorldCenter(spawn.x, spawn.y);
  const waveScale = 1 + state.waveIndex * 0.04;
  const hp = Math.round(definition.hp * tier.enemyHpMultiplier * waveScale);
  const shield = Math.round((definition.shield ?? 0) * tier.enemyHpMultiplier * waveScale);
  state.enemies.push({
    id: state.nextEnemyId++,
    definitionId: definition.id,
    name: definition.name,
    x: spawnCenter.x,
    y: spawnCenter.y,
    pathProgress: pathProgressAt(state.pathNav, spawnCenter.x, spawnCenter.y),
    checkpointIndex: 1,
    hp,
    maxHp: hp,
    shield,
    maxShield: shield,
    speed: definition.speed * tier.enemySpeedMultiplier,
    rewardStars: Math.ceil(definition.rewardStars * tier.starMultiplier),
    rewardGold: Math.ceil(definition.rewardGold * tier.goldMultiplier),
    color: definition.color,
    alive: true,
    leaked: false,
    flying: definition.flying ?? false,
    invisible: definition.invisible ?? false,
    magicImmune: definition.magicImmune ?? false,
    physicalImmune: definition.physicalImmune ?? false,
    revealedUntil: 0,
    poisonDps: 0,
    poisonUntil: 0,
    slowUntil: 0,
    slowFactor: 1,
    armorReduction: 0,
  });
}

export function tickEnemies(state: GameState, dt: number): void {
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    if (enemy.poisonUntil > state.time && enemy.poisonDps > 0) {
      applyDamage(state, enemy, enemy.poisonDps * dt, null, {
        bypassShield: false,
        damageType: 'magic',
      });
    }
    const speedMult = enemy.slowUntil > state.time ? 1 - enemy.slowFactor : 1;
    const result = enemy.flying
      ? stepFlyingEnemy(enemy, state.pathNav, dt * speedMult)
      : stepEnemyOnPath(enemy, state.pathNav, dt * speedMult);
    if (result === 'leaked') {
      enemy.alive = false;
      enemy.leaked = true;
      state.leakedEnemies += 1;
      state.waveLeaked = true;
      const leakDamage = getEnemy(enemy.definitionId).leakDamage ?? 1;
      state.lives = Math.max(0, state.lives - leakDamage);
      if (state.lives <= 0) state.status = 'lost';
    }
  }
}

export function stepFlyingEnemy(
  enemy: EnemyState,
  nav: GameState['pathNav'],
  dt: number,
): 'moving' | 'leaked' {
  const targetIdx = Math.min(enemy.checkpointIndex, nav.checkpoints.length - 1);
  const target = nav.checkpoints[targetIdx]!;
  const targetCenter = hexWorldCenter(target.x, target.y);
  const dx = targetCenter.x - enemy.x;
  const dy = targetCenter.y - enemy.y;
  const dist = Math.hypot(dx, dy);
  const travel = enemy.speed * dt;

  if (dist <= LEAK_EPSILON) {
    if (targetIdx >= nav.checkpoints.length - 1) {
      return 'leaked';
    }
    enemy.checkpointIndex = targetIdx + 1;
    return 'moving';
  }

  if (travel >= dist) {
    enemy.x = targetCenter.x;
    enemy.y = targetCenter.y;
  } else {
    enemy.x += (dx / dist) * travel;
    enemy.y += (dy / dist) * travel;
  }
  enemy.pathProgress = pathProgressAt(nav, enemy.x, enemy.y);
  return 'moving';
}

export function tickGems(state: GameState, dt: number): void {
  for (const gem of state.gems) {
    gem.cooldownLeft = Math.max(0, gem.cooldownLeft - dt);
    if (gem.cooldownLeft > 0) continue;
    const stats = getGemCombatStats(state.save, gem.family, gem.level);
    const target = findGemTarget(state, gem, stats.range);
    if (!target) continue;
    state.projectiles.push(makeProjectile(state, gem, stats, target));
    gem.cooldownLeft = stats.cooldown;
  }
}

export function tickProjectiles(state: GameState, dt: number): void {
  for (const projectile of state.projectiles) {
    if (!projectile.active) continue;
    const target = state.enemies.find((enemy) => enemy.id === projectile.targetId && enemy.alive);
    if (!target) {
      projectile.active = false;
      continue;
    }
    const dx = target.x - projectile.x;
    const dy = target.y - projectile.y;
    const dist = Math.hypot(dx, dy);
    const travel = projectile.speed * dt;
    if (dist <= PROJECTILE_HIT_DISTANCE || travel >= dist) {
      projectile.x = target.x;
      projectile.y = target.y;
      projectile.active = false;
      hitWithProjectile(state, projectile, target);
    } else {
      projectile.x += (dx / dist) * travel;
      projectile.y += (dy / dist) * travel;
    }
  }
}

export function tickMissiles(state: GameState, dt: number): void {
  for (const missile of state.missiles) {
    if (!missile.active) continue;
    missile.impactIn -= dt;
    if (missile.impactIn > 0) continue;
    missile.active = false;
    damageInRadius(state, missile);
  }
}

export function tickMissilesOnly(state: GameState, dt: number): void {
  tickMissiles(state, dt);
  clearInactive(state);
}

export function tickCombatStep(state: GameState, dt: number): void {
  state.time += dt;
  state.missileCooldownLeft = Math.max(0, state.missileCooldownLeft - dt);
  spawnEnemies(state, dt);
  tickEnemies(state, dt);
  tickGems(state, dt);
  tickProjectiles(state, dt);
  tickMissiles(state, dt);
  clearInactive(state);
  completeWaveOrAttempt(state);
}

export function clearInactive(state: GameState): void {
  state.enemies = state.enemies.filter((enemy) => enemy.alive);
  state.projectiles = state.projectiles.filter((projectile) => projectile.active);
  state.missiles = state.missiles.filter((missile) => missile.active || missile.life > 0);
}

export function hitWithProjectile(
  state: GameState,
  projectile: ProjectileState,
  target: EnemyState,
): void {
  const gem = state.gems.find((candidate) => candidate.id === projectile.gemId) ?? null;
  const damageType = gem ? gemDamageType(gem.family) : 'pure';
  if (target.invisible) target.revealedUntil = state.time + 2.5;

  let damage = projectile.damage;

  if (projectile.bonusVsHighHp && target.maxHp > 150) {
    damage *= 1 + projectile.bonusVsHighHp;
  }
  if (projectile.armorReduction) {
    target.armorReduction = Math.max(target.armorReduction, projectile.armorReduction);
    damage *= 1 + target.armorReduction;
  }
  if (projectile.critChance && nextCombatRoll(state) < projectile.critChance) {
    damage *= 2;
  }

  const damageDone = applyDamage(state, target, damage, gem, {
    shieldPierce: projectile.shieldPierce ?? 1,
    damageType,
  });
  if (gem) gem.damageDone += damageDone;

  if (projectile.poisonDps && projectile.poisonDuration) {
    target.poisonDps = Math.max(target.poisonDps, projectile.poisonDps);
    target.poisonUntil = Math.max(target.poisonUntil, state.time + projectile.poisonDuration);
  }
  if (projectile.slowFactor && projectile.slowDuration) {
    target.slowFactor = Math.max(target.slowFactor, projectile.slowFactor);
    target.slowUntil = Math.max(target.slowUntil, state.time + projectile.slowDuration);
  }
  if (projectile.splashRadius && projectile.splashRadius > 0) {
    for (const enemy of state.enemies) {
      if (!enemy.alive || enemy.id === target.id) continue;
      if (distance(enemy, target) <= projectile.splashRadius) {
        applyDamage(state, enemy, damage * 0.45, gem, {
          shieldPierce: projectile.shieldPierce ?? 1,
          damageType,
        });
      }
    }
  }

  projectile.active = false;
}

export function handleEnemyDeath(state: GameState, enemy: EnemyState): void {
  const definition = getEnemy(enemy.definitionId);
  if (definition.splitInto && definition.splitCount) {
    for (let i = 0; i < definition.splitCount; i++) {
      spawnSplitEnemy(state, definition.splitInto, enemy.x, enemy.y, enemy.checkpointIndex);
    }
  }
}

export function spawnSplitEnemy(
  state: GameState,
  enemyId: string,
  x: number,
  y: number,
  checkpointIndex: number,
): void {
  const area = getArea(state.areaId);
  const tier = area.tiers[state.tierId];
  const definition = getEnemy(enemyId);
  const waveScale = 1 + state.waveIndex * 0.04;
  const hp = Math.round(definition.hp * tier.enemyHpMultiplier * waveScale * 0.5);
  state.enemies.push({
    id: state.nextEnemyId++,
    definitionId: definition.id,
    name: definition.name,
    x,
    y,
    pathProgress: pathProgressAt(state.pathNav, x, y),
    checkpointIndex,
    hp,
    maxHp: hp,
    shield: 0,
    maxShield: 0,
    speed: definition.speed * tier.enemySpeedMultiplier,
    rewardStars: Math.ceil(definition.rewardStars * tier.starMultiplier * 0.5),
    rewardGold: Math.ceil(definition.rewardGold * tier.goldMultiplier * 0.5),
    color: definition.color,
    alive: true,
    leaked: false,
    flying: definition.flying ?? false,
    invisible: definition.invisible ?? false,
    magicImmune: definition.magicImmune ?? false,
    physicalImmune: definition.physicalImmune ?? false,
    revealedUntil: 0,
    poisonDps: 0,
    poisonUntil: 0,
    slowUntil: 0,
    slowFactor: 1,
    armorReduction: 0,
  });
}

export function damageInRadius(state: GameState, missile: MissileState): void {
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    if (distance(enemy, missile) <= missile.radius) {
      applyDamage(state, enemy, missile.damage, null, {
        shieldPierce: 0.75,
        damageType: 'pure',
      });
    }
  }
}

export function applyDamage(
  state: GameState,
  enemy: EnemyState,
  amount: number,
  gem: GemState | null,
  options: {
    shieldPierce?: number;
    bypassShield?: boolean;
    damageType?: DamageType;
  },
): number {
  if (!enemy.alive || amount <= 0) return 0;
  const damageType = options.damageType ?? 'pure';
  const scaled =
    amount *
    effectiveDamageMultiplier(damageType, {
      magicImmune: enemy.magicImmune,
      physicalImmune: enemy.physicalImmune,
    });
  if (scaled <= 0) return 0;
  let remaining = scaled;
  let damageDone = 0;
  if (!options.bypassShield && enemy.shield > 0) {
    const shieldDamage = Math.min(enemy.shield, remaining * (options.shieldPierce ?? 1));
    enemy.shield -= shieldDamage;
    damageDone += shieldDamage;
    remaining -= shieldDamage / Math.max(0.1, options.shieldPierce ?? 1);
  }
  if (remaining > 0) {
    const hpDamage = Math.min(enemy.hp, remaining);
    enemy.hp -= hpDamage;
    damageDone += hpDamage;
  }
  if (enemy.hp <= 0 && enemy.alive) {
    enemy.alive = false;
    state.killedEnemies += 1;
    state.killedThisWave += 1;
    trackQuestProgress(state, 'kills', 1);
    const definition = getEnemy(enemy.definitionId);
    if (definition.isBoss) trackQuestProgress(state, 'boss', 1);
    state.rewards.stars += enemy.rewardStars;
    state.save.stars += enemy.rewardStars;
    state.save.totalStarsEarned += enemy.rewardStars;
    state.gold += enemy.rewardGold;
    if (gem) gem.kills += 1;
    handleEnemyDeath(state, enemy);
  }
  return damageDone;
}

export function makeProjectile(
  state: GameState,
  gem: GemState,
  stats: ReturnType<typeof getGemCombatStats>,
  target: EnemyState,
): ProjectileState {
  return {
    id: state.nextProjectileId++,
    gemId: gem.id,
    targetId: target.id,
    x: gem.x,
    y: gem.y,
    damage: stats.damage,
    speed: stats.projectileSpeed,
    color: stats.color,
    poisonDps: stats.poisonDps,
    poisonDuration: stats.poisonDuration,
    shieldPierce: stats.shieldPierce,
    splashRadius: stats.splashRadius,
    slowFactor: stats.slowFactor,
    slowDuration: stats.slowDuration,
    critChance: stats.critChance,
    bonusVsHighHp: stats.bonusVsHighHp,
    armorReduction: stats.armorReduction,
    active: true,
  };
}

export function findGemTarget(
  state: GameState,
  gem: GemState,
  range: number,
): EnemyState | undefined {
  const detectionGems = buildDetectionGems(state);
  const canHitAir = gemCanTargetAir(gem.family);
  const candidates: EnemyState[] = [];

  for (const enemy of state.enemies) {
    if (!enemy.alive || distance(gem, enemy) > range) continue;
    if (enemy.flying && !canHitAir) continue;
    if (
      !isEnemyVisible(enemy.revealedUntil, state.time, 0.5, enemy, detectionGems, enemy.invisible)
    ) {
      continue;
    }
    candidates.push(enemy);
  }

  if (candidates.length === 0) return undefined;

  switch (gem.targeting) {
    case 'last':
      return candidates.reduce((best, enemy) =>
        enemy.pathProgress > best.pathProgress ? enemy : best,
      );
    case 'strong':
      return candidates.reduce((best, enemy) => (enemy.hp > best.hp ? enemy : best));
    case 'weak':
      return candidates.reduce((best, enemy) => (enemy.hp < best.hp ? enemy : best));
    case 'first':
    default:
      return candidates.reduce((best, enemy) =>
        enemy.pathProgress < best.pathProgress ? enemy : best,
      );
  }
}

export function gemCanTargetAir(family: GemFamilyId): boolean {
  const def = gemDefinitions[family];
  if (def.hybrid) return true;
  return (
    family === 'nova' ||
    family === 'arcane' ||
    family === 'prism' ||
    family === 'plasma_mortar' ||
    family === 'solar_flare'
  );
}

export function completeWaveOrAttempt(state: GameState): void {
  if (state.status !== 'running') return;
  if (state.enemiesToSpawn > 0) return;
  if (state.enemies.some((enemy) => enemy.alive)) return;
  if (state.projectiles.some((projectile) => projectile.active)) return;
  if (state.missiles.some((missile) => missile.active && missile.impactIn > 0)) return;

  const wave = getWave(state.areaId, state.tierId, state.waveIndex);
  const waveNumber = state.waveIndex + 1;

  if (wave?.goldBonus) state.gold += wave.goldBonus;
  state.crystalDust += CRYSTAL_DUST_PER_WAVE;
  const income = waveIncome(waveNumber);
  const interest = goldInterest(state.gold);
  state.gold += income + interest;
  if (income > 0)
    pushFx(state, 'gold', state.pathNav.goalCell.x, state.pathNav.goalCell.y, `+${income}g`);
  if (interest > 0)
    pushFx(state, 'gold', state.pathNav.spawnCell.x, state.pathNav.spawnCell.y, `+${interest} interest`);

  if (!state.waveLeaked) trackQuestProgress(state, 'leakless', 1);
  trackQuestProgress(state, 'gold', state.gold);

  if (state.waveIndex < getWaveCount() - 1) {
    state.waveIndex += 1;
    state.status = 'betweenWaves';
    state.enemies = state.enemies.filter((enemy) => enemy.alive);
    beginBuildPhase(state);
    return;
  }

  state.status = 'cleared';
  if (state.leakedEnemies === 0) {
    const key = areaTierKey(state.areaId, state.tierId);
    if (!state.save.clearedAreaTiers.includes(key)) {
      state.save.clearedAreaTiers.push(key);
      state.save.crowns += 1;
      state.rewards.crowns += 1;
    }
  }
}
