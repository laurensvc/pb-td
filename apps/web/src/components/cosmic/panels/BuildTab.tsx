import type { GameAction, SaveState, Snapshot } from '../../../game/types';
import {
  BuildPhasePanel,
  HoldPanel,
  MazePanel,
  PlacedGemsPanel,
  WavePreviewPanel,
} from './build';
import { GreatGemsPanel, RecipePanel } from './progress';

export function BuildTab({
  snapshot,
  planning,
  dispatch,
  save,
}: {
  snapshot: Snapshot;
  planning: boolean;
  dispatch: (action: GameAction) => void;
  save: SaveState;
}) {
  return (
    <>
      <BuildPhasePanel snapshot={snapshot} planning={planning} dispatch={dispatch} />
      <HoldPanel snapshot={snapshot} planning={planning} dispatch={dispatch} />
      <WavePreviewPanel snapshot={snapshot} planning={planning} />
      <MazePanel snapshot={snapshot} planning={planning} dispatch={dispatch} />
      <PlacedGemsPanel snapshot={snapshot} planning={planning} dispatch={dispatch} save={save} />
      <GreatGemsPanel snapshot={snapshot} />
      <RecipePanel save={save} />
    </>
  );
}
