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
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '', emoji: '', ingredients: [], _ingredient: '', ageMin: 6,
    texture: 'mashed', allergens: '', prepNotes: '', safe: true,
  })

  useEffect(() => {
    setRecipe(recipesRepo.get(id))
    setSlots(mealSlotsRepo.list())
  }, [id])

  useEffect(() => {
    if (recipe) {
      setEditForm({
        name: recipe.name || '',
        emoji: recipe.emoji || '',
        ingredients: recipe.ingredients || [],
        _ingredient: '',
        ageMin: recipe.ageMin || 6,
        texture: recipe.texture || 'mashed',
        allergens: (recipe.allergens || []).join(', '),
        prepNotes: recipe.prepNotes || '',
        safe: recipe.safe ?? true,
      })
    }
  }, [recipe])

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
        <button onClick={() => setShowEdit(true)} className="text-gray-300 hover:text-blue-400 text-sm transition-colors">
          Edit
        </button>
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

      {/* Ingredients */}
      <div className="card p-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ingredients</h2>
        <div className="flex flex-wrap gap-1.5">
          {(recipe.ingredients || []).length > 0
            ? recipe.ingredients.map((ing, i) => (
                <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium capitalize">
                  {ing}
                </span>
              ))
            : <span className="text-sm text-gray-300">—</span>
          }
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => { recipesRepo.delete(recipe.id); navigate('/recipes') }}
        title="Delete this recipe?"
        message={`This will remove "${recipe.name}" from your library.`}
      />

      {/* Edit Recipe Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowEdit(false)} />
          <div className="relative z-10 w-full max-w-lg bg-white sm:rounded-2xl rounded-t-3xl shadow-xl max-h-[85vh] overflow-y-auto">
            <form onSubmit={(e) => {
              e.preventDefault()
              const allergens = editForm.allergens
                ? editForm.allergens.split(',').map(a => a.trim()).filter(Boolean)
                : []
              const ingredients = editForm.ingredients.filter(Boolean)
              recipesRepo.update(recipe.id, {
                name: editForm.name, emoji: editForm.emoji || '🍽️', ingredients,
                ageMin: Number(editForm.ageMin) || 6, texture: editForm.texture,
                allergens, prepNotes: editForm.prepNotes, safe: editForm.safe ?? true,
              })
              setRecipe(prev => ({
                ...prev, name: editForm.name, emoji: editForm.emoji || '🍽️',
                ingredients, ageMin: Number(editForm.ageMin) || 6,
                texture: editForm.texture, allergens, prepNotes: editForm.prepNotes,
                safe: editForm.safe ?? true,
              }))
              setShowEdit(false)
            }} className="p-5 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Edit Recipe</h2>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs text-gray-500">Emoji</span>
                  <input value={editForm.emoji} onChange={e => setEditForm({...editForm, emoji: e.target.value})}
                    placeholder="🍽️" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-lg text-center" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-gray-500">Name *</span>
                  <input required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                </label>
              </div>
              <div>
                <span className="text-xs text-gray-500">Ingredients</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {editForm.ingredients.map((ing, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium">
                        {ing}
                      </span>
                      <button type="button" onClick={() =>
                        setEditForm({...editForm, ingredients: editForm.ingredients.filter((_, j) => j !== i)})
                      } className="text-gray-300 hover:text-red-400 text-xs">✕</button>
                    </div>
                  ))}
                  <input value={editForm._ingredient || ''} onChange={e => setEditForm({...editForm, _ingredient: e.target.value})}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && editForm._ingredient?.trim()) {
                        setEditForm({...editForm, ingredients: [...editForm.ingredients, editForm._ingredient.trim()], _ingredient: ''})
                        e.preventDefault()
                      }
                    }}
                    placeholder={editForm.ingredients.length === 0 ? 'Type & press Enter' : 'Add another…'}
                    className="w-36 px-3 py-1.5 rounded-lg border border-gray-200 text-sm" />
                  <button type="button" onClick={() => {
                    if (editForm._ingredient?.trim()) {
                      setEditForm({...editForm, ingredients: [...editForm.ingredients, editForm._ingredient.trim()], _ingredient: ''})
                    }
                  }} className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:text-blue-500 active:bg-gray-50">
                    +
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs text-gray-500">Min Age (months)</span>
                  <input type="number" min={0} value={editForm.ageMin} onChange={e => setEditForm({...editForm, ageMin: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-gray-500">Texture</span>
                  <select value={editForm.texture} onChange={e => setEditForm({...editForm, texture: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm">
                    <option value="puree">Puree</option>
                    <option value="mashed">Mashed</option>
                    <option value="thinned">Thinned</option>
                    <option value="strips">Strips</option>
                    <option value="cubes">Cubes</option>
                  </select>
                </label>
              </div>
              <label className="space-y-1 block">
                <span className="text-xs text-gray-500">Allergens (comma separated)</span>
                <input value={editForm.allergens} onChange={e => setEditForm({...editForm, allergens: e.target.value})}
                  placeholder="e.g. egg, peanut" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
              </label>
              <label className="space-y-1 block">
                <span className="text-xs text-gray-500">Prep Notes</span>
                <textarea value={editForm.prepNotes} onChange={e => setEditForm({...editForm, prepNotes: e.target.value})} rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none" />
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEdit(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium active:scale-[0.98] transition-transform">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
