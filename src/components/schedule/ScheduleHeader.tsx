interface Props {
  year: number
  month: number
  title?: string
  filledCount?: number
  openCount?: number
  operatingDays?: number
  onPrev: () => void
  onNext: () => void
}

export function ScheduleHeader({ year, month, title, filledCount, openCount, operatingDays, onPrev, onNext }: Props) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      {/* Left: title + stats */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-primary)] shrink-0" />
          <span className="text-[11px] font-medium text-[var(--color-text-muted)] tracking-widest uppercase">
            {title || '스케줄'} · 자원봉사
          </span>
        </div>
        <h1 className="flex items-baseline gap-3 m-0 leading-none">
          <span className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {String(month).padStart(2, '0')}월
          </span>
          <span className="text-xl sm:text-2xl font-medium text-[var(--color-text-muted)] tracking-tight">
            {year}
          </span>
        </h1>
        {(filledCount !== undefined || openCount !== undefined || operatingDays !== undefined) && (
          <p className="mt-2 text-xs font-medium text-[var(--color-text-muted)] flex items-center gap-0 flex-wrap">
            {operatingDays !== undefined && (
              <>
                이번 달 운영일{' '}
                <b className="font-mono-num text-[var(--color-text-primary)] mx-1">{operatingDays}일</b>
              </>
            )}
            {filledCount !== undefined && operatingDays !== undefined && (
              <span className="mx-2 text-[var(--color-border-strong)]">·</span>
            )}
            {filledCount !== undefined && (
              <>
                배정된 봉사자{' '}
                <b className="font-mono-num text-[var(--color-text-primary)] mx-1">{filledCount}명</b>
              </>
            )}
            {openCount !== undefined && filledCount !== undefined && (
              <span className="mx-2 text-[var(--color-border-strong)]">·</span>
            )}
            {openCount !== undefined && (
              <>
                빈 슬롯{' '}
                <b className="font-mono-num text-[var(--color-brand-primary)] mx-1">{openCount}개</b>
              </>
            )}
          </p>
        )}
      </div>

      {/* Right: nav buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onPrev}
          aria-label="이전 달"
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-all duration-150 hover:scale-[1.04] active:scale-[0.96]"
        >
          <span className="text-base leading-none">←</span>
        </button>
        <button
          onClick={onPrev}
          aria-label="오늘"
          className="h-10 px-4 flex items-center rounded-xl bg-[var(--color-text-primary)] text-white text-xs font-medium hover:opacity-90 transition-all duration-150 active:scale-[0.97]"
          style={{ display: 'none' }}
        />
        <button
          onClick={onNext}
          aria-label="다음 달"
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-all duration-150 hover:scale-[1.04] active:scale-[0.96]"
        >
          <span className="text-base leading-none">→</span>
        </button>
      </div>
    </div>
  )
}
