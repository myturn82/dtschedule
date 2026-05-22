# 자동배정 기능 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 어드민이 현재 뷰(월/주/일) 기준으로 빈 스케줄 슬롯을 회원들에게 공평하게 자동 배정하고, 미리보기에서 개별 취소 후 저장하는 기능 추가

**Architecture:** 순수 계산 함수(`autoAssign.ts`) → 미리보기 모달(`AutoAssignPreviewModal.tsx`) → SchedulePage 버튼/저장. Split 모드는 역할별, 비 Split 모드는 volunteer_type별로 라운드로빈 배정.

**Tech Stack:** React, TypeScript, Supabase, Tailwind CSS

---

## File Map

| 파일 | 작업 |
|------|------|
| `src/utils/autoAssign.ts` | 새로 생성 — 배정 계산 순수 함수 |
| `src/components/modals/AutoAssignPreviewModal.tsx` | 새로 생성 — 미리보기 모달 |
| `src/pages/SchedulePage.tsx` | 수정 — 버튼 + 상태 + 모달 연결 |

---

## Task 1: autoAssign 유틸리티 함수

**Files:**
- Create: `src/utils/autoAssign.ts`

- [ ] **Step 1: `src/utils/autoAssign.ts` 파일 생성**

```typescript
import { getCellState } from './cellState'
import type { Assignment, SlotSetting, ScheduleRule, DateOverride, TenantRole, VolunteerType } from '../types'
import type { ProfileWithRole } from '../hooks/useProfiles'

export interface ProposedAssignment {
  id: string
  year: number
  month: number
  day: number
  timeSlot: string
  volunteerType: VolunteerType
  roleId: string | null
  userId: string
  userName: string
  roleName: string
  dayLabel: string
}

interface AutoAssignParams {
  days: Date[]
  timeSlots: string[]
  assignments: Assignment[]
  slotSettings: SlotSetting[]
  scheduleRules: ScheduleRule[]
  dateOverrides: DateOverride[]
  profiles: ProfileWithRole[]
  splitRoles: TenantRole[]
  indicatorBarRoles: TenantRole[]
  isSplitMode: boolean
}

function formatDayLabel(date: Date): string {
  const dow = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
  return `${date.getMonth() + 1}월 ${date.getDate()}일(${dow})`
}

function roundRobin(
  members: ProfileWithRole[],
  emptySlots: { year: number; month: number; day: number; slot: string }[],
  existingAssignments: Assignment[],
  matchFn: (a: Assignment, userId: string) => boolean,
  volunteerType: VolunteerType,
  roleId: string | null,
  roleName: string,
): ProposedAssignment[] {
  if (!members.length || !emptySlots.length) return []

  const countMap = new Map<string, number>()
  members.forEach(m => countMap.set(m.id, 0))
  existingAssignments.forEach(a => {
    if (matchFn(a, a.user_id) && countMap.has(a.user_id)) {
      countMap.set(a.user_id, (countMap.get(a.user_id) ?? 0) + 1)
    }
  })

  const sorted = [...members].sort((a, b) =>
    (countMap.get(a.id) ?? 0) - (countMap.get(b.id) ?? 0)
  )

  return emptySlots.map((s, i) => ({
    id: `${s.year}-${s.month}-${s.day}-${s.slot}-${roleId ?? volunteerType}-${i}`,
    year: s.year,
    month: s.month,
    day: s.day,
    timeSlot: s.slot,
    volunteerType,
    roleId,
    userId: sorted[i % sorted.length].id,
    userName: sorted[i % sorted.length].name,
    roleName,
    dayLabel: formatDayLabel(new Date(s.year, s.month - 1, s.day)),
  }))
}

function getEmptySlots(
  days: Date[],
  timeSlots: string[],
  assignments: Assignment[],
  scheduleRules: ScheduleRule[],
  slotSettings: SlotSetting[],
  dateOverrides: DateOverride[],
  isSlotTaken: (year: number, month: number, day: number, slot: string) => boolean,
): { year: number; month: number; day: number; slot: string }[] {
  const result: { year: number; month: number; day: number; slot: string }[] = []
  for (const date of days) {
    const y = date.getFullYear()
    const m = date.getMonth() + 1
    const d = date.getDate()
    for (const slot of timeSlots) {
      const cs = getCellState(d, slot, y, m, scheduleRules, slotSettings, dateOverrides, assignments)
      if (cs.isClosed || cs.isHoliday || cs.isBreaktime) continue
      if (!isSlotTaken(y, m, d, slot)) {
        result.push({ year: y, month: m, day: d, slot })
      }
    }
  }
  return result
}

export function computeAutoAssignments(params: AutoAssignParams): ProposedAssignment[] {
  const {
    days, timeSlots, assignments, slotSettings, scheduleRules, dateOverrides,
    profiles, splitRoles, indicatorBarRoles, isSplitMode,
  } = params

  const proposals: ProposedAssignment[] = []

  if (isSplitMode) {
    const assignableRoles = [...splitRoles, ...indicatorBarRoles]
    for (const role of assignableRoles) {
      const members = profiles.filter(p => p.tenantRoleId === role.id)
      if (!members.length) continue

      const emptySlots = getEmptySlots(
        days, timeSlots, assignments, scheduleRules, slotSettings, dateOverrides,
        (y, m, d, slot) => assignments.some(a =>
          a.year === y && a.month === m && a.day === d &&
          a.time_slot === slot && a.role_id === role.id
        )
      )

      proposals.push(...roundRobin(
        members, emptySlots, assignments,
        (a) => a.role_id === role.id,
        'volunteer',
        role.id,
        role.name,
      ))
    }
  } else {
    const groups = [
      {
        members: profiles.filter(p => p.role !== '50plus'),
        volunteerType: 'volunteer' as VolunteerType,
        roleName: '자원봉사자',
      },
      {
        members: profiles.filter(p => p.role === '50plus'),
        volunteerType: '50plus' as VolunteerType,
        roleName: '50플러스',
      },
    ]

    for (const { members, volunteerType, roleName } of groups) {
      if (!members.length) continue
      const vt = volunteerType

      const emptySlots = getEmptySlots(
        days, timeSlots, assignments, scheduleRules, slotSettings, dateOverrides,
        (y, m, d, slot) => assignments.some(a =>
          a.year === y && a.month === m && a.day === d &&
          a.time_slot === slot &&
          (a.volunteer_type ?? 'volunteer') === vt &&
          !a.role_id
        )
      )

      proposals.push(...roundRobin(
        members, emptySlots, assignments,
        (a) => (a.volunteer_type ?? 'volunteer') === vt,
        vt,
        null,
        roleName,
      ))
    }
  }

  return proposals.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    if (a.month !== b.month) return a.month - b.month
    if (a.day !== b.day) return a.day - b.day
    return a.timeSlot.localeCompare(b.timeSlot)
  })
}
```

