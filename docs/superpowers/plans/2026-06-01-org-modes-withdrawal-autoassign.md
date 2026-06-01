# 조직 모드 3종 · 회원 탈퇴 · 자동배정 옵션 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 조직 운영 모드를 3종(회원공유/회원개별/비회원)으로 확장하고, 회원 탈퇴 신청·승인 흐름과 자동배정 옵션(가능 요일, 월별 횟수 제한, 역할 비율)을 추가한다.

**Architecture:** Feature 7(모드)은 DB 변경 없이 타입·프론트엔드만 수정. Feature 8(탈퇴)·Feature 5(자동배정 옵션)는 `tenant_members` 테이블에 컬럼을 추가하는 단일 마이그레이션을 공유한다. 각 기능은 독립적으로 동작하며 구현 순서는 F7 → F8 → F5.

**Tech Stack:** React 19 + TypeScript + Supabase + Tailwind CSS v4

---

## 파일 변경 맵

| 파일 | 변경 유형 | 담당 기능 |
|------|---------|---------|
| `src/types/index.ts` | 수정 | TenantMode 타입, TenantMember 필드 추가 |
| `src/pages/SuperAdminPage.tsx` | 수정 | 3종 모드 UI |
| `src/components/modals/SlotEditModal.tsx` | 수정 | tenantMode 타입 |
| `src/pages/SchedulePage.tsx` | 수정 | tenantMode 정규화, 회원개별 필터, withdrawnUserIds |
| `src/components/schedule/ScheduleGrid.tsx` | 수정 | displayAssignmentFilter, withdrawnUserIds |
| `src/components/schedule/WeekGrid.tsx` | 수정 | displayAssignmentFilter, withdrawnUserIds |
| `src/components/schedule/DayView.tsx` | 수정 | displayAssignmentFilter, withdrawnUserIds |
| `src/components/schedule/TimeSlotCell.tsx` | 수정 | 탈퇴 회원 취소선 |
| `supabase/migrations/016_membership_extensions.sql` | 생성 | 탈퇴·선호 컬럼 추가 |
| `src/pages/DashboardPage.tsx` | 수정 | 탈퇴 신청 버튼 |
| `src/pages/AdminPage.tsx` | 수정 | 탈퇴 승인 UI, 회원 선호 설정 UI, 역할 비율 UI |
| `src/hooks/useAdmin.ts` | 수정 | 탈퇴 승인/거절 함수, 선호 설정 저장 함수 |
| `src/utils/autoAssign.ts` | 수정 | 가능 요일·횟수 제한·역할 비율 반영 |

---

## Phase 1 — Feature 7: 조직 운영 모드 3종

### Task 1: TenantMode 타입 추가 및 TenantSettings 업데이트

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: TenantMode 타입 추가 + TenantSettings 수정**

`src/types/index.ts`에서 `TenantSettings` 인터페이스 바로 위에 타입을 추가하고 `tenant_mode` 필드를 수정한다:

```typescript
// TenantSettings 위에 추가
export type TenantMode = '회원공유' | '회원개별' | '비회원'

// TenantSettings 내부 수정 (기존: tenant_mode?: '직접입력' | '회원선택')
tenant_mode?: TenantMode | '직접입력' | '회원선택'; // 레거시 포함
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit 2>&1
```
Expected: 에러 없음 또는 `tenant_mode` 타입 관련 에러만 (다음 태스크에서 수정)

- [ ] **Step 3: 커밋**

```bash
git add src/types/index.ts
git commit -m "feat: TenantMode 타입 추가 (회원공유/회원개별/비회원)"
```

---

### Task 2: SuperAdminPage — 3종 모드 UI

**Files:**
- Modify: `src/pages/SuperAdminPage.tsx`

- [ ] **Step 1: CreateForm 타입 + EMPTY_FORM 수정**

`CreateForm` 인터페이스에서 `tenant_mode` 타입을 수정:

```typescript
// 파일 상단 import에 TenantMode 추가
import type { Tenant, TenantMode } from '../types'

// CreateForm 내부
tenant_mode: TenantMode

// EMPTY_FORM
const EMPTY_FORM: CreateForm = { slug: '', name: '', business_type: '', title: '', theme_color: '', tenant_mode: '회원공유' }
```

- [ ] **Step 2: displayMode 헬퍼 함수 추가**

`SLUG_RE` 상수 아래에 추가:

```typescript
function displayMode(raw: string | undefined): TenantMode {
  if (raw === '회원선택') return '회원공유'
  if (raw === '직접입력') return '비회원'
  return (raw as TenantMode) ?? '회원공유'
}
```

