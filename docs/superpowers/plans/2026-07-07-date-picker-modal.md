# 날짜 선택 모달(스크롤 휠 피커) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 스케줄 화면(월/주/일 뷰)의 타이틀을 클릭하면 연/월(/일)을 스크롤 휠 방식으로 골라 바로 그 날짜로 이동하는 모달을 추가한다.

**Architecture:** `SchedulePage`가 `year`/`month`/`day` state를 관리하고 모든 뷰가 이 값에서 파생되므로, 새 `DatePickerModal` 컴포넌트는 선택된 연/월(/일)만 부모에 돌려주면 된다. 스크롤 위치 계산과 일수 계산은 `src/lib/datePicker.ts`의 순수 함수로 분리해 유닛 테스트하고, DOM 스크롤 인터랙션은 `ScheduleHeader.tsx`에 내장된 `DatePickerModal`이 담당한다.

**Tech Stack:** React 19 + TypeScript + Tailwind, Vitest + Testing Library.

**참고(프로젝트 규칙):** 아래 각 태스크의 "Commit" 스텝은 문서화 목적으로 남겨두되, **사용자가 명시적으로 커밋을 요청하기 전까지는 실제로 `git commit`을 실행하지 않는다.** (이 프로젝트의 확립된 규칙)

---

### Task 1: 날짜 피커 순수 함수 (`src/lib/datePicker.ts`)

**Files:**
- Create: `src/lib/datePicker.ts`
- Test: `src/lib/datePicker.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/datePicker.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { yearRange, daysInMonth, nearestIndex } from './datePicker'

describe('yearRange', () => {
  it('returns center-span..center+span inclusive, ascending', () => {
    expect(yearRange(2026, 2)).toEqual([2024, 2025, 2026, 2027, 2028])
  })
})

describe('daysInMonth', () => {
  it('returns 31 for January', () => {
    expect(daysInMonth(2026, 1)).toBe(31)
  })
  it('returns 28 for February in a non-leap year', () => {
    expect(daysInMonth(2026, 2)).toBe(28)
  })
  it('returns 29 for February in a leap year', () => {
    expect(daysInMonth(2024, 2)).toBe(29)
  })
  it('returns 30 for April', () => {
    expect(daysInMonth(2026, 4)).toBe(30)
  })
})

describe('nearestIndex', () => {
  it('rounds scrollTop/itemHeight to nearest integer index', () => {
    expect(nearestIndex(0, 40)).toBe(0)
    expect(nearestIndex(19, 40)).toBe(0)
    expect(nearestIndex(20, 40)).toBe(1)
    expect(nearestIndex(38, 40)).toBe(1)
    expect(nearestIndex(80, 40)).toBe(2)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/lib/datePicker.test.ts`
Expected: FAIL — `Cannot find module './datePicker'`

- [ ] **Step 3: 최소 구현 작성**

`src/lib/datePicker.ts`:
```ts
export function yearRange(center: number, span = 50): number[] {
  const years: number[] = []
  for (let y = center - span; y <= center + span; y++) years.push(y)
  return years
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function nearestIndex(scrollTop: number, itemHeight: number): number {
  return Math.round(scrollTop / itemHeight)
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/lib/datePicker.test.ts`
Expected: PASS (3 test files pass: yearRange, daysInMonth x4, nearestIndex)

- [ ] **Step 5: Commit** (사용자 요청 전까지 실행하지 않음)

```bash
git add src/lib/datePicker.ts src/lib/datePicker.test.ts
git commit -m "feat: 날짜 피커용 연도/일수/스크롤 인덱스 순수 함수 추가"
```

---

### Task 2: `DatePickerModal` 컴포넌트

