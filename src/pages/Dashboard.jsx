import { Link } from 'react-router-dom'
import { recipesRepo, mealSlotsRepo, feedingLogsRepo } from '../lib/repository'

function getWeekDays() {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7))
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return { key: d.toISOString().slice(0, 10), label: names[i], date: d }
  })
}

export default function Dashboard() {
  const recipes = recipesRepo.list().items
  const slots = mealSlotsRepo.list()
  const logs = feedingLogsRepo.list().items
  const weekDays = getWeekDays()
  const todayKey = new Date().toISOString().slice(0, 10)

  // Stats
  const uniqueFoods = new Set(logs.map(l => l.recipeId)).size
  const allergens = new Set()
  logs.forEach(l => {
    const r = recipes.find(r => r.id === l.recipeId)
    if (r?.allergens) r.allergens.forEach(a => allergens.add(a))
  })
  const favoriteCount = logs.filter(l => l.favorite).length

  // Upcoming meals this week
  const upcoming = weekDays
    .map(d => slots
      .filter(s => s.day === d.key)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
      .map(s => ({ ...s, dayLabel: d.label }))
    )
    .flat()
    .slice(0, 5)

  // Latest recipes
  const latest = recipes.slice(0, 3)

  return (
    <div className="pb-24 pt-6 px-4 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          🍼 Little Eater
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{uniqueFoods}</div>
          <div className="text-xs text-gray-500 mt-0.5">Foods Tried</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{allergens.size}</div>
          <div className="text-xs text-gray-500 mt-0.5">Allergens</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{favoriteCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">Favorites</div>
        </div>
      </div>

      {/* This Week Preview */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">This Week</h2>
          <Link to="/plan" className="text-xs text-blue-600 font-medium">View all →</Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No meals planned yet</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map(s => {
              const recipe = recipes.find(r => r.id === s.recipeId)
              return (
                <div key={s.id} className="flex items-center gap-3 py-1.5">
                  <span className="text-xs text-gray-400 w-8">{s.dayLabel}</span>
                  <span className="text-xs text-gray-400 w-12">{s.time || '—'}</span>
                  {recipe ? (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg">{recipe.emoji || '🍽️'}</span>
                      <span className="text-sm text-gray-700 truncate">{recipe.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-300">empty</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Latest Recipes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Latest Recipes</h2>
          <Link to="/recipes" className="text-xs text-blue-600 font-medium">See all</Link>
        </div>
        <div className="space-y-2">
          {latest.map(r => (
            <Link
              key={r.id}
              to={`/recipes/${r.id}`}
              className="card p-3 flex items-center gap-3 active:bg-gray-50 transition-colors"
            >
              <span className="text-2xl flex-shrink-0">{r.emoji || '🍽️'}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{r.name}</div>
                <div className="text-xs text-gray-500">
                  {r.ageMin}mo+ · {r.texture}
                  {r.allergens?.length > 0 && (
                    <span className="ml-2 text-amber-600 font-medium">⚠ {r.allergens.join(', ')}</span>
                  )}
                </div>
              </div>
              <span className="text-gray-300 text-sm">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
