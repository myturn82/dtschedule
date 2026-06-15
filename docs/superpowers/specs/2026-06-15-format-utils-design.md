# 데이터 표시 포맷팅 유틸 설계

**날짜:** 2026-06-15  
**범위:** 전화번호 표시 포맷, 숫자 천단위 콤마, 마스킹 규칙 체계화

---

## 배경 및 목표

- 전화번호(`customer_phone`)가 일부 화면(DayView, TimeSlotCell, SlotEditModal)에서 저장값 그대로 노출됨
- 숫자 천단위 포맷(`toLocaleString('ko-KR')`)이 DashboardPage에만 인라인으로 산재함
- 향후 권한별 마스킹을 도입할 때 수정 범위를 최소화하기 위한 단일 진입점 필요

---

## 결정 사항

- **마스킹 정책:** 항상 전체 노출 (현재). 마스킹 함수는 stub으로 존재, 나중에 내부만 수정.
- **전화번호 포맷:** `010-1234-5678` 형식 (하이픈 구분)
- **숫자 포맷:** `toLocaleString('ko-KR')` — 한국 천단위 콤마

---

## 아키텍처

### 신규 파일: `src/lib/format.ts`

모든 표시용 포맷팅의 단일 진입점.

```typescript
export { formatPhone as fmtPhone } from './phone'

export function fmtNumber(value: number | string | null | undefined): string {
  if (value == null || value === '') return ''
  const n = Number(value)
  if (isNaN(n)) return String(value)
  return n.toLocaleString('ko-KR')
}

// 마스킹 함수 — 현재 전체 노출, 향후 권한별 전환 대비 stub
export function maskPhone(v: string): string { return fmtPhone(v) }
export function maskEmail(v: string): string { return v }
export function maskName(v: string):  string { return v }
```

---

## 변경 파일 목록

### 전화번호 포맷 적용 (3곳)

| 파일 | 위치 | 변경 내용 |
|------|------|-----------|
| `src/components/schedule/DayView.tsx` | L61 | `a.customer_phone` → `fmtPhone(a.customer_phone)` |
| `src/components/schedule/TimeSlotCell.tsx` | L98 | `a.customer_phone` → `fmtPhone(a.customer_phone)` |
| `src/components/modals/SlotEditModal.tsx` | L483 | `a.customer_phone` → `fmtPhone(a.customer_phone)` |

### import 정리 (기존 formatPhone 사용처)

| 파일 | 변경 내용 |
|------|-----------|
| `src/pages/CustomerAdminPage.tsx` | `formatPhone` import → `fmtPhone` from `format.ts` |
| `src/components/superadmin/HubMain.tsx` | `formatPhone` import → `fmtPhone` from `format.ts` |

> `phone.ts`의 `formatPhone`은 내부에서 유지. `fmtPhone`은 re-export alias.

### 숫자 천단위 적용 (2곳)

| 파일 | 위치 | 변경 내용 |
|------|------|-----------|
| `src/pages/DashboardPage.tsx` | L537 | 인라인 `toLocaleString` → `fmtNumber()` |
| `src/pages/DashboardPage.tsx` | L552 | 인라인 `toLocaleString` → `fmtNumber()` |

---

## CLAUDE.md 규칙 추가

`CLAUDE.md`에 아래 섹션을 추가한다:

```markdown
## 데이터 표시 포맷팅 규칙

모든 데이터 표시 포맷팅은 `src/lib/format.ts`의 함수를 사용한다.

| 대상 | 함수 | 예시 |
|------|------|------|
| 전화번호 표시 | `fmtPhone(value)` | `010-1234-5678` |
| 숫자 천단위 | `fmtNumber(value)` | `1,234,567` |
| 전화번호 마스킹 | `maskPhone(value)` | 현재: 전체 노출 |
| 이메일 마스킹 | `maskEmail(value)` | 현재: 전체 노출 |
| 이름 마스킹 | `maskName(value)` | 현재: 전체 노출 |

- `toLocaleString('ko-KR')` 인라인 사용 금지 — `fmtNumber()` 사용
- `formatPhone()` 직접 import 금지 — `fmtPhone()` from `format.ts` 사용
- 마스킹이 필요해지면 `format.ts`의 mask 함수 내부만 수정
```

---

## 제외 범위

- `phone.ts`의 `formatPhone` 자체는 변경하지 않음 (입력 핸들러에서 직접 사용하는 곳 유지)
- `WeekGrid.tsx`의 `customer_phone` 검색 비교 로직 — 표시가 아닌 필터링이므로 포맷 불필요
- `AuthPage.tsx`, `PendingPage.tsx`의 전화번호 input — 입력 필드이므로 기존 `formatPhone` 유지
