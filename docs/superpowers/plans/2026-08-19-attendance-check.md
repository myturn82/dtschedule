# 출석 체크 (수동) 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `attendance` feature flag가 켜진 조직에서 관리자가 슬롯 팝업 내 배정 행마다 출석 여부를 체크하고, AdminPage에서 기간별 출석 현황을 조회한다.

**Architecture:** `assignments.attended_at` 컬럼에 타임스탬프를 기록하는 방식. `null` = 미확인, 값 있음 = 출석. SlotEditModal에 `onToggleAttend` 콜백을 추가하고, SchedulePage에서 supabase UPDATE를 실행한다. AdminPage에 `attendance` 탭을 추가해 기간별 출석률을 조회한다.

**Tech Stack:** Supabase (PostgreSQL + RLS), React, TypeScript, Tailwind CSS

**Spec:** `docs/strategy/multi-app-portfolio-strategy-2026-07-29.md` — 출석 체크 기능 (CLASS:ON, CARE:ON, SERVE:ON 대상)

## Global Constraints

- `attendance` feature flag(`getFF(ff, 'attendance')`)가 true인 조직에서만 UI 노출
- 출석 체크 UI는 관리자(`isAdmin`)만 사용 가능
- 타입 체크: `npx tsc -b` (루트의 `npx tsc --noEmit` 는 검사 안 함)
- 마이그레이션은 개발 DB(`mcuszdvophmqrwostcah`)에만 반영, 운영 반영은 사용자 승인 후
- 하드코딩 금지 — 출석 관련 레이블은 향후 i18n 확장 가능하도록 문자열 상수로 분리하지 않고 인라인으로 작성 (현재 프로젝트 패턴 준수)

---

### Task 1: DB 마이그레이션 — attended_at 컬럼 추가

**Files:**
- Create: `supabase/migrations/089_attendance.sql`

**Interfaces:**
- Produces: `assignments.attended_at timestamptz` 컬럼, 어드민 UPDATE 허용 RLS 정책

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- supabase/migrations/089_attendance.sql
-- 출석 체크: assignments 테이블에 attended_at 컬럼 추가

ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS attended_at timestamptz DEFAULT NULL;

-- 어드민이 attended_at을 업데이트할 수 있도록 정책 추가
-- (기존 admin UPDATE 정책이 있으나, attended_at 전용 정책으로 명시적 허용)
CREATE POLICY "admin can update attendance"
  ON assignments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_members tm
      WHERE tm.tenant_id = assignments.tenant_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_members tm
      WHERE tm.tenant_id = assignments.tenant_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
    )
  );
