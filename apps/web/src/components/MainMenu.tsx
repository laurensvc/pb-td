interface MainMenuProps {
  onPlay: () => void
  onSettings: () => void
}

export function MainMenu({ onPlay, onSettings }: MainMenuProps) {
  return (
    <div className="menu-screen" data-testid="main-menu">
      <div className="menu-screen__card">
        <h1 className="menu-screen__title">GemTD</h1>
        <p className="menu-screen__subtitle">Build gems. Shape the maze. Survive the waves.</p>
        <div className="menu-screen__actions">
          <button type="button" className="menu-screen__button menu-screen__button--primary" onClick={onPlay}>
            Play
          </button>
          <button type="button" className="menu-screen__button" onClick={onSettings}>
            Settings
          </button>
        </div>
      </div>
    </div>
  )
}