- [ ] **Step 3: 조직 목록의 모드 토글 버튼 → 3종 select로 교체**

기존 `saveMode()` 호출 버튼(onClick으로 2종 토글)을 `<select>`로 교체:

```tsx
<select
  value={displayMode(t.settings?.tenant_mode)}
  disabled={modeSaving}
  onChange={async e => {
    setModeSaving(true)
    const newMode = e.target.value as TenantMode
    const { data, error } = await supabase
      .from('tenants')
      .update({ settings: { ...t.settings, tenant_mode: newMode } })
      .eq('id', t.id)
      .select()
      .single()
    if (!error && data) setTenants(prev => prev.map(x => x.id === t.id ? data : x))
    setModeSaving(false)
  }}
  className="px-2 py-1 text-xs border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text-secondary)] disabled:opacity-40"
>
  <option value="회원공유">회원공유</option>
  <option value="회원개별">회원개별</option>
  <option value="비회원">비회원</option>
</select>
```

기존 `saveMode()` 함수는 삭제한다.

- [ ] **Step 4: 조직 생성 폼 라디오 버튼 3종으로 교체**

기존 `['회원선택', '직접입력']` 배열을 `['회원공유', '회원개별', '비회원']`으로 변경:

```tsx
{(['회원공유', '회원개별', '비회원'] as const).map(mode => (
  <label key={mode} className="flex items-center gap-1.5 cursor-pointer">
    <input
      type="radio"
      name="tenant_mode"
      value={mode}
      checked={form.tenant_mode === mode}
      onChange={() => setForm(prev => ({ ...prev, tenant_mode: mode }))}
      className="accent-[var(--color-brand-primary)]"
    />
    <span className="text-sm text-[var(--color-text-secondary)]">{mode}</span>
  </label>
))}
```

- [ ] **Step 5: 타입 체크**

```bash
npx tsc --noEmit 2>&1
```
Expected: 에러 없음

- [ ] **Step 6: 커밋**

```bash
git add src/pages/SuperAdminPage.tsx
git commit -m "feat: SuperAdminPage 조직 모드 3종 UI 적용"
```

---

### Task 3: SlotEditModal — tenantMode 타입 업데이트

**Files:**
- Modify: `src/components/modals/SlotEditModal.tsx`

- [ ] **Step 1: import TenantMode + prop 타입 수정**

파일 상단 import에 TenantMode 추가:

```typescript
import type { ..., TenantMode } from '../../types'
```

Props 인터페이스에서 `tenantMode` 타입 수정:

```typescript
// 기존: tenantMode?: '직접입력' | '회원선택'
tenantMode?: TenantMode | '직접입력' | '회원선택'
```

`isFreeform` 계산 수정:

```typescript
// 기존: const isFreeform = tenantMode === '직접입력'
const isFreeform = tenantMode === '비회원' || tenantMode === '직접입력'
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit 2>&1
```
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/modals/SlotEditModal.tsx
git commit -m "feat: SlotEditModal tenantMode 3종 타입 지원"
```

---

### Task 4: SchedulePage — tenantMode 정규화 + 회원개별 필터

**Files:**
- Modify: `src/pages/SchedulePage.tsx`

- [ ] **Step 1: import TenantMode**

```typescript
import type { ..., TenantMode } from '../types'
```

- [ ] **Step 2: tenantMode 정규화**

기존 `const tenantMode = tenant?.settings?.tenant_mode ?? '회원선택'` 를 교체:

```typescript
const rawMode = tenant?.settings?.tenant_mode ?? '회원선택'
const tenantMode: TenantMode =
  rawMode === '회원선택' ? '회원공유' :
  rawMode === '직접입력' ? '비회원' :
  rawMode as TenantMode
```

- [ ] **Step 3: 기존 tenantMode 조건 업데이트**

```typescript
// 기존: if (tenantMode !== '회원선택') return  →
if (tenantMode === '비회원') return

// 기존: tenantMode === '회원선택' && ... (자기배정 제한)  →
tenantMode !== '비회원' && ...

// 기존: {tenantMode === '회원선택' && (<button>자동배정...)}  →
{tenantMode !== '비회원' && (<button>자동배정...)}
```

- [ ] **Step 4: 회원개별 필터 상태 + displayAssignmentFilter**

기존 상태 선언 블록 아래에 추가:

```typescript
const [filterMemberId, setFilterMemberId] = useState<string | null>(null)

