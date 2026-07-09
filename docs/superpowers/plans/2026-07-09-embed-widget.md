# 임베드 위젯(`/embed`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 비회원(프리폼) 모드 조직이 홈페이지/SNS에 `<iframe>`으로 박아 넣을 수 있는 읽기 전용 스케줄 위젯(`/embed`)을 추가한다.

**Architecture:** `SharePage.tsx`가 하던 "URL의 `tid`로 테넌트 설정 직접 조회" 로직을 `useShareTenantSettings` 훅으로 추출해 신규 `EmbedPage.tsx`와 공유한다. 위젯 전용 RLS는 필요 없다(마이그레이션 060의 `is_freeform_tenant()` 정책을 그대로 재사용). `vercel.json`에서 `/embed` 경로만 CSP `frame-ancestors`를 열어 실제 임베드가 가능하게 한다.

**Tech Stack:** React 19 + TypeScript + Tailwind, react-router-dom, Vitest + Testing Library, Vercel headers 설정.

**참고(프로젝트 규칙)**: 각 태스크의 "Commit" 스텝은 문서화 목적으로 남기되, **사용자가 명시적으로 커밋을 요청하기 전까지는 실제로 `git commit`을 실행하지 않는다.**

**설계서 대비 변경점**: 설계서(`docs/superpowers/specs/2026-07-09-embed-widget-design.md`)는 "ScheduleHeader의 무거운 크롬 없이 최소한의 자체 헤더만 그린다"고 했으나, 상세 설계 중 기존 `ScheduleHeader` 컴포넌트가 이미 `viewType`/`onViewTypeChange`/`weekDays`를 선택적으로 지원하고(`onDateSelect`·`roleToggleSlot`을 안 넘기면 자동으로 안 보임) 월/주 전환 세그먼트 컨트롤까지 내장하고 있음을 확인했다. 새로 만들지 않고 **`ScheduleHeader`를 그대로 재사용**하는 쪽이 더 적은 코드로 더 검증된 UI를 얻는다. 또한 주간 뷰가 월 경계를 넘을 때 인접 월 데이터를 병합하는 `SchedulePage.tsx`의 기존 패턴(`needsAdj`/`adjYear`/`adjMonth`)도 `EmbedPage.tsx`에 동일하게 적용한다.

---

### Task 1: `getWeekDays`를 공용 유틸로 추출

**Files:**
- Modify: `src/utils/timeSlots.ts`
- Modify: `src/pages/SchedulePage.tsx:457-469`

**Context:** `SchedulePage.tsx`에 로컬 함수로 있는 `getWeekDays`가 `EmbedPage.tsx`(Task 3)에도 그대로 필요하다. 두 곳에 복붙하는 대신 공용 유틸로 뽑는다.

- [ ] **Step 1: `src/utils/timeSlots.ts` 끝에 함수 추가**

파일 끝(마지막 export 다음)에 추가:
```ts
export function getWeekDays(year: number, month: number, day: number): Date[] {
  const anchor = new Date(year, month - 1, day)
  const dow = anchor.getDay()
  const monday = new Date(anchor)
  monday.setDate(anchor.getDate() - ((dow + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday)
    dd.setDate(monday.getDate() + i)
    return dd
  })
}
```

- [ ] **Step 2: `SchedulePage.tsx`에서 로컬 정의 제거하고 import로 교체**

`src/pages/SchedulePage.tsx`의 기존 코드:
```ts
  function getWeekDays(y: number, m: number, d: number): Date[] {
    const anchor = new Date(y, m - 1, d)
    const dow = anchor.getDay()
    const monday = new Date(anchor)
    monday.setDate(anchor.getDate() - ((dow + 6) % 7))
    return Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(monday)
      dd.setDate(monday.getDate() + i)
      return dd
    })
  }

  const weekDays = getWeekDays(year, month, day)
```
를 다음으로 교체:
```ts
  const weekDays = getWeekDays(year, month, day)
```
(함수 정의 블록만 삭제, 호출부 `const weekDays = getWeekDays(year, month, day)`는 그대로 둔다.)

`SchedulePage.tsx` 상단 import 블록에서 `../utils/timeSlots`를 import하는 줄을 찾아 `getWeekDays`를 추가한다. 예를 들어 기존 줄이:
```ts
import { generateTimeSlots, slotStartLabel, ... } from '../utils/timeSlots'
```
형태라면 (실제 현재 import 목록은 파일을 열어 확인 — 이미 `../utils/timeSlots`에서 뭔가를 import하고 있으므로 그 줄에 `getWeekDays`만 추가하면 된다):
```ts
import { generateTimeSlots, slotStartLabel, getWeekDays, ... } from '../utils/timeSlots'
```

- [ ] **Step 3: 타입체크 및 회귀 확인**

Run: `npx tsc -b`
Expected: 출력 없음(에러 없음)

로컬 개발 서버(`npm run dev`)에서 주간 뷰로 전환해 기존처럼 정상 동작하는지(월 경계 넘는 주 포함) 눈으로 확인 — 순수 리팩터링이라 동작 변화가 있으면 안 된다.

- [ ] **Step 4: Commit** (사용자 요청 전까지 실행하지 않음)

```bash
git add src/utils/timeSlots.ts src/pages/SchedulePage.tsx
git commit -m "refactor: getWeekDays를 공용 유틸로 추출"
```

---

### Task 2: `useShareTenantSettings` 훅 추출 + `SharePage.tsx` 리팩터링

**Files:**
- Create: `src/hooks/useShareTenantSettings.ts`
- Modify: `src/pages/SharePage.tsx`

