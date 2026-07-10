# 시간별/일자별 보기 모드 토글 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `SchedulePage`의 월간/주간 탭 옆에 "⏳ 시간별 / 📅 일자별" 표시 모드 토글을 추가해, 시간축 표 대신 날짜별로 압축된 배정 목록을 볼 수 있게 한다.

**Architecture:** 기존 `ScheduleGrid`/`WeekGrid`(시간별)는 손대지 않고, 같은 데이터를 날짜 단위로 요약해서 보여주는 신규 컴포넌트 `MonthScheduleByDay`/`WeekScheduleByDay`를 추가한다. `ScheduleHeader`에 표시 모드 토글 UI를 추가하고, `SchedulePage`가 로컬 state(`displayMode`)로 두 렌더링 경로 중 하나를 선택한다. 상태는 세션 메모리에만 존재하며 `SharePage`/`EmbedPage`에는 적용하지 않는다.

**Tech Stack:** React + TypeScript, Vitest + @testing-library/react, Tailwind CSS.

**참고 스펙:** `docs/superpowers/specs/2026-07-10-schedule-display-mode-toggle-design.md`

---

### Task 1: 날짜별 배정 목록 유틸 (`getDayAssignmentEntries`)

**Files:**
- Create: `src/utils/dayAssignments.ts`
- Test: `src/utils/dayAssignments.test.ts`

- [ ] **Step 1: Write the failing test**

`src/utils/dayAssignments.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { getDayAssignmentEntries } from './dayAssignments'
import type { Assignment, ScheduleRule, SlotSetting, DateOverride } from '../types'

const baseAssignment = (over: Partial<Assignment>): Assignment => ({
  id: over.id ?? 'a1',
  tenant_id: 'T',
  year: 2026,
  month: 7,
  day: 10,
  time_slot: '09-11',
  member_name: '김간호',
  note: null,
  member_type: 'member',
  time_sub: null,
  color: null,
  user_id: null,
  role_id: null,
  customer_name: null,
  customer_phone: null,
  is_locked: false,
  account_deleted: false,
  created_at: '',
  ...over,
})

const openRules: ScheduleRule[] = ['09-11', '11-13', '13-15'].map(slot => ({
  id: `r-${slot}`, tenant_id: 'T', day_of_week: 5, time_slot: slot, is_open: true,
}))

describe('getDayAssignmentEntries', () => {
  it('sorts entries by start hour ascending across slots', () => {
    const assignments = [
      baseAssignment({ id: 'a-13', time_slot: '13-15', member_name: '13시담당' }),
      baseAssignment({ id: 'a-09', time_slot: '09-11', member_name: '9시담당' }),
    ]
    const entries = getDayAssignmentEntries(
      10, 2026, 7, ['09-11', '11-13', '13-15'], openRules, [], [], assignments
    )
    expect(entries.map(e => e.assignment.member_name)).toEqual(['9시담당', '13시담당'])
  })

  it('skips closed/holiday/breaktime slots', () => {
    const rulesWithClosedSlot: ScheduleRule[] = [
      { id: 'r1', tenant_id: 'T', day_of_week: 5, time_slot: '09-11', is_open: true },
      { id: 'r2', tenant_id: 'T', day_of_week: 5, time_slot: '11-13', is_open: false },
    ]
    const assignments = [baseAssignment({ id: 'a-11', time_slot: '11-13' })]
    const entries = getDayAssignmentEntries(
      10, 2026, 7, ['09-11', '11-13'], rulesWithClosedSlot, [], [], assignments
    )
    expect(entries).toEqual([])
  })

  it('excludes admin_note assignments', () => {
    const assignments = [baseAssignment({ id: 'note1', member_type: 'admin_note', note: '공지' })]
    const entries = getDayAssignmentEntries(
      10, 2026, 7, ['09-11'], openRules, [], [], assignments
    )
    expect(entries).toEqual([])
  })

  it('applies displayAssignmentFilter when provided', () => {
    const assignments = [
      baseAssignment({ id: 'a1', member_name: '표시됨' }),
      baseAssignment({ id: 'a2', member_name: '숨김', user_id: 'hidden-user' }),
    ]
    const entries = getDayAssignmentEntries(
      10, 2026, 7, ['09-11'], openRules, [], [], assignments,
      a => a.user_id !== 'hidden-user'
    )
    expect(entries.map(e => e.assignment.member_name)).toEqual(['표시됨'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd C:/claudePrj/dtschedule && npm test -- --run src/utils/dayAssignments.test.ts`
Expected: FAIL — `Cannot find module './dayAssignments'` (파일이 아직 없음)

- [ ] **Step 3: Write minimal implementation**

