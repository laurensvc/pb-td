import {
  LOADOUT_LIMIT,
  MISSILE_BASE,
  STARTING_LIVES,
  areaDefinitions,
  areaTierKey,
  getArea,
  getEnemy,
  getTower,
  getUpgrade,
  upgrades,
} from './content';
import { cloneSave, createDefaultSave, getRespecCost } from './save';
import type {
  EnemyState,
  GameAction,
  GameState,
  MissileState,
  ProjectileState,
  SaveState,
  Snapshot,
  TierId,
  TowerDefinition,
  TowerId,
  TowerState,
  UpgradeDefinition,
  Vec2,
} from './types';

const MAX_DT = 0.05;
const MISSILE_IMPACT_DELAY = 0.24;
const MISSILE_FX_LIFE = 0.42;
const PROJECTILE_HIT_DISTANCE = 0.12;

export function createGame(save: SaveState = createDefaultSave()): GameState {
  const normalizedSave = cloneSave(save);
  return createAttempt(normalizedSave, 'a1', 'normal');
}

export function dispatchGameAction(state: GameState, action: GameAction): void {
  switch (action.type) {
    case 'startArea':
      replaceState(state, createAttempt(state.save, action.areaId, action.tierId));
      break;
    case 'startWave':
      startWave(state);
      break;
    case 'selectTower':
      state.selectedTowerId = action.towerId;
      break;
    case 'selectLoadout':
      selectLoadout(state, action.towerIds);
      break;
    case 'placeTower':
      placeTower(state, action.slotIndex, action.towerId ?? state.selectedTowerId);
      break;
    case 'removeTower':
      removeTower(state, action.slotIndex);
      break;
    case 'selectSlot':
      state.selectedSlotIndex = action.slotIndex;
      break;
    case 'fireMissile':
      fireMissile(state, action.x, action.y);
      break;
    case 'buyUpgrade':
      buyUpgrade(state, action.upgradeId);
      break;
    case 'respecUpgrades':
      respecUpgrades(state);
      break;
    case 'retry':
      replaceState(state, createAttempt(state.save, state.areaId, state.tierId));
      break;
    case 'resetSave':
      replaceState(state, createAttempt(createDefaultSave(), 'a1', 'normal'));
      break;
  }
}

export function tickGame(state: GameState, dt: number): void {
  const step = Math.min(MAX_DT, Math.max(0, dt));
  tickTransientFx(state, step);
  if (state.status !== 'running') return;

  state.time += step;
  state.missileCooldownLeft = Math.max(0, state.missileCooldownLeft - step);
  spawnEnemies(state, step);
  tickEnemies(state, step);
  tickTowers(state, step);
  tickProjectiles(state, step);
  tickMissiles(state, step);
  clearInactive(state);
  completeWaveOrAttempt(state);
}

export function createSnapshot(state: GameState): Snapshot {
  const area = getArea(state.areaId);
  const tier = area.tiers[state.tierId];
  return {
    status: state.status,
    areaId: state.areaId,
    areaName: area.name,
    tierId: state.tierId,
    time: state.time,
    wave: Math.min(state.waveIndex + 1, tier.waves.length),
    totalWaves: tier.waves.length,
    lives: state.lives,
    maxLives: state.maxLives,
    activeEnemies: state.enemies.filter((enemy) => enemy.alive).length,
    stars: state.save.stars,
    crowns: state.save.crowns,
    attemptStars: state.rewards.stars,
    attemptCrowns: state.rewards.crowns,
    missileCooldownLeft: state.missileCooldownLeft,
    missileCooldown: getMissileStats(state).cooldown,
    selectedTowerId: state.selectedTowerId,
    selectedSlotIndex: state.selectedSlotIndex,
    loadout: [...state.loadout],
    unlockedTowerIds: [...state.save.unlockedTowerIds],
    canStartWave: state.status === 'idle' || state.status === 'betweenWaves',
    canRetry: state.status === 'lost' || state.status === 'cleared',
    resultTitle:
      state.status === 'lost'
        ? 'The breach held just long enough to learn.'
        : state.status === 'cleared'
          ? 'Area cleared.'
          : null,
    resultMessage:
      state.status === 'lost'
        ? `${state.killedEnemies} invaders destroyed. Stars earned stay with you.`
        : state.status === 'cleared'
          ? state.rewards.crowns > 0
            ? 'Full clear achieved. Crown secured for this tier.'
            : 'Full clear repeated. Mastery held; previous crown already claimed.'
          : null,
  };
}

