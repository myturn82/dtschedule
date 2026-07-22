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

// 데스크탑(테이블)과 모바일(세로 카드) 두 레이아웃이 함께 렌더링되고 CSS로만 전환되므로,
// 텍스트/라벨 기반 쿼리는 항상 2배로 나타난다.
describe('WeekScheduleByDay', () => {
  it('renders one header per weekday', () => {
    render(<WeekScheduleByDay {...baseProps} assignments={[]} />)
    expect(screen.getAllByText(/6일/).length).toBe(2)
    expect(screen.getAllByText(/12일/).length).toBe(2)
  })

  it('renders an entry and calls onCellClick with the correct target when clicked', () => {
    const onCellClick = vi.fn()
    render(<WeekScheduleByDay {...baseProps} assignments={[assignment({ id: 'a1', day: 6, time_slot: '09-11' })]} onCellClick={onCellClick} />)
    fireEvent.click(screen.getAllByText(/김간호/)[0])
    expect(onCellClick).toHaveBeenCalledWith({ year: 2026, month: 7, day: 6, timeSlot: '09-11', memberType: 'member', roleId: null })
  })

  it('shows a register control for each day with open slots, even with no assignments', () => {
    render(<WeekScheduleByDay {...baseProps} assignments={[]} />)
    expect(screen.getAllByLabelText('스케줄 등록').length).toBe(14)
    expect(screen.queryByText('-')).not.toBeInTheDocument()
  })

  it('calls onCellClick with the chosen time slot when a slot is selected from the register control', () => {
    const onCellClick = vi.fn()
    render(<WeekScheduleByDay {...baseProps} assignments={[]} onCellClick={onCellClick} />)
    const selects = screen.getAllByLabelText('스케줄 등록')
    fireEvent.change(selects[0], { target: { value: '11-13' } })
    expect(onCellClick).toHaveBeenCalledWith({ year: 2026, month: 7, day: 6, timeSlot: '11-13', memberType: 'member' })
  })

  it('shows "-" placeholder when a day has no assignments and no open slots', () => {
    render(<WeekScheduleByDay {...baseProps} assignments={[]} scheduleRules={[]} />)
    expect(screen.getAllByText('-').length).toBe(14)
    expect(screen.queryByLabelText('스케줄 등록')).not.toBeInTheDocument()
  })
})
