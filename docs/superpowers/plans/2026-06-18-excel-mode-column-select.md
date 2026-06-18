# 엑셀모드 분리 셀 선택/복사·붙여넣기 + 모바일 지원 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 엑셀모드에서 역할 분리/회원·50+ 분리 모드의 개별 열(또는 열 범위)을 선택해 복사·붙여넣기 할 수 있게 하고, PC·모바일 공통의 탭 기반 선택 규칙 + 복사/붙여넣기 액션 바를 추가해 모바일에서도 엑셀모드가 동작하게 한다.

**Architecture:** 선택 좌표에 `colIdx`(열 인덱스)를 추가해 `day × slotIdx × colIdx` 3차원 박스로 확장한다. 순수 로직(셀 비교/범위 계산/선택 상태기계/열 인덱스 변환)은 `src/utils/excelSelection.ts`로 분리해 단위 테스트하고, Supabase 호출이 섞인 복사/붙여넣기 로직은 `SchedulePage.tsx`에 남겨 함수로 추출해 키보드(Ctrl+C/V)와 새 액션 바 버튼 양쪽에서 재사용한다. `ScheduleGrid.tsx`의 선택 오버레이는 `colIdx`까지 비교하도록 `inRange`를 확장한다.

**Tech Stack:** React 19 + TypeScript, Vitest + @testing-library/react, Tailwind v4

설계 문서: `docs/superpowers/specs/2026-06-18-excel-mode-column-select-design.md`

---

### Task 1: 순수 선택 로직 유틸 작성 (TDD)

**Files:**
- Test: `src/utils/excelSelection.test.ts`
- Create: `src/utils/excelSelection.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/utils/excelSelection.test.ts
import { describe, it, expect } from 'vitest'
import {
  isSameCell, rangeFromCells, nextCellSelection,
  colIdxForRole, colIdxForMemberType,
  type CellPos,
} from './excelSelection'

const c = (day: number, slotIdx: number, colIdx: number): CellPos => ({ day, slotIdx, colIdx })

describe('isSameCell', () => {
  it('returns true for identical cells', () => {
    expect(isSameCell(c(1, 0, 0), c(1, 0, 0))).toBe(true)
  })
  it('returns false when day differs', () => {
    expect(isSameCell(c(1, 0, 0), c(2, 0, 0))).toBe(false)
  })
  it('returns false when slotIdx differs', () => {
    expect(isSameCell(c(1, 0, 0), c(1, 1, 0))).toBe(false)
  })
  it('returns false when colIdx differs', () => {
    expect(isSameCell(c(1, 0, 0), c(1, 0, 1))).toBe(false)
  })
})

describe('rangeFromCells', () => {
  it('computes min/max regardless of anchor/cursor order', () => {
    const range = rangeFromCells(c(5, 2, 1), c(2, 0, 3))
    expect(range).toEqual({
      minDay: 2, maxDay: 5,
      minSlotIdx: 0, maxSlotIdx: 2,
      minColIdx: 1, maxColIdx: 3,
    })
  })
  it('handles anchor === cursor (single cell)', () => {
    const range = rangeFromCells(c(1, 0, 0), c(1, 0, 0))
    expect(range).toEqual({
      minDay: 1, maxDay: 1,
      minSlotIdx: 0, maxSlotIdx: 0,
      minColIdx: 0, maxColIdx: 0,
    })
  })
})

describe('nextCellSelection', () => {
  it('starts a fresh single-cell selection when there is no previous selection', () => {
    const next = nextCellSelection(null, c(3, 1, 0), false)
    expect(next).toEqual({ anchor: c(3, 1, 0), cursor: c(3, 1, 0) })
  })

  it('extends cursor when previous selection was a single cell', () => {
    const prev = { anchor: c(1, 0, 0), cursor: c(1, 0, 0) }
    const next = nextCellSelection(prev, c(3, 0, 0), false)
    expect(next).toEqual({ anchor: c(1, 0, 0), cursor: c(3, 0, 0) })
  })

  it('starts a new selection when previous selection was already a completed range', () => {
    const prev = { anchor: c(1, 0, 0), cursor: c(3, 0, 0) }
    const next = nextCellSelection(prev, c(5, 0, 0), false)
    expect(next).toEqual({ anchor: c(5, 0, 0), cursor: c(5, 0, 0) })
  })

  it('forceExtend always extends cursor even when previous selection was a completed range', () => {
    const prev = { anchor: c(1, 0, 0), cursor: c(3, 0, 0) }
    const next = nextCellSelection(prev, c(5, 0, 0), true)
    expect(next).toEqual({ anchor: c(1, 0, 0), cursor: c(5, 0, 0) })
  })
})

describe('colIdxForRole', () => {
  it('returns the index of the matching role id', () => {
    expect(colIdxForRole(['r1', 'r2', 'r3'], 'r2')).toBe(1)
  })
  it('returns -1 when role id is null', () => {
    expect(colIdxForRole(['r1', 'r2'], null)).toBe(-1)
  })
  it('returns -1 when role id is not found', () => {
    expect(colIdxForRole(['r1', 'r2'], 'nope')).toBe(-1)
  })
})

describe('colIdxForMemberType', () => {
  it('returns 1 for 50plus', () => {
    expect(colIdxForMemberType('50plus')).toBe(1)
  })
  it('returns 0 for member', () => {
    expect(colIdxForMemberType('member')).toBe(0)
  })
  it('returns 0 for undefined', () => {
    expect(colIdxForMemberType(undefined)).toBe(0)
  })
})
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npx vitest run src/utils/excelSelection.test.ts`
Expected: FAIL — `Cannot find module './excelSelection'` (파일이 아직 없음)

