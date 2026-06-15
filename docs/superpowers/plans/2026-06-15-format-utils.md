# 데이터 표시 포맷팅 유틸 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `src/lib/format.ts` 단일 진입점을 만들고, 전화번호·숫자 표시를 전체 화면에 일관되게 적용한다.

**Architecture:** `formatPhone`(기존)을 `fmtPhone`으로 re-export하고, `fmtNumber` 신규 추가. 표시가 필요한 3개 컴포넌트와 DashboardPage에 적용 후 CLAUDE.md에 규칙 문서화.

**Tech Stack:** TypeScript, React, Vitest

---

### Task 1: `src/lib/format.ts` 생성 + 테스트

**Files:**
- Create: `src/lib/format.ts`
- Create: `src/lib/format.test.ts`

- [ ] **Step 1: 테스트 파일 작성**

`src/lib/format.test.ts`를 아래 내용으로 생성한다:

```typescript
import { describe, it, expect } from 'vitest'
import { fmtPhone, fmtNumber } from './format'

describe('fmtPhone', () => {
  it('010 번호에 하이픈을 붙인다', () => {
    expect(fmtPhone('01012345678')).toBe('010-1234-5678')
  })
  it('이미 하이픈이 있는 값도 정규화한다', () => {
    expect(fmtPhone('010-1234-5678')).toBe('010-1234-5678')
  })
  it('02 번호를 올바르게 포맷한다', () => {
    expect(fmtPhone('0212345678')).toBe('02-1234-5678')
  })
  it('null/undefined → 빈 문자열', () => {
    expect(fmtPhone(null)).toBe('')
    expect(fmtPhone(undefined)).toBe('')
    expect(fmtPhone('')).toBe('')
  })
})

describe('fmtNumber', () => {
  it('숫자에 천단위 콤마를 붙인다', () => {
    expect(fmtNumber(1234567)).toBe('1,234,567')
  })
  it('문자열 숫자도 처리한다', () => {
    expect(fmtNumber('9876')).toBe('9,876')
  })
  it('0은 "0"을 반환한다', () => {
    expect(fmtNumber(0)).toBe('0')
  })
  it('null/undefined → 빈 문자열', () => {
    expect(fmtNumber(null)).toBe('')
    expect(fmtNumber(undefined)).toBe('')
    expect(fmtNumber('')).toBe('')
  })
  it('숫자가 아닌 문자열은 그대로 반환한다', () => {
    expect(fmtNumber('abc')).toBe('abc')
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```
npm test -- src/lib/format.test.ts
```

Expected: `Cannot find module './format'` 에러로 실패

- [ ] **Step 3: `src/lib/format.ts` 구현**

```typescript
export { formatPhone as fmtPhone } from './phone'

export function fmtNumber(value: number | string | null | undefined): string {
  if (value == null || value === '') return ''
  const n = Number(value)
  if (isNaN(n)) return String(value)
  return n.toLocaleString('ko-KR')
}

// 마스킹 함수 — 현재 전체 노출. 권한별 전환 시 이 함수 내부만 수정.
export function maskPhone(v: string): string { return fmtPhone(v) }
export function maskEmail(v: string): string { return v }
export function maskName(v: string):  string { return v }
```

> `fmtPhone(null)`이 동작하려면 `formatPhone`이 null/undefined를 받을 수 있어야 한다.
> `phone.ts`의 `formatPhone` 시그니처가 `string`만 받으므로, `fmtPhone` wrapper를 추가한다:

```typescript
import { formatPhone } from './phone'

export function fmtPhone(value: string | null | undefined): string {
  if (!value) return ''
  return formatPhone(value)
}

export function fmtNumber(value: number | string | null | undefined): string {
  if (value == null || value === '') return ''
  const n = Number(value)
  if (isNaN(n)) return String(value)
  return n.toLocaleString('ko-KR')
}

export function maskPhone(v: string): string { return fmtPhone(v) }
export function maskEmail(v: string): string { return v }
export function maskName(v: string):  string { return v }
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```
npm test -- src/lib/format.test.ts
```

Expected: 모든 테스트 PASS

- [ ] **Step 5: 타입 체크**

```
npx tsc -b
```

Expected: 에러 없음

- [ ] **Step 6: 커밋**

```
git add src/lib/format.ts src/lib/format.test.ts
git commit -m "feat: add format.ts with fmtPhone, fmtNumber, mask stubs"
```

---

### Task 2: DayView.tsx — customer_phone 표시 포맷 적용

**Files:**
- Modify: `src/components/schedule/DayView.tsx`

- [ ] **Step 1: import 추가 및 표시 코드 수정**

파일 상단 import에 `fmtPhone` 추가. 현재 import 라인을 찾아서 아래처럼 추가한다:

