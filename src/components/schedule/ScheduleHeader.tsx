import type { ViewType } from '../../types'

const DAY_KR = ['일', '월', '화', '수', '목', '금', '토']

interface Props {
  year: number
  month: number
  title?: string
  filledCount?: number
  openCount?: number
  operatingDays?: number
  onPrev: () => void
  onNext: () => void
  viewType?: ViewType
  onViewTypeChange?: (v: ViewType) => void
  day?: number
  weekDays?: Date[]
}

function weekRangeLabel(weekDays: Date[]): string {
  if (!weekDays.length) return ''
  const start = weekDays[0]
  const end = weekDays[weekDays.length - 1]
  const sm = start.getMonth() + 1
  const em = end.getMonth() + 1
  if (sm === em) {
    return `${sm}월 ${start.getDate()}일 ~ ${end.getDate()}일`
  }
  return `${sm}월 ${start.getDate()}일 ~ ${em}월 ${end.getDate()}일`
}

export function ScheduleHeader({ year, month, title, filledCount, openCount, operatingDays, onPrev, onNext, viewType = 'month', onViewTypeChange, day, weekDays }: Props) {
  const VIEW_LABELS: Record<ViewType, string> = { month: '월', week: '주', day: '일' }

  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      {/* Left: title + stats */}
      <div className="min-w-0">
        {title && (
          <p className="text-[11px] font-semibold text-[var(--color-text-muted)] tracking-wide uppercase mb-1.5">{title}</p>
        )}
        {/* Title based on viewType */}
        {viewType === 'month' && (
          <h1 className="flex items-baseline gap-3 m-0 leading-none">
            <span className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {String(month).padStart(2, '0')}월
            </span>
            <span className="text-xl sm:text-2xl font-medium text-[var(--color-text-muted)] tracking-tight">
              {year}
            </span>
          </h1>
        )}

        {viewType === 'week' && weekDays && weekDays.length > 0 && (
          <h1 className="flex items-baseline gap-2 m-0 leading-none flex-wrap">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {weekRangeLabel(weekDays)}
            </span>
            <span className="text-base font-medium text-[var(--color-text-muted)]">{year}</span>
          </h1>
        )}

        {viewType === 'day' && day !== undefined && (
          <h1 className="flex items-baseline gap-2 m-0 leading-none">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {month}월 {day}일
            </span>
            <span className="text-base font-medium text-[var(--color-text-muted)]">
              ({DAY_KR[new Date(year, month - 1, day).getDay()]}요일)
            </span>
          </h1>
        )}

        {/* Stats: month view only */}
        {viewType === 'month' && (filledCount !== undefined || openCount !== undefined || operatingDays !== undefined) && (
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
                배정된 회원{' '}
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

      {/* Right: view switcher + nav buttons */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {/* View type switcher */}
        {onViewTypeChange && (
          <div className="flex items-center rounded-xl border border-[var(--color-border)] overflow-hidden">
            {(['month', 'week', 'day'] as ViewType[]).map(v => (
              <button
                key={v}
                onClick={() => onViewTypeChange(v)}
                className={`px-3 h-9 text-xs font-medium transition-colors border-r border-[var(--color-border)] last:border-r-0 ${
                  viewType === v
                    ? 'bg-[var(--color-brand-primary)] text-white'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>
        )}

        {/* Nav buttons */}
        <button
          onClick={onPrev}
          aria-label="이전"
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-all duration-150 hover:scale-[1.04] active:scale-[0.96]"
        >
          <span className="text-base leading-none">←</span>
        </button>
        <button
          onClick={onNext}
          aria-label="다음"
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-all duration-150 hover:scale-[1.04] active:scale-[0.96]"
        >
          <span className="text-base leading-none">→</span>
        </button>
      </div>
    </div>
  )
}
