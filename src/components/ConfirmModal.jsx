export default function ConfirmModal({ open, onClose, onConfirm, title, message }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 text-center">{title}</h3>
        <p className="text-sm text-gray-500 text-center mt-2">{message}</p>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 active:scale-[0.98] transition-transform">
            Cancel
          </button>
          <button onClick={() => { onConfirm(); onClose() }}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium active:scale-[0.98] transition-transform">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
