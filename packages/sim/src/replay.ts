import { createFacetState, dispatchFacet } from './engine';
import type { FacetAction, FacetState } from './types';

export interface RecordedCommand {
  tick: number;
  action: FacetAction;
}

export interface ReplayRecording {
  seed: number;
  contentVersion: string;
  commands: RecordedCommand[];
}

export function createRecording(seed: number, contentVersion = 'slice-1'): ReplayRecording {
  return { seed, contentVersion, commands: [] };
}

export function recordCommand(
  recording: ReplayRecording,
  tick: number,
  action: FacetAction,
): void {
  if (action.type === 'TICK' || action.type === 'START_MATCH') return;
  recording.commands.push({ tick, action: structuredClone(action) });
}

export function replayCommands(
  seed: number,
  commands: readonly RecordedCommand[],
): FacetState {
  const state = createFacetState(seed);
  dispatchFacet(state, { type: 'START_MATCH', seed });
  const sorted = [...commands].sort((a, b) => a.tick - b.tick);
  for (const { action } of sorted) {
    dispatchFacet(state, action);
  }
  return state;
}

export function statesMatch(a: FacetState, b: FacetState): boolean {
  return (
    a.wave === b.wave &&
    a.lives === b.lives &&
    a.gold === b.gold &&
    a.towers.length === b.towers.length &&
    a.rocks.length === b.rocks.length &&
    JSON.stringify(a.towers) === JSON.stringify(b.towers)
  );
}