export function getMissileStats(state: GameState): {
  damage: number;
  radius: number;
  cooldown: number;
} {
  let damage = MISSILE_BASE.damage;
  let radius = MISSILE_BASE.radius;
  let cooldown = MISSILE_BASE.cooldown;
  for (const upgrade of purchasedUpgrades(state.save)) {
    if (upgrade.missileStat === 'damage') damage += upgrade.value;
    if (upgrade.missileStat === 'radius') radius += upgrade.value;
    if (upgrade.missileStat === 'cooldown') cooldown += upgrade.value;
  }
  return {
    damage: Math.round(damage),
    radius: Number(Math.max(0.55, radius).toFixed(2)),
    cooldown: Number(Math.max(0.8, cooldown).toFixed(2)),
  };
}

export function getTowerStats(save: SaveState, towerId: TowerId): TowerDefinition {
  const base = getTower(towerId);
  let damage = base.damage;
  let range = base.range;
  let cooldown = base.cooldown;
  for (const upgrade of purchasedUpgrades(save)) {
    if (upgrade.towerId !== towerId) continue;
    if (upgrade.towerStat === 'damage') damage *= 1 + upgrade.value;
    if (upgrade.towerStat === 'range') range += upgrade.value;
    if (upgrade.towerStat === 'rate') cooldown *= 1 + upgrade.value;
  }
  return {
    ...base,
    damage: Math.round(damage),
    range: Number(range.toFixed(2)),
    cooldown: Number(Math.max(0.22, cooldown).toFixed(2)),
  };
}

export function canBuyUpgrade(save: SaveState, upgrade: UpgradeDefinition): boolean {
  if (save.purchasedUpgradeIds.includes(upgrade.id)) return false;
  if (save.stars < upgrade.costStars) return false;
  if (save.crowns < (upgrade.costCrowns ?? 0)) return false;
  return (upgrade.requires ?? []).every((requiredId) => save.purchasedUpgradeIds.includes(requiredId));
}

export function isTierUnlocked(save: SaveState, areaId: string, tierId: TierId): boolean {
  if (tierId === 'normal') return areaDefinitions.findIndex((area) => area.id === areaId) === 0
    || save.clearedAreaTiers.includes(areaTierKey(previousAreaId(areaId), 'normal'));
  return save.clearedAreaTiers.includes(areaTierKey(areaId, 'normal'));
}

export function isAreaResolved(state: GameState): boolean {
  return state.status === 'lost' || state.status === 'cleared';
}

function createAttempt(save: SaveState, areaId: string, tierId: TierId): GameState {
  const safeTier = isTierUnlocked(save, areaId, tierId) ? tierId : 'normal';
  const loadout = save.selectedLoadout
    .filter((towerId) => save.unlockedTowerIds.includes(towerId))
    .slice(0, LOADOUT_LIMIT);
  return {
    status: 'idle',
    areaId,
    tierId: safeTier,
    time: 0,
    waveIndex: 0,
    enemiesToSpawn: 0,
    spawnTimer: 0,
    lives: STARTING_LIVES,
    maxLives: STARTING_LIVES,
    missileCooldownLeft: 0,
    selectedTowerId: loadout[0] ?? 'kinetic',
    selectedSlotIndex: null,
    loadout: loadout.length > 0 ? loadout : ['kinetic'],
    enemies: [],
    towers: [],
    projectiles: [],
    missiles: [],
    rewards: { stars: 0, crowns: 0 },
    leakedEnemies: 0,
    killedEnemies: 0,
    nextEnemyId: 1,
    nextTowerId: 1,
    nextProjectileId: 1,
    nextMissileId: 1,
    save: cloneSave(save),
  };
}