- [ ] **Step 3: 최소 구현 작성**

```ts
// src/utils/excelSelection.ts
export type CellPos = { day: number; slotIdx: number; colIdx: number }

export type SelRange = {
  minDay: number; maxDay: number
  minSlotIdx: number; maxSlotIdx: number
  minColIdx: number; maxColIdx: number
}

export function isSameCell(a: CellPos, b: CellPos): boolean {
  return a.day === b.day && a.slotIdx === b.slotIdx && a.colIdx === b.colIdx
}

export function rangeFromCells(anchor: CellPos, cursor: CellPos): SelRange {
  return {
    minDay: Math.min(anchor.day, cursor.day),
    maxDay: Math.max(anchor.day, cursor.day),
    minSlotIdx: Math.min(anchor.slotIdx, cursor.slotIdx),
    maxSlotIdx: Math.max(anchor.slotIdx, cursor.slotIdx),
    minColIdx: Math.min(anchor.colIdx, cursor.colIdx),
    maxColIdx: Math.max(anchor.colIdx, cursor.colIdx),
  }
}

// PC·모바일 공통 선택 상태기계:
// - 선택이 없거나 이미 범위(anchor !== cursor)일 때 새 클릭/탭 → 새 단일 셀 선택 시작
// - 단일 셀(anchor === cursor) 상태에서 새 클릭/탭 → cursor만 갱신해 범위 완성
// - forceExtend(PC Shift 키)면 항상 cursor만 갱신
export function nextCellSelection(
  prev: { anchor: CellPos; cursor: CellPos } | null,
  pos: CellPos,
  forceExtend: boolean
): { anchor: CellPos; cursor: CellPos } {
  if (forceExtend && prev) return { anchor: prev.anchor, cursor: pos }
  if (prev && !isSameCell(prev.anchor, prev.cursor)) return { anchor: pos, cursor: pos }
  if (prev) return { anchor: prev.anchor, cursor: pos }
  return { anchor: pos, cursor: pos }
}

export function colIdxForRole(splitRoleIds: string[], roleId: string | null | undefined): number {
  return splitRoleIds.indexOf(roleId ?? '')
}

export function colIdxForMemberType(memberType: string | null | undefined): number {
  return memberType === '50plus' ? 1 : 0
}
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `npx vitest run src/utils/excelSelection.test.ts`
Expected: PASS (16 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/utils/excelSelection.ts src/utils/excelSelection.test.ts
git commit -m "feat: 엑셀모드 셀 선택 상태기계/열 인덱스 변환 순수 유틸 추가"
```

