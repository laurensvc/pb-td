import { GameView } from './components/GameView.tsx'

export default function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1>GemTD</h1>
        <p className="app__meta">Vertical slice — build, maze, combat</p>
      </header>
      <main className="app__main">
        <GameView />
      </main>
    </div>
  )
}