function startWave(state: GameState): void {
  if (state.status !== 'idle' && state.status !== 'betweenWaves') return;
  const area = getArea(state.areaId);
  const wave = area.tiers[state.tierId].waves[state.waveIndex];
  if (!wave) return;
  state.status = 'running';
  state.enemiesToSpawn = wave.count;
  state.spawnTimer = 0;
}

function selectLoadout(state: GameState, towerIds: TowerId[]): void {
  const next = Array.from(new Set(towerIds))
    .filter((towerId) => state.save.unlockedTowerIds.includes(towerId))
    .slice(0, LOADOUT_LIMIT);
  if (next.length === 0) return;
  state.loadout = next;
  state.save.selectedLoadout = [...next];
  if (state.selectedTowerId && !next.includes(state.selectedTowerId)) {
    state.selectedTowerId = next[0];
  }
}

function placeTower(state: GameState, slotIndex: number, towerId: TowerId | null): void {
  if (!towerId || state.status === 'running') return;
  if (!state.loadout.includes(towerId) || !state.save.unlockedTowerIds.includes(towerId)) return;
  const area = getArea(state.areaId);
  const slot = area.buildSlots[slotIndex];
  if (!slot) return;
  removeTower(state, slotIndex);
  state.towers.push({
    id: state.nextTowerId++,
    towerId,
    slotIndex,
    x: slot.x,
    y: slot.y,
    cooldownLeft: 0,
    kills: 0,
    damageDone: 0,
  });
  state.selectedSlotIndex = slotIndex;
}

function removeTower(state: GameState, slotIndex: number): void {
  if (state.status === 'running') return;
  state.towers = state.towers.filter((tower) => tower.slotIndex !== slotIndex);
}

function fireMissile(state: GameState, x: number, y: number): void {
  if (state.status !== 'running' || state.missileCooldownLeft > 0) return;
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

function buyUpgrade(state: GameState, upgradeId: string): void {
  const upgrade = getUpgrade(upgradeId);
  if (!canBuyUpgrade(state.save, upgrade)) return;
  state.save.stars -= upgrade.costStars;
  state.save.crowns -= upgrade.costCrowns ?? 0;
  state.save.spentStars += upgrade.costStars;
  state.save.purchasedUpgradeIds.push(upgrade.id);
  if (upgrade.unlockTowerId && !state.save.unlockedTowerIds.includes(upgrade.unlockTowerId)) {
    state.save.unlockedTowerIds.push(upgrade.unlockTowerId);
  }
}

function respecUpgrades(state: GameState): void {
  const cost = getRespecCost(state.save);
  if (state.save.stars < cost) return;
  const purchased = purchasedUpgrades(state.save);
  const refund = purchased.reduce((total, upgrade) => total + upgrade.costStars, 0) - cost;
  state.save.stars += Math.max(0, refund);
  state.save.spentStars = 0;
  state.save.purchasedUpgradeIds = [];
  state.save.unlockedTowerIds = ['kinetic'];
  state.save.selectedLoadout = ['kinetic'];
  state.loadout = ['kinetic'];
  state.selectedTowerId = 'kinetic';
  state.towers = state.towers.filter((tower) => tower.towerId === 'kinetic');
}

function spawnEnemies(state: GameState, dt: number): void {
  if (state.enemiesToSpawn <= 0) return;
  const area = getArea(state.areaId);
  const tier = area.tiers[state.tierId];
  const wave = tier.waves[state.waveIndex];
  state.spawnTimer -= dt;
  while (state.enemiesToSpawn > 0 && state.spawnTimer <= 0) {
    const definition = getEnemy(wave.enemyId);
    const start = area.path[0];
    const hp = Math.round(definition.hp * tier.enemyHpMultiplier);
    const shield = Math.round((definition.shield ?? 0) * tier.enemyHpMultiplier);
    state.enemies.push({
      id: state.nextEnemyId++,
      definitionId: definition.id,
      name: definition.name,
      x: start.x,
      y: start.y,
      distance: 0,
      hp,
      maxHp: hp,
      shield,
      maxShield: shield,
      speed: definition.speed * tier.enemySpeedMultiplier,
      rewardStars: Math.ceil(definition.rewardStars * tier.starMultiplier),
      color: definition.color,
      alive: true,
      leaked: false,
      poisonDps: 0,
      poisonUntil: 0,
    });
    state.enemiesToSpawn -= 1;
    state.spawnTimer += wave.spawnInterval;
  }
}

function tickEnemies(state: GameState, dt: number): void {
  const area = getArea(state.areaId);
  const pathLength = getPathLength(area.path);
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    if (enemy.poisonUntil > state.time && enemy.poisonDps > 0) {
      applyDamage(state, enemy, enemy.poisonDps * dt, null, { bypassShield: false });
    }
    enemy.distance += enemy.speed * dt;
    if (enemy.distance >= pathLength) {
      enemy.alive = false;
      enemy.leaked = true;
      state.leakedEnemies += 1;
      state.lives = Math.max(0, state.lives - 1);
      if (state.lives <= 0) {
        state.status = 'lost';
      }
      continue;
    }
    const position = pointAtDistance(area.path, enemy.distance);
    enemy.x = position.x;
    enemy.y = position.y;
  }
}

