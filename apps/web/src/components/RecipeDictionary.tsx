import { v1Recipes } from '@facet/content'
import type { RecipeDictionaryState } from '../bridge/selectors.ts'

interface RecipeDictionaryProps {
  state: RecipeDictionaryState
}

export function RecipeDictionary({ state }: RecipeDictionaryProps) {
  const ownedGemIds = new Set(state.ownedGemIds)

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
