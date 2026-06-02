# 회원개별모드 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 회원개별모드에서 일반 회원은 본인 스케줄만 조회(읽기 전용), 관리자는 헤더에서 회원을 선택해 해당 회원 스케줄을 배정/관리한다.

**Architecture:** AppHeader에 `memberSelectSlot` prop을 추가해 회원 선택 드롭다운을 헤더에 노출한다. SlotEditModal에 `lockedUserId` prop과 `isReadOnly` 플래그를 추가해 모드별 동작을 분기한다. SchedulePage에서 quick-add 차단 및 lockedUserId 전달을 담당한다.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Supabase

---

## 파일 맵

| 파일 | 변경 유형 | 담당 |
|------|-----------|------|
| `src/components/AppHeader.tsx` | 수정 | `memberSelectSlot` prop 추가, 헤더 좌측에 렌더링 |
| `src/pages/SchedulePage.tsx` | 수정 | 드롭다운 이동, quick-add 차단, `lockedUserId` 전달 |
| `src/components/modals/SlotEditModal.tsx` | 수정 | `lockedUserId` prop, `isReadOnly` 분기 |

---

## Task 1: AppHeader — memberSelectSlot prop 추가

**Files:**
- Modify: `src/components/AppHeader.tsx`

- [ ] **Step 1: AppHeaderProps에 memberSelectSlot 추가 및 렌더링**

`src/components/AppHeader.tsx`의 `AppHeaderProps` 인터페이스와 좌측 영역을 수정한다.

```tsx
// 변경 전
interface AppHeaderProps {
  funcMenuItems?: (closeMenu: () => void) => React.ReactNode
  leftSlot?: React.ReactNode
  rightSlot?: React.ReactNode
  roleLabel?: string
  onShowLogin?: () => void
}

export function AppHeader({ funcMenuItems, leftSlot, rightSlot, roleLabel, onShowLogin }: AppHeaderProps) {
```

```tsx
// 변경 후
interface AppHeaderProps {
  funcMenuItems?: (closeMenu: () => void) => React.ReactNode
  leftSlot?: React.ReactNode
  rightSlot?: React.ReactNode
  memberSelectSlot?: React.ReactNode
  roleLabel?: string
  onShowLogin?: () => void
}

export function AppHeader({ funcMenuItems, leftSlot, rightSlot, memberSelectSlot, roleLabel, onShowLogin }: AppHeaderProps) {
```

- [ ] **Step 2: 헤더 좌측 영역에 memberSelectSlot 렌더링**

`leftSlot` 다음에 `memberSelectSlot`을 추가한다.

```tsx
// 변경 전 (line 41-55)
{/* Left: hamburger + leftSlot */}
<div className="flex items-center gap-1.5">
  {showHamburger && (
    <button ...>...</button>
  )}
  {leftSlot}
</div>
```

```tsx
// 변경 후
{/* Left: hamburger + leftSlot + memberSelectSlot */}
<div className="flex items-center gap-1.5">
  {showHamburger && (
    <button
      onClick={() => setShowFuncMenu(v => !v)}
      aria-label="기능 메뉴"
      className="w-8 h-8 flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-all"
    >
      {showFuncMenu
        ? <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>
        : <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 5h14M3 10h14M3 15h14"/></svg>
      }
    </button>
  )}
  {leftSlot}
  {memberSelectSlot}
</div>
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/AppHeader.tsx
git commit -m "feat: AppHeader에 memberSelectSlot prop 추가"
```

---

## Task 2: SchedulePage — 드롭다운 이동 + quick-add 차단 + lockedUserId 전달

**Files:**
- Modify: `src/pages/SchedulePage.tsx`

- [ ] **Step 1: 회원 선택 드롭다운 JSX를 별도 변수로 분리**

SchedulePage의 상태 선언 블록(filterMemberId 아래) 바로 뒤에 드롭다운 JSX를 변수로 추출한다. `filterMemberId` state 선언은 이미 있으므로 변수만 추가한다.

```tsx
// filterMemberId state 선언 아래에 추가
const memberSelectEl = tenantMode === '회원개별' && isPrivileged ? (
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
) : null
```

- [ ] **Step 2: funcMenuItems에서 드롭다운 제거**

현재 funcMenuItems 내부의 아래 블록을 제거한다.

