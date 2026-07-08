import { useTenant } from '../../contexts/TenantContext'

interface Props {
  year: number
  month: number
}

export function ExportButton({ year, month }: Props) {
  const { tenant } = useTenant()

  function handleShareUrl() {
    const tid = tenant?.id ?? ''
    const url = `${window.location.origin}/share?tid=${tid}&year=${year}&month=${month}`
    navigator.clipboard.writeText(url).then(() => alert('공유 URL이 클립보드에 복사되었습니다.\n' + url))
  }

  return (
    <button
      onClick={handleShareUrl}
      className="flex items-center justify-center gap-1.5 w-8 h-8 sm:w-auto sm:h-auto px-0 py-0 sm:px-3 sm:py-1.5 text-xs font-medium rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shrink-0"
    >
      <span className="text-sm leading-none select-none">🔗</span>
      <span className="hidden sm:inline">공유</span>
    </button>
  )
}