---

### Task 2: `ScheduleGrid.tsx` — `inRange`에 colIdx 비교 추가 (TDD)

**Files:**
- Test: `src/components/schedule/ScheduleGrid.test.tsx`
- Modify: `src/components/schedule/ScheduleGrid.tsx:30-31` (Props 타입), `src/components/schedule/ScheduleGrid.tsx:180-182` (`inRange` 함수), `src/components/schedule/ScheduleGrid.tsx:415-420` (역할 분리 모드 오버레이), `src/components/schedule/ScheduleGrid.tsx:473-477,499-503` (회원/50+ 모드 오버레이)

- [ ] **Step 1: 실패하는 테스트 작성**

기존 `src/components/schedule/ScheduleGrid.test.tsx` 맨 아래(파일 끝 `})` 앞)에 아래 두 테스트를 추가한다. 2026년 4월 1일은 수요일이므로, 요일에 상관없이 안전하게 동작하도록 모든 요일(0~6)에 대해 `10-12` 슬롯을 open으로 설정하는 `openRules`를 사용한다.

```tsx
// src/components/schedule/ScheduleGrid.test.tsx 맨 아래에 추가
import type { ScheduleRule, TenantRole } from '../../types'

const openRules: ScheduleRule[] = [0, 1, 2, 3, 4, 5, 6].map(dow => ({
  id: `r-${dow}`, tenant_id: 'T', day_of_week: dow, time_slot: '10-12', is_open: true,
}))

describe('ScheduleGrid column-aware selection overlay', () => {
  it('highlights only the targeted role column in split mode', () => {
    const splitRoles: TenantRole[] = [
      { id: 'r1', tenant_id: 'T', name: '역할A', split_cell: true, indicator_bar: false, requires_customer_info: false, display_order: 0, created_at: '' },
      { id: 'r2', tenant_id: 'T', name: '역할B', split_cell: true, indicator_bar: false, requires_customer_info: false, display_order: 1, created_at: '' },
    ]
    const { container } = render(
      <ScheduleGrid
        {...mockProps}
        scheduleRules={openRules}
        isSplitMode
        splitRoles={splitRoles}
        selectionRange={{ minDay: 1, maxDay: 1, minSlotIdx: 0, maxSlotIdx: 0, minColIdx: 0, maxColIdx: 0 }}
      />
    )
    expect(container.querySelectorAll('.bg-blue-400\\/20').length).toBe(1)
  })

  it('highlights only the plus(50+) column in legacy vol/plus mode', () => {
    const indicatorBarRoles: TenantRole[] = [
      { id: 'lead1', tenant_id: 'T', name: '팀장', split_cell: false, indicator_bar: true, requires_customer_info: false, display_order: 0, created_at: '' },
    ]
    const { container } = render(
      <ScheduleGrid
        {...mockProps}
        scheduleRules={openRules}
        indicatorBarRoles={indicatorBarRoles}
        selectionRange={{ minDay: 1, maxDay: 1, minSlotIdx: 0, maxSlotIdx: 0, minColIdx: 1, maxColIdx: 1 }}
      />
    )
    expect(container.querySelectorAll('.bg-blue-400\\/20').length).toBe(1)
  })
})
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npx vitest run src/components/schedule/ScheduleGrid.test.tsx`
Expected: FAIL — `selectionRange`에 `minColIdx`/`maxColIdx`가 없다는 타입 에러, 또는 현재 `inRange`가 열을 구분하지 않아 분리 모드 테스트가 `2`를 반환해 `toBe(1)` 실패

