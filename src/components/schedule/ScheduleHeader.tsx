import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ViewType } from '../../types'
import { DatePickerModal } from './DatePickerModal'

const DAY_KR = ['일', '월', '화', '수', '목', '금', '토']

interface Props {
  year: number
  month: number
  title?: string
  openCount?: number
  onPrev: () => void
  onNext: () => void
  viewType?: ViewType
  onViewTypeChange?: (v: ViewType) => void
  day?: number
  weekDays?: Date[]
  onDateSelect?: (year: number, month: number, day?: number) => void
  hideViewSwitcher?: boolean
  roleToggleSlot?: React.ReactNode
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

export function ScheduleHeader({ year, month, title, openCount, onPrev, onNext, viewType = 'month', onViewTypeChange, day, weekDays, onDateSelect, hideViewSwitcher, roleToggleSlot }: Props) {
  const { t } = useTranslation('schedule')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const VIEW_LABELS: Record<ViewType, string> = { month: t('views.month'), week: t('views.week'), day: t('views.day') }
  const navBtnCls = 'w-6 h-6 flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-all duration-150 hover:scale-[1.04] active:scale-[0.96]'

  return (
    <>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        {/* Left: title + stats */}
        <div className="min-w-0">
          {title && (
            <p className="text-[11px] font-semibold text-[var(--color-text-muted)] tracking-wide uppercase mb-1.5">{title}</p>
          )}
          {/* Title based on viewType */}
          {viewType === 'month' && (
            <h1 className="flex items-center gap-1.5 m-0 leading-none">
              <button onClick={onPrev} aria-label={t('nav.prev')} className={navBtnCls}>
                <span className="text-xs leading-none">←</span>
              </button>
              {onDateSelect ? (
                <button
                  type="button"
                  onClick={() => setShowDatePicker(true)}
                  className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)] px-0.5 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  {month}월
                </button>
              ) : (
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)] px-0.5">
                  {month}월
                </span>
              )}
              <button onClick={onNext} aria-label={t('nav.next')} className={navBtnCls}>
                <span className="text-xs leading-none">→</span>
              </button>
            </h1>
          )}

          {viewType === 'week' && weekDays && weekDays.length > 0 && (
            <h1 className="flex items-center gap-1.5 m-0 leading-none flex-wrap">
              <button onClick={onPrev} aria-label={t('nav.prev')} className={navBtnCls}>
                <span className="text-xs leading-none">←</span>
              </button>
              {onDateSelect ? (
                <button
                  type="button"
                  onClick={() => setShowDatePicker(true)}
                  className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)] px-0.5 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  {weekRangeLabel(weekDays)}
                </button>
              ) : (
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)] px-0.5">
                  {weekRangeLabel(weekDays)}
                </span>
              )}
              <button onClick={onNext} aria-label={t('nav.next')} className={navBtnCls}>
                <span className="text-xs leading-none">→</span>
              </button>
            </h1>
          )}

          {viewType === 'day' && day !== undefined && (
            <h1 className="flex items-center gap-1.5 m-0 leading-none">
              <button onClick={onPrev} aria-label={t('nav.prev')} className={navBtnCls}>
                <span className="text-xs leading-none">←</span>
              </button>
              {onDateSelect ? (
                <button
                  type="button"
                  onClick={() => setShowDatePicker(true)}
                  className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)] px-0.5 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  {month}월 {day}일
                </button>
              ) : (
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)] px-0.5">
                  {month}월 {day}일
                </span>
              )}
              <span className="text-sm font-medium text-[var(--color-text-muted)]">
                ({DAY_KR[new Date(year, month - 1, day).getDay()]}요일)
              </span>
              <button onClick={onNext} aria-label={t('nav.next')} className={navBtnCls}>
                <span className="text-xs leading-none">→</span>
              </button>
            </h1>
          )}

          {/* Stats: month view only */}
          {viewType === 'month' && openCount !== undefined && (
            <p className="mt-2 text-xs font-medium text-[var(--color-text-muted)] flex items-center gap-0 flex-wrap">
              빈 슬롯{' '}
              <b className="font-mono-num text-[var(--color-brand-primary)] mx-1">{openCount}개</b>
            </p>
          )}
        </div>

        {/* Right: role toggle + view switcher */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {roleToggleSlot}
          {/* View type switcher */}
          {onViewTypeChange && !hideViewSwitcher && (
            <div className="flex items-center rounded-xl border border-[var(--color-border)] overflow-hidden">
              {(['month', 'week', 'day'] as ViewType[]).map(v => (
                <button
                  key={v}
                  onClick={() => onViewTypeChange(v)}
                  className={`px-3 h-9 text-xs font-medium transition-colors border-r border-[var(--color-border)] last:border-r-0 ${
                    viewType === v
                      ? 'bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)]'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                  }`}
                >
                  {VIEW_LABELS[v]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showDatePicker && (
        <DatePickerModal
          year={year}
          month={month}
          day={day}
          mode={viewType === 'month' ? 'month' : 'full'}
          onConfirm={(y, m, d) => {
            onDateSelect?.(y, m, d)
            setShowDatePicker(false)
          }}
          onClose={() => setShowDatePicker(false)}
        />
      )}
    </>
  )
}
