# 엑셀모드 — 분리 셀(열) 선택/복사·붙여넣기 + 모바일 지원 설계

상태: 승인됨 (채팅 내 디자인 승인 완료) — 작성일 2026-06-18

## 1. 배경 / 문제

`SchedulePage.tsx`의 "엑셀모드"는 월간 뷰(`ScheduleGrid`)에서 셀을 드래그/Shift+클릭으로 선택해
Ctrl+C/Ctrl+V로 복사·붙여넣기 하는 기능이다. 현재 두 가지 문제가 있다.

1. **열 단위 선택 불가** — 선택 단위가 `{ day, slotIdx }` 2차원뿐이라, 역할 분리 모드(`isSplitMode`)나
   회원/50+ 분리 모드(`showVolPlusSplit`)에서 한 시간대의 모든 열이 한꺼번에 선택·복사된다.
   특정 역할 하나, 또는 회원/50+ 중 하나만 복사하고 싶어도 분리해서 선택할 방법이 없다.
2. **모바일에서 사용 불가** — 범위 선택은 Shift 키(물리 키보드)로 끝점을 확장하고,
   복사/붙여넣기는 Ctrl+C/Ctrl+V 키보드 단축키로만 실행된다. 둘 다 모바일에는 대응 수단이 전혀 없어
   엑셀모드 자체가 모바일에서는 사실상 동작하지 않는다(엑셀모드 토글 버튼 자체는 모바일 메뉴에도 있음).

## 2. 목표 / 비목표

**목표**
- 역할 분리 모드·회원/50+ 분리 모드 모두에서 개별 열(또는 여러 열 범위)을 선택해 복사/붙여넣기 가능
- PC·모바일 공통의 단일 선택 동작 규칙으로 통일 (모바일은 두 번 탭, PC는 기존 동작 + 신규 규칙 모두 동작)
- 복사/붙여넣기를 버튼(터치 가능)으로도 실행 가능하게 — PC의 Ctrl+C/V/Esc는 그대로 유지

**비목표**
- 주간 뷰(`WeekGrid`)·일간 뷰(`DayView`)로 엑셀모드 확장 — 토글 자체가 지금도 월간 뷰에만 노출되므로 범위 밖
- 휴관/휴식시간 등 현재도 클릭이 막혀있는 셀의 선택 가능 여부 변경 — 그대로 유지

## 3. 데이터 모델 변경

`SchedulePage.tsx`

```ts
type CellPos = { day: number; slotIdx: number; colIdx: number }
type CopiedCell = {
  dayOffset: number; slotOffset: number; colOffset: number
  assignments: Array<{ member_name: string; note: string | null; member_type: string; role_id: string | null; user_id: string | null; time_sub: string | null; color: string | null }>
}
```

`colIdx`의 의미는 모드에 따라 다르다:
- 역할 분리 모드(`isSplitMode`): `splitRoles` 배열의 인덱스 (0 = 첫 번째 역할, …)
- 회원/50+ 분리 모드(`showVolPlusSplit`, 비분리 모드): `0` = 회원(vol), `1` = 50+(plus)
- 둘 다 아님(단일 열): 항상 `0`

클릭 시 `colIdx` 계산 (`ModalTarget.roleId` / `ModalTarget.memberType` 기반):

```ts
function colIdxOf(target: ModalTarget): number {
  if (isSplitMode) return splitRoles.findIndex(r => r.id === target.roleId)
  return target.memberType === '50plus' ? 1 : 0
}
```

`selRange` / `cpRange`(`useMemo`)에 `minColIdx`/`maxColIdx` 추가:

```ts
const selRange = useMemo(() => {
  if (!cellSel) return null
  return {
    minDay: Math.min(cellSel.anchor.day, cellSel.cursor.day),
    maxDay: Math.max(cellSel.anchor.day, cellSel.cursor.day),
    minSlotIdx: Math.min(cellSel.anchor.slotIdx, cellSel.cursor.slotIdx),
    maxSlotIdx: Math.max(cellSel.anchor.slotIdx, cellSel.cursor.slotIdx),
    minColIdx: Math.min(cellSel.anchor.colIdx, cellSel.cursor.colIdx),
    maxColIdx: Math.max(cellSel.anchor.colIdx, cellSel.cursor.colIdx),
  }
}, [cellSel])
```

`cpRange`도 동일하게 `colOffset`의 최대값으로 `minColIdx`/`maxColIdx`를 계산한다.

## 4. 선택 동작 (PC·모바일 통합 규칙)

`handleCellClick`의 엑셀모드 분기를 다음 상태기계로 교체한다:

- 현재 선택이 없거나, **이미 범위(anchor ≠ cursor)** 상태에서 새 칸을 클릭/탭 → 그 칸을 anchor=cursor로 **새 선택 시작**
- 현재 선택이 **단일 칸(anchor === cursor)** 상태에서 다른 칸을 클릭/탭 → cursor만 그 칸으로 갱신해 **범위 완성**
- `isShiftRef.current`가 true(PC, Shift 누른 채 클릭)면 위 규칙과 무관하게 항상 cursor만 갱신(기존 동작 유지, 여러 번 계속 확장 가능)