const displayAssignmentFilter = useMemo<((a: Assignment) => boolean) | undefined>(() => {
  if (tenantMode !== '회원개별') return undefined
  if (isPrivileged) {
    return filterMemberId ? (a) => a.user_id === filterMemberId : undefined
  }
  return (a) => a.user_id === (profile?.id ?? '')
}, [tenantMode, isPrivileged, filterMemberId, profile?.id])
```

- [ ] **Step 5: 회원개별 모드 회원 필터 드롭다운 UI**

툴바에서 자동배정 버튼 위에 추가:

```tsx
{tenantMode === '회원개별' && isPrivileged && (
  <select
    value={filterMemberId ?? ''}
    onChange={e => setFilterMemberId(e.target.value || null)}
    className="px-2 py-1 text-xs border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
  >
    <option value="">전체 회원</option>
    {profiles.map(p => (
      <option key={p.id} value={p.id}>{p.name}</option>
    ))}
  </select>
)}
```

- [ ] **Step 6: 그리드에 displayAssignmentFilter 전달**

`ScheduleGrid`, `WeekGrid`, `DayView` 모두에 prop 추가:

```tsx
<ScheduleGrid
  ...
  displayAssignmentFilter={displayAssignmentFilter}
/>
<WeekGrid
  ...
  displayAssignmentFilter={displayAssignmentFilter}
/>
<DayView
  ...
  displayAssignmentFilter={displayAssignmentFilter}