- [ ] **Step 3: Props 타입과 `inRange` 수정**

`src/components/schedule/ScheduleGrid.tsx:30-31`을 다음으로 교체:

```ts
  selectionRange?: { minDay: number; maxDay: number; minSlotIdx: number; maxSlotIdx: number; minColIdx: number; maxColIdx: number } | null
  copyRange?: { minDay: number; maxDay: number; minSlotIdx: number; maxSlotIdx: number; minColIdx: number; maxColIdx: number } | null
```

`src/components/schedule/ScheduleGrid.tsx:180-182`의 `inRange` 함수를 다음으로 교체:

```ts
  function inRange(day: number, si: number, ci: number, r: { minDay: number; maxDay: number; minSlotIdx: number; maxSlotIdx: number; minColIdx: number; maxColIdx: number }) {
    return day >= r.minDay && day <= r.maxDay && si >= r.minSlotIdx && si <= r.maxSlotIdx && ci >= r.minColIdx && ci <= r.maxColIdx
  }
```

`src/components/schedule/ScheduleGrid.tsx:415-420`(역할 분리 모드, `splitRoles.map((role, roleIdx) => ...)` 내부)을 다음으로 교체:

```tsx
                                {selectionRange && day && inRange(day, slotIdx, roleIdx, selectionRange) && (
                                  <div className="absolute inset-0 bg-blue-400/20 pointer-events-none z-10" />
                                )}
                                {copyRange && day && inRange(day, slotIdx, roleIdx, copyRange) && (
                                  <div className="absolute inset-0 border-2 border-dashed border-blue-500 pointer-events-none z-10" />
                                )}
```

`src/components/schedule/ScheduleGrid.tsx:473-477`(vol 컬럼)을 다음으로 교체:

```tsx
                              {selectionRange && inRange(day, slotIdx, 0, selectionRange) && (
                                <div className="absolute inset-0 bg-blue-400/20 pointer-events-none z-10" />
                              )}
                              {copyRange && inRange(day, slotIdx, 0, copyRange) && (
                                <div className="absolute inset-0 border-2 border-dashed border-blue-500 pointer-events-none z-10" />
                              )}
```

`src/components/schedule/ScheduleGrid.tsx:499-503`(plus 컬럼)을 다음으로 교체:

```tsx
                              {selectionRange && inRange(day, slotIdx, 1, selectionRange) && (
                                <div className="absolute inset-0 bg-blue-400/20 pointer-events-none z-10" />
                              )}
                              {copyRange && inRange(day, slotIdx, 1, copyRange) && (
                                <div className="absolute inset-0 border-2 border-dashed border-blue-500 pointer-events-none z-10" />
                              )}
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `npx vitest run src/components/schedule/ScheduleGrid.test.tsx`
Expected: PASS (기존 3개 + 신규 2개 = 5 tests)

- [ ] **Step 5: 타입체크**

Run: `npx tsc -b`
Expected: 에러 없음 (출력 없음)

- [ ] **Step 6: 커밋**

```bash
git add src/components/schedule/ScheduleGrid.tsx src/components/schedule/ScheduleGrid.test.tsx
git commit -m "feat: ScheduleGrid 선택 오버레이가 열(colIdx)까지 구분하도록 확장"
```

---

### Task 3: `SchedulePage.tsx` — 선택 상태/타입을 새 유틸로 교체

**Files:**
- Modify: `src/pages/SchedulePage.tsx:51-60`, `src/pages/SchedulePage.tsx:113-133`

이 태스크는 순수 리팩터링(동작 변경 없음)이라 별도 신규 테스트는 추가하지 않고, 끝에서 `npx tsc -b`와 기존 테스트로 회귀를 확인한다.

- [ ] **Step 1: import 추가**

`src/pages/SchedulePage.tsx` 최상단 import 블록(`import { useState, useEffect, useMemo, useRef } from 'react'` 바로 아래)에 추가:

```ts
import { rangeFromCells, type CellPos } from '../utils/excelSelection'
```

- [ ] **Step 2: 로컬 타입/상태 교체**

`src/pages/SchedulePage.tsx:51-60`을 다음으로 교체 (기존 `type CellPos`는 제거하고 import한 것을 사용, `CopiedCell`에 `colOffset` 추가, `copyBuf.origin`은 `CellPos`라 자동으로 `colIdx`를 포함):

```ts
  // ── 셀 선택 / 복사 붙여넣기 ─────────────────────────────────────────────────
  const isShiftRef = useRef(false)
  type CopiedCell = {
    dayOffset: number; slotOffset: number; colOffset: number
    assignments: Array<{ member_name: string; note: string | null; member_type: string; role_id: string | null; user_id: string | null; time_sub: string | null; color: string | null }>
  }
  const [excelMode, setExcelMode] = useState(false)
  const [cellSel, setCellSel] = useState<{ anchor: CellPos; cursor: CellPos } | null>(null)
  const [copyBuf, setCopyBuf] = useState<{ origin: CellPos; cells: CopiedCell[] } | null>(null)
