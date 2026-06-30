import type { HudState } from '../bridge/selectors.ts'
import { phaseLabel } from '../bridge/selectors.ts'

interface HudProps {
  hud: HudState
}

export function Hud({ hud }: HudProps) {
  return (
    <div className="hud" data-testid="game-hud">
      <div className="hud__stat">
        <span className="hud__label">Gold</span>
        <span className="hud__value">{hud.gold}</span>
      </div>
      <div className="hud__stat">
        <span className="hud__label">Level</span>
        <span className="hud__value">{hud.level}</span>
      </div>
      <div className="hud__stat">
        <span className="hud__label">Lives</span>
        <span className={`hud__value ${hud.leakPolicy === 'lethal' ? 'hud__value--warn' : ''}`}>
          {hud.leaksLabel}
        </span>
      </div>
      <div className="hud__stat">
        <span className="hud__label">Phase</span>
        <span className="hud__value">{phaseLabel(hud.phase)}</span>
      </div>
      <div className="hud__stat">
        <span className="hud__label">DPS</span>
        <span className="hud__value">{hud.dpsLabel}</span>
      </div>
      {hud.phase === 'placement' && (
        <div className="hud__stat">
          <span className="hud__label">Charges</span>
          <span className="hud__value">{hud.placementCharges}/5</span>
        </div>
      )}
    </div>
  )
}