- [ ] **Step 2: 빌드 에러 없는지 확인**

```bash
npx tsc --noEmit
```

Expected: 0 errors (또는 기존 에러만 존재)

---

## Task 2: AutoAssignPreviewModal 컴포넌트

**Files:**
- Create: `src/components/modals/AutoAssignPreviewModal.tsx`

- [ ] **Step 1: `AutoAssignPreviewModal.tsx` 생성**

```tsx
import { useState } from 'react'
import type { ProposedAssignment } from '../../utils/autoAssign'

interface Props {
  proposals: ProposedAssignment[]
  onConfirm: (selected: ProposedAssignment[]) => Promise<void>
  onClose: () => void
}

export function AutoAssignPreviewModal({ proposals, onConfirm, onClose }: Props) {
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const selected = proposals.filter(p => !excluded.has(p.id))

  function toggle(id: string) {
    setExcluded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (excluded.size === proposals.length) {
      setExcluded(new Set())
    } else {
      setExcluded(new Set(proposals.map(p => p.id)))
    }
  }

  async function handleConfirm() {
    if (!selected.length) return
    setLoading(true)
    await onConfirm(selected)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-[var(--shadow-lg)] w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[var(--color-border)]">
          <div>
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">자동배정 미리보기</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              총 <span className="font-semibold text-[var(--color-brand-primary)]">{selected.length}</span>건 배정 예정
              {excluded.size > 0 && <span className="ml-1 text-[var(--color-text-muted)]">({excluded.size}건 제외)</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] transition-all duration-200 text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Table */}
        {proposals.length === 0 ? (
          <div className="flex items-center justify-center flex-1 py-12">
            <p className="text-sm text-[var(--color-text-muted)]">배정할 빈 슬롯이 없습니다</p>
          </div>
        ) : (
          <div className="overflow-auto flex-1">
            <table className="w-full text-xs border-collapse">
              <thead className="sticky top-0 bg-[var(--color-surface-secondary)]">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-[var(--color-text-muted)] w-8">
                    <input
                      type="checkbox"
                      checked={excluded.size === 0}
                      onChange={toggleAll}
                      className="rounded accent-[var(--color-brand-primary)]"
                    />
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-[var(--color-text-muted)]">날짜</th>
                  <th className="px-3 py-2 text-left font-semibold text-[var(--color-text-muted)]">시간대</th>
                  <th className="px-3 py-2 text-left font-semibold text-[var(--color-text-muted)]">역할</th>
                  <th className="px-3 py-2 text-left font-semibold text-[var(--color-text-muted)]">배정 회원</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map(p => {
                  const isExcluded = excluded.has(p.id)
                  return (
                    <tr
                      key={p.id}
                      onClick={() => toggle(p.id)}
                      className={`border-t border-[var(--color-border-table)] cursor-pointer transition-colors duration-100
                        ${isExcluded ? 'opacity-40 bg-[var(--color-surface-secondary)]' : 'hover:bg-[var(--color-surface-hover)]'}`}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={!isExcluded}
                          onChange={() => toggle(p.id)}
                          onClick={e => e.stopPropagation()}
                          className="rounded accent-[var(--color-brand-primary)]"
                        />
                      </td>
                      <td className="px-3 py-2 text-[var(--color-text-secondary)] whitespace-nowrap">{p.dayLabel}</td>
                      <td className="px-3 py-2 text-[var(--color-text-secondary)] font-mono whitespace-nowrap">{p.timeSlot}</td>
                      <td className="px-3 py-2 text-[var(--color-text-muted)]">{p.roleName}</td>
                      <td className="px-3 py-2 font-semibold text-[var(--color-text-primary)]">{p.userName}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--color-border)] flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={loading || selected.length === 0}
            className="flex-1 bg-[var(--color-brand-primary)] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[var(--color-brand-primary-hover)] disabled:opacity-50 transition-all duration-200 shadow-[0_2px_8px_rgba(37,99,235,0.25)]"
          >
            {loading ? '저장 중...' : `${selected.length}건 저장`}
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] rounded-xl py-2.5 text-sm font-medium hover:bg-[var(--color-surface-hover)] transition-all duration-200"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 빌드 에러 없는지 확인**

```bash
npx tsc --noEmit
```

---

## Task 3: SchedulePage 연결

**Files:**
- Modify: `src/pages/SchedulePage.tsx`

- [ ] **Step 1: import 추가**

`SchedulePage.tsx` 상단 import에 추가:

```tsx
import { computeAutoAssignments } from '../utils/autoAssign'
import type { ProposedAssignment } from '../utils/autoAssign'
import { AutoAssignPreviewModal } from '../components/modals/AutoAssignPreviewModal'
```

- [ ] **Step 2: 상태 추가**

기존 `const [showClearConfirm, setShowClearConfirm] = useState(false)` 아래에 추가:

```tsx
const [autoProposals, setAutoProposals] = useState<ProposedAssignment[] | null>(null)
```

- [ ] **Step 3: handleAutoAssign 함수 추가**

`weekDays` 선언 바로 아래에 추가:

```tsx
function getTargetDays(): Date[] {
  if (viewType === 'month') {
    const count = new Date(year, month, 0).getDate()
    return Array.from({ length: count }, (_, i) => new Date(year, month - 1, i + 1))
  }
  if (viewType === 'week') return weekDays
  return [new Date(year, month - 1, day)]
}