```

- [ ] **Step 3: `selRange`/`cpRange` memo 교체**

`src/pages/SchedulePage.tsx:113-133`을 다음으로 교체:

```ts
  const selRange = useMemo(() => {
    if (!cellSel) return null
    return rangeFromCells(cellSel.anchor, cellSel.cursor)
  }, [cellSel])

  const cpRange = useMemo(() => {
    if (!copyBuf || !copyBuf.cells.length) return null
    const maxDO = Math.max(...copyBuf.cells.map(c => c.dayOffset))
    const maxSO = Math.max(...copyBuf.cells.map(c => c.slotOffset))
    const maxCO = Math.max(...copyBuf.cells.map(c => c.colOffset))
    return {
      minDay: copyBuf.origin.day,
      maxDay: copyBuf.origin.day + maxDO,
      minSlotIdx: copyBuf.origin.slotIdx,
      maxSlotIdx: copyBuf.origin.slotIdx + maxSO,
      minColIdx: copyBuf.origin.colIdx,
      maxColIdx: copyBuf.origin.colIdx + maxCO,
    }
  }, [copyBuf])
```

- [ ] **Step 4: 타입체크 (아직 컴파일 안 됨 — 정상)**

Run: `npx tsc -b`
Expected: FAIL — `handleCellClick`에서 여전히 `{ day, slotIdx }`만 만들고 있어 `CellPos`(colIdx 필수)와 타입 불일치 에러. 이 에러는 Task 4에서 해결한다. (이 스텝은 "다음 태스크에서 고칠 에러가 정확히 예상한 곳에서 나는지" 확인하는 용도)

- [ ] **Step 5: 커밋하지 않음**

Task 4와 함께 컴파일이 통과한 뒤 한 번에 커밋한다 (중간 상태는 빌드가 깨져 있으므로 커밋하지 않음).

---

### Task 4: `SchedulePage.tsx` — 열 인덱스 계산 + 선택 상태기계 적용

**Files:**
- Modify: `src/pages/SchedulePage.tsx:440-456` (`handleCellClick`)

- [ ] **Step 1: import 추가**

Task 3에서 추가한 import 줄을 다음으로 교체 (같은 줄에 더 추가):

```ts
import { rangeFromCells, nextCellSelection, colIdxForRole, colIdxForMemberType, type CellPos } from '../utils/excelSelection'
```

- [ ] **Step 2: `colIdxOf` 헬퍼 + `handleCellClick` 엑셀모드 분기 교체**

`src/pages/SchedulePage.tsx:440-456`(현재 내용):

```ts
  async function handleCellClick(target: ModalTarget) {
    const slotIdx = timeSlots.indexOf(target.timeSlot)

    // 엑셀 모드: 선택만 하고 팝업 열지 않음
    if (excelMode) {
      if (isShiftRef.current) {
        setCellSel(prev => ({
          anchor: prev?.anchor ?? { day: target.day, slotIdx },
          cursor: { day: target.day, slotIdx },
        }))
      } else {
        setCellSel({ anchor: { day: target.day, slotIdx }, cursor: { day: target.day, slotIdx } })
      }
      return
    }
```

다음으로 교체:

```ts
  function colIdxOf(target: ModalTarget): number {
    if (isSplitMode) return colIdxForRole(splitRoles.map(r => r.id), target.roleId)
    return colIdxForMemberType(target.memberType)
  }

  async function handleCellClick(target: ModalTarget) {
    const slotIdx = timeSlots.indexOf(target.timeSlot)

    // 엑셀 모드: 선택만 하고 팝업 열지 않음
    if (excelMode) {
      const pos: CellPos = { day: target.day, slotIdx, colIdx: colIdxOf(target) }
      setCellSel(prev => nextCellSelection(prev, pos, isShiftRef.current))
      return
    }
```

- [ ] **Step 3: 타입체크**

Run: `npx tsc -b`
Expected: 에러 없음 (Task 3에서 예상했던 에러가 해소됨)

- [ ] **Step 4: 커밋**

```bash
git add src/pages/SchedulePage.tsx
git commit -m "feat: 엑셀모드 셀 선택에 열(colIdx) 차원 추가 + PC·모바일 통합 선택 규칙 적용"
```

---

### Task 5: `SchedulePage.tsx` — 복사/붙여넣기를 열 인지형으로 확장 + 함수 추출

**Files:**
- Modify: `src/pages/SchedulePage.tsx:226-286` (키보드 이펙트 → `runCopy`/`runPaste` 함수로 추출)

- [ ] **Step 1: 키보드 이펙트 블록 교체**

`src/pages/SchedulePage.tsx:226-286`(현재 `// ── 키보드: Shift 추적 + Ctrl+C/V/Escape ──` 주석부터 `}, [excelMode, ...])`까지)을 다음으로 교체:

```ts
  // ── 복사/붙여넣기 실행 (키보드·버튼 공용) ──────────────────────────────────
  function runCopy() {
    if (!selRange) return
    const cells: CopiedCell[] = []
    for (let ci = selRange.minColIdx; ci <= selRange.maxColIdx; ci++) {
      for (let si = selRange.minSlotIdx; si <= selRange.maxSlotIdx; si++) {
        if (si < 0 || si >= timeSlots.length) continue
        for (let d = selRange.minDay; d <= selRange.maxDay; d++) {
          const cs = getCellState(d, timeSlots[si], year, month, scheduleRules, slotSettings, dateOverrides, assignments)
          const colAssignments = cs.assignments.filter(a => {
            if (a.member_type === 'admin_note') return false
            if (isSplitMode) return a.role_id === (splitRoles[ci]?.id ?? null)
            return colIdxForMemberType(a.member_type) === ci
          })
          cells.push({
            dayOffset: d - selRange.minDay,
            slotOffset: si - selRange.minSlotIdx,
            colOffset: ci - selRange.minColIdx,
            assignments: colAssignments.map(a => ({ member_name: a.member_name, note: a.note, member_type: a.member_type, role_id: a.role_id, user_id: a.user_id, time_sub: a.time_sub, color: a.color })),
          })
        }
      }
    }
    setCopyBuf({ origin: { day: selRange.minDay, slotIdx: selRange.minSlotIdx, colIdx: selRange.minColIdx }, cells })
  }

  async function runPaste() {
    if (!copyBuf || !cellSel || !isPrivileged) return
    const pasteDay = Math.min(cellSel.anchor.day, cellSel.cursor.day)
    const pasteSlotIdx = Math.min(cellSel.anchor.slotIdx, cellSel.cursor.slotIdx)
    const pasteColIdx = Math.min(cellSel.anchor.colIdx, cellSel.cursor.colIdx)
    const daysInMonth = new Date(year, month, 0).getDate()
    for (const cell of copyBuf.cells) {
      const td = pasteDay + cell.dayOffset
      const tsi = pasteSlotIdx + cell.slotOffset
      const tci = pasteColIdx + cell.colOffset
      if (td < 1 || td > daysInMonth || tsi < 0 || tsi >= timeSlots.length) continue

      let targetRoleId: string | null = null
      let targetMemberType = 'member'
      if (isSplitMode) {
        const role = splitRoles[tci]
        if (!role) continue
        targetRoleId = role.id
      } else {
        if (tci < 0 || tci > 1) continue
        const dow = new Date(year, month - 1, td).getDay()
        if (tci === 1 && dow === 6) continue // 토요일은 50+ 열이 없음 — 붙여넣으면 화면에 안 보이는 고아 데이터가 됨
        targetMemberType = tci === 1 ? '50plus' : 'member'
      }

      const ts = timeSlots[tsi]
      const cs = getCellState(td, ts, year, month, scheduleRules, slotSettings, dateOverrides, assignments)
      if (cs.isHoliday || cs.isBreaktime || cs.isClosed || cs.isLocked) continue
      for (const a of cell.assignments) {
        await addAssignment({
          tenant_id: tenant!.id, year, month, day: td, time_slot: ts,
          member_name: a.member_name, note: a.note ?? undefined,
          member_type: isSplitMode ? a.member_type : targetMemberType,
          user_id: a.user_id,
          role_id: isSplitMode ? targetRoleId : null,
          time_sub: a.time_sub ?? undefined, color: a.color ?? undefined,
          customer_name: null, customer_phone: null,
        })
      }
    }
  }

  // ── 키보드: Shift 추적 + Ctrl+C/V/Escape ──────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Shift') { isShiftRef.current = true; return }
      if (!excelMode) return
      if (e.key === 'Escape') { setCellSel(null); setCopyBuf(null); return }
      if (!(e.ctrlKey || e.metaKey)) return

      if (e.key === 'c') {
        e.preventDefault()
        runCopy()
      }

      if (e.key === 'v') {
        e.preventDefault()
        runPaste()
      }
    }
    function onKeyUp(e: KeyboardEvent) { if (e.key === 'Shift') isShiftRef.current = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excelMode, cellSel, selRange, copyBuf, isPrivileged, isSplitMode, splitRoles, timeSlots, year, month, scheduleRules, slotSettings, dateOverrides, assignments, addAssignment, tenant])
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc -b`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/pages/SchedulePage.tsx
git commit -m "feat: 엑셀모드 복사/붙여넣기를 열(colIdx) 인지형으로 확장하고 재사용 함수로 추출"
```

---

### Task 6: 복사/붙여넣기 액션 바 UI 추가 (PC·모바일 공통)

**Files:**
- Modify: `src/pages/SchedulePage.tsx:1086-1091` (현재 `directRegMsg` 토스트 블록 바로 아래)

- [ ] **Step 1: 액션 바 JSX 추가**

`src/pages/SchedulePage.tsx`에서 다음 블록:

```tsx
      {directRegMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[var(--color-brand-primary)] text-white text-sm font-medium shadow-lg animate-fade-up pointer-events-none">
          {directRegMsg}
        </div>
      )}
      <DevFileLabel file="SchedulePage.tsx" />
```

다음으로 교체:

```tsx
      {directRegMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[var(--color-brand-primary)] text-white text-sm font-medium shadow-lg animate-fade-up pointer-events-none">
          {directRegMsg}
        </div>
      )}
      {excelMode && cellSel && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-strong)] shadow-[var(--shadow-lg)]">
          <button
            type="button"
            onClick={runCopy}
            disabled={!selRange}
            className="select-none px-3 py-1.5 rounded-xl text-sm font-semibold bg-[var(--color-brand-primary)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            📋 복사
          </button>
          <button
            type="button"
            onClick={runPaste}
            disabled={!copyBuf || !isPrivileged}
            className="select-none px-3 py-1.5 rounded-xl text-sm font-semibold bg-[var(--color-brand-primary)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            📥 붙여넣기
          </button>
          <button
            type="button"
            onClick={() => { setCellSel(null); setCopyBuf(null) }}
            className="select-none px-3 py-1.5 rounded-xl text-sm font-semibold border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            ✕ 선택해제
          </button>
        </div>
      )}
      <DevFileLabel file="SchedulePage.tsx" />
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc -b`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/pages/SchedulePage.tsx
git commit -m "feat: 엑셀모드 복사/붙여넣기/선택해제 액션 바 추가 (PC·모바일 공통)"
```