```typescript
import { fmtPhone } from '../../lib/format'
```

L61 수정 (before):
```tsx
<span className="text-xs text-[var(--color-text-muted)] truncate">· {a.customer_phone}</span>
```

L61 수정 (after):
```tsx
<span className="text-xs text-[var(--color-text-muted)] truncate">· {fmtPhone(a.customer_phone)}</span>
```

- [ ] **Step 2: 타입 체크**

```
npx tsc -b
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```
git add src/components/schedule/DayView.tsx
git commit -m "feat: apply fmtPhone to DayView customer_phone display"
```

---

### Task 3: TimeSlotCell.tsx — customer_phone 표시 포맷 적용

**Files:**
- Modify: `src/components/schedule/TimeSlotCell.tsx`

- [ ] **Step 1: import 추가 및 표시 코드 수정**

파일 상단에 import 추가:

```typescript
import { fmtPhone } from '../../lib/format'
```

L98 수정 (before):
```tsx
{a.customer_name}{a.customer_phone ? ` · ${a.customer_phone}` : ''}
```

L98 수정 (after):
```tsx
{a.customer_name}{a.customer_phone ? ` · ${fmtPhone(a.customer_phone)}` : ''}
```

- [ ] **Step 2: 기존 테스트 실행 — 회귀 없음 확인**

```
npm test -- src/components/schedule/TimeSlotCell.test.tsx
```

Expected: 기존 테스트 모두 PASS

- [ ] **Step 3: 타입 체크**

```
npx tsc -b
```

Expected: 에러 없음

- [ ] **Step 4: 커밋**

```
git add src/components/schedule/TimeSlotCell.tsx
git commit -m "feat: apply fmtPhone to TimeSlotCell customer_phone display"
```

---

### Task 4: SlotEditModal.tsx — customer_phone 표시 포맷 적용

**Files:**
- Modify: `src/components/modals/SlotEditModal.tsx`

- [ ] **Step 1: import 추가 및 표시 코드 수정**

파일 상단에 import 추가:

```typescript
import { fmtPhone } from '../../lib/format'
```

L483 수정 (before):
```typescript
if (!useDynamicFields && a.customer_phone) detailChips.push({ key: 'phone', label: '연락처', value: a.customer_phone })
```

L483 수정 (after):
```typescript
if (!useDynamicFields && a.customer_phone) detailChips.push({ key: 'phone', label: '연락처', value: fmtPhone(a.customer_phone) })
```

- [ ] **Step 2: 타입 체크**

```
npx tsc -b
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```
git add src/components/modals/SlotEditModal.tsx
git commit -m "feat: apply fmtPhone to SlotEditModal customer_phone chip"
```

---

### Task 5: CustomerAdminPage.tsx + HubMain.tsx — import 정리

**Files:**
- Modify: `src/pages/CustomerAdminPage.tsx`
- Modify: `src/components/superadmin/HubMain.tsx`

- [ ] **Step 1: CustomerAdminPage.tsx import 수정**

L14 (before):
```typescript
import { isValidPhone, formatPhone } from '../lib/phone'
```

L14 (after):
```typescript
import { isValidPhone } from '../lib/phone'
import { fmtPhone } from '../lib/format'
```

파일 내 `formatPhone(` 를 모두 `fmtPhone(` 로 교체한다 (L323, L326):

```typescript
// L323 (before)
onClick={() => { setEditingPhone(true); setEditPhone(formatPhone(myCustomer.phone ?? '')) }}
// L323 (after)
onClick={() => { setEditingPhone(true); setEditPhone(fmtPhone(myCustomer.phone ?? '')) }}

// L326 (before)
전화번호: {myCustomer.phone ? formatPhone(myCustomer.phone) : '미입력'}
// L326 (after)
전화번호: {myCustomer.phone ? fmtPhone(myCustomer.phone) : '미입력'}
```

- [ ] **Step 2: HubMain.tsx import 수정**

L10 (before):
```typescript
import { formatPhone } from '../../lib/phone'
```

L10 (after):
```typescript
import { fmtPhone } from '../../lib/format'
```

파일 내 `formatPhone(` 를 모두 `fmtPhone(` 로 교체한다 (L73, L79, L91, L105):

```typescript
// L73 (before)
const [localPhone, setLocalPhone] = useState(formatPhone(customer.phone ?? ''))
// L73 (after)
const [localPhone, setLocalPhone] = useState(fmtPhone(customer.phone ?? ''))

// L79 (before)
setLocalPhone(formatPhone(customer.phone ?? ''))
// L79 (after)
setLocalPhone(fmtPhone(customer.phone ?? ''))

// L91 (before)
const isPhoneDirty = localPhone !== formatPhone(customer.phone ?? '')
// L91 (after)
const isPhoneDirty = localPhone !== fmtPhone(customer.phone ?? '')

// L105 (before)
setLocalPhone(formatPhone(customer.phone ?? ''))
// L105 (after)
setLocalPhone(fmtPhone(customer.phone ?? ''))
```