```ts
function isSameCell(a: CellPos, b: CellPos) {
  return a.day === b.day && a.slotIdx === b.slotIdx && a.colIdx === b.colIdx
}

if (excelMode) {
  const pos: CellPos = { day: target.day, slotIdx, colIdx: colIdxOf(target) }
  setCellSel(prev => {
    if (isShiftRef.current && prev) return { anchor: prev.anchor, cursor: pos }
    if (prev && !isSameCell(prev.anchor, prev.cursor)) return { anchor: pos, cursor: pos }
    if (prev) return { anchor: prev.anchor, cursor: pos }
    return { anchor: pos, cursor: pos }
  })
  return
}
```

이 규칙 하나로 데스크톱 기존 사용자(Shift+클릭으로 계속 확장)와 모바일 사용자(두 번 탭으로 범위 완성, 세 번째 탭은 새 선택) 모두 자연스럽게 동작한다. 별도의 모바일 전용 토글이나 분기가 필요 없다.

## 5. 복사 (Ctrl+C / 복사 버튼)

`selRange`의 `minColIdx~maxColIdx`까지 순회하며, 각 `colIdx`에 대해 역할 분리 모드면 `splitRoles[colIdx].id`로 `role_id` 필터, 비분리 모드면 `colIdx === 1 ? '50plus' : 'member'`로 `member_type` 필터링한 배정만 모아서 `CopiedCell.assignments`에 담는다. `colOffset = colIdx - selRange.minColIdx`도 함께 저장한다.

기존처럼 `member_type !== 'admin_note'`는 계속 제외한다.

## 6. 붙여넣기 (Ctrl+V / 붙여넣기 버튼)

붙여넣기 시작 열(`pasteColIdx`)은 `cellSel.cursor.colIdx` 또는 `anchor.colIdx` 중 작은 값(기존 day/slotIdx와 동일한 방식)으로 정한다. 각 `CopiedCell`에 대해 `targetColIdx = pasteColIdx + cell.colOffset`을 계산하고:

- 역할 분리 모드: `targetColIdx`가 `splitRoles` 범위를 벗어나면 해당 셀은 건너뛴다(day/slotIdx 범위 초과 시 건너뛰는 기존 로직과 동일한 패턴).
- 비분리 모드(회원/50+): `targetColIdx`가 0/1 범위를 벗어나면 건너뛴다. **추가로, 대상 요일이 토요일이고 `targetColIdx === 1`(50+)이면 건너뛴다** — 토요일은 50+ 열 자체가 화면에 없으므로(`ScheduleGrid`의 `!isSat` 조건), 여기에 배정을 만들면 화면에는 안 보이는 고아 데이터가 생긴다.

각 colIdx에 대응하는 `role_id`/`member_type`로 값을 바꿔서 `addAssignment`를 호출하는 것 외에는 기존 붙여넣기 로직(휴관/휴식/잠금 셀 스킵 등)을 그대로 유지한다.

## 7. `ScheduleGrid.tsx` 변경

`Props`의 `selectionRange`/`copyRange` 타입에 `minColIdx`/`maxColIdx` 추가.

`inRange` 함수에 `colIdx` 파라미터 추가:

```ts
function inRange(day: number, si: number, ci: number, r: RangeT) {
  return day >= r.minDay && day <= r.maxDay
    && si >= r.minSlotIdx && si <= r.maxSlotIdx
    && ci >= r.minColIdx && ci <= r.maxColIdx
}
```

- 역할 분리 모드 렌더링(`splitRoles.map((role, roleIdx) => ...)`): 이미 `roleIdx`를 갖고 있으므로 `inRange(day, slotIdx, roleIdx, selectionRange)`로 교체.
- 비분리 모드(vol/plus) 렌더링: vol 블록은 `colIdx=0`, plus 블록은 `colIdx=1`을 리터럴로 넘겨 `inRange(day, slotIdx, 0, ...)` / `inRange(day, slotIdx, 1, ...)`.

오버레이 자체(파란 반투명 배경 / 점선 테두리)의 마크업·스타일은 변경하지 않는다.

## 8. 복사/붙여넣기 액션 바 (신규 UI)

`excelMode && cellSel`일 때 화면 하단에 고정 바를 띄운다 (기존 `fixed bottom-6 left-1/2 -translate-x-1/2 z-50` 토스트와 같은 위치 패턴 재사용):

```
[📋 복사]  [📥 붙여넣기]  [✕ 선택해제]
```

- 복사: `selRange`가 있을 때만 활성화, 클릭 시 기존 Ctrl+C 핸들러와 동일한 로직 실행
- 붙여넣기: `copyBuf && cellSel && isPrivileged`일 때만 활성화, 기존 Ctrl+V 핸들러와 동일한 로직 실행
- 선택해제: `cellSel`/`copyBuf`를 모두 `null`로 (기존 Esc 핸들러와 동일)

PC의 Ctrl+C/V/Esc 키보드 단축키는 그대로 유지하고, 버튼은 두 핸들러를 호출하는 추가 진입점으로 둔다(로직 중복 방지를 위해 키보드 핸들러 내부 로직을 함수로 추출해 버튼 onClick에서도 재사용).