---

### Task 7: 수동 검증 (브라우저)

선택 상태기계와 Supabase 연동, 실제 드래그/탭 동작은 자동화 테스트로 의미 있게 검증하기 어려우므로 dev 서버에서 직접 확인한다.

- [ ] **Step 1: dev 서버 확인**

Run: `npm run dev` (이미 실행 중이면 스킵)

- [ ] **Step 2: 역할 분리 모드 — 단일 열 복사/붙여넣기**

관리자 계정으로 역할 분리 모드가 설정된 테넌트의 월간 뷰 진입 → 엑셀모드 ON → 역할 A 열의 한 칸 클릭 → 다른 날짜의 역할 A 열 클릭(범위 완성, 파란 음영 확인) → 하단 액션 바 "복사" → 대상 칸 클릭 → "붙여넣기" → 역할 A 열에만 배정이 들어갔는지, 역할 B/C 열은 그대로인지 확인

- [ ] **Step 3: 역할 분리 모드 — 열 범위 복사/붙여넣기**

역할 A~C 열 범위 선택(다른 날짜의 역할 C 칸을 두 번째 탭/클릭) → 복사 → 역할 B를 시작 열로 잡고 붙여넣기 → B,C 순서로 들어가고 D 역할이 없으면(범위 초과) 조용히 스킵되는지 확인

