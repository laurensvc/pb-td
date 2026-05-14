import { PhaserGameHost } from './components/PhaserGameHost';
import { useGameController } from './hooks/useGameController';

export default function App() {
  const controller = useGameController();

  return <PhaserGameHost controller={controller} />;
}
