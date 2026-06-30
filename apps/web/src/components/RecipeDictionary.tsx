import { v1Recipes } from '@facet/content'
import type { GameSnapshot } from '@facet/protocol'

interface RecipeDictionaryProps {
  snapshot: GameSnapshot
}

export function RecipeDictionary({ snapshot }: RecipeDictionaryProps) {
  const ownedGemIds = new Set([
    ...snapshot.candidates.map((c) => c.gemId),
    ...snapshot.towers.filter((t) => t.gemId).map((t) => t.gemId!),
  ])

  return (
    <div className="panel recipe-dictionary" data-testid="recipe-dictionary">
      <h3>Recipes</h3>
      <ul className="recipe-dictionary__list">
        {v1Recipes.map((recipe) => {
          const inputs = recipe.inputs.filter((i) => i.kind === 'gem').map((i) => i.gemId)
          const ownedCount = inputs.filter((id) => ownedGemIds.has(id)).length
          const combinable = ownedCount === inputs.length && inputs.length > 0
          return (
            <li
              key={recipe.id}
              className={combinable ? 'recipe-dictionary__item--ready' : undefined}
            >
              <strong>{recipe.displayName}</strong>
              <span className="recipe-dictionary__inputs">{inputs.join(' + ')}</span>
              {combinable && <span className="recipe-dictionary__badge">Ready</span>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
