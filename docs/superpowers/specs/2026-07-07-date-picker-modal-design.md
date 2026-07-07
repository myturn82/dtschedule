# 날짜 선택 모달 (스크롤 휠 피커) 설계

## 배경 / 목적

스케줄 화면(`SchedulePage.tsx`)의 월/주/일 뷰 타이틀(예: "7월", "7월 1일 ~ 7일", "7월 7일")을 클릭하면
연/월(/일)을 직접 스크롤로 골라 바로 해당 날짜로 이동할 수 있는 기능을 추가한다.
현재는 이전(←)/다음(→) 버튼으로 한 칸씩만 이동 가능해, 멀리 떨어진 날짜로 가려면 여러 번 클릭해야 한다.

## 범위

- 대상: `SchedulePage.tsx`가 사용하는 `ScheduleHeader` (월/주/일 뷰 공통)
- 비대상: `SharePage.tsx`(읽기 전용 공유 뷰)는 `onDateSelect`를 넘기지 않아 기존 동작 유지(타이틀 클릭 불가)

## 데이터 흐름

`SchedulePage.tsx`는 `year`/`month`/`day`를 각각 `useState`로 관리하고, 주간 뷰의 `weekDays`도
`getWeekDays(year, month, day)`로 이 값들에서 파생된다. 따라서 뷰 종류와 무관하게
**`year`/`month`/`day` state만 갱신하면 해당 뷰가 자동으로 올바른 날짜를 보여준다.**
피커는 이 세 값을 골라 부모에 돌려주기만 하면 되고, 뷰별 특수 처리가 필요 없다.

```
ScheduleHeader
  onDateSelect?: (year: number, month: number, day?: number) => void
       │ (타이틀 클릭 → 모달 오픈 → 확인)
       ▼
SchedulePage
  onDateSelect={(y, m, d) => { setYear(y); setMonth(m); if (d !== undefined) setDay(d) }}
```

## 컴포넌트

### `src/components/schedule/DatePickerModal.tsx` (신규)

```ts
interface Props {
  year: number
  month: number
  day?: number                 // mode='full'일 때만 사용/표시
  mode: 'month' | 'full'       // 월뷰='month'(연/월만), 주·일뷰='full'(연/월/일)
  onConfirm: (year: number, month: number, day?: number) => void
  onClose: () => void
}
```

- 배경 딤 오버레이 + 중앙 카드형 모달.
- `mode==='month'`이면 컬럼 `[연, 월]`, `mode==='full'`이면 `[연, 월, 일]`.
- 각 컬럼은 세로 스크롤 리스트(`overflow-y-auto`, `scroll-snap-type: y mandatory`),
  각 항목은 `scroll-snap-align: center`. 리스트 위/아래에 `(컨테이너 높이 - 항목 높이) / 2`
  크기의 spacer를 둬서 첫/마지막 값도 중앙까지 스크롤 가능하게 한다.
- 중앙 위치에 스크롤되지 않는 고정 하이라이트 바(선택 표시)를 얹는다.
- 각 컬럼 위/아래에 작은 ▲▼ 버튼을 두어, 스크롤 제스처가 없는 환경(트랙패드 미보유, 키보드 포커스 등)에서도
  한 칸씩 이동 가능하게 한다. 버튼 클릭 시 `scrollBy({ top: ±itemHeight, behavior: 'smooth' })`.
- 값 범위: 연도 `초기연도 - 50 ~ + 50` 고정 배열(무한 스크롤 없음), 월 `1~12` 고정,
  일은 `daysInMonth(선택연도, 선택월)`로 스크롤할 때마다 재계산.
- 연/월 변경으로 최대 일수가 선택된 일보다 작아지면(예: 31일 선택 후 2월로 스크롤) 일 값을 자동으로 그 달의
  마지막 날로 클램프.
- 모달 마운트 시 각 컬럼을 현재 값 위치로 애니메이션 없이(`scrollTo({ behavior: 'auto' })`) 즉시 이동.
- 하단 "확인"/"취소" 버튼. "확인"은 각 컬럼의 현재 스크롤 위치에서 계산된 값으로 `onConfirm(year, month, day?)`
  호출 후 닫힘. "취소"/배경 클릭/ESC는 변경 없이 `onClose()`만 호출.

### 순수 함수 (유닛 테스트 대상)

같은 파일 또는 `src/lib/` 하위에 아래 순수 함수를 분리해 로직을 스크롤 DOM과 독립적으로 테스트 가능하게 한다.

- `yearRange(center: number, span = 50): number[]` — `[center-span, ..., center+span]`
- `daysInMonth(year: number, month: number): number` — 해당 월의 실제 일수
- `nearestIndex(scrollTop: number, itemHeight: number): number` — 스크롤 위치에서 가장 가까운 항목 인덱스(반올림)

## `ScheduleHeader.tsx` 변경

- `onDateSelect?: (year: number, month: number, day?: number) => void` prop 추가.
- 이 prop이 있을 때만 월/주/일 타이틀 텍스트에 `cursor-pointer` 스타일 + 클릭 핸들러(모달 오픈, 내부 `useState`로 관리)를 부여.
  prop이 없으면(`SharePage.tsx`) 기존처럼 클릭 불가능한 순수 텍스트로 남는다.
- 모달 오픈 시 현재 `viewType`에 따라 `mode`를 결정: `month` → `'month'`, `week`/`day` → `'full'`.
- 확인 시 `onDateSelect(y, m, d)` 호출.

## `SchedulePage.tsx` 변경

- `<ScheduleHeader ... onDateSelect={(y, m, d) => { setYear(y); setMonth(m); if (d !== undefined) setDay(d) }} />` 연결.

## 테스트 계획

- jsdom은 실제 스크롤 스냅 물리를 재현하지 못하므로, `yearRange`/`daysInMonth`/`nearestIndex` 순수 함수는
  일반 유닛 테스트로 커버한다(경계값: 윤년 2월, 12월→1월 등).
- `DatePickerModal`의 모달 오픈/확인/취소 흐름은 실제 스크롤 대신 "확인" 버튼 클릭 시 초기값 그대로
  `onConfirm`이 호출되는지, "취소" 시 `onConfirm`이 호출되지 않고 `onClose`만 호출되는지를 버튼 클릭 기반으로 검증한다.
- 실제 스크롤 인터랙션(휠/터치 스와이프, 중앙 스냅, ▲▼ 버튼 이동)은 `npm run dev`로 브라우저에서 직접 확인한다.

## 비범위 (하지 않는 것)

- 무한 스크롤 연도 목록(고정 범위만 지원)
- 스크롤 중 실시간 이동(라이브 프리뷰만 하고 실제 이동은 "확인" 버튼으로만 발생)
- `SharePage.tsx`(공유 읽기 전용 뷰)에 대한 적용
