import { describe, it, expect } from 'vitest'
import { yearRange, daysInMonth, nearestIndex } from './datePicker'

describe('yearRange', () => {
  it('returns center-span..center+span inclusive, ascending', () => {
    expect(yearRange(2026, 2)).toEqual([2024, 2025, 2026, 2027, 2028])
  })
})

describe('daysInMonth', () => {
  it('returns 31 for January', () => {
    expect(daysInMonth(2026, 1)).toBe(31)
  })
  it('returns 28 for February in a non-leap year', () => {
    expect(daysInMonth(2026, 2)).toBe(28)
  })
  it('returns 29 for February in a leap year', () => {
    expect(daysInMonth(2024, 2)).toBe(29)
  })
  it('returns 30 for April', () => {
    expect(daysInMonth(2026, 4)).toBe(30)
  })
})

describe('nearestIndex', () => {
  it('rounds scrollTop/itemHeight to nearest integer index', () => {
    expect(nearestIndex(0, 40)).toBe(0)
    expect(nearestIndex(19, 40)).toBe(0)
    expect(nearestIndex(20, 40)).toBe(1)
    expect(nearestIndex(38, 40)).toBe(1)
    expect(nearestIndex(80, 40)).toBe(2)
  })
})