- [ ] **Step 4: 회원/50+ 분리 모드**

회원/50+ 분리(indicator_bar 역할 존재) 테넌트에서 50+ 열만 선택 → 복사 → 평일 50+ 열에 붙여넣기 정상 동작 확인 → 토요일 50+ 위치로 붙여넣기 시도 시 조용히 스킵되는지(에러 없이 아무 일도 안 일어남) 확인

- [ ] **Step 5: 모바일(터치) 시뮬레이션**

Chrome DevTools 모바일 에뮬레이션(또는 실기기)에서 엑셀모드 ON → 두 번 탭으로 범위 선택 → 하단 액션 바 버튼으로 복사/붙여넣기/선택해제가 정상 동작하는지 확인

- [ ] **Step 6: PC 회귀 확인**

Shift+클릭으로 계속 확장되는 기존 동작, Ctrl+C/V/Esc 단축키가 모두 회귀 없이 동작하는지 확인

- [ ] **Step 7: 체크리스트 문서 갱신**

`docs/checklist_2026-06-18.md`에 위 5~7번 항목을 점검 섹션으로 추가하고, 사용자가 실제 화면에서 체크하도록 안내

---

## Self-Review 결과

- **스펙 커버리지:** 설계 문서의 1~9절 모두 Task 1~6에 대응됨 (선택 모델→Task1,3,4 / 액션 바→Task6 / ScheduleGrid 변경→Task2 / 토요일 50+ 스킵→Task5 / 적용 범위(월간 뷰 한정, 휴관 셀 변경 없음)는 코드 변경 없이 기존 구조 그대로 유지되므로 별도 Task 불필요)
- **플레이스홀더 스캔:** 없음 — 모든 스텝에 완전한 코드/명령 포함
- **타입 일관성:** `CellPos`/`colIdxForRole`/`colIdxForMemberType`/`rangeFromCells`/`nextCellSelection` 이름이 Task 1 정의 이후 Task 3~5에서 동일하게 재사용됨을 확인
