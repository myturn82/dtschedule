# 위자드 레슨종류 설정 단계 추가 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** LESSON:ON / CLASS:ON 버티컬로 가입하는 조직의 위자드에 레슨종류 등록 단계(step 6)를 삽입하고, 커스텀필드 단계는 step 7로 밀어낸다.

**Architecture:** `activePreset`이 `lesson-sports` 또는 `education-academy`일 때만 `showLessonStep = true`가 되고, 이를 기준으로 TOTAL·CUSTOM_FIELDS_STEP을 동적 계산한다. 새 컴포넌트 `Step6LessonTypes`는 기존 `useLessonPackages` 훅을 그대로 사용해 즉시 DB에 저장(Next 시 별도 save 없음). DB 스키마 변경 없음.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Supabase (기존 `lesson_package_types` 테이블)

## Global Constraints

- 타입 체크는 반드시 `npx tsc -b`로 확인 (`npx tsc --noEmit`은 루트 tsconfig 특성상 아무것도 검사하지 않음)
- 아이콘은 `WizardIcon` 객체의 키만 사용 (`WizardIconKey` 타입)
- 버티컬 식별자(`'lesson-sports'`, `'education-academy'`)는 `VERTICAL_PRESETS` 맵에 이미 정의된 값을 그대로 사용
- 새 기능이므로 `DevFileLabel` 추가 불필요 (위자드 페이지에 이미 있음)
- 표 헤더 `text-center`, 서술형 텍스트 `text-left` 정렬 원칙 준수

---

## File Map

| 파일 | 변경 종류 | 역할 |
|------|-----------|------|
| `src/components/setup/StepHeader.tsx` | 수정 | `LESSON_STEP_META` 상수 export 추가 |
| `src/components/setup/steps/Step6LessonTypes.tsx` | 신규 생성 | 레슨종류 등록 위자드 단계 UI |
| `src/pages/SetupWizardPage.tsx` | 수정 | 동적 TOTAL, displaySteps, 조건부 렌더 |

---

### Task 1: StepHeader에 LESSON_STEP_META 추가

**Files:**
- Modify: `src/components/setup/StepHeader.tsx`

**Interfaces:**
- Produces: `LESSON_STEP_META: WizardStepMeta` — Task 2, 3에서 import해서 사용

- [ ] **Step 1: `StepHeader.tsx` 하단에 상수 추가**

현재 파일 끝 `export function StepHeader` 위에 아래 상수를 추가한다:

```tsx
export const LESSON_STEP_META: WizardStepMeta = {
  n: 6,
  icon: 'sparkles',
  tone: 'amber',
  title: '레슨 종류를 등록해주세요',
  desc: '회원에게 판매할 레슨권 종류를 미리 등록하면 결제 기록 시 바로 선택할 수 있어요.',
}
```

> `sparkles` 아이콘은 `WizardIcon`에 이미 존재하고, `tone` 값 `amber`는 WIZARD_STEPS에서 이미 사용 중인 유효한 값이다.

- [ ] **Step 2: 타입 체크**

```powershell
npx tsc -b
```

오류 없이 통과해야 한다.

- [ ] **Step 3: 커밋**

```powershell
git add src/components/setup/StepHeader.tsx
git commit -m "feat: LESSON_STEP_META 상수 추가 (위자드 레슨종류 단계용)"
```

---

### Task 2: Step6LessonTypes 컴포넌트 구현

**Files:**
- Create: `src/components/setup/steps/Step6LessonTypes.tsx`

**Interfaces:**
- Consumes:
  - `useLessonPackages(tenantId: string)` from `../../../hooks/useLessonPackages` — `{ packageTypes, loading, addPackageType, deletePackageType }`
  - `LESSON_STEP_META` from `../StepHeader`
  - `StepHeader` from `../StepHeader`
  - `WizardIcon` from `../WizardIcons`
- Produces: `Step6LessonTypes({ tenantId: string }): JSX.Element` — Task 3에서 import

- [ ] **Step 1: 파일 생성**

`src/components/setup/steps/Step6LessonTypes.tsx` 를 아래 내용으로 생성한다:

