# 회원개별모드 설계

날짜: 2026-06-02

## 개요

조직 운영 모드에 **회원개별모드**를 추가한다. 기존 두 모드와 합쳐 세 가지 모드가 된다.

| 모드 | 기존 명칭 | 설명 |
|------|-----------|------|
| 회원공유 | 회원선택 | 모든 회원이 서로의 스케줄 조회 가능 (기존 동작 유지) |
| 회원개별 | 신규 | 관리자가 회원별로 스케줄 배정, 회원은 본인 것만 조회 |
| 비회원 | 직접입력 | 이름 직접 입력 방식 (기존 동작 유지) |

---

## 회원개별모드 상세 동작

### 일반 회원

- 스케줄 그리드에서 **본인 스케줄만 표시** (`user_id === profile.id`)
- 다른 회원의 스케줄은 보이지 않음
- 셀 클릭 시 모달 진입 불가 (읽기 전용)
- 등록·수정·삭제 버튼 비활성화

### 관리자 / 슈퍼관리자

- 헤더에 **회원 선택 드롭다운** 항상 노출 (기존 햄버거 메뉴에서 이동)
- 회원 **미선택** 상태: 전체 스케줄 조회 가능, 셀 클릭 시 일반 회원 드롭다운 포함 모달 열림
- 회원 **선택** 상태: 해당 회원 스케줄만 표시, 셀 클릭 시 해당 회원 고정 모달 열림
- 배정 시 `user_id` = **선택된 회원의 user_id** (회원 필터링 기준)
- `volunteer_name` = 선택된 회원의 이름

---

## 데이터 모델

DB 스키마 변경 없음. 기존 `assignments.user_id` 컬럼이 "배정 대상 회원" 기준으로 사용됨.

---

## 변경 파일

### 1. `src/pages/SchedulePage.tsx`

- `회원개별` 모드 + 일반 회원이 셀 클릭 시 `handleCellClick` 에서 모달 진입 차단
- 회원 선택 드롭다운을 `funcMenuItems` 내부에서 헤더 `leftSlot`으로 이동
- `SlotEditModal`에 `lockedUserId={filterMemberId ?? undefined}` prop 전달
- `tenantMode === '회원개별'` 조건에서 회원(비관리자)의 `handleCellClick` 조기 반환 추가

### 2. `src/components/modals/SlotEditModal.tsx`

- `lockedUserId?: string` prop 추가
- 관리자 + `lockedUserId` 있을 때: `selectedUserId`를 `lockedUserId`로 초기화하고 회원 드롭다운 숨김 (이름만 표시)
- 회원개별 모드 + 일반 회원(`!isAdmin`): 추가·수정·삭제 버튼 비활성화, 읽기 전용 배너 표시

### 3. `src/components/AppHeader.tsx`

- `memberSelectSlot?: ReactNode` prop 추가
- 기존 헤더 leftSlot 영역 옆에 `memberSelectSlot` 렌더링 위치 삽입

---

## 필터링 로직

```
displayAssignmentFilter (회원개별 모드):
  - 관리자, filterMemberId 있음  → a.user_id === filterMemberId
  - 관리자, filterMemberId 없음  → undefined (전체 표시)
  - 일반 회원                   → a.user_id === profile.id
```

기존 로직과 동일, 변경 없음.

---

## 범위 외

- DB RLS 변경 없음 (클라이언트 필터링으로 충분)
- 자동배정(`autoAssign`) 동작 변경 없음 (관리자 전용이므로 현행 유지)
- 회원공유·비회원 모드 동작 변경 없음
