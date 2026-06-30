import type { GameCommand, GameSnapshot, SnapshotSelectionAction } from '@facet/protocol'

interface BuildControlsProps {
  snapshot: GameSnapshot
  onCommand: (command: GameCommand) => void
}

function toCommand(action: SnapshotSelectionAction): GameCommand {
  switch (action.kind) {
    case 'keep':
      return { type: 'build.keepGem', candidateId: action.candidateId }
    case 'downgrade':
      return {
        type: 'build.downgrade',
        candidateId: action.candidateId,
        resultGemId: action.resultGemId,
      }
    case 'duplicate-combine':
      return {
        type: 'build.combine',
        candidateId: action.candidateId,
        count: action.count,
        resultGemId: action.resultGemId,
        consumedCandidateIds: action.consumedCandidateIds,
      }
    case 'one-hit-special':
      return {
        type: 'recipe.combine',
        candidateId: action.candidateId,
        recipeId: action.recipeId,
        outputTowerId: action.outputTowerId,
        consumedCandidateIds: action.consumedCandidateIds,
      }
  }
}

const TARGETING_MODES = [
  { id: 'closest_to_goal', label: 'Closest to goal' },
  { id: 'closest_to_tower', label: 'Closest to tower' },
  { id: 'highest_hp', label: 'Highest HP' },
  { id: 'first_in_range', label: 'First in range' },
] as const

export function BuildControls({ snapshot, onCommand }: BuildControlsProps) {
  const selectedTower = snapshot.towers.find((t) => t.id === snapshot.selectedTowerId)

  return (
    <div className="panel build-controls" data-testid="build-controls">
      {snapshot.phase === 'countdown' && (
        <button type="button" onClick={() => onCommand({ type: 'game.skipCountdown' })}>
          Start build phase
        </button>
      )}

      {(snapshot.phase === 'placement' || snapshot.phase === 'selection') && (
        <div className="build-controls__section">
          <h3>Gem chance L{snapshot.chanceLevel}</h3>
          <button
            type="button"
            disabled={!snapshot.canUpgradeChance}
            onClick={() => onCommand({ type: 'economy.upgradeGemChance' })}
          >
            Upgrade ({snapshot.chanceUpgradeCost}g)
          </button>
        </div>
      )}

      {snapshot.phase === 'selection' && (
        <div className="build-controls__section">
          <h3>Selection</h3>
          <ul className="build-controls__actions">
            {snapshot.selectionActions.map((action, index) => (
              <li key={`${action.kind}-${action.candidateId}-${index}`}>
                <button type="button" onClick={() => onCommand(toCommand(action))}>
                  {action.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedTower && (
        <div className="build-controls__section">
          <h3>Tower targeting</h3>
          <select
            value={selectedTower.targetingMode}
            onChange={(e) =>
              onCommand({
                type: 'tower.setTargetingMode',
                towerId: selectedTower.id,
                mode: e.target.value as typeof selectedTower.targetingMode,
              })
            }
          >
            {TARGETING_MODES.map((mode) => (
              <option key={mode.id} value={mode.id}>
                {mode.label}
              </option>
            ))}
          </select>
          <label className="build-controls__toggle">
            <input
              type="checkbox"
              checked={selectedTower.holdFire}
              onChange={(e) =>
                onCommand({
                  type: 'tower.setHoldFire',
                  towerId: selectedTower.id,
                  held: e.target.checked,
                })
              }
            />
            Hold fire
          </label>
        </div>
      )}
    </div>
  )
}
