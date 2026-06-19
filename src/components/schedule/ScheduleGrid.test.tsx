import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScheduleGrid } from './ScheduleGrid'
import type { ScheduleRule, TenantRole } from '../../types'

const mockProps = {
  year: 2026,
  month: 4,
  timeSlots: ['10-12', '12-13', '20-22'] as string[],
  assignments: [],
  slotSettings: [],
  scheduleRules: [],
  dateOverrides: [],
  highlightName: null,
  onCellClick: vi.fn(),
}

describe('ScheduleGrid', () => {
  it('renders day-of-week headers', () => {
    render(<ScheduleGrid {...mockProps} />)
    expect(screen.getByText('월')).toBeInTheDocument()
    expect(screen.getByText('화')).toBeInTheDocument()
    expect(screen.getByText('일')).toBeInTheDocument()
    expect(screen.getByText('토')).toBeInTheDocument()
  })

  it('renders time slot labels in HH:MM~HH:MM format', () => {
    render(<ScheduleGrid {...mockProps} />)
    expect(screen.getAllByText('10:00~12:00').length).toBeGreaterThan(0)
    expect(screen.getAllByText('20:00~22:00').length).toBeGreaterThan(0)
  })

  it('renders CLOSE cells for 12-13 row', () => {
    render(<ScheduleGrid {...mockProps} />)
    const closeCells = screen.getAllByText('CLOSE')
    expect(closeCells.length).toBeGreaterThan(0)
  })
})

const openRules: ScheduleRule[] = [0, 1, 2, 3, 4, 5, 6].map(dow => ({
  id: `r-${dow}`, tenant_id: 'T', day_of_week: dow, time_slot: '10-12', is_open: true,
}))

describe('ScheduleGrid column-aware selection overlay', () => {
  it('highlights only the targeted role column in split mode', () => {
    const splitRoles: TenantRole[] = [
      { id: 'r1', tenant_id: 'T', name: '역할A', split_cell: true, indicator_bar: false, requires_customer_info: false, display_order: 0, created_at: '' },
      { id: 'r2', tenant_id: 'T', name: '역할B', split_cell: true, indicator_bar: false, requires_customer_info: false, display_order: 1, created_at: '' },
    ]
    const { container } = render(
      <ScheduleGrid
        {...mockProps}
        scheduleRules={openRules}
        isSplitMode
        splitRoles={splitRoles}
        selectionRange={{ minDay: 1, maxDay: 1, minSlotIdx: 0, maxSlotIdx: 0, minColIdx: 0, maxColIdx: 0 }}
      />
    )
    expect(container.querySelectorAll('.bg-blue-400\\/20').length).toBe(1)
  })

  it('highlights only the plus(50+) column in legacy vol/plus mode', () => {
    const indicatorBarRoles: TenantRole[] = [
      { id: 'lead1', tenant_id: 'T', name: '팀장', split_cell: false, indicator_bar: true, requires_customer_info: false, display_order: 0, created_at: '' },
    ]
    const { container } = render(
      <ScheduleGrid
        {...mockProps}
        scheduleRules={openRules}
        indicatorBarRoles={indicatorBarRoles}
        selectionRange={{ minDay: 1, maxDay: 1, minSlotIdx: 0, maxSlotIdx: 0, minColIdx: 1, maxColIdx: 1 }}
      />
    )
    expect(container.querySelectorAll('.bg-blue-400\\/20').length).toBe(1)
  })
})