```tsx
import { useState } from 'react'
import { useLessonPackages } from '../../../hooks/useLessonPackages'
import { StepHeader, LESSON_STEP_META } from '../StepHeader'
import { WizardIcon } from '../WizardIcons'

interface Props {
  tenantId: string
}

const inputCls = 'px-3 py-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30 focus:border-[var(--color-brand-primary)]'

export function Step6LessonTypes({ tenantId }: Props) {
  const { packageTypes, loading, addPackageType, deletePackageType } = useLessonPackages(tenantId)
  const [name, setName] = useState('')
  const [count, setCount] = useState('')
  const [weeks, setWeeks] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !count) return
    setSaving(true); setErr(null)
    const maxOrder = packageTypes.reduce((m, t) => Math.max(m, t.display_order), -1)
    const error = await addPackageType({
      name: name.trim(),
      session_count: parseInt(count, 10),
      validity_days: weeks ? parseInt(weeks, 10) * 7 : null,
      display_order: maxOrder + 1,
    })
    setSaving(false)
    if (error) { setErr(error); return }
    setName(''); setCount(''); setWeeks('')
  }

  async function handleDelete(id: string) {
    await deletePackageType(id)
  }

  return (
    <div>
      <StepHeader step={LESSON_STEP_META} />

      {/* 등록된 종류 목록 */}
      {packageTypes.length > 0 && (
        <ul className="flex flex-col gap-2 mb-4">
          {packageTypes.map(t => (
            <li key={t.id}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-sm">
              <span className="font-medium text-[var(--color-text-primary)]">{t.name}</span>
              <span className="text-[var(--color-text-muted)]">
                {t.session_count}회
                {t.validity_days ? ` · ${t.validity_days / 7}주` : ''}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(t.id)}
                className="ml-auto p-1 rounded-lg text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                aria-label="삭제"
              >
                <WizardIcon.trash size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 추가 폼 */}
      <form onSubmit={handleAdd} className="flex flex-col gap-3">
        <input
          className={inputCls}
          placeholder="레슨 종류 이름 (예: 1:1 PT 10회)"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            className={`${inputCls} flex-1`}
            type="number"
            min={1}
            placeholder="회차 수"
            value={count}
            onChange={e => setCount(e.target.value)}
          />
          <input
            className={`${inputCls} flex-1`}
            type="number"
            min={1}
            placeholder="유효 기간(주, 선택)"
            value={weeks}
            onChange={e => setWeeks(e.target.value)}
          />
        </div>
        {err && <p className="text-xs text-red-500">{err}</p>}
        <button
          type="submit"
          disabled={!name.trim() || !count || saving || loading}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] text-sm font-semibold disabled:opacity-40 transition-opacity"
        >
          <WizardIcon.plus size={14} />
          {saving ? '추가 중...' : '레슨 종류 추가'}
        </button>
      </form>

      <p className="mt-4 text-xs text-center text-[var(--color-text-muted)]">
        나중에 관리자 화면에서 언제든 추가·수정할 수 있어요.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: 타입 체크**

```powershell
npx tsc -b
```

오류 없이 통과해야 한다.

- [ ] **Step 3: 커밋**

```powershell
git add src/components/setup/steps/Step6LessonTypes.tsx
git commit -m "feat: Step6LessonTypes 위자드 단계 컴포넌트 추가"
```

---

### Task 3: SetupWizardPage 통합

**Files:**
- Modify: `src/pages/SetupWizardPage.tsx`

**Interfaces:**
- Consumes:
  - `Step6LessonTypes({ tenantId: string })` from Task 2
  - `LESSON_STEP_META` from Task 1
  - `activePreset: VerticalPreset | null` — 이미 존재하는 state

- [ ] **Step 1: import 추가**

파일 상단 import 블록에 아래 두 줄을 추가한다 (기존 Step7CustomFields import 근처):

```tsx
import { Step6LessonTypes } from '../components/setup/steps/Step6LessonTypes'
import { LESSON_STEP_META } from '../components/setup/StepHeader'
```

- [ ] **Step 2: 동적 상수 선언 추가**

`SetupWizardPage` 함수 안, `const TOTAL = WIZARD_STEPS.length` 줄을 아래로 교체한다:

기존:
```tsx
const TOTAL = WIZARD_STEPS.length // 7
```

교체 후:
```tsx
const showLessonStep = !!activePreset &&
  ['lesson-sports', 'education-academy'].includes(activePreset.id)
