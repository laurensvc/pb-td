import type { GameAction, SaveState, Snapshot } from '../../../game/types';
import { ProspectPanel, QuestPanel } from './shop';

export function ShopTab({
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
      <ProspectPanel snapshot={snapshot} planning={planning} dispatch={dispatch} save={save} />
      <QuestPanel snapshot={snapshot} planning={planning} dispatch={dispatch} />
    </>
  );
}
