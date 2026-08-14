import { useState, useEffect, useRef } from 'react'
import { feedingLogsRepo, recipesRepo, localDate, parseLocalDate, compressImage } from '../lib/repository'
import ConfirmModal from '../components/ConfirmModal'

const LOG_AMOUNTS = ['Tasted', 'Ate some', 'Ate most', 'Ate all', 'Refused']
const REACTIONS = ['None', 'Mild rash', 'Vomiting', 'Diarrhea', 'Gas', 'Other']

export default function Diary() {
  const [logs, setLogs] = useState([])
  const [recipes] = useState(recipesRepo.list().items)
  const [showForm, setShowForm] = useState(false)
  const [showEdit, setShowEdit] = useState(null)
  const [form, setForm] = useState({
    date: localDate(),
    time: '09:00',
    recipeId: '',
    amount: 'Tasted',
    reaction: 'None',
    notes: '',
    favorite: false,
    photo: null,
  })
  const [editForm, setEditForm] = useState({})
  const [filter, setFilter] = useState('All')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [loadCount, setLoadCount] = useState(14) // days to show
  const [photoPreview, setPhotoPreview] = useState(null)
  const fileInputRef = useRef(null)
  const editFileInputRef = useRef(null)
  const [expandedPhoto, setExpandedPhoto] = useState(null)
  const [expandedLog, setExpandedLog] = useState(null)
  const [viewMode, setViewMode] = useState('list') // 'list' | 'gallery'

  useEffect(() => {
    ;(async () => {
      const { items } = await feedingLogsRepo.list()
      setLogs(items)
    })()
  }, [])

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file)
    setPhotoPreview(compressed)
    setForm({ ...form, photo: compressed })
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    await feedingLogsRepo.create({ ...form, date: form.date || localDate() })
    const { items } = await feedingLogsRepo.list()
    setLogs(items)
    setShowForm(false)
    setForm({
      date: localDate(),
      time: '09:00',
      recipeId: '',
      amount: 'Tasted',
      reaction: 'None',
      notes: '',
      favorite: false,
      photo: null,
    })
    setPhotoPreview(null)
  }

  const handleToggleFav = async (id) => {
    const log = logs.find(l => l.id === id)
    await feedingLogsRepo.update(id, { favorite: !log.favorite })
    const { items } = await feedingLogsRepo.list()
    setLogs(items)
  }

  const handleEdit = (log) => {
    setEditForm({ ...log })
    setShowEdit(log.id)
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    await feedingLogsRepo.update(showEdit, {
      date: editForm.date,
      time: editForm.time,
      recipeId: editForm.recipeId,
      amount: editForm.amount,
      reaction: editForm.reaction,
      notes: editForm.notes,
      photo: editForm.photo,
    })
    const { items } = await feedingLogsRepo.list()
    setLogs(items)
    setShowEdit(null)
  }

  const handleDelete = (id, name) => {
    setConfirmDelete({ id, name })
  }

  const confirmDeleteLog = async () => {
    await feedingLogsRepo.delete(confirmDelete.id)
    const { items } = await feedingLogsRepo.list()
    setLogs(items)
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

  const todayKey = localDate()

  return (
    <div className="pb-24 pt-6 px-4 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Diary</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'gallery' ? 'list' : 'gallery')}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 active:scale-95 transition-transform"
            title={viewMode === 'gallery' ? 'List view' : 'Gallery view'}
          >
            {viewMode === 'gallery' ? '📋' : '📷'}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-600 text-white text-lg font-medium active:scale-95 transition-transform"
          >
            +
          </button>
        </div>
      </div>

      {/* Filter bar */}
      {viewMode === 'list' && (
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
      )}

      {/* Favorites */}
      {viewMode === 'list' && logs.filter(l => l.favorite).length > 0 && (
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

      {/* Gallery view */}
      {viewMode === 'gallery' && (() => {
        const logsWithPhotos = logs.filter(l => l.photo)
        return (
          <div className="space-y-3">
            {logsWithPhotos.length > 0 ? (
              <div className="columns-2 gap-2 space-y-2">
                {logsWithPhotos.sort((a, b) => b.date.localeCompare(a.date) || (b.time || '').localeCompare(a.time || '')).map(log => {
                  const recipe = recipes.find(r => r.id === log.recipeId)
                  return (
                    <button
                      key={log.id}
                      onClick={() => { setExpandedPhoto(log.photo); setExpandedLog(log) }}
                      className="w-full break-inside-avoid rounded-xl overflow-hidden border border-gray-200 active:opacity-80 transition-opacity"
                    >
                      <div className="w-full max-h-48 overflow-hidden bg-gray-100">
                        <img
                          src={log.photo}
                          alt={recipe?.name || 'Feeding photo'}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="p-1.5 bg-white">
                        <div className="text-[11px] font-medium text-gray-700 truncate">{recipe?.name || 'Unknown'}</div>
                        <div className="text-[10px] text-gray-400">{log.date}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <span className="text-4xl">📷</span>
                <p className="text-sm text-gray-400 mt-3">No photos yet</p>
                <p className="text-xs text-gray-300 mt-1">Log a feeding with a photo to see it here</p>
              </div>
            )}
          </div>
        )
      })()}

      {/* Logs by date */}
      {viewMode === 'list' && Object.entries(grouped).map(([date, dayLogs]) => (
        <div key={date}>
          <div className={`text-xs font-semibold mb-2 px-1 ${date === todayKey ? 'text-blue-600' : 'text-gray-500'}`}>
            {date === todayKey ? 'Today' : parseLocalDate(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
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
                      {log.photo && (
                        <button
                          onClick={() => setExpandedPhoto(log.photo)}
                          className="mt-2 w-full aspect-video rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          <img
                            src={log.photo}
                            alt="Feeding photo"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      )}
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

      {viewMode === 'list' && hasMore && (
        <button onClick={() => setLoadCount(c => c + 14)}
          className="w-full py-3 text-sm text-blue-600 font-medium active:text-blue-700">
          Load more
        </button>
      )}

      {viewMode === 'list' && logs.length === 0 && (
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
              {/* Photo upload */}
              <div>
                <span className="text-xs text-gray-500">Photo</span>
                <div className="mt-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 active:bg-gray-50 transition-colors"
                  >
                    <span className="text-lg">📷</span>
                    {photoPreview ? 'Change photo' : 'Add photo'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  {photoPreview && (
                    <div className="relative group">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => { setPhotoPreview(null); setForm({...form, photo: null}) }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
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
                {/* Edit photo */}
                <div>
                  <span className="text-xs text-gray-500">Photo</span>
                  <div className="mt-1 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 active:bg-gray-50 transition-colors"
                    >
                      <span className="text-lg">📷</span>
                      {editForm.photo ? 'Change photo' : 'Add photo'}
                    </button>
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const compressed = await compressImage(file)
                        setEditForm({ ...editForm, photo: compressed })
                      }}
                      className="hidden"
                    />
                    {editForm.photo && (
                      <div className="relative group">
                        <img
                          src={editForm.photo}
                          alt="Preview"
                          className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, photo: null })}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>
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

      {/* Expanded Photo Modal */}
      {expandedPhoto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/80" onClick={() => { setExpandedPhoto(null); setExpandedLog(null) }} />
          <div className="relative z-10 w-full max-w-lg mx-auto p-4">
            <div className="max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-xl">
              <img
                src={expandedPhoto}
                alt="Feeding photo"
                className="w-full object-cover rounded-t-2xl"
              />
              {expandedLog && (() => {
                const recipe = recipes.find(r => r.id === expandedLog.recipeId)
                return (
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{recipe?.emoji || '🍽️'}</span>
                        <span className="text-sm font-semibold text-gray-900">{recipe?.name || 'Unknown'}</span>
                      </div>
                      <button
                        onClick={() => { setExpandedPhoto(null); setExpandedLog(null) }}
                        className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 text-sm flex items-center justify-center hover:bg-gray-200 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="text-gray-500">
                        <div className="text-xs text-gray-400">Date</div>
                        <div className="font-medium">{expandedLog.date}</div>
                      </div>
                      <div className="text-gray-500">
                        <div className="text-xs text-gray-400">Time</div>
                        <div className="font-medium">{expandedLog.time || '—'}</div>
                      </div>
                      <div className="text-gray-500">
                        <div className="text-xs text-gray-400">Amount</div>
                        <div className="font-medium">{expandedLog.amount || '—'}</div>
                      </div>
                      <div className="text-gray-500">
                        <div className="text-xs text-gray-400">Reaction</div>
                        <div className="font-medium">{expandedLog.reaction !== 'None' ? `⚠ ${expandedLog.reaction}` : 'No reaction'}</div>
                      </div>
                    </div>
                    {expandedLog.notes && (
                      <div className="text-xs text-gray-400 italic border-t border-gray-100 pt-3">{expandedLog.notes}</div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
