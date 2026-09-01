import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { daysInMonth, nearestIndex, yearRange } from '../../lib/datePicker'

const ITEM_HEIGHT = 40
const VISIBLE_ITEMS = 5
const COLUMN_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS
const SPACER_HEIGHT = (COLUMN_HEIGHT - ITEM_HEIGHT) / 2

interface Props {
  year: number
  month: number
  day?: number
  mode: 'month' | 'full'
  isValidDate?: (year: number, month: number, day: number) => boolean
  onConfirm: (year: number, month: number, day?: number) => void
  onClose: () => void
}

interface ColumnProps {
  values: number[]
  selected: number
  onSelect: (value: number) => void
  suffix: string
  ariaLabel: string
}

function PickerColumn({ values, selected, onSelect, suffix, ariaLabel }: ColumnProps) {
  const ref = useRef<HTMLDivElement>(null)

  function scrollToValue(v: number, behavior: ScrollBehavior = 'smooth') {
    const el = ref.current
    if (!el) return
    const idx = values.indexOf(v)
    if (idx < 0) return
    const top = idx * ITEM_HEIGHT
    if (typeof el.scrollTo === 'function') el.scrollTo({ top, behavior })
    else el.scrollTop = top
  }

  useEffect(() => {
    scrollToValue(selected, 'auto')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.length])

  function handleScroll() {
    const el = ref.current
    if (!el) return
    const idx = nearestIndex(el.scrollTop, ITEM_HEIGHT)
    const clamped = Math.min(Math.max(idx, 0), values.length - 1)
    const value = values[clamped]
    if (value !== undefined && value !== selected) onSelect(value)
  }

  function handleItemClick(v: number) {
    if (v !== selected) onSelect(v)
    scrollToValue(v)
  }

  function step(delta: number) {
    const el = ref.current
    if (!el) return
    if (typeof el.scrollBy === 'function') el.scrollBy({ top: delta * ITEM_HEIGHT, behavior: 'smooth' })
    else el.scrollTop += delta * ITEM_HEIGHT
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => step(-1)}
        aria-label={`${ariaLabel} 다음 값`}
        className="w-9 h-6 flex items-center justify-center rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <span className="text-[10px] leading-none">▲</span>
      </button>
      <div className="relative" style={{ height: COLUMN_HEIGHT, width: 72 }}>
        <div
          className="absolute inset-x-0 rounded-lg bg-[var(--color-surface-hover)] pointer-events-none"
          style={{ top: SPACER_HEIGHT, height: ITEM_HEIGHT }}
        />
        <div
          ref={ref}
          onScroll={handleScroll}
          aria-label={ariaLabel}
          className="relative h-full overflow-y-auto [scroll-snap-type:y_mandatory] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          <div style={{ height: SPACER_HEIGHT }} />
          {values.map(v => (
            <div
              key={v}
              role="button"
              tabIndex={0}
              onClick={() => handleItemClick(v)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleItemClick(v) } }}
              className={`flex items-center justify-center text-sm font-semibold [scroll-snap-align:center] select-none cursor-pointer hover:text-[var(--color-text-primary)] ${
                v === selected ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'
              }`}
              style={{ height: ITEM_HEIGHT }}
            >
              {v}{suffix}
            </div>
          ))}
          <div style={{ height: SPACER_HEIGHT }} />
        </div>
      </div>
      <button
        type="button"
        onClick={() => step(1)}
        aria-label={`${ariaLabel} 이전 값`}
        className="w-9 h-6 flex items-center justify-center rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <span className="text-[10px] leading-none">▼</span>
      </button>
    </div>
  )
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

interface CalendarPickerProps {
  initYear: number
  initMonth: number
  initDay: number
  isValidDate?: (year: number, month: number, day: number) => boolean
  onDayConfirm: (year: number, month: number, day: number) => void
}