`src/utils/dayAssignments.ts`:
```ts
import type { Assignment, ScheduleRule, SlotSetting, DateOverride, TimeSlot } from '../types'
import { getCellState } from './cellState'

export interface DayAssignmentEntry {
  timeSlot: TimeSlot
  startHour: number
  assignment: Assignment
}

export function getDayAssignmentEntries(
  day: number,
  year: number,
  month: number,
  timeSlots: TimeSlot[],
  scheduleRules: ScheduleRule[],
  slotSettings: SlotSetting[],
  dateOverrides: DateOverride[],
  assignments: Assignment[],
  displayAssignmentFilter?: (a: Assignment) => boolean
): DayAssignmentEntry[] {
  const entries: DayAssignmentEntry[] = []

  for (const timeSlot of timeSlots) {
    const cellState = getCellState(day, timeSlot, year, month, scheduleRules, slotSettings, dateOverrides, assignments)
    if (cellState.isClosed) continue

    const startHour = Number(timeSlot.split('-')[0])
    for (const assignment of cellState.assignments) {
      if (assignment.member_type === 'admin_note') continue
      if (displayAssignmentFilter && !displayAssignmentFilter(assignment)) continue
      entries.push({ timeSlot, startHour, assignment })
    }
  }

  return entries.sort((a, b) => a.startHour - b.startHour)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd C:/claudePrj/dtschedule && npm test -- --run src/utils/dayAssignments.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/utils/dayAssignments.ts src/utils/dayAssignments.test.ts
git commit -m "feat: 날짜별 배정 목록 조회 유틸(getDayAssignmentEntries) 추가"
```

---

### Task 2: 월간 일자별 뷰 (`MonthScheduleByDay`)

**Files:**
- Modify: `src/components/schedule/ScheduleGrid.tsx` (`getCalendarWeeks` export)
- Create: `src/components/schedule/MonthScheduleByDay.tsx`
- Test: `src/components/schedule/MonthScheduleByDay.test.tsx`

- [ ] **Step 1: `getCalendarWeeks`를 export로 변경**

`src/components/schedule/ScheduleGrid.tsx`의 41번째 줄:
```ts
function getCalendarWeeks(year: number, month: number): (number | null)[][] {
```
를 다음으로 교체:
```ts
export function getCalendarWeeks(year: number, month: number): (number | null)[][] {
```

- [ ] **Step 2: 기존 테스트가 여전히 통과하는지 확인**

Run: `cd C:/claudePrj/dtschedule && npm test -- --run src/components/schedule/ScheduleGrid.test.tsx`
Expected: PASS (기존 동작 변경 없음, export 키워드만 추가)

- [ ] **Step 3: Write the failing test**

`src/components/schedule/MonthScheduleByDay.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MonthScheduleByDay } from './MonthScheduleByDay'
import type { Assignment, ScheduleRule } from '../../types'

const openRules: ScheduleRule[] = [0, 1, 2, 3, 4, 5, 6].flatMap(dow =>
  ['09-11', '11-13'].map(slot => ({ id: `r-${dow}-${slot}`, tenant_id: 'T', day_of_week: dow, time_slot: slot, is_open: true }))
)

const assignment = (over: Partial<Assignment>): Assignment => ({
  id: over.id ?? 'a1', tenant_id: 'T', year: 2026, month: 7, day: 10,
  time_slot: '09-11', member_name: '김간호', note: null, member_type: 'member',
  time_sub: null, color: null, user_id: null, role_id: null,
  customer_name: null, customer_phone: null, is_locked: false,
  account_deleted: false, created_at: '', ...over,
})

const baseProps = {
  year: 2026, month: 7,
  timeSlots: ['09-11', '11-13'],
  slotSettings: [],
  scheduleRules: openRules,
  dateOverrides: [],
  onCellClick: vi.fn(),
}

describe('MonthScheduleByDay', () => {
  it('renders day-of-week headers', () => {
    render(<MonthScheduleByDay {...baseProps} assignments={[]} />)
    expect(screen.getByText('월')).toBeInTheDocument()
    expect(screen.getByText('일')).toBeInTheDocument()
  })

  it('shows "-" placeholder for a day with no assignments', () => {
    render(<MonthScheduleByDay {...baseProps} assignments={[]} />)
    expect(screen.getAllByText('-').length).toBeGreaterThan(0)
  })

  it('renders an entry and calls onCellClick with the correct target when clicked', () => {
    const onCellClick = vi.fn()
    render(<MonthScheduleByDay {...baseProps} assignments={[assignment({ id: 'a1', day: 10, time_slot: '09-11' })]} onCellClick={onCellClick} />)
    fireEvent.click(screen.getByText(/김간호/))
    expect(onCellClick).toHaveBeenCalledWith({ year: 2026, month: 7, day: 10, timeSlot: '09-11', memberType: 'member', roleId: null })
  })

  it('caps visible entries and expands on "+N건 더" click', () => {
    const assignments = ['a1', 'a2', 'a3', 'a4'].map((id, i) =>
      assignment({ id, day: 10, time_slot: i % 2 === 0 ? '09-11' : '11-13', member_name: `팀원${i}` })
    )
    render(<MonthScheduleByDay {...baseProps} assignments={assignments} />)
    expect(screen.queryByText('팀원3')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('+1건 더'))
    expect(screen.getByText(/팀원3/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd C:/claudePrj/dtschedule && npm test -- --run src/components/schedule/MonthScheduleByDay.test.tsx`
