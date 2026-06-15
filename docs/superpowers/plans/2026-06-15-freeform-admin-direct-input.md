# 비회원 모드 관리자 직접 입력 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 비회원/직접입력 모드에서 관리자가 회원 선택 드롭다운 없이 커스텀 필드(성명 포함)를 직접 입력해 스케줄을 등록할 수 있게 한다.

**Architecture:** `SlotEditModal.tsx` 2곳만 수정. (1) `isFreeform + isSplitMode + isAdmin` 조건의 회원 선택 드롭다운 블록 제거. (2) 첫 번째 커스텀 필드(성명) 숨김 조건 제거. 다른 파일 변경 없음.

**Tech Stack:** TypeScript, React, Vitest

---

### Task 1: 회원 선택 드롭다운 제거 + 성명 필드 항상 표시

**Files:**
- Modify: `src/components/modals/SlotEditModal.tsx` (L605-636)

- [ ] **Step 1: 현재 코드 확인**

`src/components/modals/SlotEditModal.tsx` L600-644 를 읽어 아래 두 블록의 정확한 위치를 확인한다.

- [ ] **Step 2: 회원 선택 드롭다운 블록 제거**

아래 블록 전체를 삭제한다 (L605-626):

```tsx
              {/* 역할 분리 + 비회원/직접입력 모드: 등록된 회원에서 선택 (필수) */}
              {isSplitMode && isAdmin && isFreeform && selectableProfiles.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-[var(--color-text-muted)] mb-2">회원 선택</p>
                  <select
                    value={selectedUserId}
                    onChange={e => {
                      const id = e.target.value
                      setSelectedUserId(id)
                      const p = profiles.find(pr => pr.id === id)
                      if (p && customFields[0]) {
                        setFieldValues(prev => ({ ...prev, [customFields[0].id]: p.name }))
                      }
                    }}
                    className={inputClass}
                  >
                    {selectableProfiles.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
```

- [ ] **Step 3: 성명 필드 숨김 조건 제거**

L632-636의 customFields map을 수정한다:

(before):
```tsx
                  {customFields.map((field, idx) =>
                    idx === 0 && isSplitMode && isAdmin && selectableProfiles.length > 0
                      ? null
                      : renderFieldInput(field)
                  )}
```

(after):
```tsx
                  {customFields.map(field => renderFieldInput(field))}
```

- [ ] **Step 4: 타입 체크**

```
npx tsc -b
```

Expected: 에러 없음

- [ ] **Step 5: 기존 테스트 실행**

```
npm test -- --run
```

Expected: 27개 테스트 모두 PASS

- [ ] **Step 6: 커밋**

```
git add src/components/modals/SlotEditModal.tsx
git commit -m "feat: remove member select for admin in freeform mode, always show name field"
```

---

### Task 2: 회원 선택 관련 코멘트 정리

`isFreeform && isSplitMode` 조건을 참조하는 인접 코멘트가 이제 맞지 않으므로 정리한다.

**Files:**
- Modify: `src/components/modals/SlotEditModal.tsx`

- [ ] **Step 1: 관련 코멘트 확인**

파일에서 "위쪽의 '회원 선택' 드롭다운에서 이미 처리됨" 코멘트를 찾는다 (약 L649):

```tsx
                    // 역할 분리 + 비회원/직접입력 모드는 위쪽의 "회원 선택" 드롭다운에서 이미 처리됨
```

- [ ] **Step 2: 코멘트 제거**

해당 코멘트 라인을 삭제한다.

- [ ] **Step 3: 타입 체크 + 테스트**

```
npx tsc -b && npm test -- --run
```

Expected: 에러 없음, 모든 테스트 PASS

- [ ] **Step 4: 커밋**

```
git add src/components/modals/SlotEditModal.tsx
git commit -m "chore: remove stale member-select comment in SlotEditModal"
```