function CalendarPicker({ initYear, initMonth, initDay, isValidDate, onDayConfirm }: CalendarPickerProps) {
  const [viewYear, setViewYear] = useState(initYear)
  const [viewMonth, setViewMonth] = useState(initMonth)
  const [selYear, setSelYear] = useState(initYear)
  const [selMonth, setSelMonth] = useState(initMonth)
  const [selDay, setSelDay] = useState(initDay)

  function prevMonth() {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1) }
    else setViewMonth(m => m + 1)
  }

  const cells = useMemo(() => {
    const firstDow = new Date(viewYear, viewMonth - 1, 1).getDay()
    const curDays = daysInMonth(viewYear, viewMonth)
    const prevDays = daysInMonth(viewYear, viewMonth === 1 ? 12 : viewMonth - 1)
    const result: { year: number; month: number; day: number; cur: boolean }[] = []

    for (let i = firstDow - 1; i >= 0; i--) {
      const m = viewMonth === 1 ? 12 : viewMonth - 1
      const y = viewMonth === 1 ? viewYear - 1 : viewYear
      result.push({ year: y, month: m, day: prevDays - i, cur: false })
    }
    for (let d = 1; d <= curDays; d++) {
      result.push({ year: viewYear, month: viewMonth, day: d, cur: true })
    }
    const remaining = 42 - result.length
    for (let d = 1; d <= remaining; d++) {
      const m = viewMonth === 12 ? 1 : viewMonth + 1
      const y = viewMonth === 12 ? viewYear + 1 : viewYear
      result.push({ year: y, month: m, day: d, cur: false })
    }
    return result
  }, [viewYear, viewMonth])

  function handleDayClick(year: number, month: number, day: number, cur: boolean) {
    if (!cur) return
    if (isValidDate && !isValidDate(year, month, day)) return
    setSelYear(year); setSelMonth(month); setSelDay(day)
    onDayConfirm(year, month, day)
  }

  const today = new Date()
  const todayY = today.getFullYear()
  const todayM = today.getMonth() + 1
  const todayD = today.getDate()

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m12 5-5 5 5 5"/></svg>
        </button>
        <span className="text-sm font-bold text-[var(--color-text-primary)]">{viewYear}년 {viewMonth}월</span>
        <button
          type="button"
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m8 5 5 5-5 5"/></svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`text-center text-[11px] font-bold py-1 ${
              i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-[var(--color-text-muted)]'
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const isSelected = cell.cur && cell.year === selYear && cell.month === selMonth && cell.day === selDay
          const isToday = cell.cur && cell.year === todayY && cell.month === todayM && cell.day === todayD
          const invalid = cell.cur && isValidDate && !isValidDate(cell.year, cell.month, cell.day)
          const isSunday = i % 7 === 0
          const isSaturday = i % 7 === 6

          return (
            <button
              key={i}
              type="button"
              disabled={!cell.cur || !!invalid}
              onClick={() => handleDayClick(cell.year, cell.month, cell.day, cell.cur)}
              title={invalid ? '운영일이 아닙니다' : undefined}
              className={`h-9 w-full flex items-center justify-center text-[13px] font-semibold rounded-full transition-all duration-150 ${
                isSelected
                  ? 'bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] shadow-[0_4px_10px_-6px_var(--color-brand-primary)]'
                  : invalid
                    ? 'text-[var(--color-text-muted)] opacity-30 cursor-not-allowed line-through'
                    : isToday
                      ? 'border border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] hover:bg-[var(--color-surface-hover)]'
                      : !cell.cur
                        ? 'text-[var(--color-text-muted)] opacity-25 cursor-default'
                        : isSunday
                          ? 'text-red-500 hover:bg-[var(--color-surface-hover)]'
                          : isSaturday
                            ? 'text-blue-500 hover:bg-[var(--color-surface-hover)]'
                            : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              {cell.day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function DatePickerModal({ year, month, day, mode, isValidDate, onConfirm, onClose }: Props) {
  const [pickedYear, setPickedYear] = useState(year)
  const [pickedMonth, setPickedMonth] = useState(month)
  const [pickedDay, setPickedDay] = useState(day ?? 1)

  useEffect(() => {
    const maxDay = daysInMonth(pickedYear, pickedMonth)
    if (pickedDay > maxDay) setPickedDay(maxDay)
  }, [pickedYear, pickedMonth, pickedDay])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const years = useMemo(() => [...yearRange(year)].reverse(), [year])
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => 12 - i), [])

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-lg w-full max-w-xs p-5"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">날짜 선택</h2>

        {mode === 'full' ? (
          <>
            <CalendarPicker
              initYear={pickedYear}
              initMonth={pickedMonth}
              initDay={pickedDay}
              isValidDate={isValidDate}
              onDayConfirm={(y, m, d) => onConfirm(y, m, d)}
            />
            <div className="mt-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 text-sm font-medium rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                취소
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-center gap-2">
              <PickerColumn values={years} selected={pickedYear} onSelect={setPickedYear} suffix="년" ariaLabel="연도" />
              <PickerColumn values={months} selected={pickedMonth} onSelect={setPickedMonth} suffix="월" ariaLabel="월" />
            </div>
            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => onConfirm(pickedYear, pickedMonth)}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] hover:bg-[var(--color-brand-primary-hover)] transition-colors"
              >
                확인
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
