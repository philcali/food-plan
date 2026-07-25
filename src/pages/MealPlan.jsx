import { useState, useEffect, useMemo } from 'react'
import { recipesRepo, mealSlotsRepo } from '../lib/repository'
import ConfirmModal from '../components/ConfirmModal'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getWeekDays() {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return { key: d.toISOString().slice(0, 10), label: DAYS[i], date: d }
  })
}

function EmptySlot({ onClick }) {
  return (
    <button onClick={onClick}
      className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors">
      + Add recipe
    </button>
  )
}

function SlotCard({ slot, recipe, onRemove }) {
  return (
    <div className="card p-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{recipe?.emoji || '🍽️'}</span>
            <span className="text-sm font-medium text-gray-900">{recipe?.name || 'Unknown'}</span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {recipe?.ageMin}mo+ · {recipe?.texture}
            {recipe?.allergens?.length > 0 && (
              <span className="ml-1 text-amber-600">⚠ {recipe.allergens.join(', ')}</span>
            )}
          </div>
          {slot.notes && <div className="text-xs text-gray-400 mt-1 italic">{slot.notes}</div>}
        </div>
        <div className="flex flex-col gap-1">
          <input
            type="time"
            value={slot.time || ''}
            onChange={e => updateMealSlot(slot.id, { time: e.target.value })}
            className="text-xs px-2 py-1 rounded-lg border border-gray-200 w-24"
          />
          <button onClick={() => onRemove(slot, recipe)}
            className="text-xs text-gray-300 hover:text-red-400 transition-colors self-end">
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MealPlan() {
  const todayKey = new Date().toISOString().slice(0, 10)
  const [recipes, setRecipes] = useState(recipesRepo.list().items)
  const [slots, setSlots] = useState(mealSlotsRepo.list())
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedSlotId, setSelectedSlotId] = useState(null)
  const [selectedDay, setSelectedDay] = useState(todayKey)
  const [weekDays] = useState(() => getWeekDays())
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    setRecipes(recipesRepo.list().items)
    setSlots(mealSlotsRepo.list())
  }, [])

  const filtered = useMemo(() =>
    recipes.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.ingredient?.toLowerCase().includes(search.toLowerCase())
    ), [recipes, search])

  const refreshSlots = () => setSlots(mealSlotsRepo.list())
  const refreshRecipes = () => setRecipes(recipesRepo.list().items)

  const handleAddToSlot = (recipeId) => {
    if (selectedSlotId) {
      mealSlotsRepo.update(selectedSlotId, { recipeId })
      refreshSlots()
      setShowAdd(false)
      setSelectedSlotId(null)
      setSearch('')
    }
  }

  const handleAddSlot = (dayKey) => {
    const newSlot = { day: dayKey, time: '' }
    mealSlotsRepo.create(newSlot)
    refreshSlots()
    setSelectedSlotId(mealSlotsRepo.list().at(-1)?.id)
    setShowAdd(true)
  }

  const handleRemoveSlot = (slot, recipe) => {
    setConfirmDelete({ slotId: slot.id, name: recipe?.name })
  }

  const confirmRemoveSlot = () => {
    mealSlotsRepo.delete(confirmDelete.slotId)
    refreshSlots()
    setConfirmDelete(null)
  }

  return (
    <div className="pb-24 pt-6 px-4 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Meal Plan</h1>

      {/* Week overview */}
      <div className="card p-3">
        <div className="flex justify-between text-xs text-gray-500">
          {weekDays.map(d => (
            <button key={d.key}
              onClick={() => setSelectedDay(d.key)}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-colors ${
                d.key === selectedDay ? 'bg-blue-50 text-blue-600' : d.key === todayKey ? 'text-blue-600' : 'hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">{d.label}</span>
              <span className="text-[10px]">{d.date.getDate()}</span>
              {slots.filter(s => s.day === d.key).length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Selected day meals */}
      <div className="space-y-2">
        {(() => {
          const selected = weekDays.find(d => d.key === selectedDay)
          const daySlots = slots.filter(s => s.day === selectedDay).sort((a, b) => (a.time || '').localeCompare(b.time || ''))
          return (
            <>
              <div className={`flex items-center gap-2 ${selectedDay === todayKey ? 'text-blue-600' : 'text-gray-700'}`}>
                <h2 className="text-sm font-semibold">{selected?.label}</h2>
                {selectedDay === todayKey && (
                  <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">Today</span>
                )}
              </div>
              <div className="space-y-2 pl-2 border-l-2 border-gray-100">
                {daySlots.map(slot => (
                  <SlotCard key={slot.id} slot={slot} recipe={recipes.find(r => r.id === slot.recipeId)}
                    onRemove={handleRemoveSlot} />
                ))}
                <EmptySlot onClick={() => {
                  const newSlot = { day: selectedDay, time: '' }
                  mealSlotsRepo.create(newSlot)
                  refreshSlots()
                  setSelectedSlotId(mealSlotsRepo.list().at(-1)?.id)
                  setShowAdd(true)
                }} />
              </div>
            </>
          )
        })()}
      </div>

      {/* Add Recipe Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowAdd(false)} />
          <div className="relative z-10 w-full max-w-lg bg-white sm:rounded-2xl rounded-t-3xl shadow-xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Add Recipe</h2>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input type="text" placeholder="Search foods..." value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {filtered.map(r => (
                <button key={r.id} onClick={() => handleAddToSlot(r.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left">
                  <span className="text-2xl">{r.emoji || '🍽️'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{r.name}</div>
                    <div className="text-xs text-gray-500">
                      {r.ageMin}mo+ · {r.texture}
                      {r.allergens?.length > 0 && (
                        <span className="ml-1 text-amber-600">⚠ {r.allergens.join(', ')}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-blue-600 text-sm font-medium">Add</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">No recipes found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmRemoveSlot}
        title="Remove this meal?"
        message={`This will remove "${confirmDelete?.name}" from the plan.`}
      />
    </div>
  )
}