**Files:**
- Create: `src/components/schedule/DatePickerModal.tsx`
- Test: `src/components/schedule/DatePickerModal.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/schedule/DatePickerModal.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DatePickerModal } from './DatePickerModal'

describe('DatePickerModal', () => {
  it('calls onConfirm with the initial year/month when mode is "month"', () => {
    const onConfirm = vi.fn()
    render(<DatePickerModal year={2026} month={7} mode="month" onConfirm={onConfirm} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(onConfirm).toHaveBeenCalledWith(2026, 7)
  })

  it('calls onConfirm with year/month/day when mode is "full"', () => {
    const onConfirm = vi.fn()
    render(<DatePickerModal year={2026} month={7} day={15} mode="full" onConfirm={onConfirm} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(onConfirm).toHaveBeenCalledWith(2026, 7, 15)
  })

  it('calls onClose without calling onConfirm when cancel is clicked', () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    render(<DatePickerModal year={2026} month={7} mode="month" onConfirm={onConfirm} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not render a day column when mode is "month"', () => {
    render(<DatePickerModal year={2026} month={7} mode="month" onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.queryByLabelText('일')).not.toBeInTheDocument()
  })

  it('renders a day column when mode is "full"', () => {
    render(<DatePickerModal year={2026} month={7} day={15} mode="full" onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByLabelText('일')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/components/schedule/DatePickerModal.test.tsx`
Expected: FAIL — `Cannot find module './DatePickerModal'`

- [ ] **Step 3: 구현 작성**

