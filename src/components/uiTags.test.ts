import { describe, expect, it } from 'vitest';
import { gameConfig, getEnemy, getGem } from '../game/config';
import { getTowerTags, getWaveTags } from './uiTags';

const wavePeers = gameConfig.waves.map((wave) => ({
  wave,
  enemy: getEnemy(gameConfig, wave.enemyId),
}));

describe('UI tags', () => {
  it('summarizes tower damage and effect bonuses', () => {
    expect(getTowerTags(getGem(gameConfig, 'emerald-2'))).toEqual(['Magic', 'Poison', 'Reveal']);
    expect(getTowerTags(getGem(gameConfig, 'ruby-1'))).toEqual(['Cleave']);
    expect(getTowerTags(getGem(gameConfig, 'opal-1'))).toEqual(['Magic', 'Aura']);
  });

  it('summarizes next-wave threats from enemy stats and skills', () => {
    const flyingWave = gameConfig.waves[4];
    expect(getWaveTags(flyingWave, getEnemy(gameConfig, flyingWave.enemyId), wavePeers)).toContain(
      'Flying',
    );

    const bossWave = gameConfig.waves[9];
    const bossTags = getWaveTags(bossWave, getEnemy(gameConfig, bossWave.enemyId), wavePeers);
    expect(bossTags).toContain('Boss');
    expect(bossTags).toContain('High HP');

    const armorWave = gameConfig.waves[21];
    expect(getWaveTags(armorWave, getEnemy(gameConfig, armorWave.enemyId), wavePeers)).toContain(
      'High Armor',
    );
  });
});
