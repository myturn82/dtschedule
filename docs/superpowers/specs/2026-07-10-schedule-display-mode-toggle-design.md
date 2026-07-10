# 시간별/일자별 보기 모드 토글 — 설계 문서

**작성일**: 2026-07-10

## 배경 및 목적

현재 `SchedulePage`의 월간 뷰(`ScheduleGrid`)와 주간 뷰(`WeekGrid`)는 시간대를 행(row), 요일을 열(column)로 하는 표 형태로만 렌더링된다. 시간대가 많은 조직(예: 방문요양센터의 09:00/11:00/13:00 등)에서는 "이번 주 누가 언제 배정됐는지"를 표 전체를 훑어야 파악할 수 있어, 날짜 단위로 빠르게 훑어보고 싶은 경우 불편하다.

이를 보완하기 위해 월간/주간 탭 옆에 "⏳ 시간별 / 📅 일자별" 표시 모드 토글을 추가한다. **시간별**은 기존 표 형태(변경 없음), **일자별**은 날짜 하나당 그 날의 모든 배정을 시간순 목록으로 압축해서 보여주는 새로운 요약 뷰다.

## 범위

- 적용 화면: `SchedulePage`만. `SharePage`(비회원 공유 링크), `EmbedPage`(외부 임베드 위젯)에는 적용하지 않는다.
- 적용 탭: 월간, 주간. 일간 탭은 이미 하루 단위 화면이라 토글을 노출하지 않는다.
- 상태 저장: 세션 내 React state만 사용. localStorage나 DB(tenant 설정)에 저장하지 않는다 — 새로고침하면 기본값(시간별)으로 돌아온다.

## 1. 토글 UI 및 상태 관리

- `ScheduleHeader`에 prop 추가: `displayMode?: 'time' | 'day'`, `onDisplayModeChange?: (v: 'time' | 'day') => void`.
- 렌더링 위치: 기존 우측 영역(`roleToggleSlot` 옆, 뷰 스위처(월간/주간/일간) 앞 또는 뒤)에 작은 세그먼트 버튼 "⏳ 시간별 / 📅 일자별"로 표시.
- 노출 조건: `viewType !== 'day'` 이고 `onDisplayModeChange`가 전달된 경우에만 렌더링.
  - 이 위치는 관리자(햄버거 메뉴로 뷰 스위처가 숨겨진 경우 `hideViewSwitcher=true`)와 일반 회원(뷰 스위처가 보이는 경우) 화면에서 모두 공통으로 지나가는 영역이므로, 별도로 관리자용 햄버거 메뉴(`funcMenuItems`)를 수정하지 않아도 양쪽 모두에 토글이 노출된다.
- 상태: `SchedulePage`에 `const [displayMode, setDisplayMode] = useState<'time' | 'day'>('time')` 추가. `SharePage`/`EmbedPage`는 이 prop을 아예 전달하지 않아 토글이 나타나지 않는다.
- 엑셀 모드(`excelMode`)가 켜져 있는 동안은 `ScheduleHeader`에 `onDisplayModeChange`를 전달하지 않아 토글 자체를 숨긴다 (엑셀 모드는 표 셀 선택 기반이라 일자별 요약과 개념이 맞지 않음).

## 2. 일자별 렌더링 컴포넌트

### 신규 파일
- `src/components/schedule/MonthScheduleByDay.tsx` — 월간 일자별 뷰
- `src/components/schedule/WeekScheduleByDay.tsx` — 주간 일자별 뷰
- `src/utils/dayAssignments.ts` — 특정 날짜의 모든 시간대 배정을 시간순으로 모으는 공용 유틸

### `dayAssignments.ts`
```ts
export interface DayAssignmentEntry {
  timeSlot: TimeSlot
  startHour: number
  assignment: Assignment
  roleId: string | null
}

export function getDayAssignmentEntries(
  day: number, year: number, month: number,
  timeSlots: TimeSlot[],
  scheduleRules: ScheduleRule[], slotSettings: SlotSetting[],
  dateOverrides: DateOverride[], assignments: Assignment[],
  displayAssignmentFilter?: (a: Assignment) => boolean
): DayAssignmentEntry[]
```
- 각 `timeSlot`에 대해 `getCellState`를 호출하고, `isClosed`/`isHoliday`/`isBreaktime`인 슬롯은 건너뛴다.
- 남은 슬롯의 `assignments`(`member_type !== 'admin_note'`)를 모아 `startHour` 기준 오름차순 정렬 후 반환.
- `MonthScheduleByDay`와 `WeekScheduleByDay`가 이 함수를 공유한다.

