import { describe, it, expect } from 'vitest'
import { getCellState } from './cellState'
import type { Assignment, SlotSetting, ScheduleRule, DateOverride } from '../types'

const T = 'test-tenant'
const baseRules: ScheduleRule[] = [
  { id: '1', tenant_id: T, day_of_week: 1, time_slot: '10-12', is_open: true },
  { id: '2', tenant_id: T, day_of_week: 1, time_slot: '20-22', is_open: false },
  { id: '3', tenant_id: T, day_of_week: 2, time_slot: '20-22', is_open: true },
]
const baseSettings: SlotSetting[] = [
  { id: '1', tenant_id: T, time_slot: '10-12', max_capacity: 2, updated_by: null },
]
const noOverrides: DateOverride[] = []
const noAssignments: Assignment[] = []

describe('getCellState', () => {
  it('returns isBreaktime=true for 12-13 slot', () => {
    // 2026-04-06은 월요일
    const state = getCellState(6, '12-13', 2026, 4, baseRules, baseSettings, noOverrides, noAssignments)
    expect(state.isBreaktime).toBe(true)
    expect(state.isClosed).toBe(true)
  })

  it('returns isClosed=true for Sunday', () => {
    // 2026-04-05는 일요일
    const state = getCellState(5, '10-12', 2026, 4, baseRules, baseSettings, noOverrides, noAssignments)
    expect(state.isHoliday).toBe(true)
    expect(state.isClosed).toBe(true)
  })

  it('returns isClosed=true for 월요일 20-22', () => {
    const state = getCellState(6, '20-22', 2026, 4, baseRules, baseSettings, noOverrides, noAssignments)
    expect(state.isClosed).toBe(true)
    expect(state.isHoliday).toBe(false)
  })

  it('returns isNightShift=true for 20-22 slot on 화요일', () => {
    const state = getCellState(7, '20-22', 2026, 4, baseRules, baseSettings, noOverrides, noAssignments)
    expect(state.isNightShift).toBe(true)
    expect(state.isClosed).toBe(false)
  })

  it('returns isFull=true when assignments >= maxCapacity', () => {
    const assignments: Assignment[] = [
      { id: 'a1', tenant_id: T, year: 2026, month: 4, day: 6, time_slot: '10-12', member_name: '홍길동', note: null, user_id: 'u1', created_at: '', member_type: 'member', time_sub: null, color: null, role_id: null, customer_name: null, customer_phone: null, is_locked: false, account_deleted: false },
      { id: 'a2', tenant_id: T, year: 2026, month: 4, day: 6, time_slot: '10-12', member_name: '김철수', note: null, user_id: 'u2', created_at: '', member_type: 'member', time_sub: null, color: null, role_id: null, customer_name: null, customer_phone: null, is_locked: false, account_deleted: false },
    ]
    const state = getCellState(6, '10-12', 2026, 4, baseRules, baseSettings, noOverrides, assignments)
    expect(state.isFull).toBe(true)
    expect(state.assignments).toHaveLength(2)
  })

  it('연중무휴 조직: is_open=true rule이 있으면 공휴일도 운영으로 처리', () => {
    // 2026-10-09 한글날 (금요일, dayOfWeek=5)
    const allOpenRules: ScheduleRule[] = [
      { id: 'r5', tenant_id: T, day_of_week: 5, time_slot: '10-12', is_open: true },
    ]
    const state = getCellState(9, '10-12', 2026, 10, allOpenRules, baseSettings, noOverrides, noAssignments)
    expect(state.isHoliday).toBe(false)
    expect(state.isClosed).toBe(false)
  })

  it('is_open rule 없을 때 공휴일은 휴관 처리', () => {
    // 2026-10-09 한글날, rule 없음
    const state = getCellState(9, '10-12', 2026, 10, [], baseSettings, noOverrides, noAssignments)
    expect(state.isHoliday).toBe(true)
    expect(state.isClosed).toBe(true)
  })

  it('respects date_override holiday', () => {
    const overrides: DateOverride[] = [
      { id: 'o1', tenant_id: T, date: '2026-04-06', is_open: false, is_holiday: true, label: '휴관일', is_locked: false }
    ]
    const state = getCellState(6, '10-12', 2026, 4, baseRules, baseSettings, overrides, noAssignments)
    expect(state.isHoliday).toBe(true)
  })
})