function tickTowers(state: GameState, dt: number): void {
  for (const tower of state.towers) {
    tower.cooldownLeft = Math.max(0, tower.cooldownLeft - dt);
    if (tower.cooldownLeft > 0) continue;
    const stats = getTowerStats(state.save, tower.towerId);
    const target = findTowerTarget(state, tower, stats.range);
    if (!target) continue;
    state.projectiles.push(makeProjectile(state, tower, stats, target));
    tower.cooldownLeft = stats.cooldown;
  }
}

function tickProjectiles(state: GameState, dt: number): void {
  for (const projectile of state.projectiles) {
    if (!projectile.active) continue;
    const target = state.enemies.find((enemy) => enemy.id === projectile.targetId && enemy.alive);
    if (!target) {
      projectile.active = false;
      continue;
    }
    const dx = target.x - projectile.x;
    const dy = target.y - projectile.y;
    const distance = Math.hypot(dx, dy);
    const travel = projectile.speed * dt;
    if (distance <= PROJECTILE_HIT_DISTANCE || travel >= distance) {
      projectile.x = target.x;
      projectile.y = target.y;
      projectile.active = false;
      hitWithProjectile(state, projectile, target);
    } else {
      projectile.x += (dx / distance) * travel;
      projectile.y += (dy / distance) * travel;
    }
  }
}

function tickMissiles(state: GameState, dt: number): void {
  for (const missile of state.missiles) {
    if (!missile.active) continue;
    missile.impactIn -= dt;
    if (missile.impactIn > 0) continue;
    missile.active = false;
    damageInRadius(state, missile);
  }
}

function tickTransientFx(state: GameState, dt: number): void {
  for (const missile of state.missiles) {
    if (missile.active) continue;
    missile.life -= dt;
  }
}

