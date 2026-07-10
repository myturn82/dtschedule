import { describe, it, expect } from 'vitest'
import { getDayAssignmentEntries } from './dayAssignments'
import type { Assignment, ScheduleRule } from '../types'

const baseAssignment = (over: Partial<Assignment>): Assignment => ({
  id: over.id ?? 'a1',
  tenant_id: 'T',
  year: 2026,
  month: 7,
  day: 10,
  time_slot: '09-11',
  member_name: '김간호',
  note: null,
  member_type: 'member',
  time_sub: null,
  color: null,
  user_id: null,
  role_id: null,
  customer_name: null,
  customer_phone: null,
  is_locked: false,
  account_deleted: false,
  created_at: '',
  ...over,
})

const openRules: ScheduleRule[] = ['09-11', '11-13', '13-15'].map(slot => ({
  id: `r-${slot}`, tenant_id: 'T', day_of_week: 5, time_slot: slot, is_open: true,
}))

describe('getDayAssignmentEntries', () => {
  it('sorts entries by start hour ascending across slots', () => {
    const assignments = [
      baseAssignment({ id: 'a-13', time_slot: '13-15', member_name: '13시담당' }),
      baseAssignment({ id: 'a-09', time_slot: '09-11', member_name: '9시담당' }),
    ]
    const entries = getDayAssignmentEntries(
      10, 2026, 7, ['09-11', '11-13', '13-15'], openRules, [], [], assignments
    )
    expect(entries.map(e => e.assignment.member_name)).toEqual(['9시담당', '13시담당'])
  })

  it('skips closed/holiday/breaktime slots', () => {
    const rulesWithClosedSlot: ScheduleRule[] = [
      { id: 'r1', tenant_id: 'T', day_of_week: 5, time_slot: '09-11', is_open: true },
      { id: 'r2', tenant_id: 'T', day_of_week: 5, time_slot: '11-13', is_open: false },
    ]
    const assignments = [baseAssignment({ id: 'a-11', time_slot: '11-13' })]
    const entries = getDayAssignmentEntries(
      10, 2026, 7, ['09-11', '11-13'], rulesWithClosedSlot, [], [], assignments
    )
    expect(entries).toEqual([])
  })

  it('excludes admin_note assignments', () => {
    const assignments = [baseAssignment({ id: 'note1', member_type: 'admin_note', note: '공지' })]
    const entries = getDayAssignmentEntries(
      10, 2026, 7, ['09-11'], openRules, [], [], assignments
    )
    expect(entries).toEqual([])
  })

  it('applies displayAssignmentFilter when provided', () => {
    const assignments = [
      baseAssignment({ id: 'a1', member_name: '표시됨' }),
      baseAssignment({ id: 'a2', member_name: '숨김', user_id: 'hidden-user' }),
    ]
    const entries = getDayAssignmentEntries(
      10, 2026, 7, ['09-11'], openRules, [], [], assignments,
      a => a.user_id !== 'hidden-user'
    )
    expect(entries.map(e => e.assignment.member_name)).toEqual(['표시됨'])
  })
})