```

- [ ] **Step 2: 개발 DB에 적용**

```
npx supabase db push --project-ref mcuszdvophmqrwostcah
```

- [ ] **Step 3: 적용 확인**

Supabase 대시보드 → Table Editor → assignments 테이블에서 `attended_at` 컬럼 존재 확인.

---

### Task 2: Assignment 타입에 attended_at 추가

**Files:**
- Modify: `src/types/index.ts:233-254`

**Interfaces:**
- Consumes: 없음
- Produces: `Assignment.attended_at?: string | null` — Task 3, 4, 5에서 사용

- [ ] **Step 1: Assignment 인터페이스에 필드 추가**

`src/types/index.ts` 의 `Assignment` 인터페이스 (`is_locked` 줄 아래)에 한 줄 추가:

```ts
export interface Assignment {
  id: string;
  tenant_id: string;
  year: number;
  month: number;
  day: number;
  time_slot: TimeSlot;
  member_name: string;
  note: string | null;
  member_type: MemberType;
  time_sub: string | null;
  color: string | null;
  user_id: string | null;
  role_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  extra_data?: Record<string, string>;
  lesson_package_id?: string | null;
  is_locked: boolean;
  account_deleted: boolean;
  attended_at: string | null;   // ← 추가
  created_at: string;
}
```

- [ ] **Step 2: 타입 체크**

```
npx tsc -b
```

에러 없으면 완료. `attended_at` 를 읽는 기존 코드가 없으므로 에러는 발생하지 않는다.

- [ ] **Step 3: 커밋**

```
git add src/types/index.ts supabase/migrations/089_attendance.sql
git commit -m "feat: add attended_at to assignments (attendance check)"
```

---

### Task 3: SlotEditModal — 출석 체크 UI 추가

**Files:**
- Modify: `src/components/modals/SlotEditModal.tsx`

**Interfaces:**
- Consumes: `Assignment.attended_at` (Task 2), `getFF(ff, 'attendance')` from `featureFlags`
- Produces: `onToggleAttend?: (id: string, attended: boolean) => Promise<string | null>` prop — Task 4에서 구현

배정 목록을 렌더하는 행마다 출석 체크 버튼을 추가한다. 버튼은 `isAdmin && getFF(tenantFF, 'attendance')` 일 때만 표시.

- [ ] **Step 1: Props 인터페이스에 onToggleAttend 추가**

`src/components/modals/SlotEditModal.tsx` 의 `interface Props` (line 21 근처):

```ts
interface Props {
  // ... 기존 props ...
  onToggleAttend?: (id: string, attended: boolean) => Promise<string | null>
}
```

함수 시그니처에도 비구조화 추가:

```ts
export function SlotEditModal({
  // ... 기존 ...
  onToggleLock, isHighlighted, onToggleHighlight,
  onToggleAttend,   // ← 추가
}: Props) {
```

- [ ] **Step 2: 출석 체크 버튼 렌더링**

SlotEditModal 안에서 배정 목록을 렌더하는 각 행(assignment row)을 찾아, 행의 액션 버튼 영역(삭제·잠금 버튼 옆)에 아래 버튼을 추가한다.

조건: `onToggleAttend && isAdmin` 일 때만 렌더.

```tsx
{onToggleAttend && isAdmin && (
  <button
    type="button"
    title={a.attended_at ? '출석 취소' : '출석 확인'}
    disabled={loading}
    onClick={async () => {
      const err = await onToggleAttend(a.id, !a.attended_at)
      if (err) setError(err)
    }}
    className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-colors ${
      a.attended_at
        ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-secondary)]'
    }`}
  >
    {/* 체크 아이콘 */}
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  </button>
)}
```

배정 행에 출석 뱃지도 추가 (이름 옆 소형 뱃지, `attended_at` 있을 때만):

```tsx
{a.attended_at && (
  <span className="shrink-0 text-[10px] font-bold px-2 py-[2px] rounded-full text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400">
    출석
  </span>
)}
```

- [ ] **Step 3: 타입 체크**

```
npx tsc -b
```

- [ ] **Step 4: 커밋**

```
git add src/components/modals/SlotEditModal.tsx
git commit -m "feat: attendance toggle button in SlotEditModal"
```

---

### Task 4: SchedulePage — updateAttendance 연결

**Files:**
- Modify: `src/pages/SchedulePage.tsx`

**Interfaces:**
- Consumes: `onToggleAttend` prop (Task 3)
- Produces: `updateAttendance(id, attended)` — supabase UPDATE 실행

- [ ] **Step 1: updateAttendance 함수 추가**

SchedulePage 안에서 `updateAssignment` 함수 근처에 추가:

```ts
async function updateAttendance(id: string, attended: boolean): Promise<string | null> {
  const { error } = await supabase
    .from('assignments')
    .update({ attended_at: attended ? new Date().toISOString() : null })
    .eq('id', id)
    .eq('tenant_id', tenant!.id)
  return error ? error.message : null
}
```

- [ ] **Step 2: SlotEditModal에 prop 전달**

`SchedulePage.tsx:1047` 의 `<SlotEditModal ...>` 에 추가:

```tsx
onToggleAttend={isPrivileged ? updateAttendance : undefined}
```

- [ ] **Step 3: 동작 확인**

로컬 개발 서버 실행 → `attendance` feature flag가 켜진 조직 → 스케줄 셀 클릭 → 배정 행의 체크 버튼 클릭 → 초록 뱃지로 변경 확인. Supabase 대시보드에서 해당 row의 `attended_at` 값 확인.

- [ ] **Step 4: 타입 체크 + 커밋**

```
npx tsc -b
git add src/pages/SchedulePage.tsx
git commit -m "feat: wire updateAttendance in SchedulePage"
```

---

### Task 5: AdminPage — 출석 현황 탭 추가

**Files:**
- Modify: `src/pages/AdminPage.tsx`

**Interfaces:**
- Consumes: `Assignment.attended_at` (Task 2), `hoursFrom/hoursTo` 패턴 (기존 코드 참고)
- Produces: `attendance` 탭 — 기간별 사용자별 배정 수, 출석 수, 출석률 테이블

`hours` 탭 구현 패턴(`hoursFrom`, `hoursTo`, `hoursRows`, `hoursLoading`, line 295~)을 그대로 따른다.

- [ ] **Step 1: Tab 타입에 attendance 추가**

`AdminPage.tsx` line 215:

```ts
type Tab = 'members' | 'roles' | 'rules' | 'settings' | 'autoassign' | 'legend' | 'custom_fields' | 'notifications' | 'lessons' | 'feedback' | 'hours' | 'attendance'
```

`TAB_LABELS` (line 217):

```ts
const TAB_LABELS: Record<Tab, string> = {
  // ... 기존 ...
  hours: '시간 집계',
  attendance: '출석 현황',
}
```

- [ ] **Step 2: attendance 탭 숨김 조건 추가**

`tab === 'attendance'` 가 `attendance` FF 없이 열린 경우 리셋 (line 292 근처):

```ts
if (tab === 'attendance' && !getFF(tenantFF, 'attendance')) setTab('members')
```

탭 nav 필터(`adminIsFreeform` 분기 아래):

```ts
if (t === 'attendance' && !getFF(tenantFF, 'attendance')) return false
```

- [ ] **Step 3: 상태와 쿼리 추가**

`hoursLoading` 선언 바로 아래(line 307 근처)에 추가:

```ts
// Attendance tab
const [attendFrom, setAttendFrom] = useState(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
})
const [attendTo, setAttendTo] = useState(() => {
  const d = new Date()
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
})
const [attendRows, setAttendRows] = useState<{ name: string; total: number; attended: number }[]>([])
const [attendLoading, setAttendLoading] = useState(false)

useEffect(() => {
  if (tab !== 'attendance' || !adminTenantId) return
  let cancelled = false
  setAttendLoading(true)

  const fromDate = new Date(attendFrom)
  const toDate   = new Date(attendTo)
  const fromY = fromDate.getFullYear(), fromM = fromDate.getMonth() + 1, fromD = fromDate.getDate()
  const toY   = toDate.getFullYear(),   toM   = toDate.getMonth() + 1,   toD   = toDate.getDate()

  supabase
    .from('assignments')
    .select('member_name, attended_at, year, month, day')
    .eq('tenant_id', adminTenantId)
    .or(
      Array.from({ length: (toY - fromY) * 12 + toM - fromM + 1 }, (_, i) => {
        const y = fromY + Math.floor((fromM - 1 + i) / 12)
        const m = ((fromM - 1 + i) % 12) + 1
        return `and(year.eq.${y},month.eq.${m})`
      }).join(',')
    )
    .then(({ data, error }) => {
      if (cancelled || error || !data) { setAttendLoading(false); return }
      const filtered = data.filter(r => {
        const d = new Date(r.year, r.month - 1, r.day)
        const from = new Date(fromY, fromM - 1, fromD)
        const to   = new Date(toY,   toM   - 1, toD)
        return d >= from && d <= to
      })
      const map = new Map<string, { total: number; attended: number }>()
      for (const r of filtered) {
        const key = r.member_name
        const cur = map.get(key) ?? { total: 0, attended: 0 }
        cur.total += 1
        if (r.attended_at) cur.attended += 1
        map.set(key, cur)
      }
      const rows = [...map.entries()]
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.attended - a.attended || a.name.localeCompare(b.name))
      if (!cancelled) { setAttendRows(rows); setAttendLoading(false) }
    })
  return () => { cancelled = true }
}, [tab, adminTenantId, attendFrom, attendTo])
```

- [ ] **Step 4: 출석 현황 탭 UI 추가**

`hours` 탭 블록(`{tab === 'hours' && ...}`) 바로 아래에 추가:

```tsx
{tab === 'attendance' && getFF(tenantFF, 'attendance') && (
  <div>
    <header className="mb-5">
      <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 px-3 py-[5px] rounded-full">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        출석 현황
      </span>
      <h2 className="mt-3 mb-1.5 text-[clamp(22px,5vw,27px)] font-extrabold tracking-tight text-[var(--color-text-primary)]">출석 현황</h2>
      <p className="text-[14px] font-medium text-[var(--color-text-muted)] leading-relaxed max-w-[52ch]">
        기간을 지정해 사용자별 출석률을 조회합니다.
      </p>
    </header>

    {/* Date range picker */}
    <div className="flex flex-wrap items-center gap-3 mb-5 p-4 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center gap-2">
        <label className="text-[13px] font-medium text-[var(--color-text-muted)] whitespace-nowrap">시작일</label>
        <input type="date" value={attendFrom} onChange={e => setAttendFrom(e.target.value)}
          className="text-[13px] border border-[var(--color-border)] rounded-lg px-3 py-1.5 bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30" />
      </div>
      <span className="text-[var(--color-text-muted)]">—</span>
      <div className="flex items-center gap-2">
        <label className="text-[13px] font-medium text-[var(--color-text-muted)] whitespace-nowrap">종료일</label>
        <input type="date" value={attendTo} onChange={e => setAttendTo(e.target.value)}
          className="text-[13px] border border-[var(--color-border)] rounded-lg px-3 py-1.5 bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30" />
      </div>
    </div>

    {attendLoading ? (
      <p className="text-center text-[13px] text-[var(--color-text-muted)] py-10">불러오는 중...</p>
    ) : attendRows.length === 0 ? (
      <p className="text-center text-[13px] text-[var(--color-text-muted)] py-10">해당 기간에 배정 이력이 없습니다.</p>
    ) : (
      <div className="rounded-[14px] border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-sm min-w-[400px]">
          <thead>
            <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
              <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)]">이름</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)]">총 배정</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)]">출석</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)]">출석률</th>
            </tr>
          </thead>
          <tbody>
            {attendRows.map((row, idx) => {
              const rate = row.total > 0 ? Math.round((row.attended / row.total) * 100) : 0
              return (
                <tr key={idx} className="border-b border-[var(--color-border)] last:border-b-0 bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)] transition-colors">
                  <td className="text-center px-4 py-3 text-[13px] font-medium text-[var(--color-text-primary)]">{row.name}</td>
                  <td className="text-center px-4 py-3 text-[13px] tabular-nums text-[var(--color-text-primary)]">
                    {row.total}<span className="text-[11px] text-[var(--color-text-muted)] ml-0.5">건</span>
                  </td>
                  <td className="text-center px-4 py-3 text-[13px] tabular-nums text-[var(--color-text-primary)]">
                    {row.attended}<span className="text-[11px] text-[var(--color-text-muted)] ml-0.5">건</span>
                  </td>
                  <td className="text-center px-4 py-3 text-[13px] font-semibold tabular-nums">
                    <span className={rate >= 80 ? 'text-emerald-600' : rate >= 50 ? 'text-amber-500' : 'text-red-500'}>
                      {rate}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-[var(--color-surface-secondary)] border-t border-[var(--color-border)]">
              <td className="text-center px-4 py-3 text-[13px] font-bold text-[var(--color-text-primary)]">합계</td>
              <td className="text-center px-4 py-3 text-[13px] font-bold tabular-nums text-[var(--color-text-primary)]">
                {attendRows.reduce((s, r) => s + r.total, 0)}<span className="text-[11px] text-[var(--color-text-muted)] ml-0.5">건</span>
              </td>
              <td className="text-center px-4 py-3 text-[13px] font-bold tabular-nums text-[var(--color-text-primary)]">
                {attendRows.reduce((s, r) => s + r.attended, 0)}<span className="text-[11px] text-[var(--color-text-muted)] ml-0.5">건</span>
              </td>
              <td className="text-center px-4 py-3 text-[13px] font-bold tabular-nums text-[var(--color-text-primary)]">
                {(() => {
                  const t = attendRows.reduce((s, r) => s + r.total, 0)
                  const a = attendRows.reduce((s, r) => s + r.attended, 0)
                  return t > 0 ? `${Math.round((a / t) * 100)}%` : '-'
                })()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    )}
  </div>
)}
```

- [ ] **Step 5: 타입 체크**

```
npx tsc -b
```

- [ ] **Step 6: 동작 확인**

로컬 개발 서버 → `attendance` FF 켠 조직 → AdminPage → `출석 현황` 탭 → 기간 변경 시 테이블 갱신 확인.

- [ ] **Step 7: 커밋**

```
git add src/pages/AdminPage.tsx
git commit -m "feat: attendance summary tab in AdminPage"
```

---

## 전체 완료 후 체크리스트

- [ ] `npx tsc -b` 에러 없음
- [ ] `attendance` FF OFF 조직에서 체크 버튼·탭 미노출 확인
- [ ] `attendance` FF ON 조직에서 체크 버튼 표시 → 클릭 → 출석 뱃지 표시 확인
- [ ] AdminPage 출석 현황 탭 — 기간 변경 시 데이터 갱신 확인
- [ ] 출석률 색상: 80% 이상 초록, 50~79% 노랑, 49% 이하 빨강 확인
- [ ] `docs/checklists/checklist_2026-08-19.md` 작성
