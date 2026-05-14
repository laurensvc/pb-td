import Phaser from 'phaser';
import { gameConfig, getEnemy } from '../../game/config';
import type {
  DamageType,
  EnemySkill,
  GameSnapshot,
  TargetMode,
  TowerEffect,
} from '../../game/types';
import { getTowerTags } from '../../components/uiTags';
import { getSceneBridge, type PhaserSceneBridge } from '../adapters/sceneBridge';
import {
  addButton,
  addLabel,
  destroyButtons,
  destroyTexts,
  drawPanel,
  type UiButton,
} from '../ui/canvasUi';
import { Colors } from '../ui/palette';
import { SceneKeys } from './sceneKeys';

type InspectorTab = 'intel' | 'quests' | 'help';

const targetModes: readonly TargetMode[] = [
  'first',
  'last',
  'strongest',
  'weakest',
  'closest',
  'flyingOnly',
  'bossOnly',
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

export class InspectorScene extends Phaser.Scene {
  private bridge!: PhaserSceneBridge;
  private graphics!: Phaser.GameObjects.Graphics;
  private buttons: UiButton[] = [];
  private texts: Phaser.GameObjects.Text[] = [];
  private tab: InspectorTab = 'intel';
  private lastToken = '';

  constructor() {
    super(SceneKeys.Inspector);
  }

  create(): void {
    this.bridge = getSceneBridge();
    this.graphics = this.add.graphics().setDepth(30);
  }

  update(): void {
    const snapshot = this.bridge.getSnapshot();
    const token = `${this.scale.width}:${this.scale.height}:${this.tab}:${snapshot.selectedTile?.x}:${snapshot.selectedTile?.y}:${snapshot.selectedTower?.id}:${snapshot.selectedTower?.tier}:${snapshot.selectedTower?.kills}:${snapshot.selectedTower?.targetMode}:${snapshot.canRemoveStone}:${snapshot.wave}:${snapshot.status}:${snapshot.gold}:${snapshot.quests.length}:${snapshot.rank.seasonRankId}`;
    if (token === this.lastToken) return;
    this.lastToken = token;
    this.redraw();
  }

  private redraw(): void {
    this.graphics.clear();
    destroyButtons(this.buttons);
    destroyTexts(this.texts);
    if (this.scale.width < 1040) return;
    const x = this.scale.width - 372;
    drawPanel(this.graphics, x, 112, 360, this.scale.height - 260, 0.92);
    this.drawTabs(x + 12, 128);
    if (this.tab === 'intel') this.drawIntel(this.bridge.getSnapshot(), x + 18, 182);
    else if (this.tab === 'quests') this.drawQuests(this.bridge.getSnapshot(), x + 18, 182);
    else this.drawHelp(x + 18, 182);
  }

  private drawTabs(x: number, y: number): void {
    this.buttons.push(
      addButton(
        this,
        x,
        y,
        104,
        36,
        'INTEL',
        () => this.setTab('intel'),
        false,
        this.tab === 'intel' ? 'primary' : 'secondary',
      ),
    );
    this.buttons.push(
      addButton(
        this,
        x + 112,
        y,
        104,
        36,
        'QUESTS',
        () => this.setTab('quests'),
        false,
        this.tab === 'quests' ? 'primary' : 'secondary',
      ),
    );
    this.buttons.push(
      addButton(
        this,
        x + 224,
        y,
        104,
        36,
        'HELP',
        () => this.setTab('help'),
        false,
        this.tab === 'help' ? 'primary' : 'secondary',
      ),
    );
  }

  private setTab(tab: InspectorTab): void {
    this.tab = tab;
    this.lastToken = '';
  }

  private drawIntel(snapshot: GameSnapshot, x: number, y: number): void {
    this.texts.push(addLabel(this, x, y, 'SELECTED', 13, '#f3ca72'));
    if (snapshot.selectedTower) {
      const tower = snapshot.selectedTower;
      this.texts.push(addLabel(this, x, y + 30, tower.name, 22, '#d8eef4'));
      this.texts.push(
        addLabel(
          this,
          x,
          y + 60,
          `${tower.damage} dmg | ${tower.cooldown.toFixed(2)}s | ${tower.range.toFixed(1)} range`,
          13,
          '#7f9ca8',
        ),
      );
      this.texts.push(
        addLabel(
          this,
          x,
          y + 88,
          `Class ${tower.classification} | ${damageLabels[tower.damageType]} | Kills ${tower.kills}`,
          13,
          '#d8eef4',
        ),
      );
      this.texts.push(
        addLabel(
          this,
          x,
          y + 116,
          `Target ${snapshot.selectedTowerTarget?.name ?? 'auto'} | Mode ${targetModeLabels[tower.targetMode]}`,
          13,
          '#d8eef4',
        ),
      );
      const costs = snapshot.selectedTowerUpgradeCosts;
      this.buttons.push(
        addButton(
          this,
          x,
          y + 146,
          150,
          34,
          `TIER ${tower.tier} ${costs?.tier ?? 'MAX'}`,
          () => this.dispatchSelected('upgradeTowerTier'),
          costs?.tier === null,
        ),
      );
      this.buttons.push(
        addButton(
          this,
          x + 160,
          y + 146,
          150,
          34,
          `DMG ${tower.upgradeLevels.damage} ${costs?.damage ?? 'MAX'}`,
          () => this.dispatchSelected('upgradeTowerStat', 'damage'),
          costs?.damage === null,
        ),
      );
      this.buttons.push(
        addButton(
          this,
          x,
          y + 188,
          150,
          34,
          `SPD ${tower.upgradeLevels.speed} ${costs?.speed ?? 'MAX'}`,
          () => this.dispatchSelected('upgradeTowerStat', 'speed'),
          costs?.speed === null,
        ),
      );
      this.buttons.push(
        addButton(
          this,
          x + 160,
          y + 188,
          150,
          34,
          `RNG ${tower.upgradeLevels.range} ${costs?.range ?? 'MAX'}`,
          () => this.dispatchSelected('upgradeTowerStat', 'range'),
          costs?.range === null,
        ),
      );
      this.buttons.push(
        addButton(this, x, y + 232, 150, 34, 'STOP / FIRE', () =>
          this.dispatchSelected('toggleTowerStop'),
        ),
      );
      this.buttons.push(
        addButton(
          this,
          x + 160,
          y + 232,
          150,
          34,
          'CLEAR TARGET',
          () => this.dispatchSelected('setTowerTarget'),
          !tower.targetId,
        ),
      );
      this.drawTargetModes(x, y + 286, tower.targetMode);
      this.drawTags(x, y + 376, getTowerTags(tower));
      const effects = tower.effects.length
        ? tower.effects.map((effect) => effectLabels[effect.type])
        : ['No effects'];
      this.drawTags(x, y + 430, effects);
    } else if (snapshot.canRemoveStone && snapshot.selectedTile) {
      this.texts.push(addLabel(this, x, y + 34, 'Maze block', 21, '#d8eef4'));
      this.texts.push(addLabel(this, x, y + 66, 'Towers can replace this block.', 13, '#7f9ca8'));
      this.buttons.push(
        addButton(
          this,
          x,
          y + 102,
          170,
          36,
          'REMOVE BLOCK',
          () => this.dispatchSelected('removeStone'),
          false,
          'danger',
        ),
      );
    } else {
      this.texts.push(
        addLabel(
          this,
          x,
          y + 38,
          'Select a tower, block, or enemy target on the board.',
          13,
          '#7f9ca8',
        ),
      );
    }
    this.drawWaveIntel(snapshot, x, Math.min(this.scale.height - 320, y + 500));
  }

  private drawTargetModes(x: number, y: number, active: TargetMode): void {
    this.texts.push(addLabel(this, x, y, 'TARGET MODE', 12, '#8beaff'));
    for (let i = 0; i < targetModes.length; i++) {
      const mode = targetModes[i];
      const bx = x + (i % 2) * 156;
      const by = y + 22 + Math.floor(i / 2) * 32;
      this.buttons.push(
        addButton(
          this,
          bx,
          by,
          146,
          26,
          targetModeLabels[mode],
          () => this.dispatchTargetMode(mode),
          false,
          mode === active ? 'primary' : 'secondary',
        ),
      );
    }
  }

  private drawWaveIntel(snapshot: GameSnapshot, x: number, y: number): void {
    const wave = snapshot.currentWave;
    const enemy = wave ? getEnemy(gameConfig, wave.enemyId) : null;
    this.texts.push(addLabel(this, x, y, 'WAVE INTEL', 13, '#f3ca72'));
    if (!wave || !enemy) {
      this.texts.push(addLabel(this, x, y + 30, 'No further waves.', 13, '#7f9ca8'));
      return;
    }
    this.texts.push(addLabel(this, x, y + 30, `${wave.wave}. ${wave.name}`, 18, '#d8eef4'));
    this.texts.push(
      addLabel(
        this,
        x,
        y + 58,
        `${enemy.name} | Count ${wave.count} | Reward ${enemy.reward}g`,
        13,
        '#7f9ca8',
      ),
    );
    const tags = snapshot.currentWaveSkills.length ? snapshot.currentWaveSkills : enemy.skills;
    this.drawTags(
      x,
      y + 88,
      tags.map((tag) => enemySkillLabels[tag]),
    );
  }

  private drawQuests(snapshot: GameSnapshot, x: number, y: number): void {
    const rank = gameConfig.ranks.find((item) => item.id === snapshot.rank.seasonRankId);
    this.texts.push(
      addLabel(this, x, y, `RANK ${rank?.name ?? snapshot.rank.seasonRankId}`, 18, '#d8eef4'),
    );
    this.texts.push(
      addLabel(
        this,
        x,
        y + 28,
        `Solo ${snapshot.rank.soloRank} | Race ${snapshot.rank.raceRank}`,
        13,
        '#7f9ca8',
      ),
    );
    this.buttons.push(
      addButton(
        this,
        x,
        y + 58,
        180,
        34,
        'CLAIM SEASON',
        () => this.bridge.dispatch({ type: 'claimSeasonReward' }),
        snapshot.rank.claimedSeasonReward,
        'primary',
      ),
    );
    this.buttons.push(
      addButton(
        this,
        x + 190,
        y + 58,
        130,
        34,
        'CLEAR SAVE',
        () => this.bridge.resetSave(),
        false,
        'danger',
      ),
    );
    let py = y + 116;
    for (let i = 0; i < gameConfig.quests.length; i++) {
      const quest = gameConfig.quests[i];
      const progress = snapshot.quests.find((item) => item.id === quest.id);
      const amount = progress?.completed ? 100 : Math.round((progress?.progress ?? 0) * 100);
      this.texts.push(addLabel(this, x, py, quest.name, 13, '#d8eef4'));
      this.graphics.fillStyle(0x071016, 0.9);
      this.graphics.fillRect(x, py + 18, 260, 6);
      this.graphics.fillStyle(progress?.completed ? Colors.green : Colors.amber, 0.9);
      this.graphics.fillRect(x, py + 18, 260 * (amount / 100), 6);
      py += 44;
      if (py > this.scale.height - 190) break;
    }
  }

  private drawHelp(x: number, y: number): void {
    this.texts.push(addLabel(this, x, y, 'FIELD GUIDE', 19, '#d8eef4'));
    const lines = [
      'Build phase grants five maze blocks, banked to fifteen.',
      'Shop towers can replace blocks or use legal open tiles.',
      'Selected towers can buy tier, damage, speed, and range.',
      'Manual target focus overrides automatic target mode.',
      'Physical, magic, and pure damage handle defenses differently.',
    ];
    for (let i = 0; i < lines.length; i++) {
      this.texts.push(addLabel(this, x, y + 42 + i * 42, lines[i], 13, '#7f9ca8'));
    }
  }

  private drawTags(x: number, y: number, tags: readonly string[]): void {
    let px = x;
    let py = y;
    for (let i = 0; i < tags.length; i++) {
      const label = tags[i];
      const width = Math.min(150, 16 + label.length * 7);
      if (px + width > x + 320) {
        px = x;
        py += 26;
      }
      this.graphics.fillStyle(Colors.cyan, 0.08);
      this.graphics.fillRoundedRect(px, py, width, 20, 2);
      this.graphics.lineStyle(1, Colors.cyan, 0.28);
      this.graphics.strokeRoundedRect(px, py, width, 20, 2);
      this.texts.push(addLabel(this, px + 6, py + 10, label.toUpperCase(), 10, '#8beaff'));
      px += width + 6;
    }
  }

  private dispatchSelected(
    type:
      | 'upgradeTowerTier'
      | 'upgradeTowerStat'
      | 'toggleTowerStop'
      | 'setTowerTarget'
      | 'removeStone',
    stat?: 'damage' | 'speed' | 'range',
  ): void {
    const tile = this.bridge.getSnapshot().selectedTile;
    if (!tile) return;
    if (type === 'upgradeTowerStat' && stat)
      this.bridge.dispatch({ type, x: tile.x, y: tile.y, stat });
    else if (type === 'setTowerTarget')
      this.bridge.dispatch({ type, x: tile.x, y: tile.y, targetId: null });
    else if (type === 'upgradeTowerTier') this.bridge.dispatch({ type, x: tile.x, y: tile.y });
    else if (type === 'toggleTowerStop') this.bridge.dispatch({ type, x: tile.x, y: tile.y });
    else if (type === 'removeStone') this.bridge.dispatch({ type, x: tile.x, y: tile.y });
  }

  private dispatchTargetMode(targetMode: TargetMode): void {
    const tile = this.bridge.getSnapshot().selectedTile;
    if (!tile) return;
    this.bridge.dispatch({ type: 'setTowerTargetMode', x: tile.x, y: tile.y, targetMode });
  }
}