### `MonthScheduleByDay.tsx`
- `ScheduleGrid`와 동일한 주차 계산(`getCalendarWeeks`), 요일 헤더, 공휴일 음영 스타일을 재사용 (해당 로직은 `ScheduleGrid`에서 별도 export하거나 필요한 만큼만 복제 — 구현 단계에서 결정).
- 날짜 셀 하나당 `getDayAssignmentEntries` 결과를 최대 3~4건까지 표시하고, 넘치는 항목은 "+N건 더" 텍스트를 눌러 같은 셀 내에서 펼친다(별도 모달 없음, `useState`로 셀별 펼침 상태 관리).
- 각 항목 줄 형식: `{time label} {member_name}` (역할 분리 모드인 조직은 `[역할명]`을 앞에 붙임). `is_locked`면 잠금 아이콘, 탈퇴 회원(`withdrawnUserIds`)이면 취소선 + "삭제됨" 표시를 유지한다.
- 항목 클릭 시 기존과 동일하게 `onCellClick({ year, month, day, timeSlot, memberType: assignment.member_type ?? 'member', roleId })`를 호출 — 기존 `SlotEditModal`이 그대로 열린다.
- 배정이 없는 날짜는 "-" 정도만 표시하고 클릭 이벤트 없음(추가는 시간별/일간 모드에서 수행).
- Props는 `ScheduleGrid`와 최대한 동일한 인터페이스를 유지해 `SchedulePage`에서 분기 렌더링이 쉽도록 한다: `year, month, timeSlots, assignments, slotSettings, scheduleRules, dateOverrides, splitRoles, isSplitMode, hiddenRoleIds, displayAssignmentFilter, withdrawnUserIds, onCellClick`. (`canAdd`, `highlightName`, `selectionRange`/`copyRange`, 인디케이터 바 관련 prop은 이 컴포넌트에서 사용하지 않음 — 아래 "제외 범위" 참조.)

### `WeekScheduleByDay.tsx`
- 동일한 개념을 7일 컬럼(`weekDays: Date[]`)에 적용. `WeekGrid`처럼 오늘 열 자동 스크롤은 유지한다(요일 헤더/오늘 강조는 `WeekGrid`와 동일 스타일 재사용).
- 나머지 동작(항목 클릭, 펼치기, 빈 날짜 처리)은 `MonthScheduleByDay`와 동일.

### `SchedulePage.tsx` 변경
```tsx
{loading ? (...)
: viewType === 'month' ? (
    displayMode === 'day'
      ? <MonthScheduleByDay year={year} month={month} timeSlots={timeSlots} assignments={assignments} slotSettings={slotSettings} scheduleRules={scheduleRules} dateOverrides={dateOverrides} splitRoles={splitRoles} isSplitMode={isSplitMode} hiddenRoleIds={hiddenRoleIds} displayAssignmentFilter={displayAssignmentFilter} withdrawnUserIds={withdrawnUserIds} onCellClick={handleCellClick} />
      : <ScheduleGrid ...기존 그대로... />
  )
: viewType === 'week' ? (
    displayMode === 'day'
      ? <WeekScheduleByDay weekDays={weekDays} ...동일 패턴... />
      : <WeekGrid ...기존 그대로... />
  )
: ...
}
```

## 3. 범위 경계 (명시적 제외)

- 인디케이터 바 색상 스트라이프, 팀장(teamLeader) 전용 틴트 등 장식적 강조는 일자별 모드에서 생략한다 (정보 밀도를 낮추는 목적과 상충).
- 엑셀 모드(셀 선택/복사·붙여넣기)는 일자별 모드에서 지원하지 않는다 — 엑셀 모드 중에는 토글 자체를 숨긴다.
- `SharePage`, `EmbedPage`에는 이 토글과 일자별 컴포넌트를 적용하지 않는다.
- 빈 날짜(배정 없음)는 읽기 전용으로 표시하며 클릭해서 새 배정을 추가할 수 없다 — 추가는 시간별 모드 또는 일간 탭에서 수행한다.
- `selectionRange`/`copyRange`(엑셀 모드 선택 영역 표시)는 일자별 컴포넌트에 전달하지 않는다.

## 4. 테스트 계획

- `src/utils/dayAssignments.test.ts`: 여러 시간대에 배정이 있을 때 시간순 정렬 검증, 휴관/휴게시간 슬롯 제외 검증, `displayAssignmentFilter` 적용 검증.
- `src/components/schedule/MonthScheduleByDay.test.tsx`, `WeekScheduleByDay.test.tsx`: 항목 클릭 시 올바른 `ModalTarget`으로 `onCellClick` 호출 검증, 빈 날짜 클릭 시 이벤트 미발생 검증, "+N건 더" 펼침 동작 검증.
- `src/components/schedule/ScheduleHeader.test.tsx`: `displayMode`/`onDisplayModeChange` prop 유무에 따른 토글 노출·비노출, `viewType === 'day'`일 때 미노출 검증.
- 회귀 확인: 기존 `ScheduleGrid.test.tsx`, `TimeSlotCell.test.tsx`는 변경하지 않으므로 그대로 통과해야 한다.
