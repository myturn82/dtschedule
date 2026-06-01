# Phase A — Quick Fixes & UX Improvements

**날짜**: 2026-06-01  
**범위**: 항목 0, 1, 2, 3, 4, 6 (소규모 버그 수정 및 UX 개선)  
**관련 파일**: SlotEditModal, CapacityModal, AdminPage, TenantSelectPage, DashboardPage, SuperAdminPage

---

## 항목 0 — 전화번호 실시간 유효성 검사

### 현재 상태
`SlotEditModal.tsx`에서 `isValidPhone()` 검사는 `handleAdd` / `handleUpdate` 제출 시점에만 실행됨.  
입력 중에는 에러가 표시되지 않아 사용자 경험이 불량함.

### 설계
- `phoneError` 상태(`string | null`) 추가
- `freeformPhone` onChange 핸들러에서:
  - 값이 비어있으면 `phoneError = null`
  - 값이 있고 `isValidPhone()` 실패 시 `phoneError = '연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)'`
  - 유효하면 `phoneError = null`
- 전화번호 input 바로 아래에 `phoneError` 표시 (기존 `error` 상태와 별도)
- 기존 `handleAdd` / `handleUpdate`의 중복 검사는 유지 (방어 로직)

### 변경 파일
- `src/components/modals/SlotEditModal.tsx`

---

## 항목 1 — 인원 일괄변경 + 모바일 반응형

### 현재 상태
- `CapacityModal.tsx`: 슬롯별 개별 숫자 입력만 가능, 일괄 변경 없음
- 모바일에서 `grid-cols-2` 고정으로 입력 폭이 너무 좁아짐

### 설계

**일괄변경 UI**:
```
┌─────────────────────────────┐
│ 일괄 적용   [숫자 입력] [적용] │
└─────────────────────────────┘
```
- 헤더와 슬롯 그리드 사이에 배치
- 숫자 입력(min=1, max=99) + "전체 적용" 버튼
- 적용 버튼 클릭 시 모든 timeSlots에 순차 `onUpdate` 호출
- 진행 중 버튼 비활성화 + "적용 중..." 텍스트
- 완료 후 성공 피드백 (인라인 메시지)

**모바일 반응형**:
- `grid grid-cols-2` → `grid grid-cols-1 sm:grid-cols-2`

### 변경 파일
- `src/components/modals/CapacityModal.tsx`

---

## 항목 2, 3 — 승인대기 탭 이동 연결

### 현재 상태
- `TenantSelectPage`: 슈퍼관리자 org 카드의 "승인대기 N건" 뱃지 클릭 시 `/`로 이동 (스케줄 페이지)
- `DashboardPage`: "승인 대기" KPI 카드가 정적 `div`로 클릭 불가
- `AdminPage`: URL 파라미터로 초기 탭을 지정할 수 없음
- `AdminPage` 회원 탭: 미승인 건수가 표시되지 않음

### 설계

#### ① AdminPage — `?tab=` URL 파라미터 지원
```typescript
const initTab = searchParams.get('tab') as Tab | null
const [tab, setTab] = useState<Tab>(
  initTab && (Object.keys(TAB_LABELS) as Tab[]).includes(initTab) ? initTab : 'members'
)
```

#### ② TenantSelectPage — 승인대기 뱃지 별도 클릭
- `OrgCard`에 `onPendingClick?: () => void` prop 추가
- 승인대기 뱃지를 `<button>`으로 감싸고:
  ```typescript
  onClick={e => { e.stopPropagation(); onPendingClick?.() }}
  ```
- 슈퍼관리자만 해당: `onPendingClick: () => navigate(`/admin?org=${t.id}&tab=pending`)`
- 일반 관리자 카드는 변경 없음 (요구사항 범위 외)

#### ③ DashboardPage — "승인 대기" KPI 카드 클릭 가능
- `<div>` → `<button>` 변경
- `pendingMembers.length > 0`일 때만 활성화 (0건이면 `cursor-default`, `disabled`)
- 클릭 시 `navigate('/admin?tab=pending')`

#### ④ AdminPage 회원 탭 — 미승인 건수 뱃지
- "회원 (N명)" 제목 옆에 미승인 건수 뱃지 추가:
  ```
  회원 관리 (12명)  [승인대기 3건 →]
  ```
- 뱃지 클릭 시 `setTab('pending')`

### 변경 파일
- `src/pages/AdminPage.tsx`
- `src/pages/TenantSelectPage.tsx`
- `src/pages/DashboardPage.tsx`

---

## 항목 4 — SlotEditModal 직접입력 모드 하드코딩 제거

### 현재 상태
`SlotEditModal.tsx` 헤더 서브타이틀:
```typescript
!isSplitMode && isAdmin
  ? ` · ${defaultType === '50plus' ? '50플러스활동가' : '자원봉사자'}`
  : ''
```
직접입력 모드(`isFreeform = true`)에서도 "자원봉사자" 레이블이 표시됨.

### 설계
```typescript
!isSplitMode && isAdmin && !isFreeform
  ? ` · ${defaultType === '50plus' ? '50플러스활동가' : '자원봉사자'}`
  : ''
```
`isFreeform`일 때는 타입 레이블 미표시. 시간 슬롯 정보만 표시.

### 변경 파일
- `src/components/modals/SlotEditModal.tsx`

---

## 항목 6 — SuperAdmin slug 수정 기능

### 현재 상태
`SuperAdminPage.tsx`에서 조직명(name)은 인라인 수정 가능하나 slug는 수정 불가.

### 설계
기존 `editingNameId / editName / nameSaving` 패턴 동일 적용:

**추가 상태**:
```typescript
const [editingSlugId, setEditingSlugId] = useState<string | null>(null)
const [editSlug, setEditSlug]           = useState('')
const [slugSaving, setSlugSaving]       = useState(false)
```

**저장 로직 (`saveSlug`)**:
1. `SLUG_RE` 형식 검사 (이미 정의된 정규식 재사용)
2. 같은 slug를 가진 다른 테넌트 중복 검사 (`tenants` 배열에서 현재 ID 제외)
3. Supabase `tenants` 테이블 `slug` 컬럼 업데이트
4. 로컬 상태 갱신

**UI**: 조직 목록에서 slug 텍스트(`t.slug`) 클릭 시 인라인 input으로 전환.  
name 편집과 slug 편집은 동시에 열 수 없음 (서로 닫힘).

### 변경 파일
- `src/pages/SuperAdminPage.tsx`

---

## 영향 범위 요약

| 항목 | 파일 | 변경 유형 |
|------|------|----------|
| 0 | SlotEditModal.tsx | 상태 추가 + UI |
| 1 | CapacityModal.tsx | UI 추가 + 반응형 |
| 2, 3 | AdminPage.tsx | URL 파라미터 + UI |
| 2 | TenantSelectPage.tsx | Props + 클릭 핸들러 |
| 3 | DashboardPage.tsx | 클릭 가능 변환 |
| 4 | SlotEditModal.tsx | 조건 수정 1줄 |
| 6 | SuperAdminPage.tsx | 상태 추가 + UI |

**DB 스키마 변경 없음** — 모두 프론트엔드 변경만 해당.
