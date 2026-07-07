import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DatePickerModal } from './DatePickerModal'

describe('DatePickerModal', () => {
  it('calls onConfirm with the initial year/month when mode is "month"', () => {
    const onConfirm = vi.fn()
    render(<DatePickerModal year={2026} month={7} mode="month" onConfirm={onConfirm} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(onConfirm).toHaveBeenCalledWith(2026, 7)
  })

  it('calls onConfirm with year/month/day when mode is "full"', () => {
    const onConfirm = vi.fn()
    render(<DatePickerModal year={2026} month={7} day={15} mode="full" onConfirm={onConfirm} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(onConfirm).toHaveBeenCalledWith(2026, 7, 15)
  })

  it('calls onClose without calling onConfirm when cancel is clicked', () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    render(<DatePickerModal year={2026} month={7} mode="month" onConfirm={onConfirm} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not render a day column when mode is "month"', () => {
    render(<DatePickerModal year={2026} month={7} mode="month" onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.queryByLabelText('일')).not.toBeInTheDocument()
  })

  it('renders a day column when mode is "full"', () => {
    render(<DatePickerModal year={2026} month={7} day={15} mode="full" onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByLabelText('일')).toBeInTheDocument()
  })
})
