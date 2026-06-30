import { describe, expect, it } from 'vitest';
import {
  applyArmorDebuff,
  applySlowDebuff,
  effectiveArmorReduction,
  effectiveSlowFactor,
  hitWithProjectile,
  syncDebuffScalars,
} from './combat';
import { createGame } from './engine';
import type { EnemyState, ProjectileState } from './types';

function makeEnemy(overrides: Partial<EnemyState> = {}): EnemyState {
  return {
    id: 1,
    definitionId: 'scout',
    name: 'Scout',
    x: 0,
    y: 0,
    pathProgress: 0,
    checkpointIndex: 1,
    hp: 100,
    maxHp: 100,
    shield: 0,
    maxShield: 0,
    speed: 1,
    rewardGold: 1,
    color: '#fff',
    alive: true,
    leaked: false,
    flying: false,
    invisible: false,
    magicImmune: false,
    physicalImmune: false,
    revealedUntil: 0,
    poisonDps: 0,
    poisonUntil: 0,
    slowDebuffs: [],
    armorDebuffs: [],
    slowUntil: 0,
    slowFactor: 0,
    armorReduction: 0,
    ...overrides,
  };
}

function makeProjectile(overrides: Partial<ProjectileState> = {}): ProjectileState {
  return {
    id: 1,
    gemId: 1,
    family: 'kinetic',
    targetId: 1,
    effectLevel: 1,
    x: 0,
    y: 0,
    damage: 10,
    speed: 5,
    color: '#fff',
    active: true,
    ...overrides,
  };
}

describe('debuff stacking by gem level', () => {
  it('stacks slow from different levels into a stronger movement penalty', () => {
    const enemy = makeEnemy();
    applySlowDebuff(enemy, 1, 0.2, 10);
    applySlowDebuff(enemy, 2, 0.25, 10);

    expect(effectiveSlowFactor(enemy, 0)).toBe(0.45);
    expect(effectiveSlowFactor(enemy, 0)).toBeGreaterThan(0.25);
    expect(effectiveSlowFactor(enemy, 0)).toBeGreaterThan(0.2);
  });

  it('does not stack duplicate same-level slow debuffs', () => {
    const enemy = makeEnemy();
    applySlowDebuff(enemy, 2, 0.2, 10);
    applySlowDebuff(enemy, 2, 0.35, 10);

    expect(effectiveSlowFactor(enemy, 0)).toBe(0.35);
    expect(enemy.slowDebuffs).toHaveLength(1);
  });

  it('stops slowing movement after slow expires', () => {
    const enemy = makeEnemy();
    applySlowDebuff(enemy, 1, 0.4, 5);

    expect(effectiveSlowFactor(enemy, 4.9)).toBe(0.4);
    expect(effectiveSlowFactor(enemy, 5)).toBe(0);

    syncDebuffScalars(enemy, 5);
    expect(enemy.slowUntil).toBe(0);
    expect(enemy.slowFactor).toBe(0);
  });

  it('stacks armor reduction from different levels for damage amplification', () => {
    const enemy = makeEnemy();
    applyArmorDebuff(enemy, 1, 0.08);
    applyArmorDebuff(enemy, 2, 0.1);

    expect(effectiveArmorReduction(enemy)).toBeCloseTo(0.18);
  });

  it('does not stack duplicate same-level armor reduction', () => {
    const enemy = makeEnemy();
    applyArmorDebuff(enemy, 2, 0.08);
    applyArmorDebuff(enemy, 2, 0.12);

    expect(effectiveArmorReduction(enemy)).toBeCloseTo(0.12);
    expect(enemy.armorDebuffs).toHaveLength(1);
  });

  it('applies stacked armor reduction on projectile hit', () => {
    const game = createGame();
    game.status = 'running';
    const enemy = makeEnemy({ hp: 1000, maxHp: 1000 });
    game.enemies.push(enemy);

    hitWithProjectile(
      game,
      makeProjectile({ effectLevel: 1, armorReduction: 0.08, damage: 100 }),
      enemy,
    );
    const hpAfterFirst = enemy.hp;

    hitWithProjectile(
      game,
      makeProjectile({ effectLevel: 2, armorReduction: 0.1, damage: 100 }),
      enemy,
    );
    const hpAfterSecond = enemy.hp;

    const firstHitDamage = 1000 - hpAfterFirst;
    const secondHitDamage = hpAfterFirst - hpAfterSecond;

    expect(secondHitDamage).toBeGreaterThan(firstHitDamage);
    expect(effectiveArmorReduction(enemy)).toBeCloseTo(0.18);
  });
});