/>
```

- [ ] **Step 7: 타입 체크**

```bash
npx tsc --noEmit 2>&1
```
Expected: displayAssignmentFilter prop 관련 에러 (Task 5에서 해결)

- [ ] **Step 8: 커밋**

```bash
git add src/pages/SchedulePage.tsx
git commit -m "feat: tenantMode 3종 정규화 및 회원개별 필터 추가"
```

---

### Task 5: 그리드 컴포넌트 — displayAssignmentFilter + cellState 필터 적용

**Files:**
- Modify: `src/components/schedule/ScheduleGrid.tsx`
- Modify: `src/components/schedule/WeekGrid.tsx`
- Modify: `src/components/schedule/DayView.tsx`

각 파일에 동일한 패턴을 적용한다.

- [ ] **Step 1: ScheduleGrid Props에 displayAssignmentFilter 추가**

```typescript
interface Props {
  ...
  displayAssignmentFilter?: (a: Assignment) => boolean
}
```

함수 시그니처에도 추가:
```typescript
export function ScheduleGrid({
  ..., displayAssignmentFilter,
}: Props) {
```

- [ ] **Step 2: cellState 계산 후 displayCellState 생성**

ScheduleGrid 내부에서 `getCellState` 호출 직후:

```typescript
const cellState = getCellState(day, slot, year, month, scheduleRules, slotSettings, dateOverrides, assignments)
const displayCellState = displayAssignmentFilter
  ? { ...cellState, assignments: cellState.assignments.filter(displayAssignmentFilter) }
  : cellState
```

모든 `<TimeSlotCell cellState={cellState}` → `<TimeSlotCell cellState={displayCellState}`로 교체.

- [ ] **Step 3: WeekGrid, DayView에 동일 패턴 적용**

WeekGrid와 DayView도 Step 1~2와 동일하게 수정한다. 각 파일에서 `getCellState` 호출 후 `displayCellState`를 생성하고 `TimeSlotCell`에 전달.

- [ ] **Step 4: 타입 체크**

```bash
npx tsc --noEmit 2>&1
```
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/components/schedule/ScheduleGrid.tsx src/components/schedule/WeekGrid.tsx src/components/schedule/DayView.tsx
git commit -m "feat: 회원개별 모드 displayAssignmentFilter 그리드 적용"
```

---

## Phase 2 — Feature 8: 회원 탈퇴

### Task 6: DB 마이그레이션

**Files:**
- Create: `supabase/migrations/016_membership_extensions.sql`

- [ ] **Step 1: 마이그레이션 파일 생성**

```sql
-- supabase/migrations/016_membership_extensions.sql

ALTER TABLE tenant_members
  ADD COLUMN IF NOT EXISTS withdrawal_status        text NOT NULL DEFAULT 'none'
    CHECK (withdrawal_status IN ('none', 'pending', 'approved')),
  ADD COLUMN IF NOT EXISTS withdrawal_requested_at  timestamptz,
  ADD COLUMN IF NOT EXISTS withdrawal_approved_at   timestamptz,
  ADD COLUMN IF NOT EXISTS available_days           int[]  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS monthly_limit            int    DEFAULT NULL;
```

- [ ] **Step 2: 커밋**

```bash
git add supabase/migrations/016_membership_extensions.sql
git commit -m "feat: tenant_members 탈퇴·선호 설정 컬럼 추가 마이그레이션"
```

---

### Task 7: TenantMember 타입 업데이트

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: TenantMember에 필드 추가**

```typescript
export interface TenantMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: TenantAccessRole;
  role_id: string | null;
  is_approved: boolean;
  created_at: string;
  // Feature 8 — 탈퇴
  withdrawal_status: 'none' | 'pending' | 'approved';
  withdrawal_requested_at: string | null;
  withdrawal_approved_at: string | null;
  // Feature 5 — 자동배정 선호
  available_days: number[] | null;   // 0=일, 1=월 ... 6=토, null=제한없음
  monthly_limit: number | null;      // null=제한없음
}
```

- [ ] **Step 2: TenantSettings에 role_ratios 추가**

```typescript
export interface TenantSettings {
  ...
  role_ratios?: Record<string, number>; // roleId → 퍼센트, 합계 100
}
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit 2>&1
```
Expected: `withdrawal_status` 접근 관련 에러 (기존 코드에서 아직 없는 필드) — 기존 코드가 이 필드를 쓰지 않으므로 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/types/index.ts
git commit -m "feat: TenantMember 탈퇴·선호 설정 타입 필드 추가"
```

---

### Task 8: useAdmin — 탈퇴 승인/거절 함수 추가

**Files:**
- Modify: `src/hooks/useAdmin.ts`

- [ ] **Step 1: approveWithdrawal 함수 추가**

기존 `approveUser` 함수 아래에 추가:

```typescript
const approveWithdrawal = useCallback(async (userId: string): Promise<string | null> => {
  const { error } = await supabase
    .from('tenant_members')
    .update({
      withdrawal_status: 'approved',
      withdrawal_approved_at: new Date().toISOString(),
      is_approved: false,
    })
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
  if (!error) {
    setMembers(prev => prev.map(m =>
      m.user_id === userId
        ? { ...m, withdrawal_status: 'approved' as const, is_approved: false }
        : m
    ))
  }
  return error?.message ?? null
}, [tenantId])

const rejectWithdrawal = useCallback(async (userId: string): Promise<string | null> => {
  const { error } = await supabase
    .from('tenant_members')
    .update({ withdrawal_status: 'none', withdrawal_requested_at: null })
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
  if (!error) {
    setMembers(prev => prev.map(m =>
      m.user_id === userId
        ? { ...m, withdrawal_status: 'none' as const, withdrawal_requested_at: null }
        : m
    ))
  }
  return error?.message ?? null
}, [tenantId])
```

반환 객체에 두 함수 추가:
```typescript
return { ..., approveWithdrawal, rejectWithdrawal }
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit 2>&1
```

- [ ] **Step 3: 커밋**

```bash
git add src/hooks/useAdmin.ts
git commit -m "feat: useAdmin 탈퇴 승인/거절 함수 추가"
```

---

### Task 9: DashboardPage — 탈퇴 신청 버튼

**Files:**
- Modify: `src/pages/DashboardPage.tsx`

- [ ] **Step 1: 탈퇴 신청 핸들러 추가**

컴포넌트 내부에 추가:

```typescript
const currentMembership = memberships.find(m => m.tenant_id === tenant?.id)

async function handleWithdrawalRequest() {
  if (!confirm('정말 이 조직에서 탈퇴를 신청하시겠습니까?\n관리자 승인 후 처리됩니다.')) return
  const { error } = await supabase
    .from('tenant_members')
    .update({
      withdrawal_status: 'pending',
      withdrawal_requested_at: new Date().toISOString(),
    })
    .eq('tenant_id', tenant!.id)
    .eq('user_id', profile!.id)
  if (!error) {
    // TenantContext memberships 갱신을 위해 페이지 새로고침
    window.location.reload()
  }
}
```

- [ ] **Step 2: 탈퇴 버튼 UI 추가**

페이지 하단(기존 콘텐츠 마지막)에 추가:

```tsx
{currentMembership && currentMembership.withdrawal_status === 'none' && (
  <div className="mt-8 pt-4 border-t border-[var(--color-border)]">
    <button
      onClick={handleWithdrawalRequest}
      className="text-xs text-[var(--color-text-muted)] hover:text-red-500 underline transition-colors"
    >
      조직 탈퇴 신청
    </button>
  </div>
)}
{currentMembership?.withdrawal_status === 'pending' && (
  <div className="mt-8 pt-4 border-t border-[var(--color-border)]">
    <p className="text-xs text-amber-600">탈퇴 신청이 처리 중입니다. 관리자 승인을 기다려주세요.</p>
  </div>
)}
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit 2>&1
```

- [ ] **Step 4: 커밋**

```bash
git add src/pages/DashboardPage.tsx
git commit -m "feat: DashboardPage 조직 탈퇴 신청 버튼 추가"
```

---

### Task 10: AdminPage — 탈퇴 승인 UI

**Files:**
- Modify: `src/pages/AdminPage.tsx`

- [ ] **Step 1: approveWithdrawal, rejectWithdrawal import**

`useAdmin` 훅에서 두 함수를 구조분해:

```typescript
const { ..., approveWithdrawal, rejectWithdrawal } = useAdmin(tenant?.id ?? '')
```

- [ ] **Step 2: 승인대기 탭에 탈퇴 신청 섹션 추가**

기존 가입 승인 섹션 아래에 추가:

```tsx
{/* 탈퇴 신청 */}
{(() => {
  const withdrawalPending = members.filter(m => m.withdrawal_status === 'pending')
  if (!withdrawalPending.length) return null
  return (
    <div className="mt-6">
      <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold mb-3">
        탈퇴 신청 ({withdrawalPending.length}건)
      </p>
      <div className="space-y-2">
        {withdrawalPending.map(m => (
          <div key={m.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{m.profile?.name}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                신청일: {m.withdrawal_requested_at
                  ? new Date(m.withdrawal_requested_at).toLocaleDateString('ko-KR')
                  : '-'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => approveWithdrawal(m.user_id)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                승인
              </button>
              <button
                onClick={() => rejectWithdrawal(m.user_id)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                거절
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})()}
```

- [ ] **Step 3: 승인대기 탭 뱃지에 탈퇴 신청 카운트 포함**

기존 `members.filter(m => !m.is_approved).length` 카운트를 유지하되 탈퇴 신청을 별도 섹션으로만 표시(기존 뱃지 변경 불필요).

- [ ] **Step 4: 타입 체크**

```bash
npx tsc --noEmit 2>&1
```

- [ ] **Step 5: 커밋**

```bash
git add src/pages/AdminPage.tsx
git commit -m "feat: AdminPage 탈퇴 신청 승인/거절 UI 추가"
```

---

### Task 11: SchedulePage + TimeSlotCell — 탈퇴 회원 취소선

**Files:**
- Modify: `src/pages/SchedulePage.tsx`
- Modify: `src/components/schedule/TimeSlotCell.tsx`
- Modify: `src/components/schedule/ScheduleGrid.tsx`
- Modify: `src/components/schedule/WeekGrid.tsx`
- Modify: `src/components/schedule/DayView.tsx`

- [ ] **Step 1: SchedulePage — withdrawnUserIds 계산**

`displayAssignmentFilter` useMemo 아래에 추가:

```typescript
const withdrawnUserIds = useMemo(() => new Set(
  memberships
    .filter(m => m.tenant_id === tenant?.id && m.withdrawal_status === 'approved')
    .map(m => m.user_id)
), [memberships, tenant?.id])
```

그리드 컴포넌트에 전달:
```tsx
<ScheduleGrid ... withdrawnUserIds={withdrawnUserIds} />
<WeekGrid     ... withdrawnUserIds={withdrawnUserIds} />
<DayView      ... withdrawnUserIds={withdrawnUserIds} />
```

- [ ] **Step 2: ScheduleGrid/WeekGrid/DayView — withdrawnUserIds prop 추가 + TimeSlotCell 전달**

각 파일의 Props 인터페이스에 추가:
```typescript
withdrawnUserIds?: Set<string>
```

`<TimeSlotCell`에 prop 전달:
```tsx
<TimeSlotCell
  cellState={displayCellState}
  withdrawnUserIds={withdrawnUserIds}
  ...
/>
```

- [ ] **Step 3: TimeSlotCell — Props 및 NameChips 수정**

`TimeSlotCell` Props에 추가:
```typescript
withdrawnUserIds?: Set<string>
```

`NameChips` 함수 시그니처에 추가:
```typescript
function NameChips({ assignments, highlightName, tintBg, tintInk, teamLeaderUserIds, small, showTimeSub, withdrawnUserIds }: {
  ...
  withdrawnUserIds?: Set<string>
})
```

`NameChips` 내부 chip 렌더링에 취소선 추가:

```tsx
// 기존 chip span에 className 조건 추가
const isWithdrawn = withdrawnUserIds?.has(a.user_id)
<span
  key={a.id}
  className={`... ${isWithdrawn ? 'line-through opacity-50' : ''}`}
  title={isWithdrawn ? '탈퇴한 회원' : undefined}
>
```

모든 `<NameChips` 호출에 `withdrawnUserIds={withdrawnUserIds}` 추가.

- [ ] **Step 4: 타입 체크**

```bash
npx tsc --noEmit 2>&1
```
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/pages/SchedulePage.tsx src/components/schedule/ScheduleGrid.tsx src/components/schedule/WeekGrid.tsx src/components/schedule/DayView.tsx src/components/schedule/TimeSlotCell.tsx
git commit -m "feat: 탈퇴 회원 배정 취소선 표시"
```

---

## Phase 3 — Feature 5: 자동배정 옵션

### Task 12: AdminPage — 회원 선호 설정 UI (가능 요일, 월별 횟수 제한)

**Files:**
- Modify: `src/pages/AdminPage.tsx`

- [ ] **Step 1: saveMemberPreference 함수 추가**

컴포넌트 내부 함수로 추가:

```typescript
async function saveMemberPreference(
  userId: string,
  availableDays: number[] | null,
  monthlyLimit: number | null
): Promise<string | null> {
  const { error } = await supabase
    .from('tenant_members')
    .update({ available_days: availableDays, monthly_limit: monthlyLimit })
    .eq('tenant_id', tenant!.id)
    .eq('user_id', userId)
  if (!error) {
    setMembers(prev => prev.map(m =>
      m.user_id === userId
        ? { ...m, available_days: availableDays, monthly_limit: monthlyLimit }
        : m
    ))
  }
  return error?.message ?? null
}
```

- [ ] **Step 2: 회원 선호 설정 상태 관리**

```typescript
const [expandedPrefUserId, setExpandedPrefUserId] = useState<string | null>(null)
const [prefDays, setPrefDays] = useState<number[]>([])
const [prefLimit, setPrefLimit] = useState<string>('')
```

- [ ] **Step 3: 회원 목록 각 행에 "설정" 버튼 + 인라인 패널 추가**

회원 목록 렌더링 부분에서 각 멤버 항목 아래에 추가:

```tsx
{/* 설정 버튼 */}
<button
  onClick={() => {
    if (expandedPrefUserId === m.user_id) {
      setExpandedPrefUserId(null)
      return
    }
    setExpandedPrefUserId(m.user_id)
    setPrefDays(m.available_days ?? [])
    setPrefLimit(m.monthly_limit?.toString() ?? '')
  }}
  className="px-2 py-1 text-[10px] border border-[var(--color-border)] rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]"
>
  자동배정 설정
</button>

{/* 인라인 패널 */}
{expandedPrefUserId === m.user_id && (
  <div className="mt-2 p-3 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] space-y-3">
    {/* 가능 요일 */}
    <div>
      <p className="text-[10px] font-semibold text-[var(--color-text-muted)] mb-1.5">가능 요일 (미선택 = 모든 요일)</p>
      <div className="flex gap-2">
        {['일','월','화','수','목','금','토'].map((label, idx) => (
          <label key={idx} className="flex flex-col items-center gap-0.5 cursor-pointer">
            <input
              type="checkbox"
              checked={prefDays.includes(idx)}
              onChange={() => setPrefDays(prev =>
                prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx].sort()
              )}
              className="accent-[var(--color-brand-primary)]"
            />
            <span className="text-[10px] text-[var(--color-text-secondary)]">{label}</span>
          </label>
        ))}
      </div>
    </div>
    {/* 월별 횟수 제한 */}
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">월별 최대 횟수</span>
      <input
        type="number" min={1} max={99}
        value={prefLimit}
        onChange={e => setPrefLimit(e.target.value)}
        placeholder="제한없음"
        className="w-16 border border-[var(--color-border-strong)] rounded-lg px-2 py-1 text-xs text-center bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none"
      />
      <span className="text-[10px] text-[var(--color-text-muted)]">회 (빈칸=무제한)</span>
    </div>
    {/* 저장 */}
    <button
      onClick={async () => {
        const days = prefDays.length === 0 ? null : prefDays
        const limit = prefLimit ? parseInt(prefLimit, 10) : null
        const err = await saveMemberPreference(m.user_id, days, limit)
        if (!err) setExpandedPrefUserId(null)
      }}
      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-hover)]"
    >
      저장
    </button>
  </div>
)}
```

- [ ] **Step 4: 타입 체크**

```bash
npx tsc --noEmit 2>&1
```

- [ ] **Step 5: 커밋**

```bash
git add src/pages/AdminPage.tsx
git commit -m "feat: AdminPage 회원별 자동배정 선호 설정 UI"
```

---

### Task 13: AdminPage — 역할 비율 설정 UI

**Files:**
- Modify: `src/pages/AdminPage.tsx`

- [ ] **Step 1: 역할 비율 상태**

```typescript
const [roleRatios, setRoleRatios] = useState<Record<string, number>>({})
const [ratioSaving, setRatioSaving] = useState(false)
```

settings 로드 시 초기화 (기존 settings useEffect 내):
```typescript
setRoleRatios(s.role_ratios ?? {})
```

- [ ] **Step 2: handleRatioSave 함수**

```typescript
async function handleRatioSave() {
  const total = Object.values(roleRatios).reduce((s, v) => s + v, 0)
  if (Object.keys(roleRatios).length > 0 && total !== 100) {
    setSettingsError('역할 비율의 합계는 100%이어야 합니다.')
    return
  }
  setRatioSaving(true)
  const merged = { ...settings, role_ratios: roleRatios }
  const { error } = await supabase
    .from('tenants')
    .update({ settings: merged })
    .eq('id', tenant!.id)
  if (!error) setMessage('역할 비율이 저장됐습니다.')
  else setSettingsError(error.message)
  setRatioSaving(false)
}
```

- [ ] **Step 3: Settings 탭에 역할 비율 UI 추가**

기존 설정 UI의 마지막 섹션 아래에 추가 (tenantRoles가 있을 때만 표시):

```tsx
{tenantRoles.length > 0 && (
  <div className="pt-4 border-t border-[var(--color-border)]">
    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold mb-3">
      자동배정 역할 비율 (합계 100%)
    </p>
    <div className="space-y-2">
      {tenantRoles.map(role => (
        <div key={role.id} className="flex items-center gap-3">
          <span className="text-sm text-[var(--color-text-secondary)] w-32 shrink-0">{role.name}</span>
          <input
            type="number" min={0} max={100}
            value={roleRatios[role.id] ?? 0}
            onChange={e => setRoleRatios(prev => ({ ...prev, [role.id]: parseInt(e.target.value, 10) || 0 }))}
            className="w-16 border border-[var(--color-border-strong)] rounded-lg px-2 py-1 text-sm text-center bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none"
          />
          <span className="text-xs text-[var(--color-text-muted)]">%</span>
        </div>
      ))}
      <p className="text-xs text-[var(--color-text-muted)]">
        합계: {Object.values(roleRatios).reduce((s, v) => s + v, 0)}%
        {Object.values(roleRatios).reduce((s, v) => s + v, 0) !== 100 && Object.keys(roleRatios).length > 0
          ? <span className="text-red-500 ml-1">(100%이 아닙니다)</span>
          : null}
      </p>
    </div>
    <button
      onClick={handleRatioSave}
      disabled={ratioSaving}
      className="mt-3 px-4 py-2 text-sm font-semibold rounded-xl bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-hover)] disabled:opacity-50"
    >
      {ratioSaving ? '저장 중...' : '비율 저장'}
    </button>
  </div>
)}
```

- [ ] **Step 4: 타입 체크**

```bash
npx tsc --noEmit 2>&1
```

- [ ] **Step 5: 커밋**

```bash
git add src/pages/AdminPage.tsx
git commit -m "feat: AdminPage 역할별 자동배정 비율 설정 UI"
```

---

### Task 14: autoAssign.ts — 제약 조건 적용

**Files:**
- Modify: `src/utils/autoAssign.ts`

- [ ] **Step 1: MemberPreference 인터페이스 + AutoAssignParams 확장**

기존 인터페이스 아래에 추가:

```typescript
export interface MemberPreference {
  availableDays: number[] | null
  monthlyLimit: number | null
}
```

`AutoAssignParams` 인터페이스에 추가:

```typescript
interface AutoAssignParams {
  ...
  memberPreferences?: Map<string, MemberPreference>  // userId → preference
  roleRatios?: Record<string, number>                // roleId → percent
}
```

- [ ] **Step 2: computeAutoAssignments 함수 — 가능 요일 필터 적용**

기존 함수 내부에서 멤버 배열을 필터링하는 부분 (각 day loop 내):

```typescript
const dayOfWeek = new Date(year, month - 1, day).getDay()

// 가능 요일 필터
const eligibleMembers = members.filter(m => {
  const pref = memberPreferences?.get(m.id)
  if (!pref?.availableDays || pref.availableDays.length === 0) return true
  return pref.availableDays.includes(dayOfWeek)
})
```

- [ ] **Step 3: 월별 횟수 제한 필터 적용**

기존 라운드로빈 배정 전, 멤버별 이번 달 배정 수를 카운트하는 로직 추가:

```typescript
// 현재 달 기존 배정 수 계산 (AutoAssignParams.assignments 사용)
const assignCountThisMonth: Record<string, number> = {}
for (const a of assignments) {  // params.assignments = 해당 월 기존 배정
  if (a.user_id) {
    assignCountThisMonth[a.user_id] = (assignCountThisMonth[a.user_id] ?? 0) + 1
  }
}

// 횟수 제한 필터 (라운드로빈 시 적용)
function isUnderLimit(userId: string): boolean {
  const pref = memberPreferences?.get(userId)
  if (!pref?.monthlyLimit) return true
  return (assignCountThisMonth[userId] ?? 0) < pref.monthlyLimit
}

// 배정 시마다 카운트 증가
assignCountThisMonth[chosenMember.id] = (assignCountThisMonth[chosenMember.id] ?? 0) + 1
```

라운드로빈 루프에서 `isUnderLimit` 체크 추가:
```typescript
// sortedMembers 순회 시
const next = sortedMembers.find((m, i) =>
  i >= currentIdx && isUnderLimit(m.id)
) ?? sortedMembers.find(m => isUnderLimit(m.id))
if (!next) break  // 모든 멤버가 한도 초과
```

- [ ] **Step 4: 역할 비율 적용 (비split 모드)**

역할 비율이 있을 때 volunteer/50plus 슬롯 할당 수 계산:

```typescript
// 비split 모드 빈슬롯 분배 시
if (roleRatios && Object.keys(roleRatios).length > 0) {
  const totalEmpty = emptySlots.length
  const volunteerRatio = (roleRatios['volunteer'] ?? 50) / 100
  const plusRatio = (roleRatios['50plus'] ?? 50) / 100
  const volunteerCount = Math.round(totalEmpty * volunteerRatio)
  // volunteerCount개는 volunteer 타입으로, 나머지는 50plus 타입으로 배정
}
```

- [ ] **Step 5: 타입 체크**

```bash
npx tsc --noEmit 2>&1
```
Expected: 에러 없음

- [ ] **Step 6: 커밋**

```bash
git add src/utils/autoAssign.ts
git commit -m "feat: autoAssign 가능요일·횟수제한·역할비율 제약 적용"
```

---

### Task 15: SchedulePage — memberPreferences 로드 및 전달

**Files:**
- Modify: `src/pages/SchedulePage.tsx`

- [ ] **Step 1: memberPreferences 계산**

```typescript
const memberPreferences = useMemo(() => {
  const map = new Map<string, MemberPreference>()
  for (const m of memberships) {
    if (m.tenant_id === tenant?.id) {
      map.set(m.user_id, {
        availableDays: m.available_days,
        monthlyLimit: m.monthly_limit,
      })
    }
  }
  return map
}, [memberships, tenant?.id])
```

- [ ] **Step 2: handleAutoAssign에 memberPreferences + roleRatios 전달**

```typescript
const proposals = computeAutoAssignments({
  ...existingParams,
  memberPreferences,
  roleRatios: tenant?.settings?.role_ratios,
  volunteerLabel: typeLabels.volunteer,
})
```

- [ ] **Step 3: MemberPreference import 추가**

```typescript
import type { MemberPreference } from '../utils/autoAssign'
```

- [ ] **Step 4: 타입 체크**

```bash
npx tsc --noEmit 2>&1
```
Expected: 에러 없음

- [ ] **Step 5: 최종 커밋**

```bash
git add src/pages/SchedulePage.tsx
git commit -m "feat: SchedulePage 자동배정 선호설정·역할비율 파라미터 전달"
```

---

## 완료 체크리스트

- [ ] Feature 7: `'회원공유' | '회원개별' | '비회원'` 3종 모드 동작 확인
  - 기존 `'회원선택'` 조직 → `'회원공유'`로 표시
  - 회원개별 모드에서 관리자는 전체 배정 + 필터 가능
  - 회원개별 모드에서 일반 회원은 본인 배정만 표시
- [ ] Feature 8: 탈퇴 신청 → 관리자 승인 → 취소선 표시 확인
- [ ] Feature 5: 자동배정 시 가능 요일 외 회원 제외 확인
- [ ] Feature 5: 자동배정 시 월별 한도 초과 회원 제외 확인
- [ ] `npx tsc --noEmit` 에러 없음