Expected: FAIL — `Cannot find module './MonthScheduleByDay'`

- [ ] **Step 5: Write minimal implementation**

`src/components/schedule/MonthScheduleByDay.tsx`:
```tsx
import { useState } from 'react'
import { getCalendarWeeks } from './ScheduleGrid'
import { getKoreanHolidayName } from '../../utils/koreanHolidays'
import { getDayAssignmentEntries } from '../../utils/dayAssignments'
import { rangeSlotLabel } from '../../utils/timeSlots'
import { LockIcon } from '../icons/LockIcons'
import type { Assignment, SlotSetting, ScheduleRule, DateOverride, TimeSlot, ModalTarget, TenantRole } from '../../types'

const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0]
const DOW_LABELS = ['월', '화', '수', '목', '금', '토', '일']
const MAX_VISIBLE = 3
const EMPTY_SET: Set<string> = new Set()

interface Props {
  year: number
  month: number
  timeSlots: TimeSlot[]
  assignments: Assignment[]
  slotSettings: SlotSetting[]
  scheduleRules: ScheduleRule[]
  dateOverrides: DateOverride[]
  splitRoles?: TenantRole[]
  isSplitMode?: boolean
  hiddenRoleIds?: Set<string>
  displayAssignmentFilter?: (a: Assignment) => boolean
  withdrawnUserIds?: Set<string>
  onCellClick: (target: ModalTarget) => void
}

export function MonthScheduleByDay({
  year, month, timeSlots, assignments, slotSettings, scheduleRules, dateOverrides,
  splitRoles = [], isSplitMode = false, hiddenRoleIds = EMPTY_SET,
  displayAssignmentFilter, withdrawnUserIds, onCellClick,
}: Props) {
  const weeks = getCalendarWeeks(year, month)
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set())

  function roleName(roleId: string | null): string | null {
    if (!isSplitMode || !roleId) return null
    return splitRoles.find(r => r.id === roleId)?.name ?? null
  }

  function toggleExpanded(day: number) {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  return (
    <div className="sm:overflow-x-auto">
      <table className="border-collapse text-sm w-full table-fixed">
        <thead>
          <tr>
            {DOW_ORDER.map((dow, i) => (
              <th
                key={dow}
                className={`border border-[var(--color-border-table)] px-2 py-1 text-xs font-semibold text-center
                  ${dow === 0 ? 'text-red-500 bg-red-50/70 dark:bg-red-950/40'
                    : dow === 6 ? 'text-blue-500 bg-blue-50/70 dark:bg-blue-950/40'
                    : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'}`}
              >
                {DOW_LABELS[i]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIdx) => (
            <tr key={weekIdx}>
              {week.map((day, dowIdx) => {
                const dow = DOW_ORDER[dowIdx]
                if (!day) {
                  return (
                    <td key={dowIdx} className="border border-[var(--color-border-table)] bg-[var(--color-surface-secondary)] align-top" style={{ height: '5rem' }} />
                  )
                }
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const holidayName = getKoreanHolidayName(dateStr)
                const allEntries = getDayAssignmentEntries(day, year, month, timeSlots, scheduleRules, slotSettings, dateOverrides, assignments, displayAssignmentFilter)
                const entries = isSplitMode
                  ? allEntries.filter(e => !e.assignment.role_id || !hiddenRoleIds.has(e.assignment.role_id))
                  : allEntries
                const isExpanded = expandedDays.has(day)
                const visibleEntries = isExpanded ? entries : entries.slice(0, MAX_VISIBLE)
                const hiddenCount = entries.length - visibleEntries.length

                return (
                  <td
                    key={dowIdx}
                    className={`border border-[var(--color-border-table)] align-top px-1 py-1
                      ${holidayName || dow === 0 ? 'bg-red-50/50 dark:bg-red-950/30' : dow === 6 ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''}`}
                    style={{ height: '5rem' }}
                  >
                    <div className={`text-xs font-bold mb-0.5 ${holidayName || dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-[var(--color-text-secondary)]'}`}>
                      {day}
                      {holidayName && <span className="block text-[9px] font-medium truncate">{holidayName}</span>}
                    </div>
                    {entries.length === 0 ? (
                      <div className="text-[10px] text-[var(--color-text-muted)]">-</div>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        {visibleEntries.map(({ timeSlot, assignment }) => {
                          const isWithdrawn = !!(assignment.user_id && withdrawnUserIds?.has(assignment.user_id)) || assignment.account_deleted
                          const rname = roleName(assignment.role_id)
                          return (
                            <button
                              key={assignment.id}
                              onClick={() => onCellClick({ year, month, day, timeSlot, memberType: assignment.member_type, roleId: assignment.role_id })}
                              className="text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate bg-[var(--tint-brand)] text-[var(--tint-brand-ink)] hover:brightness-95"
                              title={rangeSlotLabel(timeSlot)}
                            >
                              <span className="font-mono-num">{timeSlot.split('-')[0]}시</span>{' '}
                              {rname && <span className="opacity-70">[{rname}]</span>}{' '}
                              <span className={isWithdrawn ? 'line-through opacity-70' : ''}>{assignment.member_name}</span>
                              {assignment.is_locked && <LockIcon size={8} className="inline-block ml-0.5" />}
                            </button>
                          )
                        })}
                        {hiddenCount > 0 && (
                          <button onClick={() => toggleExpanded(day)} className="text-[10px] text-[var(--color-brand-primary)] font-medium text-left px-1">
                            +{hiddenCount}건 더
                          </button>
                        )}
                        {isExpanded && entries.length > MAX_VISIBLE && (
                          <button onClick={() => toggleExpanded(day)} className="text-[10px] text-[var(--color-text-muted)] text-left px-1">
                            접기
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd C:/claudePrj/dtschedule && npm test -- --run src/components/schedule/MonthScheduleByDay.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 7: Commit**

```bash
git add src/components/schedule/ScheduleGrid.tsx src/components/schedule/MonthScheduleByDay.tsx src/components/schedule/MonthScheduleByDay.test.tsx
git commit -m "feat: 월간 일자별 요약 뷰(MonthScheduleByDay) 추가"
```

---

### Task 3: 주간 일자별 뷰 (`WeekScheduleByDay`)

**Files:**
- Create: `src/components/schedule/WeekScheduleByDay.tsx`
- Test: `src/components/schedule/WeekScheduleByDay.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/components/schedule/WeekScheduleByDay.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WeekScheduleByDay } from './WeekScheduleByDay'
import type { Assignment, ScheduleRule } from '../../types'

const weekDays = Array.from({ length: 7 }, (_, i) => new Date(2026, 6, 6 + i)) // 2026-07-06 (월) ~ 07-12 (일)

const openRules: ScheduleRule[] = [0, 1, 2, 3, 4, 5, 6].flatMap(dow =>
  ['09-11', '11-13'].map(slot => ({ id: `r-${dow}-${slot}`, tenant_id: 'T', day_of_week: dow, time_slot: slot, is_open: true }))
)

const assignment = (over: Partial<Assignment>): Assignment => ({
  id: over.id ?? 'a1', tenant_id: 'T', year: 2026, month: 7, day: 6,
  time_slot: '09-11', member_name: '김간호', note: null, member_type: 'member',
  time_sub: null, color: null, user_id: null, role_id: null,
  customer_name: null, customer_phone: null, is_locked: false,
  account_deleted: false, created_at: '', ...over,
})

const baseProps = {
  weekDays,
  timeSlots: ['09-11', '11-13'],
  slotSettings: [],
  scheduleRules: openRules,
  dateOverrides: [],
  onCellClick: vi.fn(),
}

describe('WeekScheduleByDay', () => {
  it('renders one header per weekday', () => {
    render(<WeekScheduleByDay {...baseProps} assignments={[]} />)
    expect(screen.getByText(/6일/)).toBeInTheDocument()
    expect(screen.getByText(/12일/)).toBeInTheDocument()
  })

  it('renders an entry and calls onCellClick with the correct target when clicked', () => {
    const onCellClick = vi.fn()
    render(<WeekScheduleByDay {...baseProps} assignments={[assignment({ id: 'a1', day: 6, time_slot: '09-11' })]} onCellClick={onCellClick} />)
    fireEvent.click(screen.getByText(/김간호/))
    expect(onCellClick).toHaveBeenCalledWith({ year: 2026, month: 7, day: 6, timeSlot: '09-11', memberType: 'member', roleId: null })
  })

  it('shows "-" placeholder for a day with no assignments', () => {
    render(<WeekScheduleByDay {...baseProps} assignments={[]} />)
    expect(screen.getAllByText('-').length).toBe(7)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd C:/claudePrj/dtschedule && npm test -- --run src/components/schedule/WeekScheduleByDay.test.tsx`
Expected: FAIL — `Cannot find module './WeekScheduleByDay'`

- [ ] **Step 3: Write minimal implementation**

`src/components/schedule/WeekScheduleByDay.tsx`:
```tsx
import { useState, useRef, useEffect } from 'react'
import { getKoreanHolidayName } from '../../utils/koreanHolidays'
import { getDayAssignmentEntries } from '../../utils/dayAssignments'
import { rangeSlotLabel } from '../../utils/timeSlots'
import { LockIcon } from '../icons/LockIcons'
import type { Assignment, SlotSetting, ScheduleRule, DateOverride, TimeSlot, ModalTarget, TenantRole } from '../../types'

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']
const MAX_VISIBLE = 4
const EMPTY_SET: Set<string> = new Set()

interface Props {
  weekDays: Date[]
  timeSlots: TimeSlot[]
  assignments: Assignment[]
  slotSettings: SlotSetting[]
  scheduleRules: ScheduleRule[]
  dateOverrides: DateOverride[]
  splitRoles?: TenantRole[]
  isSplitMode?: boolean
  hiddenRoleIds?: Set<string>
  displayAssignmentFilter?: (a: Assignment) => boolean
  withdrawnUserIds?: Set<string>
  onCellClick: (target: ModalTarget) => void
}

export function WeekScheduleByDay({
  weekDays, timeSlots, assignments, slotSettings, scheduleRules, dateOverrides,
  splitRoles = [], isSplitMode = false, hiddenRoleIds = EMPTY_SET,
  displayAssignmentFilter, withdrawnUserIds, onCellClick,
}: Props) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const today = new Date()
  const todayColRef = useRef<HTMLTableCellElement>(null)

  useEffect(() => {
    todayColRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'nearest', inline: 'center' })
  }, [weekDays])

  function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  }

  function roleName(roleId: string | null): string | null {
    if (!isSplitMode || !roleId) return null
    return splitRoles.find(r => r.id === roleId)?.name ?? null
  }

  function toggleExpanded(key: string) {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-sm w-full table-fixed" style={{ minWidth: 640 }}>
        <thead>
          <tr>
            {weekDays.map((date, i) => {
              const dow = date.getDay()
              const holidayName = getKoreanHolidayName(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`)
              return (
                <th
                  key={i}
                  className={`border border-[var(--color-border-table)] px-2 py-1 text-xs font-semibold text-center
                    ${holidayName || dow === 0 ? 'text-red-500 bg-red-50/70 dark:bg-red-950/40'
                      : dow === 6 ? 'text-blue-500 bg-blue-50/70 dark:bg-blue-950/40'
                      : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'}`}
                >
                  {date.getDate()}일 ({DAY_LABELS[i]})
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          <tr>
            {weekDays.map((date, i) => {
              const isToday = isSameDay(date, today)
              const dow = date.getDay()
              const year = date.getFullYear()
              const month = date.getMonth() + 1
              const day = date.getDate()
              const key = `${year}-${month}-${day}`
              const allEntries = getDayAssignmentEntries(day, year, month, timeSlots, scheduleRules, slotSettings, dateOverrides, assignments, displayAssignmentFilter)
              const entries = isSplitMode
                ? allEntries.filter(e => !e.assignment.role_id || !hiddenRoleIds.has(e.assignment.role_id))
                : allEntries
              const isExpanded = expandedDays.has(key)
              const visibleEntries = isExpanded ? entries : entries.slice(0, MAX_VISIBLE)
              const hiddenCount = entries.length - visibleEntries.length

              return (
                <td
                  key={i}
                  ref={isToday ? todayColRef : undefined}
                  className={`border border-[var(--color-border-table)] align-top px-1 py-1
                    ${dow === 0 ? 'bg-red-50/50 dark:bg-red-950/30' : dow === 6 ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''}
                    ${isToday ? 'ring-2 ring-inset ring-[var(--color-brand-primary)]' : ''}`}
                  style={{ height: '12rem' }}
                >
                  {entries.length === 0 ? (
                    <div className="text-[10px] text-[var(--color-text-muted)]">-</div>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {visibleEntries.map(({ timeSlot, assignment }) => {
                        const isWithdrawn = !!(assignment.user_id && withdrawnUserIds?.has(assignment.user_id)) || assignment.account_deleted
                        const rname = roleName(assignment.role_id)
                        return (
                          <button
                            key={assignment.id}
                            onClick={() => onCellClick({ year, month, day, timeSlot, memberType: assignment.member_type, roleId: assignment.role_id })}
                            className="text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate bg-[var(--tint-brand)] text-[var(--tint-brand-ink)] hover:brightness-95"
                            title={rangeSlotLabel(timeSlot)}
                          >
                            <span className="font-mono-num">{timeSlot.split('-')[0]}시</span>{' '}
                            {rname && <span className="opacity-70">[{rname}]</span>}{' '}
                            <span className={isWithdrawn ? 'line-through opacity-70' : ''}>{assignment.member_name}</span>
                            {assignment.is_locked && <LockIcon size={8} className="inline-block ml-0.5" />}
                          </button>
                        )
                      })}
                      {hiddenCount > 0 && (
                        <button onClick={() => toggleExpanded(key)} className="text-[10px] text-[var(--color-brand-primary)] font-medium text-left px-1">
                          +{hiddenCount}건 더
                        </button>
                      )}
                      {isExpanded && entries.length > MAX_VISIBLE && (
                        <button onClick={() => toggleExpanded(key)} className="text-[10px] text-[var(--color-text-muted)] text-left px-1">
                          접기
                        </button>
                      )}
                    </div>
                  )}
                </td>
              )
            })}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd C:/claudePrj/dtschedule && npm test -- --run src/components/schedule/WeekScheduleByDay.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/schedule/WeekScheduleByDay.tsx src/components/schedule/WeekScheduleByDay.test.tsx
git commit -m "feat: 주간 일자별 요약 뷰(WeekScheduleByDay) 추가"
```

---

### Task 4: `ScheduleHeader`에 표시 모드 토글 추가

**Files:**
- Modify: `src/components/schedule/ScheduleHeader.tsx`
- Test: `src/components/schedule/ScheduleHeader.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/components/schedule/ScheduleHeader.test.tsx`에 다음 테스트를 추가 (기존 3개 테스트는 그대로 둠):
```tsx
describe('ScheduleHeader display mode toggle', () => {
  it('does not render the toggle when onDisplayModeChange is not provided', () => {
    render(<ScheduleHeader year={2026} month={4} onPrev={vi.fn()} onNext={vi.fn()} />)
    expect(screen.queryByText('일자별')).not.toBeInTheDocument()
  })

  it('renders the toggle for month view when onDisplayModeChange is provided', () => {
    render(<ScheduleHeader year={2026} month={4} viewType="month" onPrev={vi.fn()} onNext={vi.fn()} displayMode="time" onDisplayModeChange={vi.fn()} />)
    expect(screen.getByText(/일자별/)).toBeInTheDocument()
    expect(screen.getByText(/시간별/)).toBeInTheDocument()
  })

  it('hides the toggle on day view even when onDisplayModeChange is provided', () => {
    render(<ScheduleHeader year={2026} month={4} day={1} viewType="day" onPrev={vi.fn()} onNext={vi.fn()} displayMode="time" onDisplayModeChange={vi.fn()} />)
    expect(screen.queryByText(/일자별/)).not.toBeInTheDocument()
  })

  it('calls onDisplayModeChange with "day" when the 일자별 button is clicked', () => {
    const onDisplayModeChange = vi.fn()
    render(<ScheduleHeader year={2026} month={4} viewType="month" onPrev={vi.fn()} onNext={vi.fn()} displayMode="time" onDisplayModeChange={onDisplayModeChange} />)
    fireEvent.click(screen.getByText(/일자별/))
    expect(onDisplayModeChange).toHaveBeenCalledWith('day')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd C:/claudePrj/dtschedule && npm test -- --run src/components/schedule/ScheduleHeader.test.tsx`
Expected: FAIL — "Unable to find an element with the text: /일자별/" (토글이 아직 없음)

- [ ] **Step 3: Write minimal implementation**

`src/components/schedule/ScheduleHeader.tsx`의 Props 인터페이스(8~22번째 줄)에 두 필드 추가:
```ts
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
  displayMode?: 'time' | 'day'
  onDisplayModeChange?: (v: 'time' | 'day') => void
}
```

함수 시그니처(36번째 줄)를 교체:
```ts
export function ScheduleHeader({ year, month, title, openCount, onPrev, onNext, viewType = 'month', onViewTypeChange, day, weekDays, onDateSelect, hideViewSwitcher, roleToggleSlot, displayMode = 'time', onDisplayModeChange }: Props) {
```

우측 영역(135~156번째 줄)의 `{roleToggleSlot}` 바로 다음에 토글 블록 추가:
```tsx
        {/* Right: role toggle + view switcher */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {roleToggleSlot}
          {onDisplayModeChange && viewType !== 'day' && (
            <div className="flex items-center rounded-xl border border-[var(--color-border)] overflow-hidden">
              <button
                onClick={() => onDisplayModeChange('time')}
                className={`px-2.5 h-9 text-xs font-medium transition-colors border-r border-[var(--color-border)] ${
                  displayMode === 'time'
                    ? 'bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)]'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                ⏳ 시간별
              </button>
              <button
                onClick={() => onDisplayModeChange('day')}
                className={`px-2.5 h-9 text-xs font-medium transition-colors ${
                  displayMode === 'day'
                    ? 'bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)]'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                📅 일자별
              </button>
            </div>
          )}
          {/* View type switcher */}
          {onViewTypeChange && !hideViewSwitcher && (
```
(이후 기존 뷰 스위처 블록·닫는 태그는 그대로 유지)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd C:/claudePrj/dtschedule && npm test -- --run src/components/schedule/ScheduleHeader.test.tsx`
Expected: PASS (7 tests — 기존 3개 + 신규 4개)

- [ ] **Step 5: Commit**

```bash
git add src/components/schedule/ScheduleHeader.tsx src/components/schedule/ScheduleHeader.test.tsx
git commit -m "feat: ScheduleHeader에 시간별/일자별 표시 모드 토글 추가"
```

---

### Task 5: `SchedulePage` 배선 (state + 조건부 렌더링)

**Files:**
- Modify: `src/pages/SchedulePage.tsx`

- [ ] **Step 1: import 추가**

`src/pages/SchedulePage.tsx` 15~16번째 줄 근처에 추가:
```ts
import { ScheduleGrid } from '../components/schedule/ScheduleGrid'
import { WeekGrid } from '../components/schedule/WeekGrid'
import { MonthScheduleByDay } from '../components/schedule/MonthScheduleByDay'
import { WeekScheduleByDay } from '../components/schedule/WeekScheduleByDay'
```

- [ ] **Step 2: state 추가**

64번째 줄 `const [viewType, setViewType] = useState<ViewType>('month')` 바로 다음 줄에 추가:
```ts
const [displayMode, setDisplayMode] = useState<'time' | 'day'>('time')
```

- [ ] **Step 3: `ScheduleHeader`에 prop 전달**

798~838번째 줄의 `<ScheduleHeader ... />` 호출에 두 prop 추가 (엑셀 모드 중에는 `onDisplayModeChange`를 넘기지 않아 토글을 숨김):
```tsx
            <ScheduleHeader
              year={year} month={month} day={day}
              title={tenant?.settings?.title || tenant?.name}
              viewType={viewType}
              onViewTypeChange={handleViewTypeChange}
              hideViewSwitcher={isPrivileged}
              displayMode={displayMode}
              onDisplayModeChange={excelMode ? undefined : setDisplayMode}
              roleToggleSlot={isSplitMode && splitRoles.length > 1 && viewType !== 'day' ? (
```
(`roleToggleSlot` 이하 기존 내용은 그대로 유지)

- [ ] **Step 4: 월간/주간 렌더링 분기**

864~921번째 줄의 기존 블록을 다음으로 교체 (`ScheduleGrid`/`WeekGrid`에 전달하는 prop 목록은 기존과 완전히 동일하게 유지):
```tsx
            ) : viewType === 'month' ? (
              displayMode === 'day' ? (
                <MonthScheduleByDay
                  year={year} month={month}
                  timeSlots={timeSlots}
                  assignments={assignments} slotSettings={slotSettings}
                  scheduleRules={scheduleRules} dateOverrides={dateOverrides}
                  splitRoles={splitRoles}
                  isSplitMode={isSplitMode}
                  hiddenRoleIds={hiddenRoleIds}
                  displayAssignmentFilter={displayAssignmentFilter}
                  withdrawnUserIds={withdrawnUserIds}
                  onCellClick={handleCellClick}
                />
              ) : (
                <ScheduleGrid
                  year={year} month={month}
                  timeSlots={timeSlots}
                  assignments={assignments} slotSettings={slotSettings}
                  scheduleRules={scheduleRules} dateOverrides={dateOverrides}
                  highlightName={highlightName || null}
                  profile={profile}
                  tenantRole={tenantRole}
                  memberRoleId={memberRoleId}
                  teamLeaderUserIds={teamLeaderUserIds}
                  splitRoles={splitRoles}
                  indicatorBarRoles={indicatorBarRoles}
                  isSplitMode={isSplitMode}
                  hiddenRoleIds={hiddenRoleIds}
                  slotLabels={slotLabels}
                  canAdd={canAdd}
                  onCellClick={handleCellClick}
                  onHolidayCellClick={profile && isPrivileged
                    ? (d, startHour, endHour) => setHolidayTarget({ day: d, startHour, endHour })
                    : undefined}
                  displayAssignmentFilter={displayAssignmentFilter}
                  withdrawnUserIds={withdrawnUserIds}
                  highlightedSlots={highlightedSlots}
                  selectionRange={selRange}
                  copyRange={cpRange}
                />
              )
            ) : viewType === 'week' ? (
              displayMode === 'day' ? (
                <WeekScheduleByDay
                  weekDays={weekDays}
                  timeSlots={timeSlots}
                  assignments={assignments} slotSettings={slotSettings}
                  scheduleRules={scheduleRules} dateOverrides={weekDateOverrides}
                  splitRoles={splitRoles}
                  isSplitMode={isSplitMode}
                  hiddenRoleIds={hiddenRoleIds}
                  displayAssignmentFilter={displayAssignmentFilter}
                  withdrawnUserIds={withdrawnUserIds}
                  onCellClick={handleCellClick}
                />
              ) : (
                <WeekGrid
                  weekDays={weekDays}
                  timeSlots={timeSlots}
                  assignments={assignments} slotSettings={slotSettings}
                  scheduleRules={scheduleRules} dateOverrides={weekDateOverrides}
                  highlightName={highlightName || null}
                  profile={profile}
                  splitRoles={splitRoles}
                  indicatorBarRoles={indicatorBarRoles}
                  isSplitMode={isSplitMode}
                  hiddenRoleIds={hiddenRoleIds}
                  slotLabels={slotLabels}
                  selectedDay={new Date(year, month - 1, day)}
                  memberRoleId={memberRoleId}
                  tenantRole={tenantRole}
                  teamLeaderUserIds={teamLeaderUserIds}
                  isPrivileged={isPrivileged}
                  onDateHeaderClick={d => {
                    setYear(d.getFullYear())
                    setMonth(d.getMonth() + 1)
                    setDay(d.getDate())
                  }}
                  canAdd={canAdd}
                  onCellClick={handleCellClick}
                  displayAssignmentFilter={displayAssignmentFilter}
                  withdrawnUserIds={withdrawnUserIds}
                  highlightedSlots={highlightedSlots}
                  selectionRange={selRange}
                  copyRange={cpRange}
                />
              )
            ) : (
```
(그 다음 `<DayView ... />` 블록은 변경하지 않음)

- [ ] **Step 5: 타입 체크**

Run: `cd C:/claudePrj/dtschedule && npx tsc -b`
Expected: 에러 없이 종료 (0 output)

- [ ] **Step 6: 전체 테스트 스위트 실행**

Run: `cd C:/claudePrj/dtschedule && npm test -- --run`
Expected: 모든 테스트 PASS (기존 테스트 회귀 없음 + 신규 테스트 포함)

- [ ] **Step 7: Commit**

```bash
git add src/pages/SchedulePage.tsx
git commit -m "feat: SchedulePage에 시간별/일자별 표시 모드 배선"
```

---

### Task 6: 수동 검증 + 문서 갱신

**Files:**
- Modify: `README.md`
- Create: `docs/checklist_2026-07-10.md`

- [ ] **Step 1: 개발 서버로 수동 확인**

Run: `cd C:/claudePrj/dtschedule && npm run dev` (백그라운드 실행)

브라우저에서 다음을 확인한다:
- 월간 탭에서 "📅 일자별" 클릭 → 날짜별 요약 목록으로 전환되는지
- 요약 목록에서 배정 항목 클릭 → 기존 SlotEditModal이 정상적으로 뜨는지
- 배정이 4건 이상인 날짜에서 "+N건 더" → "접기" 토글이 잘 동작하는지
- 주간 탭에서도 동일하게 동작하는지, 오늘 날짜 컬럼이 강조되는지
- 일간 탭에서는 토글 자체가 보이지 않는지
- 엑셀 모드를 켜면 토글이 사라지는지, 엑셀 모드를 끄면 다시 나타나는지
- 새로고침하면 "시간별"로 초기화되는지 (세션 메모리 확인)

확인 후 개발 서버 종료.

- [ ] **Step 2: README.md 갱신**

`README.md`의 `✨ 핵심 기능` 섹션에 다음 항목 추가 (정확한 위치는 기존 목록 형식에 맞춰 삽입):
```md
- **시간별/일자별 보기 모드**: 월간·주간 뷰에서 시간축 표 대신 날짜별 배정 요약 목록으로 전환해서 볼 수 있는 토글 제공
```

- [ ] **Step 3: 점검 체크리스트 작성**

`docs/CHANGE_TEST_CHECKLIST_TEMPLATE.md`를 참고해 `docs/checklist_2026-07-10.md`를 작성한다. 월간/주간 뷰 각각에 대해 아래 항목을 포함한다:
- [ ] 월간 뷰 — 일자별 전환 시 날짜별 요약이 올바르게 표시되는가
- [ ] 월간 뷰 — 배정 항목 클릭 시 기존 수정 모달이 정상 동작하는가
- [ ] 주간 뷰 — 일자별 전환 시 날짜별 요약이 올바르게 표시되는가
- [ ] 주간 뷰 — 오늘 날짜 컬럼 강조 및 자동 스크롤이 유지되는가
- [ ] 일간 뷰 — 토글이 노출되지 않는가
- [ ] 엑셀 모드 on/off에 따라 토글이 숨겨지고 다시 나타나는가
- [ ] 역할 분리(split) 모드 조직에서 역할명이 항목 앞에 표시되는가
- [ ] SharePage/EmbedPage에는 토글이 노출되지 않는가 (영향 없음 확인)

- [ ] **Step 4: Commit**

```bash
git add README.md docs/checklist_2026-07-10.md
git commit -m "docs: 시간별/일자별 보기 모드 README 및 점검 체크리스트 추가"
```
