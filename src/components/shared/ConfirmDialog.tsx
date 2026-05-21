interface Props {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title, message, confirmLabel = '확인', cancelLabel = '취소', danger = false,
  onConfirm, onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border-strong)] rounded-2xl shadow-[var(--shadow-xl)] w-full max-w-sm animate-scale-in">
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-2">{title}</h2>
          <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-line">{message}</p>
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-all duration-200"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
              danger
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)] text-white'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