**Context:** `SharePage.tsx`(현재 전체 내용은 아래 "Step 2"에 있음)의 "URL의 `tid`로 테넌트 설정을 직접 조회"하는 로직(현재 라인 22~75 부근)을 훅으로 추출한다. 동작은 절대 바뀌지 않는 순수 리팩터링이다. `EmbedPage.tsx`(Task 3)가 이 훅을 그대로 재사용한다.

- [ ] **Step 1: 훅 파일 작성**

`src/hooks/useShareTenantSettings.ts`:
```ts
import { useEffect, useState } from 'react'
import { useTenant } from '../contexts/TenantContext'
import { displayMode } from '../lib/tenantMode'
import { supabase } from '../lib/supabase'
import { generateTimeSlots } from '../utils/timeSlots'
import type { TimeSlot } from '../utils/timeSlots'
import type { CustomFieldDef, LegendItem } from '../types'

interface ShareTenantSettings {
  tenant: ReturnType<typeof useTenant>['tenant']
  tenantId: string
  timeSlots: TimeSlot[]
  legendItems: LegendItem[]
  slotLabels: Record<string, string>
  isFreeformTenant: boolean
  tenantModeReady: boolean
  customFields: CustomFieldDef[]
  useDynamicFields: boolean
  detailFields: CustomFieldDef[]
}

/**
 * `/share`, `/embed` 등 tid 쿼리 파라미터로 테넌트를 지정하는 공개 페이지가 공유하는 훅.
 * tid가 현재 로그인 컨텍스트의 테넌트와 다르면(주로 비로그인 방문자) tenants.settings를
 * 직접 조회해 timeSlots/legendItems/slotLabels/tenantMode/customFields를 계산한다.
 */
export function useShareTenantSettings(tidFromUrl: string): ShareTenantSettings {
  const { tenant, timeSlots: contextTimeSlots, legendItems: contextLegendItems, slotLabels: contextSlotLabels } = useTenant()
  const tenantId = tidFromUrl || tenant?.id || ''

  const [fetchedTimeSlots, setFetchedTimeSlots] = useState<TimeSlot[] | null>(null)
  const [fetchedLegendItems, setFetchedLegendItems] = useState<LegendItem[] | null>(null)
  const [fetchedSlotLabels, setFetchedSlotLabels] = useState<Record<string, string> | null>(null)
  const [fetchedTenantMode, setFetchedTenantMode] = useState<string | undefined>(undefined)
  const [fetchedCustomFields, setFetchedCustomFields] = useState<CustomFieldDef[] | null>(null)

  useEffect(() => {
    if (!tidFromUrl || tidFromUrl === tenant?.id) {
      setFetchedTimeSlots(null)
      setFetchedLegendItems(null)
      setFetchedSlotLabels(null)
      setFetchedTenantMode(undefined)
      setFetchedCustomFields(null)
      return
    }
    supabase.from('tenants').select('settings').eq('id', tidFromUrl).single()
      .then(({ data }) => {
        if (!data?.settings) return
        const s = data.settings as Record<string, unknown>
        const slots = Array.isArray(s.time_slots) && (s.time_slots as string[]).length > 0
          ? s.time_slots as TimeSlot[]
          : generateTimeSlots(
              (s.open_from as string | undefined) ?? '09:00',
              (s.open_to as string | undefined) ?? '22:00',
              (s.slot_interval_minutes as number | undefined) ?? 120
            )
        setFetchedTimeSlots(slots)
        setFetchedLegendItems((s.legend_items as LegendItem[] | undefined) ?? [])
        setFetchedSlotLabels((s.slot_labels as Record<string, string> | undefined) ?? {})
        setFetchedTenantMode(s.tenant_mode as string | undefined)
        setFetchedCustomFields((s.custom_fields as CustomFieldDef[] | undefined) ?? [])
      })
  }, [tidFromUrl, tenant?.id])

  const timeSlots = fetchedTimeSlots ?? contextTimeSlots
  const legendItems = fetchedLegendItems ?? contextLegendItems
  const slotLabels = fetchedSlotLabels ?? contextSlotLabels
  const isFreeformTenant = displayMode((fetchedTenantMode ?? tenant?.settings?.tenant_mode) as string | undefined) === '비회원'
  const tenantModeReady = !tidFromUrl || tidFromUrl === tenant?.id || fetchedTenantMode !== undefined
  const customFields = fetchedCustomFields ?? tenant?.settings?.custom_fields ?? []
  const useDynamicFields = isFreeformTenant && customFields.length > 0
  const detailFields = useDynamicFields ? customFields.slice(1) : customFields

  return {
    tenant, tenantId, timeSlots, legendItems, slotLabels,
    isFreeformTenant, tenantModeReady, customFields, useDynamicFields, detailFields,
  }
}
```

- [ ] **Step 2: `SharePage.tsx`를 훅을 쓰도록 리팩터링**

`src/pages/SharePage.tsx`의 현재 전체 내용(참고용, 그대로 옮겨적지 말고 아래 "교체 후" 기준으로 수정):
- 라인 1~18: import
- 라인 22~75: `tidFromUrl`/`tenant`/`tenantId`/fetch useEffect/파생 값들
- 나머지: 게이트 렌더링, 메인 렌더링, 모달(커스텀 필드 chip 포함)

