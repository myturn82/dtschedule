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

// 목록은 내림차순(큰 값이 위)으로 렌더링한다: scrollTop이 줄어드는 방향(=화면상 위로 스크롤)이
// 더 위에 있는 항목, 즉 더 큰(다음) 값을 중앙으로 가져오게 하기 위함.
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

export function DatePickerModal({ year, month, day, mode, onConfirm, onClose }: Props) {
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
  const maxDay = daysInMonth(pickedYear, pickedMonth)
  const days = useMemo(() => Array.from({ length: maxDay }, (_, i) => maxDay - i), [maxDay])

  function handleConfirm() {
    if (mode === 'month') onConfirm(pickedYear, pickedMonth)
    else onConfirm(pickedYear, pickedMonth, pickedDay)
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-lg w-full max-w-xs p-5"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">날짜 이동</h2>
        <div className="flex items-start justify-center gap-2">
          <PickerColumn values={years} selected={pickedYear} onSelect={setPickedYear} suffix="년" ariaLabel="연도" />
          <PickerColumn values={months} selected={pickedMonth} onSelect={setPickedMonth} suffix="월" ariaLabel="월" />
          {mode === 'full' && (
            <PickerColumn values={days} selected={pickedDay} onSelect={setPickedDay} suffix="일" ariaLabel="일" />
          )}
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
            onClick={handleConfirm}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] hover:bg-[var(--color-brand-primary-hover)] transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
