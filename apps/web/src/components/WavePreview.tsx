import type { WavePreviewState } from '../bridge/selectors.ts'

interface WavePreviewProps {
  state: WavePreviewState
}

export function WavePreview({ state }: WavePreviewProps) {
  if (!state.visible || !state.wave) return null

  const wave = state.wave

  return (
    <div className="panel wave-preview" data-testid="wave-preview">
      <h3>
        Wave {wave.waveNumber}: {wave.displayName}
      </h3>
      <p className="wave-preview__announcement">{wave.announcement}</p>
      <dl className="wave-preview__meta">
        <div>
          <dt>Threat</dt>
          <dd>{'★'.repeat(wave.threatLevel)}</dd>
        </div>
        <div>
          <dt>Enemies</dt>
          <dd>{wave.enemySummary}</dd>
        </div>
        {wave.isFlying && (
          <div>
            <dt>Mobility</dt>
            <dd className="wave-preview__tag wave-preview__tag--fly">Flying</dd>
          </div>
        )}
        {wave.isBoss && (
          <div>
            <dt>Boss</dt>
            <dd className="wave-preview__tag wave-preview__tag--boss">Boss</dd>
          </div>
        )}
        {wave.abilities.length > 0 && (
          <div>
            <dt>Abilities</dt>
            <dd>{wave.abilities.join(', ')}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}