function completeWaveOrAttempt(state: GameState): void {
  if (state.status !== 'running') return;
  if (state.enemiesToSpawn > 0) return;
  if (state.enemies.some((enemy) => enemy.alive)) return;
  if (state.projectiles.some((projectile) => projectile.active)) return;

  const area = getArea(state.areaId);
  const tier = area.tiers[state.tierId];
  if (state.waveIndex < tier.waves.length - 1) {
    state.waveIndex += 1;
    state.status = 'betweenWaves';
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

function hitWithProjectile(
  state: GameState,
  projectile: ProjectileState,
  target: EnemyState,
): void {
  const tower = state.towers.find((candidate) => candidate.id === projectile.towerId) ?? null;
  const damageDone = applyDamage(state, target, projectile.damage, tower, {
    shieldPierce: projectile.shieldPierce ?? 1,
  });
  if (tower) tower.damageDone += damageDone;
  if (projectile.poisonDps && projectile.poisonDuration) {
    target.poisonDps = Math.max(target.poisonDps, projectile.poisonDps);
    target.poisonUntil = Math.max(target.poisonUntil, state.time + projectile.poisonDuration);
  }
  if (projectile.splashRadius && projectile.splashRadius > 0) {
    for (const enemy of state.enemies) {
      if (!enemy.alive || enemy.id === target.id) continue;
      if (distance(enemy, target) <= projectile.splashRadius) {
        applyDamage(state, enemy, projectile.damage * 0.45, tower, {
          shieldPierce: projectile.shieldPierce ?? 1,
        });
      }
    }
  }
}

function damageInRadius(state: GameState, missile: MissileState): void {
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    if (distance(enemy, missile) <= missile.radius) {
      applyDamage(state, enemy, missile.damage, null, { shieldPierce: 0.75 });
    }
  }
}

function applyDamage(
  state: GameState,
  enemy: EnemyState,
  amount: number,
  tower: TowerState | null,
  options: { shieldPierce?: number; bypassShield?: boolean },
): number {
  if (!enemy.alive) return 0;
  let remaining = amount;
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
    state.rewards.stars += enemy.rewardStars;
    state.save.stars += enemy.rewardStars;
    state.save.totalStarsEarned += enemy.rewardStars;
    if (tower) tower.kills += 1;
  }
  return damageDone;
}

function clearInactive(state: GameState): void {
  state.enemies = state.enemies.filter((enemy) => enemy.alive || enemy.leaked);
  state.projectiles = state.projectiles.filter((projectile) => projectile.active);
  state.missiles = state.missiles.filter((missile) => missile.active || missile.life > 0);
}

function makeProjectile(
  state: GameState,
  tower: TowerState,
  stats: TowerDefinition,
  target: EnemyState,
): ProjectileState {
  return {
    id: state.nextProjectileId++,
    towerId: tower.id,
    targetId: target.id,
    x: tower.x,
    y: tower.y,
    damage: stats.damage,
    speed: stats.projectileSpeed,
    color: stats.color,
    poisonDps: stats.poisonDps,
    poisonDuration: stats.poisonDuration,
    shieldPierce: stats.shieldPierce,
    splashRadius: stats.splashRadius,
    active: true,
  };
}

function findTowerTarget(
  state: GameState,
  tower: TowerState,
  range: number,
): EnemyState | undefined {
  let best: EnemyState | undefined;
  for (const enemy of state.enemies) {
    if (!enemy.alive || distance(tower, enemy) > range) continue;
    if (!best || enemy.distance > best.distance) best = enemy;
  }
  return best;
}

function purchasedUpgrades(save: SaveState): UpgradeDefinition[] {
  return save.purchasedUpgradeIds
    .map((upgradeId) => upgrades.find((upgrade) => upgrade.id === upgradeId))
    .filter((upgrade): upgrade is UpgradeDefinition => Boolean(upgrade));
}

function getPathLength(path: readonly Vec2[]): number {
  let length = 0;
  for (let i = 1; i < path.length; i++) {
    length += distance(path[i - 1], path[i]);
  }
  return length;
}

function pointAtDistance(path: readonly Vec2[], targetDistance: number): Vec2 {
  let remaining = targetDistance;
  for (let i = 1; i < path.length; i++) {
    const from = path[i - 1];
    const to = path[i];
    const segment = distance(from, to);
    if (remaining <= segment) {
      const ratio = segment === 0 ? 0 : remaining / segment;
      return {
        x: from.x + (to.x - from.x) * ratio,
        y: from.y + (to.y - from.y) * ratio,
      };
    }
    remaining -= segment;
  }
  return path[path.length - 1];
}

function previousAreaId(areaId: string): string {
  const index = areaDefinitions.findIndex((area) => area.id === areaId);
  if (index <= 0) return areaId;
  return areaDefinitions[index - 1].id;
}

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function replaceState(target: GameState, source: GameState): void {
  Object.assign(target, source);
}