**교체 후** 전체 파일:
```tsx
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DevFileLabel } from '../components/DevFileLabel'
import { useSchedule } from '../hooks/useSchedule'
import { useShareTenantSettings } from '../hooks/useShareTenantSettings'
import { ScheduleHeader } from '../components/schedule/ScheduleHeader'
import { ScheduleGrid } from '../components/schedule/ScheduleGrid'
import { Legend } from '../components/schedule/Legend'
import { slotStartLabel } from '../utils/timeSlots'
import { getCellState } from '../utils/cellState'
import { useTenantRoles } from '../hooks/useTenantRoles'
import { fmtNumber } from '../lib/format'
import { getOptionUnit } from '../types'
import type { ModalTarget } from '../types'

const DAY_KR = ['일', '월', '화', '수', '목', '금', '토']

export function SharePage() {
  const [params, setParams] = useSearchParams()
  const year = parseInt(params.get('year') ?? String(new Date().getFullYear()))
  const month = parseInt(params.get('month') ?? String(new Date().getMonth() + 1))
  const tidFromUrl = params.get('tid') ?? ''

  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null)

  const {
    tenantId, timeSlots, legendItems, slotLabels,
    isFreeformTenant, tenantModeReady, detailFields,
  } = useShareTenantSettings(tidFromUrl)

  const { roles: tenantRoles } = useTenantRoles(tenantId)
  const splitRoles = tenantRoles.filter(r => r.split_cell && !r.indicator_bar)
  const indicatorBarRoles = tenantRoles.filter(r => r.indicator_bar)
  const isSplitMode = splitRoles.length > 0

  const { assignments, slotSettings, scheduleRules, dateOverrides, loading } = useSchedule(tenantId, year, month)

  if (!isFreeformTenant) {
    if (!tenantModeReady) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-gray-400 dark:text-gray-500 text-sm">로딩 중...</div>
        </div>
      )
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <p className="text-gray-500 dark:text-gray-400 text-sm">스케줄을 보려면 로그인이 필요합니다.</p>
          <a href="/auth" className="mt-4 inline-block px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            로그인
          </a>
        </div>
      </div>
    )
  }

  const modalCellState = modalTarget
    ? getCellState(modalTarget.day, modalTarget.timeSlot, modalTarget.year, modalTarget.month, scheduleRules, slotSettings, dateOverrides, assignments)
    : null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-1">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-1.5 max-w-full">
        <div className="mb-1 text-xs text-gray-400 dark:text-gray-500 text-right">읽기 전용 공유 뷰</div>
        <ScheduleHeader
          year={year} month={month}
          onPrev={() => {
            const [py, pm] = month === 1 ? [year - 1, 12] : [year, month - 1]
            setParams({ tid: tidFromUrl, year: String(py), month: String(pm) })
          }}
          onNext={() => {
            const [ny, nm] = month === 12 ? [year + 1, 1] : [year, month + 1]
            setParams({ tid: tidFromUrl, year: String(ny), month: String(nm) })
          }}
        />
        <Legend legendItems={legendItems} />
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">로딩 중...</div>
        ) : (
          <ScheduleGrid
            year={year} month={month}
            timeSlots={timeSlots}
            assignments={assignments} slotSettings={slotSettings}
            scheduleRules={scheduleRules} dateOverrides={dateOverrides}
            splitRoles={splitRoles}
            indicatorBarRoles={indicatorBarRoles}
            isSplitMode={isSplitMode}
            highlightName={null}
            canAdd={false}
            onCellClick={t => {
              const cs = getCellState(t.day, t.timeSlot, t.year, t.month, scheduleRules, slotSettings, dateOverrides, assignments)
              if (cs.assignments.filter(a => a.member_type !== 'admin_note').length > 0) setModalTarget(t)
            }}
          />
        )}
      </div>

      {modalTarget && modalCellState && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setModalTarget(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-5 w-full max-w-sm mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-base font-bold text-[var(--color-text-primary)]">
                  {modalTarget.month}월 {modalTarget.day}일 ({DAY_KR[new Date(modalTarget.year, modalTarget.month - 1, modalTarget.day).getDay()]})
                </span>
                <span className="ml-2 text-sm text-[var(--color-text-muted)]">
                  {slotLabels[modalTarget.timeSlot] ?? slotStartLabel(modalTarget.timeSlot)}
                </span>
              </div>
              <button
                onClick={() => setModalTarget(null)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-[var(--color-text-muted)] mb-3">
              {modalCellState.assignments.filter(a => a.member_type !== 'admin_note').length}명 / {modalCellState.maxCapacity}명
            </div>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {modalCellState.assignments
                .filter(a => a.member_type !== 'admin_note')
                .map(a => {
                  const detailChips = detailFields
                    .filter(f => f.type !== 'image_upload')
                    .map(f => {
                      const val = a.extra_data?.[f.id]
                      if (!val) return null
                      const unit = getOptionUnit(f.options?.find(o => o.value === val)?.value_type)
                      return { key: f.id, label: f.label, value: `${fmtNumber(val)}${unit}` }
                    })
                    .filter((c): c is { key: string; label: string; value: string } => c !== null)
                  if (a.note) detailChips.push({ key: 'note', label: '메모', value: a.note })

                  return (
                    <div key={a.id} className="flex flex-col gap-1.5 px-3 py-2 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold bg-[oklch(0.95_0.045_28)] text-[oklch(0.45_0.14_28)]">
                          {a.member_name?.charAt(0) ?? '?'}
                        </span>
                        <span className="text-sm font-semibold text-[var(--color-text-primary)]">{a.member_name}</span>
                      </div>
                      {detailChips.length > 0 && (
                        <div className="flex flex-wrap gap-1 pl-9">
                          {detailChips.map(c => (
                            <span key={c.key} className="text-[11px] font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border)] px-1.5 py-0.5 rounded-md">
                              {c.label}: {c.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}

      <DevFileLabel file="SharePage.tsx" />
    </div>
  )
}
```