- [ ] **Step 3: 타입 체크**

```
npx tsc -b
```

Expected: 에러 없음

- [ ] **Step 4: 커밋**

```
git add src/pages/CustomerAdminPage.tsx src/components/superadmin/HubMain.tsx
git commit -m "refactor: unify phone display imports to fmtPhone from format.ts"
```

---

### Task 6: DashboardPage.tsx — fmtNumber 적용

**Files:**
- Modify: `src/pages/DashboardPage.tsx`

- [ ] **Step 1: import 추가**

파일 상단에 import 추가:

```typescript
import { fmtNumber } from '../lib/format'
```

- [ ] **Step 2: 인라인 toLocaleString 교체**

L537 (before):
```typescript
const fmtValue = isNaN(Number(row.value)) ? row.value : Number(row.value).toLocaleString('ko-KR')
```

L537 (after):
```typescript
const fmtValue = fmtNumber(row.value) || row.value
```

L552 (before):
```typescript
const fmtSum = valueSum !== null ? valueSum.toLocaleString('ko-KR') : null
```

L552 (after):
```typescript
const fmtSum = valueSum !== null ? fmtNumber(valueSum) : null
```

- [ ] **Step 3: 타입 체크**

```
npx tsc -b
```

Expected: 에러 없음

- [ ] **Step 4: 커밋**

```
git add src/pages/DashboardPage.tsx
git commit -m "refactor: replace inline toLocaleString with fmtNumber in DashboardPage"
```

---

### Task 7: CLAUDE.md 포맷팅 규칙 추가

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: 규칙 섹션 추가**

`CLAUDE.md`의 기존 섹션 마지막(파일 끝)에 아래 내용을 추가한다:

```markdown
## 데이터 표시 포맷팅 규칙

모든 데이터 **표시** 포맷팅은 `src/lib/format.ts`의 함수를 사용한다.

| 대상 | 함수 | 출력 예시 |
|------|------|-----------|
| 전화번호 표시 | `fmtPhone(value)` | `010-1234-5678` |
| 숫자 천단위 | `fmtNumber(value)` | `1,234,567` |
| 전화번호 마스킹 | `maskPhone(value)` | 현재: 전체 노출 |
| 이메일 마스킹 | `maskEmail(value)` | 현재: 전체 노출 |
| 이름 마스킹 | `maskName(value)` | 현재: 전체 노출 |

### 반드시 지켜야 할 규칙

1. **`toLocaleString('ko-KR')` 인라인 사용 금지** — 항상 `fmtNumber()`를 사용한다.
2. **`formatPhone()` 직접 import 금지** — 표시 목적이라면 `fmtPhone()` from `src/lib/format.ts`를 사용한다.
   - 예외: 실시간 입력 onChange 핸들러 내부에서는 `formatPhone()` 직접 사용 허용.
3. **마스킹 정책 변경 시** — `format.ts`의 `mask*` 함수 내부만 수정하면 전체 적용된다.
4. **`null` / `undefined` 안전** — `fmtPhone`, `fmtNumber` 모두 null/undefined를 빈 문자열로 처리한다.
```

- [ ] **Step 2: 커밋**

```
git add CLAUDE.md
git commit -m "docs: add data display formatting rules to CLAUDE.md"
```

---

### Task 8: 최종 검증

- [ ] **Step 1: 전체 테스트 실행**

```
npm test
```

Expected: 모든 테스트 PASS

- [ ] **Step 2: 빌드 확인**

```
npx tsc -b
```

Expected: 에러 없음

- [ ] **Step 3: 개발 서버에서 육안 확인**

`http://localhost:5173` 에서 아래 화면을 순서대로 확인한다:

1. **월간 뷰 (ScheduleGrid)** — customer_phone이 있는 슬롯의 TimeSlotCell에서 `010-XXXX-XXXX` 형식 확인
2. **주간 뷰 (WeekGrid)** — 동일 확인
3. **일간 뷰 (DayView)** — 슬롯 상세에서 전화번호 `010-XXXX-XXXX` 형식 확인
4. **슬롯 편집 모달 (SlotEditModal)** — 연락처 chip에서 포맷 확인
5. **대시보드 (DashboardPage)** — 통계 숫자에 천단위 콤마 확인
6. **고객 관리 (CustomerAdminPage)** — 전화번호 표시 포맷 확인
