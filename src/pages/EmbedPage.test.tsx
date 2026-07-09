import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { EmbedPage } from './EmbedPage'

const mockUseShareTenantSettings = vi.fn()
vi.mock('../hooks/useShareTenantSettings', () => ({
  useShareTenantSettings: () => mockUseShareTenantSettings(),
}))
vi.mock('../hooks/useTenantRoles', () => ({
  useTenantRoles: () => ({ roles: [] }),
}))
vi.mock('../hooks/useSchedule', () => ({
  useSchedule: () => ({ assignments: [], slotSettings: [], scheduleRules: [], dateOverrides: [], loading: false }),
}))
vi.mock('../components/schedule/ScheduleGrid', () => ({
  ScheduleGrid: () => <div data-testid="month-grid" />,
}))
vi.mock('../components/schedule/WeekGrid', () => ({
  WeekGrid: () => <div data-testid="week-grid" />,
}))

function baseSettings(overrides: Partial<ReturnType<typeof mockUseShareTenantSettings>> = {}) {
  return {
    tenant: null,
    tenantId: 'tenant-1',
    timeSlots: [],
    legendItems: [],
    slotLabels: {},
    isFreeformTenant: true,
    tenantModeReady: true,
    customFields: [],
    useDynamicFields: false,
    detailFields: [],
    ...overrides,
  }
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <EmbedPage />
    </MemoryRouter>
  )
}

describe('EmbedPage', () => {
  it('shows loading state while tenant mode is not ready', () => {
    mockUseShareTenantSettings.mockReturnValue(baseSettings({ tenantModeReady: false }))
    renderAt('/embed?tid=tenant-1')
    expect(screen.getByText('로딩 중...')).toBeInTheDocument()
  })

  it('shows a fallback message when the tenant is not freeform mode', () => {
    mockUseShareTenantSettings.mockReturnValue(baseSettings({ isFreeformTenant: false }))
    renderAt('/embed?tid=tenant-1')
    expect(screen.getByText(/비회원 모드 조직에서만/)).toBeInTheDocument()
  })

  it('renders the month grid by default for a freeform tenant', () => {
    mockUseShareTenantSettings.mockReturnValue(baseSettings())
    renderAt('/embed?tid=tenant-1')
    expect(screen.getByTestId('month-grid')).toBeInTheDocument()
    expect(screen.queryByTestId('week-grid')).not.toBeInTheDocument()
  })

  it('renders the week grid when view=week is in the URL', () => {
    mockUseShareTenantSettings.mockReturnValue(baseSettings())
    renderAt('/embed?tid=tenant-1&view=week')
    expect(screen.getByTestId('week-grid')).toBeInTheDocument()
    expect(screen.queryByTestId('month-grid')).not.toBeInTheDocument()
  })
})
