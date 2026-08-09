import { useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import {
  exportData,
  exportRecipesOnly,
  importData,
  validateImport,
  clearAllData,
} from '../lib/repository'

function downloadJson(data, filename) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Settings() {
  const [importFile, setImportFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showDestructiveConfirm, setShowDestructiveConfirm] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [toast, setToast] = useState(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleExportFull() {
    const data = await exportData()
    const date = new Date().toISOString().slice(0, 10)
    downloadJson(data, `fp-backup-${date}.json`)
    showToast('Full backup downloaded')
  }

  async function handleExportRecipes() {
    const data = await exportRecipesOnly()
    const date = new Date().toISOString().slice(0, 10)
    downloadJson(data, `fp-recipes-${date}.json`)
    showToast('Recipes exported')
  }

  async function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      setToast('Invalid JSON file')
      return
    }
    const result = validateImport(parsed)
    if (!result.valid) {
      setToast(result.error)
      return
    }
    setImportFile(file)
    setPreview(result.preview)
    setShowPreview(true)
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  async function handleImport(merge) {
    const text = await importFile.text()
    const data = JSON.parse(text)
    await importData(data, !merge)
    setShowPreview(false)
    setImportFile(null)
    setPreview(null)
    showToast(merge ? 'Data merged' : 'Data restored — all previous data wiped')
  }

  async function handleClearAll() {
    await clearAllData()
    setShowClearConfirm(false)
    showToast('All data cleared')
    window.location.reload()
  }

  return (
    <div className="pb-24 pt-6 px-4 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/" className="text-gray-400 hover:text-gray-600">
          ←
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
      </div>

      {/* Export */}
      <div className="card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">📤 Export</h2>
        <button
          onClick={handleExportFull}
          className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        >
          <div>
            <div className="text-sm font-medium text-gray-700">Full backup</div>
            <div className="text-xs text-gray-400">Recipes, meal plans, diary &amp; photos</div>
          </div>
          <span className="text-gray-400">↓</span>
        </button>
        <button
          onClick={handleExportRecipes}
          className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        >
          <div>
            <div className="text-sm font-medium text-gray-700">Recipes only</div>
            <div className="text-xs text-gray-400">Your food collection</div>
          </div>
          <span className="text-gray-400">↓</span>
        </button>
      </div>

      {/* Import */}
      <div className="card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">📥 Import</h2>
        <label className="w-full flex items-center justify-center py-3 px-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer text-center">
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileSelect}
          />
          <div>
            <div className="text-sm font-medium text-gray-600">Choose file</div>
            <div className="text-xs text-gray-400">fp-backup-*.json or fp-recipes-*.json</div>
          </div>
        </label>
      </div>

      {/* Clear all */}
      <div className="card p-4">
        <button
          onClick={() => setShowClearConfirm(true)}
          className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors text-left"
        >
          <div>
            <div className="text-sm font-medium text-red-600">🗑 Clear all data</div>
            <div className="text-xs text-red-400">Remove everything — can't be undone</div>
          </div>
          <span className="text-red-400">→</span>
        </button>
      </div>

      {/* Import preview modal */}
      <Modal open={showPreview} onClose={() => { setShowPreview(false); setImportFile(null); setPreview(null); }}>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Import data</h3>
            <p className="text-sm text-gray-500 mt-0.5">{importFile?.name}</p>
          </div>

          {preview && (
            <div className="rounded-lg bg-gray-50 p-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Recipes</span>
                <span className="font-medium text-gray-900">{preview.recipes}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Meal plans</span>
                <span className="font-medium text-gray-900">{preview.mealSlots}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Diary entries</span>
                <span className="font-medium text-gray-900">{preview.feedingLogs}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Photos</span>
                <span className="font-medium text-gray-900">{preview.images}</span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-gray-200">
                <span className="text-gray-600">File size</span>
                <span className="font-medium text-gray-900">{formatSize(importFile?.size || 0)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => handleImport(true)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors"
            >
              Merge data
            </button>
            <button
              onClick={() => { setShowPreview(false); setShowDestructiveConfirm(true); }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors"
            >
              Wipe &amp; Import
            </button>
          </div>
        </div>
      </Modal>

      {/* Destructive confirm */}
      <ConfirmModal
        open={showDestructiveConfirm}
        onClose={() => setShowDestructiveConfirm(false)}
        title="Wipe all data?"
        message="This will permanently delete all your recipes, meal plans, and diary entries. The imported data will replace everything."
        confirmLabel="Wipe & Import"
        onConfirm={() => {
          setShowDestructiveConfirm(false)
          handleImport(false)
        }}
      />

      {/* Clear all confirm */}
      <ConfirmModal
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear all data?"
        message="This will permanently delete everything. This cannot be undone."
        confirmLabel="Clear Everything"
        onConfirm={handleClearAll}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
