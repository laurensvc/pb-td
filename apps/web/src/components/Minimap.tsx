import type { WorldInputCommand } from '@facet/protocol'
import type { MinimapState } from '../bridge/selectors.ts'

interface MinimapProps {
  state: MinimapState
  onFocusLandmark: (command: WorldInputCommand) => void
}

export function Minimap({ state, onFocusLandmark }: MinimapProps) {
  const { worldWidth, worldHeight } = state

  return (
    <div className="minimap" data-testid="minimap">
      <div className="minimap__label">Map</div>
      <svg
        className="minimap__svg"
        viewBox={`0 0 ${worldWidth} ${worldHeight}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Board minimap"
      >
        <rect
          x={0}
          y={0}
          width={worldWidth}
          height={worldHeight}
          className="minimap__board"
        />
        {state.candidates.map((point, index) => (
          <circle
            key={`candidate-${index}`}
            cx={point.x}
            cy={point.y}
            r={worldWidth * 0.004}
            className="minimap__candidate"
          />
        ))}
        {state.towers.map((tower, index) => (
          <rect
            key={`tower-${index}`}
            x={tower.x - worldWidth * 0.003}
            y={tower.y - worldWidth * 0.003}
            width={worldWidth * 0.006}
            height={worldWidth * 0.006}
            className={tower.active ? 'minimap__tower' : 'minimap__tower minimap__tower--idle'}
          />
        ))}
        {state.creeps.map((creep, index) => (
          <circle
            key={`creep-${index}`}
            cx={creep.x}
            cy={creep.y}
            r={worldWidth * 0.0035}
            className="minimap__creep"
          />
        ))}
        {state.landmarks.map((landmark) => (
          <g key={landmark.id}>
            <circle
              cx={landmark.x}
              cy={landmark.y}
              r={worldWidth * 0.005}
              className="minimap__landmark"
              onClick={() => onFocusLandmark({ type: 'camera.focusLandmark', landmarkId: landmark.id })}
            />
            <title>{landmark.id}</title>
          </g>
        ))}
      </svg>
    </div>
  )
}