```tsx
// 제거할 코드 (funcMenuItems 안에 있는 부분)
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

- [ ] **Step 3: AppHeader에 memberSelectSlot 전달**

```tsx
// 변경 전
<AppHeader
  leftSlot={<FilterBar value={highlightName} onChange={setHighlightName} />}
  rightSlot={<ExportButton year={year} month={month} />}
  roleLabel={memberTenantRoleName ?? undefined}
  funcMenuItems={(close) => (
    ...
  )}
/>
```

```tsx
// 변경 후
<AppHeader
  leftSlot={<FilterBar value={highlightName} onChange={setHighlightName} />}
  rightSlot={<ExportButton year={year} month={month} />}
  memberSelectSlot={memberSelectEl}
  roleLabel={memberTenantRoleName ?? undefined}
  funcMenuItems={(close) => (
    ...
  )}
/>
```

- [ ] **Step 4: handleCellClick에서 회원개별 모드 quick-add 차단**

기존 quick-add 조건에 `tenantMode !== '회원개별'` 추가한다.

```tsx
// 변경 전
if (
  tenantMode !== '비회원' &&
  !isPrivileged &&
  profile &&
  !getTimeSubOptions(target.timeSlot)
) {
```

```tsx
// 변경 후
if (
  tenantMode !== '비회원' &&
  tenantMode !== '회원개별' &&
  !isPrivileged &&
  profile &&
  !getTimeSubOptions(target.timeSlot)
) {
```

- [ ] **Step 5: SlotEditModal에 lockedUserId prop 전달**

```tsx
// 변경 전
{modalTarget && selectedCellState && profile && (
  <SlotEditModal
    target={modalTarget}
    cellState={selectedCellState}
    profile={profile}
    tenantRole={tenantRole}
    memberRoleId={memberRoleId}
    splitRoles={splitRoles}
    isSplitMode={isSplitMode}
    tenantRoles={tenantRoles}
    tenantMode={tenantMode}
    customFields={customFields}
    slotLabels={slotLabels}
    typeLabels={typeLabels}
    onClose={() => setModalTarget(null)}
    onAdd={...}
    onUpdate={...}
    onDelete={...}
  />
)}
```

```tsx
// 변경 후
{modalTarget && selectedCellState && profile && (
  <SlotEditModal
    target={modalTarget}
    cellState={selectedCellState}
    profile={profile}
    tenantRole={tenantRole}
    memberRoleId={memberRoleId}
    splitRoles={splitRoles}
    isSplitMode={isSplitMode}
    tenantRoles={tenantRoles}
    tenantMode={tenantMode}
    customFields={customFields}
    slotLabels={slotLabels}
    typeLabels={typeLabels}
    lockedUserId={tenantMode === '회원개별' && isPrivileged ? (filterMemberId ?? undefined) : undefined}
    onClose={() => setModalTarget(null)}
    onAdd={...}
    onUpdate={...}
    onDelete={...}
  />
)}
```

- [ ] **Step 6: 커밋**

```bash
git add src/pages/SchedulePage.tsx
git commit -m "feat: 회원개별모드 드롭다운 헤더 이동, quick-add 차단, lockedUserId 전달"
```

---

## Task 3: SlotEditModal — lockedUserId + isReadOnly 구현

**Files:**
- Modify: `src/components/modals/SlotEditModal.tsx`

- [ ] **Step 1: Props에 lockedUserId 추가**

```tsx
// 변경 전
interface Props {
  target: ModalTarget
  cellState: CellState
  profile: Profile | null
  tenantRole?: 'admin' | 'member' | null
  memberRoleId?: string | null
  splitRoles?: TenantRole[]
  isSplitMode?: boolean
  tenantRoles?: TenantRole[]
  tenantMode?: TenantMode | '직접입력' | '회원선택'
  customFields?: CustomFieldDef[]
  slotLabels?: Record<string, string>
  typeLabels?: { volunteer: string; '50plus': string }
  onClose: () => void
  onAdd: ...
  onUpdate: ...
  onDelete: ...
}
```

```tsx
// 변경 후 (lockedUserId 추가)
interface Props {
  target: ModalTarget
  cellState: CellState
  profile: Profile | null
  tenantRole?: 'admin' | 'member' | null
  memberRoleId?: string | null
  splitRoles?: TenantRole[]
  isSplitMode?: boolean
  tenantRoles?: TenantRole[]
  tenantMode?: TenantMode | '직접입력' | '회원선택'
  customFields?: CustomFieldDef[]
  slotLabels?: Record<string, string>
  typeLabels?: { volunteer: string; '50plus': string }
  lockedUserId?: string
  onClose: () => void
  onAdd: ...
  onUpdate: ...
  onDelete: ...
}
```

- [ ] **Step 2: 함수 시그니처에 lockedUserId 추가 + isReadOnly + selectedUserId 초기화 변경**

```tsx
// 변경 전
export function SlotEditModal({
  target, cellState, profile, tenantRole, memberRoleId,
  splitRoles = [], isSplitMode = false, tenantRoles = [],
  tenantMode = '회원선택', customFields = [],
  slotLabels = {},
  typeLabels = { volunteer: '자원봉사자', '50plus': '50플러스활동가' },
  onClose, onAdd, onUpdate, onDelete,
}: Props) {
  const { day, month, timeSlot, volunteerType: defaultType, roleId: initialRoleId } = target
  const isAdmin = profile?.is_super_admin || tenantRole === 'admin'
  const profileType: VolunteerType = 'volunteer'

  const isFreeform = tenantMode === '비회원' || tenantMode === '직접입력'
  const useDynamicFields = isFreeform && customFields.length > 0

  const [volunteerType, setVolunteerType] = useState<VolunteerType>(
    isAdmin ? defaultType : profileType
  )
  const timeSubOptions = getTimeSubOptions(timeSlot)
  const defaultTimeSub = timeSubOptions ? timeSubOptions[timeSubOptions.length - 1].value : null
  const [timeSub, setTimeSub] = useState<string | null>(defaultTimeSub)
  const [selectedUserId, setSelectedUserId] = useState<string>(isAdmin ? '' : (profile?.id ?? ''))
```

```tsx
// 변경 후
export function SlotEditModal({
  target, cellState, profile, tenantRole, memberRoleId,
  splitRoles = [], isSplitMode = false, tenantRoles = [],
  tenantMode = '회원선택', customFields = [],
  slotLabels = {},
  typeLabels = { volunteer: '자원봉사자', '50plus': '50플러스활동가' },
  lockedUserId,
  onClose, onAdd, onUpdate, onDelete,
}: Props) {
  const { day, month, timeSlot, volunteerType: defaultType, roleId: initialRoleId } = target
  const isAdmin = profile?.is_super_admin || tenantRole === 'admin'
  const profileType: VolunteerType = 'volunteer'

  const isFreeform = tenantMode === '비회원' || tenantMode === '직접입력'
  const useDynamicFields = isFreeform && customFields.length > 0
  const isReadOnly = !isAdmin && tenantMode === '회원개별'

  const [volunteerType, setVolunteerType] = useState<VolunteerType>(
    isAdmin ? defaultType : profileType
  )
  const timeSubOptions = getTimeSubOptions(timeSlot)
  const defaultTimeSub = timeSubOptions ? timeSubOptions[timeSubOptions.length - 1].value : null
  const [timeSub, setTimeSub] = useState<string | null>(defaultTimeSub)
  const [selectedUserId, setSelectedUserId] = useState<string>(
    isAdmin ? (lockedUserId ?? '') : (profile?.id ?? '')
  )
```

- [ ] **Step 3: canEdit에 isReadOnly 반영**

```tsx
// 변경 전 (line 381)
const canEdit = isAdmin || a.user_id === profile?.id
```

```tsx
// 변경 후
const canEdit = isAdmin || (a.user_id === profile?.id && !isReadOnly)
```

- [ ] **Step 4: 회원선택 모드에서 lockedUserId 시 이름만 표시**

`/* 회원선택 모드 */` 섹션(line 522)의 `{isAdmin ? (` 분기를 수정한다.

```tsx
// 변경 전
) : (
  /* 회원선택 모드 */
  <>
    {isAdmin ? (
      <div>
        <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">회원 선택</p>
        {selectableProfiles.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)] py-2 text-center">
            {totalTypeProfiles.length === 0
              ? '해당 유형으로 가입된 회원이 없습니다'
              : '모든 회원이 이미 배정되어 있습니다'}
          </p>
        ) : (
          <select
            value={selectedUserId}
            onChange={e => setSelectedUserId(e.target.value)}
            className={inputClass}
          >
            <option value="">-- 회원을 선택하세요 --</option>
            {selectableProfiles.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>
    ) : (
```

```tsx
// 변경 후
) : (
  /* 회원선택 모드 */
  <>
    {isAdmin ? (
      <div>
        <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">회원 선택</p>
        {lockedUserId ? (
          <div className="px-3 py-2.5 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] font-medium">
            {profiles.find(p => p.id === lockedUserId)?.name ?? '알 수 없음'}
          </div>
        ) : selectableProfiles.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)] py-2 text-center">
            {totalTypeProfiles.length === 0
              ? '해당 유형으로 가입된 회원이 없습니다'
              : '모든 회원이 이미 배정되어 있습니다'}
          </p>
        ) : (
          <select
            value={selectedUserId}
            onChange={e => setSelectedUserId(e.target.value)}
            className={inputClass}
          >
            <option value="">-- 회원을 선택하세요 --</option>
            {selectableProfiles.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>
    ) : (
```

- [ ] **Step 5: isReadOnly 시 폼 영역을 조회 전용 안내로 대체**

line 424 근처의 `{profile ? (` 블록을 수정한다.

```tsx
// 변경 전
{profile ? (
  <>
    {/* Time slot selector */}
    {timeSubOptions && ( ... )}

    {/* Input section */}
    {useDynamicFields ? ( ... ) : isFreeform ? ( ... ) : ( /* 회원선택 모드 */ )}

    {error && ( ... )}

    <div className="flex gap-2">
      <button onClick={editingId ? handleUpdate : handleAdd} ...>
        {loading ? '저장 중...' : editingId ? '수정 완료' : '추가'}
      </button>
      ...
    </div>
  </>
) : (
  <p className="text-sm text-[var(--color-text-muted)] text-center py-3">
    로그인 후 스케줄을 입력할 수 있습니다.
  </p>
)}
```

```tsx
// 변경 후
{profile && !isReadOnly ? (
  <>
    {/* Time slot selector */}
    {timeSubOptions && ( ... )}

    {/* Input section */}
    {useDynamicFields ? ( ... ) : isFreeform ? ( ... ) : ( /* 회원선택 모드 */ )}

    {error && ( ... )}

    <div className="flex gap-2">
      <button onClick={editingId ? handleUpdate : handleAdd} ...>
        {loading ? '저장 중...' : editingId ? '수정 완료' : '추가'}
      </button>
      ...
    </div>
  </>
) : profile && isReadOnly ? (
  <p className="text-sm text-[var(--color-text-muted)] text-center py-3">
    스케줄 조회 전용입니다. 배정은 관리자에게 문의하세요.
  </p>
) : (
  <p className="text-sm text-[var(--color-text-muted)] text-center py-3">
    로그인 후 스케줄을 입력할 수 있습니다.
  </p>
)}
```

- [ ] **Step 6: 커밋**

```bash
git add src/components/modals/SlotEditModal.tsx
git commit -m "feat: SlotEditModal 회원개별모드 lockedUserId + 읽기전용 지원"
```

---

## 수동 검증 체크리스트

빌드 후 아래 시나리오를 브라우저에서 확인한다.

```
npm run build
```

**관리자 시나리오**
- [ ] 회원개별모드 조직에서 헤더 좌측에 회원 선택 드롭다운이 표시됨
- [ ] "전체 회원" 선택 시 모든 스케줄 표시, 셀 클릭 시 회원 드롭다운 있는 모달 열림
- [ ] 특정 회원 선택 시 해당 회원 스케줄만 표시
- [ ] 특정 회원 선택 후 셀 클릭 시 모달에서 회원 이름이 고정(드롭다운 없음)으로 표시됨
- [ ] 추가 버튼 클릭 → 해당 회원의 user_id로 저장됨(회원 로그인 시 표시 확인)

**일반 회원 시나리오**
- [ ] 회원개별모드에서 헤더에 드롭다운 없음
- [ ] 본인 스케줄만 그리드에 표시됨
- [ ] 셀 클릭 시 모달 열림 but 추가/수정/삭제 버튼 없음, "조회 전용" 안내 표시
- [ ] 다른 회원 스케줄 표시 안 됨

**회원공유·비회원 모드 회귀 확인**
- [ ] 회원공유모드: 기존과 동일하게 동작
- [ ] 비회원모드: 기존과 동일하게 동작
