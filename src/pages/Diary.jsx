import { useState, useEffect } from 'react'
import { feedingLogsRepo, recipesRepo } from '../lib/repository'
import ConfirmModal from '../components/ConfirmModal'

const LOG_AMOUNTS = ['Tasted', 'Ate some', 'Ate most', 'Ate all', 'Refused']
const REACTIONS = ['None', 'Mild rash', 'Vomiting', 'Diarrhea', 'Gas', 'Other']

export default function Diary() {
  const [logs, setLogs] = useState(feedingLogsRepo.list().items)
  const [totalLogs, setTotalLogs] = useState(feedingLogsRepo.list().total)
  const [recipes] = useState(recipesRepo.list().items)
  const [showForm, setShowForm] = useState(false)
  const [showEdit, setShowEdit] = useState(null)
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: '09:00',
    recipeId: '',
    amount: 'Tasted',
    reaction: 'None',
    notes: '',
    favorite: false,
  })
  const [editForm, setEditForm] = useState({})
  const [filter, setFilter] = useState('All')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [loadCount, setLoadCount] = useState(14) // days to show

  useEffect(() => {
    const { items, total } = feedingLogsRepo.list()
    setLogs(items)
    setTotalLogs(total)
  }, [])

  const handleAdd = (e) => {
    e.preventDefault()
    feedingLogsRepo.create({ ...form, date: form.date || new Date().toISOString().slice(0, 10) })
    const { items, total } = feedingLogsRepo.list()
    setLogs(items)
    setTotalLogs(total)
    setShowForm(false)
    setForm({
      date: new Date().toISOString().slice(0, 10),
      time: '09:00',
      recipeId: '',
      amount: 'Tasted',
      reaction: 'None',
      notes: '',
      favorite: false,
    })
  }

  const handleToggleFav = (id) => {
    const log = logs.find(l => l.id === id)
    feedingLogsRepo.update(id, { favorite: !log.favorite })
    const { items, total } = feedingLogsRepo.list()
    setLogs(items)
    setTotalLogs(total)
  }

  const handleEdit = (log) => {
    setEditForm({ ...log })
    setShowEdit(log.id)
  }

  const handleSaveEdit = (e) => {
    e.preventDefault()
    feedingLogsRepo.update(showEdit, {
      date: editForm.date,
      time: editForm.time,
      recipeId: editForm.recipeId,
      amount: editForm.amount,
      reaction: editForm.reaction,
      notes: editForm.notes,
    })
    const { items, total } = feedingLogsRepo.list()
    setLogs(items)
    setTotalLogs(total)
    setShowEdit(null)
  }

  const handleDelete = (id, name) => {
    setConfirmDelete({ id, name })
  }

  const confirmDeleteLog = () => {
    feedingLogsRepo.delete(confirmDelete.id)
    const { items, total } = feedingLogsRepo.list()
    setLogs(items)
    setTotalLogs(total)
    setConfirmDelete(null)
  }

  const filteredLogs = filter === 'All'
    ? logs
    : logs.filter(l => l.reaction === filter)

  // Group all logs by date
  const allGrouped = filteredLogs
    .sort((a, b) => b.date.localeCompare(a.date) || (b.time || '').localeCompare(a.time || ''))
    .reduce((acc, log) => {
      const key = log.date
      if (!acc[key]) acc[key] = []
      acc[key].push(log)
      return acc
    }, {})

  const allDates = Object.keys(allGrouped).sort((a, b) => b.localeCompare(a))
  const visibleDates = allDates.slice(0, loadCount)

  const grouped = visibleDates.reduce((acc, date) => {
    acc[date] = allGrouped[date]
    return acc
  }, {})

  const hasMore = visibleDates.length < allDates.length

  const todayKey = new Date().toISOString().slice(0, 10)

  return (
    <div className="pb-24 pt-6 px-4 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Diary</h1>
        <button
          onClick={() => setShowForm(true)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-600 text-white text-lg font-medium active:scale-95 transition-transform"
        >
          +
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['All', 'None', 'Mild rash', 'Vomiting', 'Diarrhea', 'Gas'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-200 text-gray-600 active:bg-gray-100'
            }`}
          >
            {f === 'All' ? 'All' : f === 'None' ? 'No reaction' : f}
          </button>
        ))}
      </div>

      {/* Favorites */}
      {logs.filter(l => l.favorite).length > 0 && (
        <div className="card p-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Favorites</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {logs.filter(l => l.favorite).map(l => {
              const r = recipes.find(r => r.id === l.recipeId)
              return (
                <div key={l.id} className="flex-shrink-0 card px-3 py-2 flex items-center gap-2">
                  <span className="text-lg">{r?.emoji || '🍽️'}</span>
                  <span className="text-xs text-gray-700 font-medium">{r?.name || 'Unknown'}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Logs by date */}
      {Object.entries(grouped).map(([date, dayLogs]) => (
        <div key={date}>
          <div className={`text-xs font-semibold mb-2 px-1 ${date === todayKey ? 'text-blue-600' : 'text-gray-500'}`}>
            {date === todayKey ? 'Today' : new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
          <div className="space-y-2">
            {dayLogs.sort((a, b) => (a.time || '').localeCompare(b.time || '')).map(log => {
              const recipe = recipes.find(r => r.id === log.recipeId)
              return (
                <div key={log.id} className="card p-3 group">
                  <div className="flex items-start gap-3">
                    <div className="text-left flex-shrink-0">
                      <div className="text-xs text-gray-400 font-medium">{log.time || '—'}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{recipe?.emoji || '🍽️'}</span>
                        <span className="text-sm font-medium text-gray-900">{recipe?.name || 'Unknown'}</span>
                        {log.favorite && <span className="text-amber-400 text-sm">★</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {log.amount} · {log.reaction !== 'None' && (
                          <span className={log.reaction === 'None' ? '' : 'text-amber-600 font-medium'}>
                            {log.reaction === 'None' ? 'No reaction' : `⚠ ${log.reaction}`}
                          </span>
                        )}
                      </div>
                      {log.notes && <div className="text-xs text-gray-400 mt-1 italic">{log.notes}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(log)}
                        className="text-xs text-gray-300 hover:text-blue-400 transition-colors px-1.5 py-0.5">
                        ✎
                      </button>
                      <span className="text-gray-200">·</span>
                      <button onClick={() => handleToggleFav(log.id)}
                        className="text-xs text-gray-300 hover:text-amber-400 transition-colors px-1.5 py-0.5">
                        ★
                      </button>
                      <span className="text-gray-200">·</span>
                      <button onClick={() => handleDelete(log.id, recipe?.name || 'Unknown food')}
                        className="text-xs text-gray-300 hover:text-red-400 transition-colors px-1.5 py-0.5">
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {hasMore && (
        <button onClick={() => setLoadCount(c => c + 14)}
          className="w-full py-3 text-sm text-blue-600 font-medium active:text-blue-700">
          Load more
        </button>
      )}

      {logs.length === 0 && (
        <div className="text-center py-16">
          <span className="text-4xl">📝</span>
          <p className="text-sm text-gray-400 mt-3">No feeding logs yet</p>
          <button onClick={() => setShowForm(true)}
            className="mt-2 text-sm text-blue-600 font-medium">Log a feeding</button>
        </div>
      )}

      {/* Add Log Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-lg bg-white sm:rounded-2xl rounded-t-3xl shadow-xl max-h-[85vh] overflow-y-auto">
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Log Feeding</h2>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs text-gray-500">Date</span>
                  <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-gray-500">Time</span>
                  <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                </label>
              </div>
              <label className="space-y-1 block">
                <span className="text-xs text-gray-500">Food *</span>
                <select value={form.recipeId} onChange={e => setForm({...form, recipeId: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm">
                  <option value="">Select a food...</option>
                  {recipes.map(r => (
                    <option key={r.id} value={r.id}>{r.emoji} {r.name}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs text-gray-500">Amount</span>
                  <select value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm">
                    {LOG_AMOUNTS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-gray-500">Reaction</span>
                  <select value={form.reaction} onChange={e => setForm({...form, reaction: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm">
                    {REACTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </label>
              </div>
              <label className="space-y-1 block">
                <span className="text-xs text-gray-500">Notes</span>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none" />
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium active:scale-[0.98] transition-transform">
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Log Modal */}
      {showEdit && (() => {
        const log = logs.find(l => l.id === showEdit)
        if (!log) return null
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="fixed inset-0 bg-black/30" onClick={() => setShowEdit(null)} />
            <div className="relative z-10 w-full max-w-lg bg-white sm:rounded-2xl rounded-t-3xl shadow-xl max-h-[85vh] overflow-y-auto">
              <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Edit Log</h2>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span className="text-xs text-gray-500">Date</span>
                    <input type="date" value={editForm.date || ''} onChange={e => setEditForm({...editForm, date: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-gray-500">Time</span>
                    <input type="time" value={editForm.time || ''} onChange={e => setEditForm({...editForm, time: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                  </label>
                </div>
                <label className="space-y-1 block">
                  <span className="text-xs text-gray-500">Food</span>
                  <select value={editForm.recipeId || ''} onChange={e => setEditForm({...editForm, recipeId: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm">
                    <option value="">Select a food...</option>
                    {recipes.map(r => (
                      <option key={r.id} value={r.id}>{r.emoji} {r.name}</option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span className="text-xs text-gray-500">Amount</span>
                    <select value={editForm.amount || 'Tasted'} onChange={e => setEditForm({...editForm, amount: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm">
                      {LOG_AMOUNTS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-gray-500">Reaction</span>
                    <select value={editForm.reaction || 'None'} onChange={e => setEditForm({...editForm, reaction: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm">
                      {REACTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </label>
                </div>
                <label className="space-y-1 block">
                  <span className="text-xs text-gray-500">Notes</span>
                  <textarea value={editForm.notes || ''} onChange={e => setEditForm({...editForm, notes: e.target.value})} rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none" />
                </label>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowEdit(null)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium active:scale-[0.98] transition-transform">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      })()}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteLog}
        title="Delete this log?"
        message={`This will remove "${confirmDelete?.name}" from your diary.`}
      />
    </div>
  )
}
