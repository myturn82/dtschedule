# 비회원 모드 관리자 직접 입력 설계

**날짜:** 2026-06-15  
**범위:** SlotEditModal — 비회원/직접입력 모드에서 관리자 회원 선택 제거 및 커스텀 필드 직접 입력

---

## 배경 및 목표

비회원(`isFreeform`) 모드에서 관리자가 스케줄 등록 시 불필요한 "회원 선택" 드롭다운이 표시됨. 이 드롭다운은 회원 선택 모드(`!isFreeform`)에서만 의미가 있으며, 비회원 모드에서는 오히려 혼란을 유발.

**목표:** 비회원/직접입력 모드에서 관리자도 일반회원처럼 커스텀 필드를 직접 입력해 등록. 역할 탭으로 역할 선택 후 반복 등록으로 다건 처리.

---

## 결정 사항

- **일반회원 수정/삭제:** 비회원 모드에서는 구현하지 않음. 관리자만 수정/삭제 가능.
- **관리자 다건 등록:** 저장 → 모달 닫힘(현재 방식) → 재오픈 → 다음 항목 등록. 폼 자동 리셋 없음.
- **역할 선택:** 기존 상단 역할 탭 유지. 탭 클릭 → 필드 입력 → 저장.

---

## 변경 파일

**`src/components/modals/SlotEditModal.tsx` 만 수정**

### 변경 1: 회원 선택 드롭다운 제거

**조건:** `isSplitMode && isAdmin && isFreeform && selectableProfiles.length > 0`인 경우 표시되던 회원 선택 섹션 제거.

```tsx
// 제거할 블록
{isSplitMode && isAdmin && isFreeform && selectableProfiles.length > 0 && (
  <div>
    <p className="text-xs font-bold text-[var(--color-text-muted)] mb-2">회원 선택</p>
    <select ...>...</select>
  </div>
)}
```

### 변경 2: 첫 번째 커스텀 필드(이름) 항상 표시

`useDynamicFields` 렌더링에서 첫 번째 필드를 숨기는 조건 제거.

```tsx
// before
{customFields.map((field, idx) =>
  idx === 0 && isSplitMode && isAdmin && selectableProfiles.length > 0
    ? null
    : renderFieldInput(field)
)}

// after
{customFields.map(field => renderFieldInput(field))}
```

---

## 영향 없는 범위

- `handleAdd` / `handleUpdate` 내 `userId` 처리: `isFreeform` 시 `userId = undefined` → `user_id = null`(비회원) 또는 `profile.id`(직접입력). 변경 없음.
- `ownAssignment` 로직: 관리자는 항상 `undefined`. 변경 없음.
- 역할 탭 렌더링: 기존 유지.
- 다른 파일: 변경 없음.

---

## 제외 범위

- 일반회원 수정/삭제 버튼: 비회원 모드에서 미구현 (관리자 전용 유지)
- 모달 저장 후 동작: 현재 방식 유지 (닫힘)
