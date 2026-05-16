interface Props {
  year: number
  month: number
  title?: string
  onPrev: () => void
  onNext: () => void
}

export function ScheduleHeader({ year, month, title, onPrev, onNext }: Props) {
  const pageTitle = title || '스케줄'

  return (
    <div className="flex items-center justify-between gap-3 mb-1">
      <button
        onClick={onPrev}
        aria-label="이전 달"
        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] text-xs sm:text-sm font-medium hover:bg-[var(--color-surface-hover)] transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] shrink-0"
      >
        <span className="text-sm leading-none">←</span>
        <span className="hidden sm:inline">이전</span>
      </button>

      <div className="text-center">
        <h1 className="font-bold text-[var(--color-text-primary)] leading-tight">
          <span className="block sm:hidden text-base">
            {year}년{' '}
            <span className="text-[var(--color-brand-primary)]">{String(month).padStart(2, '0')}월</span>
          </span>
          <span className="hidden sm:block text-xl">
            {year}년{' '}
            <span className="text-[var(--color-brand-primary)]">{String(month).padStart(2, '0')}월</span>
            {' '}{pageTitle}
          </span>
        </h1>
        <p className="sm:hidden text-[10px] font-medium text-[var(--color-text-muted)] mt-0.5">{pageTitle}</p>
      </div>

      <button
        onClick={onNext}
        aria-label="다음 달"
        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] text-xs sm:text-sm font-medium hover:bg-[var(--color-surface-hover)] transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] shrink-0"
      >
        <span className="hidden sm:inline">다음</span>
        <span className="text-sm leading-none">→</span>
      </button>
    </div>
  )
}
