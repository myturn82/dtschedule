import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WeekScheduleByDay } from './WeekScheduleByDay'
import type { Assignment, ScheduleRule } from '../../types'

const weekDays = Array.from({ length: 7 }, (_, i) => new Date(2026, 6, 6 + i)) // 2026-07-06 (월) ~ 07-12 (일)

const openRules: ScheduleRule[] = [0, 1, 2, 3, 4, 5, 6].flatMap(dow =>
  ['09-11', '11-13'].map(slot => ({ id: `r-${dow}-${slot}`, tenant_id: 'T', day_of_week: dow, time_slot: slot, is_open: true }))
)

const assignment = (over: Partial<Assignment>): Assignment => ({
  id: over.id ?? 'a1', tenant_id: 'T', year: 2026, month: 7, day: 6,
  time_slot: '09-11', member_name: '김간호', note: null, member_type: 'member',
  time_sub: null, color: null, user_id: null, role_id: null,
  customer_name: null, customer_phone: null, is_locked: false,
  account_deleted: false, created_at: '', ...over,
})

const baseProps = {
  weekDays,
  timeSlots: ['09-11', '11-13'],
  slotSettings: [],
  scheduleRules: openRules,
  dateOverrides: [],
  onCellClick: vi.fn(),
}

describe('WeekScheduleByDay', () => {
  it('renders one header per weekday', () => {
    render(<WeekScheduleByDay {...baseProps} assignments={[]} />)
    expect(screen.getByText(/6일/)).toBeInTheDocument()
    expect(screen.getByText(/12일/)).toBeInTheDocument()
  })

  it('renders an entry and calls onCellClick with the correct target when clicked', () => {
    const onCellClick = vi.fn()
    render(<WeekScheduleByDay {...baseProps} assignments={[assignment({ id: 'a1', day: 6, time_slot: '09-11' })]} onCellClick={onCellClick} />)
    fireEvent.click(screen.getByText(/김간호/))
    expect(onCellClick).toHaveBeenCalledWith({ year: 2026, month: 7, day: 6, timeSlot: '09-11', memberType: 'member', roleId: null })
  })

  it('shows "-" placeholder for a day with no assignments', () => {
    render(<WeekScheduleByDay {...baseProps} assignments={[]} />)
    expect(screen.getAllByText('-').length).toBe(7)
  })
})
