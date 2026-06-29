import type { BaseGemFamilyId, QuestState } from './types';

export type QuestTemplateId = 'merge' | 'kills' | 'leakless' | 'gold' | 'boss';

export interface QuestTemplate {
  id: QuestTemplateId;
  label: string;
  target: number;
  rewardGold: number;
  unlockGreat?: BaseGemFamilyId;
}

const POOL: QuestTemplate[] = [
  { id: 'merge', label: 'Merge 2 gems', target: 2, rewardGold: 15, unlockGreat: 'kinetic' },
  { id: 'kills', label: 'Destroy 40 invaders', target: 40, rewardGold: 20, unlockGreat: 'verdant' },
  { id: 'leakless', label: 'Clear a wave without leaks', target: 1, rewardGold: 25, unlockGreat: 'arcane' },
  { id: 'gold', label: 'Bank 120 gold', target: 120, rewardGold: 10, unlockGreat: 'nova' },
  { id: 'boss', label: 'Defeat a boss', target: 1, rewardGold: 35, unlockGreat: 'prism' },
];

export function createRunQuests(seed: number): QuestState[] {
  const picks = shuffle([...POOL], seed).slice(0, 3);
  return picks.map((template, index) => ({
    id: `quest-${index}-${template.id}`,
    templateId: template.id,
    label: template.label,
    target: template.target,
    progress: 0,
    completed: false,
    rewardGold: template.rewardGold,
    unlockGreat: template.unlockGreat,
  }));
}

export function rerollQuest(quests: QuestState[], questId: string, seed: number): void {
  const index = quests.findIndex((q) => q.id === questId);
  if (index < 0) return;
  const used = new Set(quests.map((q) => q.templateId));
  const available = POOL.filter((t) => !used.has(t.id));
  const template = available[seed % available.length] ?? POOL[seed % POOL.length]!;
  quests[index] = {
    id: `quest-${index}-${template.id}-r`,
    templateId: template.id,
    label: template.label,
    target: template.target,
    progress: 0,
    completed: false,
    rewardGold: template.rewardGold,
    unlockGreat: template.unlockGreat,
  };
}

export function applyQuestRewards(
  quest: QuestState,
  greatUnlocked: BaseGemFamilyId[],
): { gold: number; unlocked?: BaseGemFamilyId } {
  if (!quest.completed) return { gold: 0 };
  if (quest.unlockGreat && !greatUnlocked.includes(quest.unlockGreat)) {
    greatUnlocked.push(quest.unlockGreat);
    return { gold: quest.rewardGold, unlocked: quest.unlockGreat };
  }
  return { gold: quest.rewardGold };
}

function shuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
