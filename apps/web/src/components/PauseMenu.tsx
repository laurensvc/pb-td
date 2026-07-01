interface PauseMenuProps {
  onResume: () => void
  onSettings: () => void
  onMainMenu: () => void
}

export function PauseMenu({ onResume, onSettings, onMainMenu }: PauseMenuProps) {
  return (
    <div className="menu-overlay" data-testid="pause-menu" role="dialog" aria-modal="true" aria-label="Paused">
      <div className="menu-screen__card">
        <h2 className="menu-screen__title">Paused</h2>
        <div className="menu-screen__actions">
          <button type="button" className="menu-screen__button menu-screen__button--primary" onClick={onResume}>
            Resume
          </button>
          <button type="button" className="menu-screen__button" onClick={onSettings}>
            Settings
          </button>
          <button type="button" className="menu-screen__button" onClick={onMainMenu}>
            Main menu
          </button>
        </div>
      </div>
    </div>
  )
}