const TOTAL = WIZARD_STEPS.length + (showLessonStep ? 1 : 0)
const CUSTOM_FIELDS_STEP = showLessonStep ? 7 : 6
```

- [ ] **Step 3: displaySteps useMemo 추가**

기존 `openDaysSummary` useMemo 위에 아래를 추가한다:

```tsx
const displaySteps = useMemo(() => {
  if (!showLessonStep) return WIZARD_STEPS
  return [
    ...WIZARD_STEPS.slice(0, 5),
    { ...LESSON_STEP_META, n: 6 },
    { ...WIZARD_STEPS[5], n: 7 },
  ]
}, [showLessonStep])
```

- [ ] **Step 4: dots 렌더에 displaySteps 적용**

기존:
```tsx
{WIZARD_STEPS.map(s => (
```

교체:
```tsx
{displaySteps.map(s => (
```

- [ ] **Step 5: isSkippable 수정**

기존:
```tsx
const isSkippable = (s: number) => s === 6 && !isFreeform
```

교체:
```tsx
const isSkippable = (s: number) =>
  (s === CUSTOM_FIELDS_STEP && !isFreeform) ||
  (showLessonStep && s === 6)
```

- [ ] **Step 6: nextDisabled 수정**

기존:
```tsx
(step === 6 && isFreeform && customFields.length === 0)
```

교체:
```tsx
(step === CUSTOM_FIELDS_STEP && isFreeform && customFields.length === 0)
```

- [ ] **Step 7: goNext 내부 step 번호 수정**

기존:
```tsx
else if (stepNum === 6) ok = await saveStep7()
```

교체:
```tsx
else if (stepNum === CUSTOM_FIELDS_STEP) ok = await saveStep7()
```

- [ ] **Step 8: render 블록 수정**

기존:
```tsx
{step === 6 && (
  <Step7CustomFields
    fields={customFields} isFreeform={isFreeform} error={error}
    onChange={setCustomFields}
  />
)}
```

교체 (레슨종류 블록 추가 + 커스텀필드 조건 수정):
```tsx
{showLessonStep && step === 6 && (
  <Step6LessonTypes tenantId={orgId} />
)}
{step === CUSTOM_FIELDS_STEP && (
  <Step7CustomFields
    fields={customFields} isFreeform={isFreeform} error={error}
    onChange={setCustomFields}
  />
)}
```

- [ ] **Step 9: 타입 체크**

```powershell
npx tsc -b
```

오류 없이 통과해야 한다.

- [ ] **Step 10: 동작 확인**

개발 서버를 띄우고 아래 두 경로로 위자드를 진행한다.

**LESSON:ON 경로** — 레슨종류 단계가 보여야 함:
```
/setup?org=<dev-org-id>&vertical=lesson-sports
```
- step 5(운영규칙) 다음에 step 6(레슨종류) 화면이 나오는지 확인
- 레슨종류를 하나 추가하면 목록에 나타나는지 확인
- "건너뛰기" 버튼이 표시되는지 확인
- "다음"을 누르면 step 7(커스텀필드)로 이동하는지 확인
- dots이 7개 표시되는지 확인

**일반 경로** — 기존 6단계 그대로여야 함:
```
/setup?org=<dev-org-id>
```
- step 5(운영규칙) 다음에 바로 step 6(커스텀필드)가 나오는지 확인
- dots이 6개 표시되는지 확인

- [ ] **Step 11: 커밋**

```powershell
git add src/pages/SetupWizardPage.tsx
git commit -m "feat: 위자드에 레슨종류 설정 단계 추가 (LESSON:ON / CLASS:ON)"
```

---

## 완료 체크리스트

- [ ] `npx tsc -b` 오류 없음
- [ ] LESSON:ON 위자드: 레슨종류 step이 5 → 6 위치에 표시됨
- [ ] LESSON:ON 위자드: 종류 추가·삭제 즉시 반영됨
- [ ] LESSON:ON 위자드: 건너뛰기 가능, 커스텀필드가 step 7로 표시됨
- [ ] 일반 위자드: 기존 6단계 흐름 그대로 유지됨
- [ ] CLASS:ON (`education-academy`) 버티컬도 동일하게 동작함
