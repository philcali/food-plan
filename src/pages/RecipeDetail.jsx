import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { recipesRepo, mealSlotsRepo } from '../lib/repository'
import ConfirmModal from '../components/ConfirmModal'

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(null)
  const [slots, setSlots] = useState([])
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setRecipe(recipesRepo.get(id))
    setSlots(mealSlotsRepo.list())
  }, [id])

  if (!recipe) {
    return (
      <div className="pb-24 pt-6 px-4 max-w-lg mx-auto text-center py-16">
        <span className="text-4xl">🔍</span>
        <p className="text-sm text-gray-400 mt-3">Recipe not found</p>
        <Link to="/recipes" className="mt-4 inline-block text-sm text-blue-600 font-medium">Back to recipes</Link>
      </div>
    )
  }

  const usedSlots = slots.filter(s => s.recipeId === id)

  return (
    <div className="pb-24 pt-6 px-4 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        <div className="flex-1" />
        <button onClick={() => setConfirmDelete(true)} className="text-gray-300 hover:text-red-400 text-sm transition-colors">
          Delete
        </button>
      </div>

      {/* Card */}
      <div className="card p-6 text-center">
        <span className="text-5xl">{recipe.emoji || '🍽️'}</span>
        <h1 className="text-xl font-semibold text-gray-900 mt-3">{recipe.name}</h1>
        <div className="flex items-center justify-center gap-3 mt-2 text-sm text-gray-500">
          <span>{recipe.ageMin}mo+</span>
          <span>·</span>
          <span>{recipe.texture}</span>
          {recipe.allergens?.length > 0 && (
            <>
              <span>·</span>
              <span className="text-amber-600 font-medium">⚠ {recipe.allergens.join(', ')}</span>
            </>
          )}
        </div>
      </div>

      {/* Prep Notes */}
      {recipe.prepNotes && (
        <div className="card p-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Prep Notes</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{recipe.prepNotes}</p>
        </div>
      )}

      {/* Used in plans */}
      {usedSlots.length > 0 && (
        <div className="card p-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Used in Plans ({usedSlots.length})
          </h2>
          <div className="space-y-1.5">
            {usedSlots.map(s => {
              const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
              const dayLabel = dayNames[new Date(s.day + 'T00:00:00').getDay()] || s.day
              return (
                <div key={s.id} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-xs text-gray-400 w-8">{dayLabel}</span>
                  <span className="text-xs text-gray-400 w-12">{s.time || '—'}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Ingredient */}
      <div className="card p-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ingredient</h2>
        <p className="text-sm text-gray-700 capitalize">{recipe.ingredient || '—'}</p>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => { recipesRepo.delete(recipe.id); navigate('/recipes') }}
        title="Delete this recipe?"
        message={`This will remove "${recipe.name}" from your library.`}
      />
    </div>
  )
}
