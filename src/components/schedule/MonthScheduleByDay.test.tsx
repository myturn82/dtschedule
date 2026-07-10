import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MonthScheduleByDay } from './MonthScheduleByDay'
import type { Assignment, ScheduleRule } from '../../types'

const openRules: ScheduleRule[] = [0, 1, 2, 3, 4, 5, 6].flatMap(dow =>
  ['09-11', '11-13'].map(slot => ({ id: `r-${dow}-${slot}`, tenant_id: 'T', day_of_week: dow, time_slot: slot, is_open: true }))
)

const assignment = (over: Partial<Assignment>): Assignment => ({
  id: over.id ?? 'a1', tenant_id: 'T', year: 2026, month: 7, day: 10,
  time_slot: '09-11', member_name: '김간호', note: null, member_type: 'member',
  time_sub: null, color: null, user_id: null, role_id: null,
  customer_name: null, customer_phone: null, is_locked: false,
  account_deleted: false, created_at: '', ...over,
})

const baseProps = {
  year: 2026, month: 7,
  timeSlots: ['09-11', '11-13'],
  slotSettings: [],
  scheduleRules: openRules,
  dateOverrides: [],
  onCellClick: vi.fn(),
}

describe('MonthScheduleByDay', () => {
  it('renders day-of-week headers', () => {
    render(<MonthScheduleByDay {...baseProps} assignments={[]} />)
    expect(screen.getByText('월')).toBeInTheDocument()
    expect(screen.getByText('일')).toBeInTheDocument()
  })

  it('shows "-" placeholder for a day with no assignments', () => {
    render(<MonthScheduleByDay {...baseProps} assignments={[]} />)
    expect(screen.getAllByText('-').length).toBeGreaterThan(0)
  })

  it('renders an entry and calls onCellClick with the correct target when clicked', () => {
    const onCellClick = vi.fn()
    render(<MonthScheduleByDay {...baseProps} assignments={[assignment({ id: 'a1', day: 10, time_slot: '09-11' })]} onCellClick={onCellClick} />)
    fireEvent.click(screen.getByText(/김간호/))
    expect(onCellClick).toHaveBeenCalledWith({ year: 2026, month: 7, day: 10, timeSlot: '09-11', memberType: 'member', roleId: null })
  })

  it('caps visible entries and expands on "+N건 더" click', () => {
    const assignments = ['a1', 'a2', 'a3', 'a4'].map((id, i) =>
      assignment({ id, day: 10, time_slot: i % 2 === 0 ? '09-11' : '11-13', member_name: `팀원${i}` })
    )
    render(<MonthScheduleByDay {...baseProps} assignments={assignments} />)
    expect(screen.queryByText('팀원3')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('+1건 더'))
    expect(screen.getByText(/팀원3/)).toBeInTheDocument()
  })
})
