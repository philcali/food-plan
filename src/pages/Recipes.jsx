import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { recipesRepo } from '../lib/repository'
import ConfirmModal from '../components/ConfirmModal'

export default function Recipes() {
  const [recipes, setRecipes] = useState(recipesRepo.list().items)
  const [totalRecipes, setTotalRecipes] = useState(recipesRepo.list().total)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '', emoji: '', ingredients: [], ageMin: 6,
    texture: 'mashed', allergens: '', prepNotes: '', safe: true,
  })
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [loadCount, setLoadCount] = useState(20)
  const [activeFilter, setActiveFilter] = useState('All')

  useEffect(() => {
    const { items, total } = recipesRepo.list()
    setRecipes(items)
    setTotalRecipes(total)
  }, [])

  const filtered = useMemo(() => recipes.filter(r => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.ingredients?.some(i => i.toLowerCase().includes(search.toLowerCase()))
    if (!matchesSearch) return false
    switch (activeFilter) {
      case 'Safe': return !r.allergens?.length
      case 'Allergens': return r.allergens?.length > 0
      case '6mo+': return r.ageMin <= 6
      case '8mo+': return r.ageMin <= 8
      case '10mo+': return r.ageMin <= 10
      default: return true
    }
  }), [recipes, search, activeFilter])

  const handleAdd = (e) => {
    e.preventDefault()
    const allergens = form.allergens
      ? form.allergens.split(',').map(a => a.trim()).filter(Boolean)
      : []
    const ingredients = form.ingredients.filter(Boolean)
    recipesRepo.create({
      name: form.name, emoji: form.emoji || '🍽️', ingredients,
      ageMin: Number(form.ageMin) || 6, texture: form.texture,
      allergens, prepNotes: form.prepNotes, safe: form.safe ?? true,
    })
    const { items, total } = recipesRepo.list()
    setRecipes(items)
    setTotalRecipes(total)
    setShowForm(false)
    setForm({ name: '', emoji: '', ingredients: [], ageMin: 6, texture: 'mashed', allergens: '', prepNotes: '', safe: true })
  }

  const handleDelete = (id, name) => {
    setConfirmDelete({ id, name })
  }

  const confirmDeleteRecipe = () => {
    recipesRepo.delete(confirmDelete.id)
    const { items, total } = recipesRepo.list()
    setRecipes(items)
    setTotalRecipes(total)
    setConfirmDelete(null)
  }

  return (
    <div className="pb-24 pt-6 px-4 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Recipes</h1>
        <button
          onClick={() => setShowForm(true)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-600 text-white text-lg font-medium active:scale-95 transition-transform"
        >
          +
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
        <input
          type="text"
          placeholder="Search foods..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['All', 'Safe', 'Allergens', '6mo+', '8mo+', '10mo+'].map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${
              activeFilter === filter
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-200 text-gray-600 active:bg-gray-100'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Recipe list */}
      <div className="space-y-2">
        {filtered.slice(0, loadCount).map(r => (
          <div key={r.id} className="card p-3 flex items-center gap-3 active:bg-gray-50 transition-colors group">
            <Link to={`/recipes/${r.id}`} className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-2xl flex-shrink-0">{r.emoji || '🍽️'}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{r.name}</div>
                <div className="text-xs text-gray-500">
                  {r.ageMin}mo+ · {r.texture}
                  {r.allergens?.length > 0 && (
                    <span className="ml-1.5 text-amber-600 font-medium">⚠ {r.allergens.join(', ')}</span>
                  )}
                </div>
              </div>
            </Link>
            <button
              onClick={() => handleDelete(r.id, r.name)}
              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-sm"
            >
              🗑
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No recipes found</p>
        )}
      </div>

      {loadCount < totalRecipes && (
        <button onClick={() => setLoadCount(c => c + 20)}
          className="w-full py-3 text-sm text-blue-600 font-medium active:text-blue-700">
          Load more
        </button>
      )}

      {/* Add Recipe Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-lg bg-white sm:rounded-2xl rounded-t-3xl shadow-xl max-h-[85vh] overflow-y-auto">
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Add Recipe</h2>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs text-gray-500">Emoji</span>
                  <input value={form.emoji} onChange={e => setForm({...form, emoji: e.target.value})}
                    placeholder="🍽️" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-lg text-center" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-gray-500">Name *</span>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                </label>
              </div>
              <div>
                <span className="text-xs text-gray-500">Ingredients</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {form.ingredients.map((ing, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium">
                        {ing}
                      </span>
                      <button type="button" onClick={() =>
                        setForm({ ...form, ingredients: form.ingredients.filter((_, j) => j !== i) })
                      } className="text-gray-300 hover:text-red-400 text-xs">✕</button>
                    </div>
                  ))}
                  <input value={form._ingredient || ''} onChange={e => setForm({...form, _ingredient: e.target.value})}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && form._ingredient?.trim()) {
                        setForm({...form, ingredients: [...form.ingredients, form._ingredient.trim()], _ingredient: ''})
                        e.preventDefault()
                      }
                    }}
                    placeholder={form.ingredients.length === 0 ? 'Type & press Enter' : 'Add another…'}
                    className="w-36 px-3 py-1.5 rounded-lg border border-gray-200 text-sm" />
                  <button type="button" onClick={() => {
                    if (form._ingredient?.trim()) {
                      setForm({...form, ingredients: [...form.ingredients, form._ingredient.trim()], _ingredient: ''})
                    }
                  }} className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:text-blue-500 active:bg-gray-50">
                    +
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs text-gray-500">Min Age (months)</span>
                  <input type="number" min={0} value={form.ageMin} onChange={e => setForm({...form, ageMin: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-gray-500">Texture</span>
                  <select value={form.texture} onChange={e => setForm({...form, texture: e.target.value})}
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
                <input value={form.allergens} onChange={e => setForm({...form, allergens: e.target.value})}
                  placeholder="e.g. egg, peanut" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
              </label>
              <label className="space-y-1 block">
                <span className="text-xs text-gray-500">Prep Notes</span>
                <textarea value={form.prepNotes} onChange={e => setForm({...form, prepNotes: e.target.value})} rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none" />
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium active:scale-[0.98] transition-transform">
                  Add Recipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteRecipe}
        title="Delete this recipe?"
        message={`This will remove "${confirmDelete?.name}" from your library.`}
      />
    </div>
  )
}
