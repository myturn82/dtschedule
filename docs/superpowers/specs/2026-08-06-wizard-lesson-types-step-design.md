# 조직 위자드 — 레슨종류 설정 단계 추가

날짜: 2026-08-06  
대상 버티컬: LESSON:ON (`lesson-sports`), CLASS:ON (`education-academy`)

---

## 목표

LESSON:ON / CLASS:ON 버티컬로 신규 가입한 조직이 위자드 완료 직후부터
레슨권 종류를 바로 사용할 수 있도록, 위자드 내에 레슨종류 등록 단계를 추가한다.

---

## 변경 범위

### 표시 조건

```ts
const showLessonStep = !!activePreset &&
  ['lesson-sports', 'education-academy'].includes(activePreset.id)
```

`activePreset`은 URL 파라미터 `?vertical=lesson-sports` 등으로 결정되는 값으로,
기존 조직 편집 시에는 `null`이므로 기존 조직에는 영향 없음.

---

## 위자드 흐름

### 일반 조직 (변경 없음)

```
1 → 2 → 3 → 4 → 5 → 6(커스텀필드) → 완료
TOTAL = 6
```

### LESSON:ON / CLASS:ON

```
1 → 2 → 3 → 4 → 5 → 6(레슨종류) → 7(커스텀필드) → 완료
TOTAL = 7
```

---

## 새 컴포넌트: `Step6LessonTypes.tsx`

경로: `src/components/setup/steps/Step6LessonTypes.tsx`

### Props

```ts
interface Props {
  tenantId: string
  error?: string
}
```

### 내부 동작

- `useLessonPackages(tenantId)` 훅을 그대로 사용
- 패키지 타입 추가·삭제가 Next 버튼과 무관하게 즉시 DB에 반영 (Step4Roles 패턴)
- 입력 필드: 레슨명(필수) / 회차 수(필수, 정수) / 유효 기간(주 단위, 선택)
- 등록된 종류 목록: 이름 · 회차 · 유효기간 표시, 삭제 버튼
- 건너뛰기 가능이므로 "아직 없어도 괜찮아요" 안내 문구 포함

### 스텝 헤더 메타

```ts
// StepHeader.tsx에 추가할 상수
export const LESSON_STEP_META: WizardStepMeta = {
  n: 6,   // 동적으로 덮어쓰므로 참고용
  icon: 'list',
  tone: 'orange',
  title: '레슨 종류를 등록해주세요',
  desc: '회원에게 판매할 레슨권 종류를 미리 등록하면 결제 기록 시 바로 선택할 수 있습니다.',
}
```

---

## `SetupWizardPage.tsx` 수정 포인트

### 1. 단계 수 및 커스텀필드 step 번호 동적화

```ts
const showLessonStep = !!activePreset &&
  ['lesson-sports', 'education-academy'].includes(activePreset.id)

const TOTAL = WIZARD_STEPS.length + (showLessonStep ? 1 : 0)  // 6 or 7
const CUSTOM_FIELDS_STEP = showLessonStep ? 7 : 6
```

### 2. dots 표시용 배열 동적 구성 (useMemo)

```ts
const displaySteps = useMemo(() => {
  if (!showLessonStep) return WIZARD_STEPS
  return [
    ...WIZARD_STEPS.slice(0, 5),
    { ...LESSON_STEP_META, n: 6 },
    { ...WIZARD_STEPS[5], n: 7 },   // 커스텀필드
  ]
}, [showLessonStep])
```

### 3. `isSkippable` 수정

```ts
const isSkippable = (s: number) =>
  (s === CUSTOM_FIELDS_STEP && !isFreeform) ||
  (showLessonStep && s === 6)
```

### 4. `nextDisabled` 수정

커스텀필드 조건의 step 번호를 `CUSTOM_FIELDS_STEP`으로 교체:

```ts
(step === CUSTOM_FIELDS_STEP && isFreeform && customFields.length === 0)
```

### 5. `goNext` 수정

```ts
else if (stepNum === CUSTOM_FIELDS_STEP) ok = await saveStep7()
```

레슨종류 step(6)에서 Next를 누르면 별도 save 없이 `setStep(7)`로 이동.

### 6. render 블록 추가

```tsx
{showLessonStep && step === 6 && (
  <Step6LessonTypes tenantId={orgId} error={error} />
)}
{step === CUSTOM_FIELDS_STEP && (
  <Step7CustomFields ... />
)}
```

---

## 영향 없는 영역

- `StepDone` 컴포넌트: 변경 없음
- `saveStep1~3`, `saveStep7`: 내부 로직 변경 없음 (step 번호 조건만 조정)
- `useLessonPackages` 훅: 변경 없음
- DB 스키마: 변경 없음 (`lesson_package_types` 테이블 이미 존재)
- 기존 조직 위자드 흐름: 변경 없음

---

## 엣지 케이스

| 상황 | 처리 |
|------|------|
| 레슨종류 하나도 없이 Next | 허용 (건너뛰기와 동일하게 처리) |
| 레슨종류 추가 중 네트워크 오류 | `useLessonPackages` 내부 에러 표시 (위자드 진행 차단 안 함) |
| 기존 조직이 위자드 재진입 | `activePreset = null` → `showLessonStep = false` → 6단계 그대로 |
| 세션 복원 (새로고침) | `step` sessionStorage에서 복원, `showLessonStep`은 URL 파라미터로 재계산 |
