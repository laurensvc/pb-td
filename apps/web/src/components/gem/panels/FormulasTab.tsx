import type { SaveState } from '../../../game/types';
import { RecipePanel } from './progress';

export function FormulasTab({ save }: { save: SaveState }) {
  return <RecipePanel save={save} />;
}