function handleAutoAssign() {
  if (tenantMode !== '회원선택') return
  const targetDays = getTargetDays()
  const proposals = computeAutoAssignments({
    days: targetDays,
    timeSlots,
    assignments,
    slotSettings,
    scheduleRules,
    dateOverrides,
    profiles,
    splitRoles,
    indicatorBarRoles,
    isSplitMode,
  })
  if (!proposals.length) {
    alert('배정할 빈 슬롯이 없거나 배정 가능한 회원이 없습니다.')
    return
  }
  setAutoProposals(proposals)
}
```

- [ ] **Step 4: "자동배정" 버튼 추가**

기존 "초기화" 버튼 바로 앞에 추가:

```tsx
{isPrivileged && tenantMode === '회원선택' && (
  <button
    onClick={handleAutoAssign}
    className="px-3 py-1.5 text-xs font-medium rounded-xl border border-blue-200 dark:border-blue-800/40 text-blue-500 dark:text-blue-400 bg-[var(--color-surface-secondary)] hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
  >
    자동배정
  </button>
)}
```

- [ ] **Step 5: AutoAssignPreviewModal 렌더링 추가**

`showClearConfirm` ConfirmDialog 바로 아래에 추가:

```tsx
{autoProposals !== null && (
  <AutoAssignPreviewModal
    proposals={autoProposals}
    onClose={() => setAutoProposals(null)}
    onConfirm={async (selected) => {
      const errors: string[] = []
      for (const p of selected) {
        const err = await addAssignment({
          tenant_id: tenant!.id,
          year: p.year,
          month: p.month,
          day: p.day,
          time_slot: p.timeSlot,
          volunteer_name: p.userName,
          volunteer_type: p.volunteerType,
          user_id: p.userId,
          role_id: p.roleId ?? null,
        })
        if (err) errors.push(err)
      }
      setAutoProposals(null)
      if (errors.length) {
        alert(`${selected.length - errors.length}건 저장 완료, ${errors.length}건 실패`)
      }
    }}
  />
)}
```

- [ ] **Step 6: 브라우저에서 검증**

1. 관리자로 로그인 → 툴바에 "자동배정" 버튼 확인
2. "자동배정" 클릭 → 미리보기 모달 오픈 확인
3. 일부 체크 해제 → 카운터 실시간 갱신 확인
4. "N건 저장" 클릭 → 스케줄 그리드에 배정 반영 확인
5. 비 어드민 로그인 → 버튼 미표시 확인
6. 직접입력 모드 테넌트 → 버튼 미표시 확인

- [ ] **Step 7: 빌드 에러 없는지 최종 확인**

```bash
npx tsc --noEmit
```