**변경 요지**: `useAuth`/`profile` 관련 코드 전부 제거(원래도 `!profile && !isFreeformTenant`처럼 항상 `isFreeformTenant`와 함께만 쓰였는데, `isFreeformTenant`가 false인데 `profile`이 있어서 통과되는 케이스 — 로그인한 관리자가 자기 조직 미리보기 — 를 유지해야 한다면 `profile`을 남겨야 한다).

**주의**: 위 "교체 후" 코드는 `profile` 체크를 제거했다 — 이는 **로그인한 사용자가 회원공유/회원개별 모드의 공유 링크를 보는 기존 케이스를 깨뜨린다.** 반드시 `useAuth`의 `profile`을 유지하고 게이트를 `if (!profile && !isFreeformTenant)`로 되돌려야 한다. 최종 파일은 원래 `SharePage.tsx`(Task 시작 시점 기준)에서 **fetch 관련 state/useEffect 블록만 `useShareTenantSettings` 훅 호출로 교체**하고, `profile`/`useAuth` import와 게이트 조건(`if (!profile && !isFreeformTenant)`)은 그대로 유지하는 방식으로 작성한다. (이 노트는 구현 시 반드시 반영 — 위 코드 블록은 그 실수를 포함한 예시이니 그대로 복사하지 말 것.)

- [ ] **Step 3: 타입체크 및 회귀 확인**

Run: `npx tsc -b`
Expected: 출력 없음

로컬 dev 서버에서 `/share?tid=<비회원모드테넌트id>&year=...&month=...`를 시크릿 창(비로그인)으로 접속해 여전히 정상 조회되는지, `/share?tid=<회원공유모드테넌트id>&...`는 비로그인 시 로그인 화면이 뜨는지 재확인(마이그레이션 060 검증 때와 동일 시나리오, 회귀 확인용).

- [ ] **Step 4: Commit** (사용자 요청 전까지 실행하지 않음)

```bash
git add src/hooks/useShareTenantSettings.ts src/pages/SharePage.tsx
git commit -m "refactor: SharePage의 테넌트 설정 조회 로직을 useShareTenantSettings 훅으로 추출"
```

---

### Task 3: `EmbedPage.tsx` 신규 작성

**Files:**
- Create: `src/pages/EmbedPage.tsx`
- Test: `src/pages/EmbedPage.test.tsx`

**Context:** Task 1(`getWeekDays`), Task 2(`useShareTenantSettings`)가 끝난 뒤 진행. `ScheduleHeader`(이미 `viewType`/`onViewTypeChange`/`weekDays`를 지원)를 재사용해 월/주 전환을 구현하고, `ResizeObserver`로 부모 창에 높이를 알린다. `SchedulePage.tsx`의 주간 뷰 월-경계 인접 데이터 병합 패턴(`needsAdj`/`adjYear`/`adjMonth`)을 동일하게 적용한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/pages/EmbedPage.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { EmbedPage } from './EmbedPage'

const mockUseShareTenantSettings = vi.fn()
vi.mock('../hooks/useShareTenantSettings', () => ({
  useShareTenantSettings: () => mockUseShareTenantSettings(),
}))
vi.mock('../hooks/useTenantRoles', () => ({
  useTenantRoles: () => ({ roles: [] }),
}))
vi.mock('../hooks/useSchedule', () => ({
  useSchedule: () => ({ assignments: [], slotSettings: [], scheduleRules: [], dateOverrides: [], loading: false }),
}))
vi.mock('../components/schedule/ScheduleGrid', () => ({
  ScheduleGrid: () => <div data-testid="month-grid" />,
}))
vi.mock('../components/schedule/WeekGrid', () => ({
  WeekGrid: () => <div data-testid="week-grid" />,
}))

function baseSettings(overrides: Partial<ReturnType<typeof mockUseShareTenantSettings>> = {}) {
  return {
    tenant: null,
    tenantId: 'tenant-1',
    timeSlots: [],
    legendItems: [],
    slotLabels: {},
    isFreeformTenant: true,
    tenantModeReady: true,
    customFields: [],
    useDynamicFields: false,
    detailFields: [],
    ...overrides,
  }
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <EmbedPage />
    </MemoryRouter>
  )
}