`src/components/schedule/DatePickerModal.tsx`:
```tsx
import { useEffect, useMemo, useRef, useState } from 'react'
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

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const idx = values.indexOf(selected)
    if (idx < 0) return
    el.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'auto' })
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

  function step(delta: number) {
    ref.current?.scrollBy({ top: delta * ITEM_HEIGHT, behavior: 'smooth' })
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
              className={`flex items-center justify-center text-sm font-semibold [scroll-snap-align:center] select-none ${
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

  return (
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
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/components/schedule/DatePickerModal.test.tsx`
Expected: PASS (5 tests)

- [ ] **Step 5: 타입체크**

Run: `npx tsc -b`
Expected: 출력 없음(에러 없음)

- [ ] **Step 6: Commit** (사용자 요청 전까지 실행하지 않음)

```bash
git add src/components/schedule/DatePickerModal.tsx src/components/schedule/DatePickerModal.test.tsx
git commit -m "feat: 스크롤 휠 방식 날짜 선택 모달 추가"
```

---

### Task 3: `ScheduleHeader`에 타이틀 클릭 → 모달 연결

**Files:**
- Modify: `src/components/schedule/ScheduleHeader.tsx`

- [ ] **Step 1: `onDateSelect` prop 추가 및 import**

`src/components/schedule/ScheduleHeader.tsx` 상단 import에 추가:
```ts
import { useState } from 'react'
import { DatePickerModal } from './DatePickerModal'
```

`Props` 인터페이스에 추가:
```ts
  onDateSelect?: (year: number, month: number, day?: number) => void
```

함수 시그니처에 `onDateSelect`를 구조분해로 추가:
```ts
export function ScheduleHeader({ year, month, title, openCount, onPrev, onNext, viewType = 'month', onViewTypeChange, day, weekDays, onDateSelect }: Props) {
```

함수 본문 최상단(`const { t } = useTranslation(...)` 아래)에 모달 오픈 상태 추가:
```ts
  const [showDatePicker, setShowDatePicker] = useState(false)
```

- [ ] **Step 2: 클릭 가능한 타이틀 텍스트로 교체**

월 뷰의 타이틀 `<span>`을:
```tsx
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)] px-0.5">
              {month}월
            </span>
```
다음으로 교체:
```tsx
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
```

주간 뷰의 타이틀 `<span>`(`{weekRangeLabel(weekDays)}`)도 동일한 패턴으로 교체:
```tsx
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
```

일간 뷰의 타이틀 `<span>`(`{month}월 {day}일`)도 동일한 패턴으로 교체:
```tsx
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
```

- [ ] **Step 3: 모달 렌더링 추가**

`return (...)` 최상위 `<div className="flex items-end justify-between ...">` 를 감싸는 `<>...</>` 프래그먼트로 바꾸고, 그 다음에 모달을 조건부 렌더링한다. 파일 마지막 부분을 다음과 같이 수정:

```tsx
  return (
    <>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        {/* ... 기존 내용 그대로 ... */}
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
```

- [ ] **Step 4: 타입체크 및 기존 테스트 확인**

Run: `npx tsc -b`
Expected: 출력 없음(에러 없음)

Run: `npx vitest run src/components/schedule/ScheduleHeader.test.tsx`
Expected: `onDateSelect`를 넘기지 않으므로 타이틀은 그대로 `<span>`으로 렌더링되어 기존 3개 테스트 결과가 이전과 동일하게 유지됨(기존에 실패하던 2건은 이번 작업과 무관한 i18n 키 누락 문제로 그대로 실패, 새로운 회귀 없음을 확인)

- [ ] **Step 5: Commit** (사용자 요청 전까지 실행하지 않음)

```bash
git add src/components/schedule/ScheduleHeader.tsx
git commit -m "feat: 스케줄 헤더 타이틀 클릭 시 날짜 선택 모달 열기"
```

---

### Task 4: `SchedulePage`에서 `onDateSelect` 연결

**Files:**
- Modify: `src/pages/SchedulePage.tsx`

- [ ] **Step 1: `ScheduleHeader` 호출부에 `onDateSelect` 전달**

`src/pages/SchedulePage.tsx`의 `<ScheduleHeader ... />` 호출부(`onNext={...}}` 다음 줄)에 추가:

```tsx
              onDateSelect={(y, m, d) => {
                setYear(y)
                setMonth(m)
                if (d !== undefined) setDay(d)
              }}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc -b`
Expected: 출력 없음(에러 없음)

- [ ] **Step 3: Commit** (사용자 요청 전까지 실행하지 않음)

```bash
git add src/pages/SchedulePage.tsx
git commit -m "feat: 스케줄 페이지에 날짜 선택 모달 연결"
```

---

### Task 5: 브라우저 수동 검증

**Files:** 없음 (검증만 수행)

- [ ] **Step 1: 개발 서버 확인**

`npm run dev`가 이미 백그라운드에서 실행 중이면 재사용, 아니면 실행. `http://localhost:5173`에서 스케줄 화면 접속.

- [ ] **Step 2: 월 뷰 확인**

"7월" 텍스트 클릭 → 모달이 뜨고 연/월 두 컬럼만 보이는지 확인. 연도 컬럼에서 위로 스크롤(마우스 휠을 위로 굴리기) → 중앙 값이 다음 연도(더 큰 값)로 바뀌는지 확인. "확인" 클릭 → 헤더가 선택한 연/월로 바뀌는지 확인. 다시 열어 "취소" 클릭 → 아무 변화 없는지 확인.

- [ ] **Step 3: 주간 뷰 확인**

뷰 전환에서 "주" 선택 → 날짜 범위 텍스트 클릭 → 연/월/일 세 컬럼이 보이는지 확인. 일 컬럼에서 월을 2월로 스크롤했을 때 일 목록이 28일(또는 윤년 29일)까지만 나오는지, 기존에 31일을 고르고 있었다면 자동으로 28/29일로 보정되는지 확인. "확인" → 해당 날짜가 포함된 주로 이동하는지 확인.

- [ ] **Step 4: 일간 뷰 확인**

"일" 선택 → "7월 7일" 텍스트 클릭 → 연/월/일 선택 후 확인 → 정확히 그 날짜의 일간 뷰로 이동하는지, 요일 표시도 올바른지 확인.

- [ ] **Step 5: 모바일 폭에서 확인**

브라우저 개발자 도구로 모바일 폭(375px 등)으로 줄여 모달이 화면 안에 잘 들어오는지, ▲▼ 버튼과 스크롤 컬럼이 터치로도 잘 동작하는지 확인.

---

## Self-Review 결과 (계획 작성자 자체 점검)

- **spec 커버리지**: 컴포넌트/props 설계(Task 3,4) · 피커 UI/인터랙션(Task 2) · 예외처리(일수 클램프, Task 2 Step3) · 테스트 계획(Task 1,2,5) 모두 태스크로 매핑됨. 누락 없음.
- **placeholder 스캔**: "TBD"/"이후 구현" 등 표현 없음. 모든 코드 블록은 실제 실행 가능한 전체 코드.
- **타입 일관성**: `onConfirm: (year, month, day?) => void` 시그니처가 `DatePickerModal` 정의(Task 2)와 `ScheduleHeader`의 호출(Task 3), `SchedulePage`의 핸들러(Task 4)에서 동일하게 사용됨. `onDateSelect` prop 이름도 세 파일에서 일관됨.
