import type { BaseGemFamilyId, QuestState } from './types';
export type QuestTemplateId = 'merge' | 'kills' | 'leakless' | 'gold' | 'boss';
export interface QuestTemplate {
    id: QuestTemplateId;
    label: string;
    target: number;
    rewardGold: number;
    unlockGreat?: BaseGemFamilyId;
}
export declare function createRunQuests(seed: number): QuestState[];
export declare function rerollQuest(quests: QuestState[], questId: string, seed: number): void;
export declare function applyQuestRewards(quest: QuestState, greatUnlocked: BaseGemFamilyId[]): {
    gold: number;
    unlocked?: BaseGemFamilyId;
};
