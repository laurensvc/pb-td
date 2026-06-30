import { applyQuestRewards } from './quests';
import type { FxEvent, GameState, QuestState } from './types';

export function pushFx(
  state: GameState,
  kind: FxEvent['kind'],
  x: number,
  y: number,
  text: string,
): void {
  state.fxEvents.push({
    id: state.nextFxId++,
    kind,
    x: x + 0.5,
    y: y + 0.5,
    text,
    life: kind === 'merge' ? 1.2 : 0.9,
  });
}

export function trackQuestProgress(
  state: GameState,
  templateId: QuestState['templateId'],
  amount: number,
): void {
  for (const quest of state.quests) {
    if (quest.completed || quest.templateId !== templateId) continue;
    if (templateId === 'gold') {
      quest.progress = Math.max(quest.progress, amount);
    } else {
      quest.progress += amount;
    }
    if (quest.progress >= quest.target) {
      quest.completed = true;
      const reward = applyQuestRewards(quest, state.greatUnlocked);
      state.gold += reward.gold;
      if (reward.unlocked) {
        pushFx(state, 'quest', 8, 5, `Great ${reward.unlocked} unlocked!`);
      } else {
        pushFx(state, 'quest', 8, 5, `Quest +${reward.gold}g`);
      }
    }
  }
}

export function tickTransientFx(state: GameState, dt: number): void {
  state.fxEvents = state.fxEvents.filter((fx) => {
    fx.life -= dt;
    return fx.life > 0;
  });
}