## 9. 적용 범위 재확인

- 월간 뷰(`ScheduleGrid`)에만 적용. `WeekGrid`/`DayView`는 변경하지 않는다.
- 역할 분리 모드와 회원/50+ 분리 모드 둘 다 동일 코드 경로로 처리한다.
- 휴관/휴식시간 등 현재 `onCellClick`이 연결되지 않은 병합 셀은 지금처럼 선택 시작점이 될 수 없다 (변경 없음).

## 10. 테스트 관점 (구현 후 점검 포인트)

- 역할 분리 모드: 역할 A 열만 두 칸 선택 → 복사 → 다른 날짜의 역할 A 열에 붙여넣기 → 역할 A에만 들어가는지
- 역할 분리 모드: 역할 A~C 열 범위 선택 → 복사 → 역할 B를 시작점으로 붙여넣기 → B,C,(D 있으면 범위초과 스킵) 순서로 들어가는지
- 회원/50+ 모드: 50+ 열만 선택 → 복사 → 평일 50+ 열에 붙여넣기 정상, **토요일 50+ 위치에 붙여넣기 시도 시 스킵되는지**
- 모바일(터치)에서 두 번 탭으로 범위 선택 → 하단 바의 복사/붙여넣기 버튼으로 정상 동작하는지
- PC에서 기존 Shift+클릭 드래그 확장과 Ctrl+C/V/Esc가 회귀 없이 그대로 동작하는지
- 새 선택 규칙(단일 칸 상태에서 클릭 시 확장, 범위 상태에서 클릭 시 새 선택)이 기존 단일 셀 선택 후 모달 동작(엑셀모드 OFF 상태)에는 영향 없는지

## 11. 업데이트 (2026-06-19) — PC·모바일 선택 규칙 분리, 복사/붙여넣기 후 선택 초기화

구현·실사용 중 두 가지 문제가 발견되어 설계를 변경했다.

**문제 1**: 4절의 통합 규칙("단일 칸 상태에서 새 클릭 → 확장")을 PC에도 그대로 적용했더니,
같은 요일·시간대에서 역할 A를 복사한 뒤(단일 칸 선택 상태) 역할 B 칸을 클릭하면
"새 선택"이 아니라 "A~B 범위로 확장"이 되어버렸다. 붙여넣기는 그 범위의 **최소 열(=A)** 을
기준으로 동작하므로, 의도와 달리 다시 A에 붙여넣기를 시도하게 되고(이미 동일 데이터가 있어
무시됨) B에는 아무 변화가 없는 것처럼 보이는 버그가 있었다.

**해결**:
1. PC와 모바일의 선택 규칙을 분리한다.
   - **PC**(`window.matchMedia('(pointer: coarse)').matches === false`): 클릭은 항상 새 단일 셀
     선택, Shift+클릭만 끝점을 확장 — 이 기능 작업 이전의 원래 동작과 동일. 새 순수 함수
     `legacyCellSelection(prev, pos, forceExtend)` (`src/utils/excelSelection.ts`)로 구현.
   - **모바일/태블릿**(터치, `pointer: coarse`): 4절에서 정의한 두 번 탭 규칙(`nextCellSelection`)을
     그대로 사용 — Shift 키가 없으므로 이 규칙이 여전히 필요함.
   - `SchedulePage.tsx`의 `handleCellClick`에서 `isCoarsePointerDevice()`로 분기해 둘 중 하나를 호출.
2. `runCopy()`/`runPaste()` 끝에 **모바일에서만**(`isCoarsePointerDevice()`) `setCellSel(null)`을
   추가해, 복사·붙여넣기 직후 선택을 비운다. 모바일의 두 번 탭 규칙에서는 "복사 직후 탭이
   이전 선택을 확장해버리는" 동일한 문제가 여전히 발생하므로 필요하다.
   **PC에는 적용하지 않는다** — PC는 `legacyCellSelection`이 클릭마다 항상 새 선택을 만들기
   때문에 이미 이 문제가 없고, 오히려 선택을 비우면 "Ctrl+C 후 바로 Ctrl+V로 같은 자리에
   붙여넣기"하는 키보드 흐름이 깨진다(`cellSel`이 없으면 `runPaste`가 바로 종료됨). 처음에는
   플랫폼 구분 없이 항상 비웠다가, PC에서 Ctrl+V가 안 되는 회귀가 발견되어 모바일 전용으로
   좁혔다.
3. 액션 바(8절) 표시 조건을 `excelMode && cellSel`에서 `excelMode && (cellSel || copyBuf)`로
   변경 — 모바일에서 복사 직후 `cellSel`이 비워져도 `copyBuf`가 남아있는 동안은 붙여넣기/선택해제
   버튼이 계속 보이도록 함.

**참고**: PC는 이제 4절의 "단일 칸 상태에서 확장" 규칙을 사용하지 않으므로 해당 버그 자체가
PC에서는 재발하지 않는다. 모바일은 (모바일 전용) `setCellSel(null)` 덕분에 동일 문제를 피한다.
