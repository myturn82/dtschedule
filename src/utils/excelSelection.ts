export type CellPos = { day: number; slotIdx: number; colIdx: number }

export type SelRange = {
  minDay: number; maxDay: number
  minSlotIdx: number; maxSlotIdx: number
  minColIdx: number; maxColIdx: number
}

export function isSameCell(a: CellPos, b: CellPos): boolean {
  return a.day === b.day && a.slotIdx === b.slotIdx && a.colIdx === b.colIdx
}

export function rangeFromCells(anchor: CellPos, cursor: CellPos): SelRange {
  return {
    minDay: Math.min(anchor.day, cursor.day),
    maxDay: Math.max(anchor.day, cursor.day),
    minSlotIdx: Math.min(anchor.slotIdx, cursor.slotIdx),
    maxSlotIdx: Math.max(anchor.slotIdx, cursor.slotIdx),
    minColIdx: Math.min(anchor.colIdx, cursor.colIdx),
    maxColIdx: Math.max(anchor.colIdx, cursor.colIdx),
  }
}

// PC·모바일 공통 선택 상태기계:
// - 선택이 없거나 이미 범위(anchor !== cursor)일 때 새 클릭/탭 → 새 단일 셀 선택 시작
// - 단일 셀(anchor === cursor) 상태에서 새 클릭/탭 → cursor만 갱신해 범위 완성
// - forceExtend(PC Shift 키)면 항상 cursor만 갱신
export function nextCellSelection(
  prev: { anchor: CellPos; cursor: CellPos } | null,
  pos: CellPos,
  forceExtend: boolean
): { anchor: CellPos; cursor: CellPos } {
  if (forceExtend && prev) return { anchor: prev.anchor, cursor: pos }
  if (prev && !isSameCell(prev.anchor, prev.cursor)) return { anchor: pos, cursor: pos }
  if (prev) return { anchor: prev.anchor, cursor: pos }
  return { anchor: pos, cursor: pos }
}

// PC 전용 선택 규칙: 클릭은 항상 새 단일 셀 선택, Shift+클릭만 끝점을 확장한다
export function legacyCellSelection(
  prev: { anchor: CellPos; cursor: CellPos } | null,
  pos: CellPos,
  forceExtend: boolean
): { anchor: CellPos; cursor: CellPos } {
  if (forceExtend) return { anchor: prev?.anchor ?? pos, cursor: pos }
  return { anchor: pos, cursor: pos }
}

export function colIdxForRole(splitRoleIds: string[], roleId: string | null | undefined): number {
  return splitRoleIds.indexOf(roleId ?? '')
}

export function colIdxForMemberType(memberType: string | null | undefined): number {
  return memberType === '50plus' ? 1 : 0
}
