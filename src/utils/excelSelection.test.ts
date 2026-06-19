import { describe, it, expect } from 'vitest'
import {
  isSameCell, rangeFromCells, nextCellSelection, legacyCellSelection,
  colIdxForRole, colIdxForMemberType,
  type CellPos,
} from './excelSelection'

const c = (day: number, slotIdx: number, colIdx: number): CellPos => ({ day, slotIdx, colIdx })

describe('isSameCell', () => {
  it('returns true for identical cells', () => {
    expect(isSameCell(c(1, 0, 0), c(1, 0, 0))).toBe(true)
  })
  it('returns false when day differs', () => {
    expect(isSameCell(c(1, 0, 0), c(2, 0, 0))).toBe(false)
  })
  it('returns false when slotIdx differs', () => {
    expect(isSameCell(c(1, 0, 0), c(1, 1, 0))).toBe(false)
  })
  it('returns false when colIdx differs', () => {
    expect(isSameCell(c(1, 0, 0), c(1, 0, 1))).toBe(false)
  })
})

describe('rangeFromCells', () => {
  it('computes min/max regardless of anchor/cursor order', () => {
    const range = rangeFromCells(c(5, 2, 1), c(2, 0, 3))
    expect(range).toEqual({
      minDay: 2, maxDay: 5,
      minSlotIdx: 0, maxSlotIdx: 2,
      minColIdx: 1, maxColIdx: 3,
    })
  })
  it('handles anchor === cursor (single cell)', () => {
    const range = rangeFromCells(c(1, 0, 0), c(1, 0, 0))
    expect(range).toEqual({
      minDay: 1, maxDay: 1,
      minSlotIdx: 0, maxSlotIdx: 0,
      minColIdx: 0, maxColIdx: 0,
    })
  })
})

describe('nextCellSelection', () => {
  it('starts a fresh single-cell selection when there is no previous selection', () => {
    const next = nextCellSelection(null, c(3, 1, 0), false)
    expect(next).toEqual({ anchor: c(3, 1, 0), cursor: c(3, 1, 0) })
  })

  it('extends cursor when previous selection was a single cell', () => {
    const prev = { anchor: c(1, 0, 0), cursor: c(1, 0, 0) }
    const next = nextCellSelection(prev, c(3, 0, 0), false)
    expect(next).toEqual({ anchor: c(1, 0, 0), cursor: c(3, 0, 0) })
  })

  it('starts a new selection when previous selection was already a completed range', () => {
    const prev = { anchor: c(1, 0, 0), cursor: c(3, 0, 0) }
    const next = nextCellSelection(prev, c(5, 0, 0), false)
    expect(next).toEqual({ anchor: c(5, 0, 0), cursor: c(5, 0, 0) })
  })

  it('forceExtend always extends cursor even when previous selection was a completed range', () => {
    const prev = { anchor: c(1, 0, 0), cursor: c(3, 0, 0) }
    const next = nextCellSelection(prev, c(5, 0, 0), true)
    expect(next).toEqual({ anchor: c(1, 0, 0), cursor: c(5, 0, 0) })
  })
})

describe('legacyCellSelection (PC: click always resets, shift extends)', () => {
  it('starts a fresh single-cell selection on plain click with no previous selection', () => {
    const next = legacyCellSelection(null, c(3, 1, 0), false)
    expect(next).toEqual({ anchor: c(3, 1, 0), cursor: c(3, 1, 0) })
  })

  it('resets to a fresh single-cell selection on plain click even when previous was a single cell', () => {
    const prev = { anchor: c(1, 0, 0), cursor: c(1, 0, 0) }
    const next = legacyCellSelection(prev, c(3, 0, 0), false)
    expect(next).toEqual({ anchor: c(3, 0, 0), cursor: c(3, 0, 0) })
  })

  it('resets to a fresh single-cell selection on plain click even when previous was a completed range', () => {
    const prev = { anchor: c(1, 0, 0), cursor: c(3, 0, 0) }
    const next = legacyCellSelection(prev, c(5, 0, 0), false)
    expect(next).toEqual({ anchor: c(5, 0, 0), cursor: c(5, 0, 0) })
  })

  it('shift+click extends cursor while keeping the existing anchor', () => {
    const prev = { anchor: c(1, 0, 0), cursor: c(3, 0, 0) }
    const next = legacyCellSelection(prev, c(5, 0, 0), true)
    expect(next).toEqual({ anchor: c(1, 0, 0), cursor: c(5, 0, 0) })
  })

  it('shift+click with no previous selection uses the clicked cell as both anchor and cursor', () => {
    const next = legacyCellSelection(null, c(5, 0, 0), true)
    expect(next).toEqual({ anchor: c(5, 0, 0), cursor: c(5, 0, 0) })
  })
})

describe('colIdxForRole', () => {
  it('returns the index of the matching role id', () => {
    expect(colIdxForRole(['r1', 'r2', 'r3'], 'r2')).toBe(1)
  })
  it('returns -1 when role id is null', () => {
    expect(colIdxForRole(['r1', 'r2'], null)).toBe(-1)
  })
  it('returns -1 when role id is not found', () => {
    expect(colIdxForRole(['r1', 'r2'], 'nope')).toBe(-1)
  })
})

describe('colIdxForMemberType', () => {
  it('returns 1 for 50plus', () => {
    expect(colIdxForMemberType('50plus')).toBe(1)
  })
  it('returns 0 for member', () => {
    expect(colIdxForMemberType('member')).toBe(0)
  })
  it('returns 0 for undefined', () => {
    expect(colIdxForMemberType(undefined)).toBe(0)
  })
})
