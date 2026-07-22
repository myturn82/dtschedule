import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ViewType } from '../../types'
import { DatePickerModal } from './DatePickerModal'

const DAY_KR = ['일', '월', '화', '수', '목', '금', '토']

interface Props {
  year: number
  month: number
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
  displayMode?: 'time' | 'day'
  onDisplayModeChange?: (v: 'time' | 'day') => void
}

function weekRangeLabel(weekDays: Date[]): string {
  if (!weekDays.length) return ''
  const start = weekDays[0] // 월요일
  const end = weekDays[weekDays.length - 1] // 일요일

  // ISO 8601 방식: 그 달의 날짜가 4일 이상(과반수) 포함된 달을 이 주의 소속 월로 본다
  const startMonthDays = weekDays.filter(d => d.getFullYear() === start.getFullYear() && d.getMonth() === start.getMonth()).length
  const owner = startMonthDays >= 4 ? start : end
  const oy = owner.getFullYear()
  const om = owner.getMonth()

  // 그 달 1일이 속한 주가 그 달 날짜를 4일 이상 포함하면 그 주가 1주차, 아니면 다음 주가 1주차
  const firstOfMonth = new Date(oy, om, 1)
  const firstDow = (firstOfMonth.getDay() + 6) % 7 // 0=월 ~ 6=일
  const week1Monday = (7 - firstDow) >= 4
    ? new Date(oy, om, 1 - firstDow)
    : new Date(oy, om, 1 - firstDow + 7)

  const diffDays = Math.round((start.getTime() - week1Monday.getTime()) / 86400000)
  const weekNo = Math.floor(diffDays / 7) + 1

  return `${om + 1}월 ${weekNo}주차`
}

export function ScheduleHeader({ year, month, openCount, onPrev, onNext, viewType = 'month', onViewTypeChange, day, weekDays, onDateSelect, hideViewSwitcher, roleToggleSlot, displayMode = 'time', onDisplayModeChange }: Props) {
  const { t } = useTranslation('schedule')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const VIEW_LABELS: Record<ViewType, string> = { month: t('views.month'), week: t('views.week'), day: t('views.day') }
  const navBtnCls = 'w-6 h-6 flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-all duration-150 hover:scale-[1.04] active:scale-[0.96]'

  const viewSwitcher = onViewTypeChange && !hideViewSwitcher && (
    <div className="flex items-center rounded-lg border border-[var(--color-border)] overflow-hidden shrink-0">
      {(['month', 'week', 'day'] as ViewType[]).map(v => (
        <button
          key={v}
          onClick={() => onViewTypeChange(v)}
          className={`px-2 h-7 text-[11px] font-medium transition-colors border-r border-[var(--color-border)] last:border-r-0 ${
            viewType === v
              ? 'bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)]'
              : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
          }`}
        >
          {VIEW_LABELS[v]}
        </button>
      ))}
    </div>
  )

  // 뷰 전환 버튼이 보이는 경우(=멤버 권한)에는 시간별/일자별 버튼을 타이틀과 같은 행 좌측에 배치한다
  const isMemberHeader = Boolean(viewSwitcher)

  const displayModeSwitcher = onDisplayModeChange && viewType !== 'day' && (
    <div className="flex items-center rounded-lg border border-[var(--color-border)] overflow-hidden shrink-0">
      <button
        onClick={() => onDisplayModeChange('time')}
        className={`inline-flex items-center justify-center gap-1 px-1.5 h-7 text-[11px] font-medium transition-colors border-r border-[var(--color-border)] whitespace-nowrap ${
          displayMode === 'time'
            ? 'bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)]'
            : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
        시간별
      </button>
      <button
        onClick={() => onDisplayModeChange('day')}
        className={`inline-flex items-center justify-center gap-1 px-1.5 h-7 text-[11px] font-medium transition-colors whitespace-nowrap ${
          displayMode === 'day'
            ? 'bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)]'
            : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        일자별
      </button>
    </div>
  )

  return (
    <>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Left: nav + stats */}
        <div className="min-w-0 w-full sm:flex-1">
          {/* Title based on viewType */}
          {viewType === 'month' && (
            <h1 className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 m-0 leading-none">
              <div className="min-w-0 flex">{isMemberHeader && displayModeSwitcher}</div>
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
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
              </div>
              <div className="min-w-0 flex justify-end">{viewSwitcher}</div>
            </h1>
          )}

          {viewType === 'week' && weekDays && weekDays.length > 0 && (
            <h1 className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 m-0 leading-none">
              <div className="min-w-0 flex">{isMemberHeader && displayModeSwitcher}</div>
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
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
              </div>
              <div className="min-w-0 flex justify-end">{viewSwitcher}</div>
            </h1>
          )}

          {viewType === 'day' && day !== undefined && (
            <h1 className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 m-0 leading-none">
              <div className="min-w-0" />
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
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
              </div>
              <div className="min-w-0 flex justify-end">{viewSwitcher}</div>
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

        {/* Right: (admin일 때만) display mode + role toggle */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto sm:shrink-0">
          {!isMemberHeader && displayModeSwitcher}
          {!isMemberHeader && roleToggleSlot && onDisplayModeChange && viewType !== 'day' && (
            <div className="w-px h-5 bg-[var(--color-border)] shrink-0" />
          )}
          {roleToggleSlot && (
            <div className="min-w-0 flex-1 sm:flex-none rounded-lg bg-[var(--color-surface-secondary)] px-1.5 py-1">
              {roleToggleSlot}
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