describe('EmbedPage', () => {
  it('shows loading state while tenant mode is not ready', () => {
    mockUseShareTenantSettings.mockReturnValue(baseSettings({ tenantModeReady: false }))
    renderAt('/embed?tid=tenant-1')
    expect(screen.getByText('로딩 중...')).toBeInTheDocument()
  })

  it('shows a fallback message when the tenant is not freeform mode', () => {
    mockUseShareTenantSettings.mockReturnValue(baseSettings({ isFreeformTenant: false }))
    renderAt('/embed?tid=tenant-1')
    expect(screen.getByText(/비회원 모드 조직에서만/)).toBeInTheDocument()
  })

  it('renders the month grid by default for a freeform tenant', () => {
    mockUseShareTenantSettings.mockReturnValue(baseSettings())
    renderAt('/embed?tid=tenant-1')
    expect(screen.getByTestId('month-grid')).toBeInTheDocument()
    expect(screen.queryByTestId('week-grid')).not.toBeInTheDocument()
  })

  it('renders the week grid when view=week is in the URL', () => {
    mockUseShareTenantSettings.mockReturnValue(baseSettings())
    renderAt('/embed?tid=tenant-1&view=week')
    expect(screen.getByTestId('week-grid')).toBeInTheDocument()
    expect(screen.queryByTestId('month-grid')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/pages/EmbedPage.test.tsx`
Expected: FAIL — `Cannot find module './EmbedPage'`

- [ ] **Step 3: 구현 작성**

`src/pages/EmbedPage.tsx`:
```tsx
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useShareTenantSettings } from '../hooks/useShareTenantSettings'
import { useTenantRoles } from '../hooks/useTenantRoles'
import { useSchedule } from '../hooks/useSchedule'
import { ScheduleHeader } from '../components/schedule/ScheduleHeader'
import { ScheduleGrid } from '../components/schedule/ScheduleGrid'
import { WeekGrid } from '../components/schedule/WeekGrid'
import { getCellState } from '../utils/cellState'
import { getWeekDays, slotStartLabel } from '../utils/timeSlots'
import { getOptionUnit } from '../types'
import { fmtNumber } from '../lib/format'
import type { ViewType, ModalTarget } from '../types'

const DAY_KR = ['일', '월', '화', '수', '목', '금', '토']

export function EmbedPage() {
  const [params, setParams] = useSearchParams()
  const tidFromUrl = params.get('tid') ?? ''
  const today = new Date()
  const year = parseInt(params.get('year') ?? String(today.getFullYear()))
  const month = parseInt(params.get('month') ?? String(today.getMonth() + 1))
  const day = parseInt(params.get('day') ?? String(today.getDate()))
  const viewType: ViewType = params.get('view') === 'week' ? 'week' : 'month'

  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null)

  const {
    tenantId, timeSlots, isFreeformTenant, tenantModeReady, detailFields,
  } = useShareTenantSettings(tidFromUrl)

  const { roles: tenantRoles } = useTenantRoles(tenantId)
  const splitRoles = tenantRoles.filter(r => r.split_cell && !r.indicator_bar)
  const indicatorBarRoles = tenantRoles.filter(r => r.indicator_bar)
  const isSplitMode = splitRoles.length > 0

  const weekDays = getWeekDays(year, month, day)
  const _anchorDow = new Date(year, month - 1, day).getDay()
  const _mondayOffset = (_anchorDow + 6) % 7
  const _sundayDate = new Date(year, month - 1, day - _mondayOffset + 6)
  const adjYear = _sundayDate.getFullYear()
  const adjMonth = _sundayDate.getMonth() + 1
  const needsAdj = viewType === 'week' && (adjYear !== year || adjMonth !== month)

  const { assignments: primaryAssignments, slotSettings, scheduleRules, dateOverrides, loading } = useSchedule(tenantId, year, month)
  const { assignments: adjAssignments, dateOverrides: adjDateOverrides } = useSchedule(needsAdj ? tenantId : '', adjYear, adjMonth)
  const assignments = needsAdj ? [...primaryAssignments, ...adjAssignments] : primaryAssignments
  const weekDateOverrides = needsAdj ? [...dateOverrides, ...adjDateOverrides] : dateOverrides

  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(entries => {
      const height = Math.ceil(entries[0].contentRect.height)
      window.parent.postMessage({ source: 'dts-embed', type: 'resize', height }, '*')
    })
    ro.observe(el)
    return () => ro.disconnect()
  })

  function setView(v: ViewType) {
    const t = new Date()
    setParams({ tid: tidFromUrl, view: v, year: String(t.getFullYear()), month: String(t.getMonth() + 1), day: String(t.getDate()) })
  }

  function shiftWeek(delta: number) {
    const d = new Date(year, month - 1, day)
    d.setDate(d.getDate() + delta)
    setParams({ tid: tidFromUrl, view: viewType, year: String(d.getFullYear()), month: String(d.getMonth() + 1), day: String(d.getDate()) })
  }

  function shiftMonth(delta: number) {
    let y = year
    let m = month + delta
    if (m < 1) { y -= 1; m = 12 }
    if (m > 12) { y += 1; m = 1 }
    setParams({ tid: tidFromUrl, view: viewType, year: String(y), month: String(m), day: String(day) })
  }

  function handleCellClick(t: ModalTarget) {
    const cs = getCellState(t.day, t.timeSlot, t.year, t.month, scheduleRules, slotSettings, weekDateOverrides, assignments)
    if (cs.assignments.filter(a => a.member_type !== 'admin_note').length > 0) setModalTarget(t)
  }

  if (!tenantModeReady) {
    return <div ref={rootRef} className="p-4 text-center text-xs text-gray-400">로딩 중...</div>
  }

  if (!isFreeformTenant) {
    return (
      <div ref={rootRef} className="p-4 text-center text-xs text-gray-400">
        이 위젯은 비회원 모드 조직에서만 사용할 수 있습니다.
      </div>
    )
  }

  const modalCellState = modalTarget
    ? getCellState(modalTarget.day, modalTarget.timeSlot, modalTarget.year, modalTarget.month, scheduleRules, slotSettings, weekDateOverrides, assignments)
    : null

  return (
    <div ref={rootRef} className="bg-white dark:bg-gray-800 p-2">
      <ScheduleHeader
        year={year} month={month} day={day}
        viewType={viewType}
        onViewTypeChange={setView}
        weekDays={weekDays}
        onPrev={() => (viewType === 'month' ? shiftMonth(-1) : shiftWeek(-7))}
        onNext={() => (viewType === 'month' ? shiftMonth(1) : shiftWeek(7))}
      />
      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">로딩 중...</div>
      ) : viewType === 'month' ? (
        <ScheduleGrid
          year={year} month={month}
          timeSlots={timeSlots}
          assignments={assignments} slotSettings={slotSettings}
          scheduleRules={scheduleRules} dateOverrides={dateOverrides}
          splitRoles={splitRoles}
          indicatorBarRoles={indicatorBarRoles}
          isSplitMode={isSplitMode}
          highlightName={null}
          canAdd={false}
          onCellClick={handleCellClick}
        />
      ) : (
        <WeekGrid
          weekDays={weekDays}
          timeSlots={timeSlots}
          assignments={assignments} slotSettings={slotSettings}
          scheduleRules={scheduleRules} dateOverrides={weekDateOverrides}
          highlightName={null}
          splitRoles={splitRoles}
          indicatorBarRoles={indicatorBarRoles}
          isSplitMode={isSplitMode}
          canAdd={false}
          onCellClick={handleCellClick}
        />
      )}

      {modalTarget && modalCellState && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setModalTarget(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-5 w-full max-w-sm mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-base font-bold text-[var(--color-text-primary)]">
                  {modalTarget.month}월 {modalTarget.day}일 ({DAY_KR[new Date(modalTarget.year, modalTarget.month - 1, modalTarget.day).getDay()]})
                </span>
                <span className="ml-2 text-sm text-[var(--color-text-muted)]">
                  {slotStartLabel(modalTarget.timeSlot)}
                </span>
              </div>
              <button
                onClick={() => setModalTarget(null)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-[var(--color-text-muted)] mb-3">
              {modalCellState.assignments.filter(a => a.member_type !== 'admin_note').length}명 / {modalCellState.maxCapacity}명
            </div>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {modalCellState.assignments
                .filter(a => a.member_type !== 'admin_note')
                .map(a => {
                  const detailChips = detailFields
                    .filter(f => f.type !== 'image_upload')
                    .map(f => {
                      const val = a.extra_data?.[f.id]
                      if (!val) return null
                      const unit = getOptionUnit(f.options?.find(o => o.value === val)?.value_type)
                      return { key: f.id, label: f.label, value: `${fmtNumber(val)}${unit}` }
                    })
                    .filter((c): c is { key: string; label: string; value: string } => c !== null)
                  if (a.note) detailChips.push({ key: 'note', label: '메모', value: a.note })

                  return (
                    <div key={a.id} className="flex flex-col gap-1.5 px-3 py-2 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold bg-[oklch(0.95_0.045_28)] text-[oklch(0.45_0.14_28)]">
                          {a.member_name?.charAt(0) ?? '?'}
                        </span>
                        <span className="text-sm font-semibold text-[var(--color-text-primary)]">{a.member_name}</span>
                      </div>
                      {detailChips.length > 0 && (
                        <div className="flex flex-wrap gap-1 pl-9">
                          {detailChips.map(c => (
                            <span key={c.key} className="text-[11px] font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border)] px-1.5 py-0.5 rounded-md">
                              {c.label}: {c.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

**참고**: `ResizeObserver`의 `useEffect`는 의도적으로 deps 배열 없이(`[]`가 아니라 매 렌더 후) `observe`/`disconnect`를 반복 — 컨텐츠(월↔주 전환, 로딩 완료 등)가 바뀔 때마다 관찰 대상 엘리먼트의 참조 자체는 그대로(`rootRef.current`)이므로 사실 `[]`로도 충분하다. 구현 시 `useEffect(() => {...}, [])`로 최적화해도 무방하다(마운트 시 1회만 관찰 시작, ResizeObserver가 이후 크기 변화를 알아서 계속 감지).

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/pages/EmbedPage.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: 타입체크**

Run: `npx tsc -b`
Expected: 출력 없음

- [ ] **Step 6: Commit** (사용자 요청 전까지 실행하지 않음)

```bash
git add src/pages/EmbedPage.tsx src/pages/EmbedPage.test.tsx
git commit -m "feat: 비회원 모드 조직용 임베드 위젯(/embed) 페이지 추가"
```

---

### Task 4: `App.tsx`에 `/embed` 라우트 추가

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: import 추가**

`src/App.tsx`의 기존:
```ts
import { SharePage } from './pages/SharePage'
```
바로 다음 줄에 추가:
```ts
import { EmbedPage } from './pages/EmbedPage'
```

- [ ] **Step 2: 6곳의 `/share` 라우트 옆에 `/embed` 추가**

`AppRoutes` 함수 안에 `<Route path="/share" ... />`(정확히 이 형태, 정렬 공백 없는 버전)가 5번 나온다. 이 5곳 모두에 `replace_all`로 한 번에 처리:

기존:
```tsx
        <Route path="/share" element={<SharePage />} />
```
교체 후:
```tsx
        <Route path="/share" element={<SharePage />} />
        <Route path="/embed" element={<EmbedPage />} />
```

(에디터에서 "모두 바꾸기"로 5곳 전부 처리. 5곳의 위치: 비인증 아님/조직 없음 블록, 멤버십 2개 이상 블록, 슈퍼관리자 미선택 블록, 고객관리자 미선택 블록, 최종 로그인 완료 블록 — 정확한 라인은 파일을 열어 확인.)

**단, 최상단(비인증 사용자) 블록의 `/share` 줄은 정렬을 맞춘 다른 형태**이므로 별도 처리:

기존:
```tsx
        <Route path="/"        element={<LandingPage />} />
        <Route path="/consent" element={<ConsentPage />} />
        <Route path="/auth"           element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/share"          element={<SharePage />} />
        <Route path="*"               element={<Navigate to="/" replace />} />
```
교체 후:
```tsx
        <Route path="/"        element={<LandingPage />} />
        <Route path="/consent" element={<ConsentPage />} />
        <Route path="/auth"           element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/share"          element={<SharePage />} />
        <Route path="/embed"          element={<EmbedPage />} />
        <Route path="*"               element={<Navigate to="/" replace />} />
```

- [ ] **Step 3: 타입체크**

Run: `npx tsc -b`
Expected: 출력 없음

Run 검증용: `grep -c 'path="/embed"' src/App.tsx` → `6`이어야 한다(6개 라우트 블록 전부에 추가됐는지 확인).

- [ ] **Step 4: Commit** (사용자 요청 전까지 실행하지 않음)

```bash
git add src/App.tsx
git commit -m "feat: /embed 라우트를 모든 인증 상태에서 공개 접근 가능하게 추가"
```

---

### Task 5: `vercel.json` — `/embed`만 iframe 임베드 허용

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: 전체 파일을 아래 내용으로 교체**

`vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=()"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' https://cdn.jsdelivr.net https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net; img-src 'self' data: blob: https:; worker-src 'self' blob:; frame-ancestors 'none';"
        }
      ]
    },
    {
      "source": "/embed",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' https://cdn.jsdelivr.net https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net; img-src 'self' data: blob: https:; worker-src 'self' blob:; frame-ancestors *;"
        }
      ]
    }
  ],
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**변경 요지**: 기존 전역 `X-Frame-Options: DENY`를 삭제(CSP `frame-ancestors 'none'`이 최신 브라우저에서 동일 보호를 제공하므로 중복이며, 경로별로 다른 값이 필요해지면서 충돌 소지가 생김 — CSP3가 표준이므로 CSP만으로 통일). `/embed` 경로는 `Content-Security-Policy` 키만 다시 정의해 `frame-ancestors *`로 오버라이드하고, 나머지 보안 헤더(HSTS, nosniff 등)는 전역 블록에서 그대로 상속된다.

- [ ] **Step 2: JSON 유효성 확인**

Run: `node -e "JSON.parse(require('fs').readFileSync('vercel.json', 'utf8')); console.log('valid json')"`
Expected: `valid json` 출력

- [ ] **Step 3: Commit** (사용자 요청 전까지 실행하지 않음)

```bash
git add vercel.json
git commit -m "fix: /embed 경로만 iframe 임베드 허용, 나머지 경로는 기존처럼 차단"
```

**참고**: 이 변경은 배포(Vercel) 시점에만 실제로 검증 가능하다. 로컬 `npm run dev`(Vite dev server)는 `vercel.json`의 `headers` 설정을 적용하지 않으므로, 로컬에서는 iframe 차단 여부를 확인할 수 없다 — Task 7(수동 검증)에서 실제 배포 후 확인 항목으로 남겨둔다.

---

### Task 6: 관리자 햄버거 메뉴에 "임베드 코드 복사" 추가

**Files:**
- Modify: `src/pages/SchedulePage.tsx`

**Context:** Task 4까지 끝난 뒤 진행. `SchedulePage.tsx`의 `funcMenuItems`(햄버거 메뉴) 안, 기존 "화면"(월/주/일 전환, 이번 세션에 추가됨) 섹션 다음에 새 섹션을 추가한다. `isPrivileged && tenantMode === '비회원'`일 때만 보인다. `SchedulePage.tsx`는 이미 `tenantMode`(displayMode 적용된 값)와 `tenant?.id`를 갖고 있으므로 추가 조회 없이 바로 쓸 수 있다.

- [ ] **Step 1: 햄버거 메뉴에 항목 추가**

`SchedulePage.tsx`의 `funcMenuItems={(close) => (...)}` 안에서, "화면" 섹션(월/주/일 전환 버튼 + 엑셀 모드) 블록이 끝나는 지점, `<p className={navLabelCls}>문서</p>` 바로 앞에 아래를 추가:

```tsx
            {isPrivileged && tenantMode === '비회원' && (
              <>
                <p className={navLabelCls}>공유</p>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/embed?tid=${tenant?.id ?? ''}`
                    const elId = `dts-widget-${(tenant?.id ?? '').slice(0, 8)}`
                    const code = `<iframe id="${elId}" src="${url}" style="width:100%;border:0;" scrolling="no"></iframe>\n<script>\n(function () {\n  window.addEventListener('message', function (e) {\n    if (e.data && e.data.source === 'dts-embed' && e.data.type === 'resize') {\n      var el = document.getElementById('${elId}');\n      if (el) el.style.height = e.data.height + 'px';\n    }\n  });\n})();\n</script>`
                    navigator.clipboard.writeText(code).then(() => alert('임베드 코드가 클립보드에 복사되었습니다.\n조직 홈페이지의 원하는 위치에 붙여넣으세요.'))
                    close()
                  }}
                  className={menuItemCls}
                >
                  <NavIcon>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                  </NavIcon>
                  <span className="flex-1">임베드 코드 복사</span>
                </button>
              </>
            )}
```

`tenant`는 `SchedulePage.tsx`에서 이미 `useTenant()`로 구조분해된 값을 그대로 쓴다(별도 import/조회 불필요). `tenantMode`도 파일 상단에서 이미 `displayMode(...)`로 계산돼 있는 기존 변수를 그대로 참조한다(새로 만들지 않는다).

- [ ] **Step 2: 타입체크**

Run: `npx tsc -b`
Expected: 출력 없음

- [ ] **Step 3: 수동 확인**

`npm run dev`에서 비회원 모드 조직 관리자로 로그인 → 햄버거 메뉴 열기 → "공유" 섹션에 "임베드 코드 복사" 항목이 보이는지, 클릭 시 클립보드에 `<iframe>...</iframe>` + `<script>...</script>` 코드가 복사되고 alert이 뜨는지 확인. 회원공유/회원개별 모드 조직 관리자로는 이 항목이 보이지 않는지도 확인.

- [ ] **Step 4: Commit** (사용자 요청 전까지 실행하지 않음)

```bash
git add src/pages/SchedulePage.tsx
git commit -m "feat: 비회원 모드 관리자 햄버거 메뉴에 임베드 코드 복사 추가"
```

---

### Task 7: 브라우저 수동 검증

**Files:** 없음 (검증만 수행). 아래는 로컬에서 iframe 임베드를 흉내 내기 위한 테스트용 정적 HTML — 저장소에 커밋하지 않는다(스크래치 용도).

- [ ] **Step 1: 로컬 iframe 테스트 페이지 준비**

임시 파일(스크래치 디렉터리, 예: `C:\Users\mytur\AppData\Local\Temp\claude\...\scratchpad\embed-test.html`)을 만든다:

```html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>임베드 위젯 테스트</title></head>
<body>
  <h1>외부 사이트 흉내</h1>
  <p>아래가 실제로 임베드될 위젯입니다.</p>
  <iframe id="dts-widget-test" src="http://localhost:5173/embed?tid=<비회원모드테넌트id>"
    style="width:100%;max-width:480px;border:1px solid #ccc;" scrolling="no"></iframe>
  <script>
    window.addEventListener('message', function (e) {
      if (e.data && e.data.source === 'dts-embed' && e.data.type === 'resize') {
        var el = document.getElementById('dts-widget-test');
        if (el) el.style.height = e.data.height + 'px';
      }
    });
  </script>
</body>
</html>
```

이 파일을 브라우저로 직접 열어(`file://` 프로토콜) 확인한다. `<비회원모드테넌트id>`는 실제 비회원 모드 테넌트의 uuid로 교체(마이그레이션 060 검증 때 썼던 "다옴헤어" 등).

- [ ] **Step 2: 로컬 동작 확인 (Vite dev server, X-Frame-Options 영향 없음)**

- [ ] iframe 안에 헤더 크롬 없이 "7월" 타이틀 + 월/주 전환 버튼 + 달력만 꽉 차게 보임
- [ ] 이전/다음 버튼 클릭 시 정상적으로 월/주 이동
- [ ] 월↔주 전환 버튼 클릭 시 정상 전환, 주가 월 경계를 넘는 주간에서도 양쪽 달의 배정이 모두 표시됨
- [ ] 등록된 스케줄 클릭 시 이름 + 커스텀 필드 상세 모달이 뜸
- [ ] 브라우저 크기를 바꾸거나 월/주 전환으로 콘텐츠 높이가 바뀔 때 iframe 높이가 잘려 보이지 않고 자동으로 늘어남(스크롤바 없이)
- [ ] 회원공유/회원개별 모드 테넌트의 `tid`로 같은 iframe을 열면 "이 위젯은 비회원 모드 조직에서만 사용할 수 있습니다" 문구만 조용히 보임(로그인 버튼 없음)
- [ ] 존재하지 않는 `tid`로 열어도 에러 화면 없이 로딩 상태에서 자연스럽게 멈추거나 안내 문구가 뜸(크래시 없음)

- [ ] **Step 3: 배포 후 실제 크로스 오리진 임베드 확인 (운영 배포 이후)**

Task 5(`vercel.json`)가 실제로 배포돼야만 의미 있는 확인 — 로컬 dev 서버는 이 헤더를 적용하지 않는다.

- [ ] 위 Step 1의 테스트 HTML에서 `src`를 운영 URL(`https://<production-domain>/embed?tid=...`)로 바꿔 다시 열었을 때 iframe이 차단되지 않고 정상 표시됨
- [ ] 운영 사이트의 다른 경로(예: `/schedule`, `/admin`)를 같은 방식으로 iframe에 넣으면 여전히 차단됨(브라우저 콘솔에 `frame-ancestors` 위반 에러) — 전역 보호가 유지되는지 회귀 확인
- [ ] 관리자 햄버거 메뉴에서 복사한 실제 임베드 코드를 그대로 테스트 HTML에 붙여 넣어도 동일하게 동작함

- [ ] **Step 4: 임시 테스트 파일 정리**

Step 1에서 스크래치 디렉터리에 만든 `embed-test.html`은 검증이 끝나면 삭제한다(저장소에 커밋되지 않는 위치이므로 별도 조치 불필요, 스크래치 디렉터리 그대로 두어도 무방).

---

## Self-Review 결과 (계획 작성자 자체 점검)

- **spec 커버리지**: 공통 로직 추출(Task 2) · EmbedPage 월/주 전환 + 자동높이(Task 3) · 라우팅(Task 4) ·
  `vercel.json` 경로별 CSP(Task 5) · 관리자 전용 임베드 코드 UI(Task 6) · 수동 검증(Task 7) 모두 설계서
  섹션과 1:1 대응. 설계서의 `ExportButton.tsx` 안 배치는 설계 자체 검토 단계에서 이미
  `SchedulePage.tsx` 햄버거 메뉴로 수정되었고 계획도 그에 맞게 작성됨. 누락 없음.
- **placeholder 스캔**: "TBD"/"나중에 구현" 등 표현 없음. 다만 Task 2 Step 2의 "교체 후" 코드
  예시는 의도적으로 실수(profile 게이트 제거)를 남겨두고 바로 다음 문단에서 "이대로 복사하지
  말 것"이라고 명시했다 — 이는 placeholder가 아니라 구현자가 반드시 원본 `SharePage.tsx`의
  `profile`/`useAuth` 로직을 보존해야 한다는 경고이며, Task 2의 실제 산출물은 "fetch 블록만
  훅 호출로 교체, 나머지(특히 게이트 조건)는 원본 유지"로 명확히 지시되어 있다.
- **타입 일관성**: `useShareTenantSettings`의 반환 필드명(`tenantId`, `timeSlots`, `legendItems`,
  `slotLabels`, `isFreeformTenant`, `tenantModeReady`, `customFields`, `useDynamicFields`,
  `detailFields`)이 Task 2(SharePage)와 Task 3(EmbedPage) 양쪽에서 동일하게 사용됨.
  `getWeekDays(year, month, day)` 시그니처도 Task 1에서 정의한 것과 Task 3의 사용처가 일치.

