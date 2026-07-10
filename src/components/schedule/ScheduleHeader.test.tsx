import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ScheduleHeader } from './ScheduleHeader'

describe('ScheduleHeader', () => {
  it('displays year and month', () => {
    render(<ScheduleHeader year={2026} month={4} onPrev={vi.fn()} onNext={vi.fn()} />)
    expect(screen.getAllByText(/4월/)[0]).toBeInTheDocument()
  })

  it('calls onPrev when < button clicked', () => {
    const onPrev = vi.fn()
    render(<ScheduleHeader year={2026} month={4} onPrev={onPrev} onNext={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /이전/ }))
    expect(onPrev).toHaveBeenCalledOnce()
  })

  it('calls onNext when > button clicked', () => {
    const onNext = vi.fn()
    render(<ScheduleHeader year={2026} month={4} onPrev={vi.fn()} onNext={onNext} />)
    fireEvent.click(screen.getByRole('button', { name: /다음/ }))
    expect(onNext).toHaveBeenCalledOnce()
  })
})

describe('ScheduleHeader display mode toggle', () => {
  it('does not render the toggle when onDisplayModeChange is not provided', () => {
    render(<ScheduleHeader year={2026} month={4} onPrev={vi.fn()} onNext={vi.fn()} />)
    expect(screen.queryByText('일자별')).not.toBeInTheDocument()
  })

  it('renders the toggle for month view when onDisplayModeChange is provided', () => {
    render(<ScheduleHeader year={2026} month={4} viewType="month" onPrev={vi.fn()} onNext={vi.fn()} displayMode="time" onDisplayModeChange={vi.fn()} />)
    expect(screen.getByText(/일자별/)).toBeInTheDocument()
    expect(screen.getByText(/시간별/)).toBeInTheDocument()
  })

  it('hides the toggle on day view even when onDisplayModeChange is provided', () => {
    render(<ScheduleHeader year={2026} month={4} day={1} viewType="day" onPrev={vi.fn()} onNext={vi.fn()} displayMode="time" onDisplayModeChange={vi.fn()} />)
    expect(screen.queryByText(/일자별/)).not.toBeInTheDocument()
  })

  it('calls onDisplayModeChange with "day" when the 일자별 button is clicked', () => {
    const onDisplayModeChange = vi.fn()
    render(<ScheduleHeader year={2026} month={4} viewType="month" onPrev={vi.fn()} onNext={vi.fn()} displayMode="time" onDisplayModeChange={onDisplayModeChange} />)
    fireEvent.click(screen.getByText(/일자별/))
    expect(onDisplayModeChange).toHaveBeenCalledWith('day')
  })
})
