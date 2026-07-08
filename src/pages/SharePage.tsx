import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DevFileLabel } from '../components/DevFileLabel'
import { useSchedule } from '../hooks/useSchedule'
import { useTenant } from '../contexts/TenantContext'
import { useAuth } from '../hooks/useAuth'
import { displayMode } from '../lib/tenantMode'
import { ScheduleHeader } from '../components/schedule/ScheduleHeader'
import { ScheduleGrid } from '../components/schedule/ScheduleGrid'
import { Legend } from '../components/schedule/Legend'
import { supabase } from '../lib/supabase'
import { generateTimeSlots, slotStartLabel } from '../utils/timeSlots'
import { getCellState } from '../utils/cellState'
import { useTenantRoles } from '../hooks/useTenantRoles'
import type { TimeSlot } from '../utils/timeSlots'
import type { LegendItem, ModalTarget } from '../types'

const DAY_KR = ['일', '월', '화', '수', '목', '금', '토']

export function SharePage() {
  const [params, setParams] = useSearchParams()
  const year = parseInt(params.get('year') ?? String(new Date().getFullYear()))
  const month = parseInt(params.get('month') ?? String(new Date().getMonth() + 1))
  const tidFromUrl = params.get('tid') ?? ''

  const { profile } = useAuth()
  const { tenant, timeSlots: contextTimeSlots, legendItems: contextLegendItems, slotLabels: contextSlotLabels } = useTenant()
  const tenantId = tidFromUrl || tenant?.id || ''

  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null)

  // tid가 컨텍스트 테넌트와 다를 때 직접 테넌트 설정을 조회해 timeSlots·legendItems 계산
  const [fetchedTimeSlots, setFetchedTimeSlots] = useState<TimeSlot[] | null>(null)
  const [fetchedLegendItems, setFetchedLegendItems] = useState<LegendItem[] | null>(null)
  const [fetchedSlotLabels, setFetchedSlotLabels] = useState<Record<string, string> | null>(null)
  const [fetchedTenantMode, setFetchedTenantMode] = useState<string | undefined>(undefined)
  useEffect(() => {
    if (!tidFromUrl || tidFromUrl === tenant?.id) {
      setFetchedTimeSlots(null)
      setFetchedLegendItems(null)
      setFetchedSlotLabels(null)
      setFetchedTenantMode(undefined)
      return
    }
    supabase.from('tenants').select('settings').eq('id', tidFromUrl).single()
      .then(({ data }) => {
        if (!data?.settings) return
        const s = data.settings as Record<string, unknown>
        const slots = Array.isArray(s.time_slots) && (s.time_slots as string[]).length > 0
          ? s.time_slots as TimeSlot[]
          : generateTimeSlots(
              (s.open_from as string | undefined) ?? '09:00',
              (s.open_to as string | undefined) ?? '22:00',
              (s.slot_interval_minutes as number | undefined) ?? 120
            )
        setFetchedTimeSlots(slots)
        setFetchedLegendItems((s.legend_items as LegendItem[] | undefined) ?? [])
        setFetchedSlotLabels((s.slot_labels as Record<string, string> | undefined) ?? {})
        setFetchedTenantMode(s.tenant_mode as string | undefined)
      })
  }, [tidFromUrl, tenant?.id])

  const timeSlots = fetchedTimeSlots ?? contextTimeSlots
  const legendItems = fetchedLegendItems ?? contextLegendItems
  const slotLabels = fetchedSlotLabels ?? contextSlotLabels
  const isFreeformTenant = displayMode((fetchedTenantMode ?? tenant?.settings?.tenant_mode) as string | undefined) === '비회원'
  const tenantModeReady = !tidFromUrl || tidFromUrl === tenant?.id || fetchedTenantMode !== undefined

  const { roles: tenantRoles } = useTenantRoles(tenantId)
  const splitRoles = tenantRoles.filter(r => r.split_cell && !r.indicator_bar)
  const indicatorBarRoles = tenantRoles.filter(r => r.indicator_bar)
  const isSplitMode = splitRoles.length > 0

  const { assignments, slotSettings, scheduleRules, dateOverrides, loading } = useSchedule(tenantId, year, month)

  if (!profile && !isFreeformTenant) {
    if (!tenantModeReady) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-gray-400 dark:text-gray-500 text-sm">로딩 중...</div>
        </div>
      )
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <p className="text-gray-500 dark:text-gray-400 text-sm">스케줄을 보려면 로그인이 필요합니다.</p>
          <a href="/auth" className="mt-4 inline-block px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            로그인
          </a>
        </div>
      </div>
    )
  }

  const modalCellState = modalTarget
    ? getCellState(modalTarget.day, modalTarget.timeSlot, modalTarget.year, modalTarget.month, scheduleRules, slotSettings, dateOverrides, assignments)
    : null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 max-w-full">
        <div className="mb-2 text-xs text-gray-400 dark:text-gray-500 text-right">읽기 전용 공유 뷰</div>
        <ScheduleHeader
          year={year} month={month}
          onPrev={() => {
            const [py, pm] = month === 1 ? [year - 1, 12] : [year, month - 1]
            setParams({ tid: tidFromUrl, year: String(py), month: String(pm) })
          }}
          onNext={() => {
            const [ny, nm] = month === 12 ? [year + 1, 1] : [year, month + 1]
            setParams({ tid: tidFromUrl, year: String(ny), month: String(nm) })
          }}
        />
        <Legend legendItems={legendItems} />
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">로딩 중...</div>
        ) : (
          <ScheduleGrid
            year={year} month={month}
            timeSlots={timeSlots}
            assignments={assignments} slotSettings={slotSettings}
            scheduleRules={scheduleRules} dateOverrides={dateOverrides}
            splitRoles={splitRoles}
            indicatorBarRoles={indicatorBarRoles}
            isSplitMode={isSplitMode}
            highlightName={null}
            canAdd={false}
            onCellClick={t => {
              const cs = getCellState(t.day, t.timeSlot, t.year, t.month, scheduleRules, slotSettings, dateOverrides, assignments)
              if (cs.assignments.filter(a => a.member_type !== 'admin_note').length > 0) setModalTarget(t)
            }}
          />
        )}
      </div>

      {modalTarget && modalCellState && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setModalTarget(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-5 w-full max-w-sm mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-base font-bold text-[var(--color-text-primary)]">
                  {modalTarget.month}월 {modalTarget.day}일 ({DAY_KR[new Date(modalTarget.year, modalTarget.month - 1, modalTarget.day).getDay()]})
                </span>
                <span className="ml-2 text-sm text-[var(--color-text-muted)]">
                  {slotLabels[modalTarget.timeSlot] ?? slotStartLabel(modalTarget.timeSlot)}
                </span>
              </div>
              <button
                onClick={() => setModalTarget(null)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-[var(--color-text-muted)] mb-3">
              {modalCellState.assignments.filter(a => a.member_type !== 'admin_note').length}명 / {modalCellState.maxCapacity}명
            </div>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {modalCellState.assignments
                .filter(a => a.member_type !== 'admin_note')
                .map(a => (
                  <div key={a.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                    <span className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold bg-[oklch(0.95_0.045_28)] text-[oklch(0.45_0.14_28)]">
                      {a.member_name?.charAt(0) ?? '?'}
                    </span>
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">{a.member_name}</span>
                    {a.note && <span className="text-xs text-[var(--color-text-muted)] truncate">· {a.note}</span>}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <DevFileLabel file="SharePage.tsx" />
    </div>
  )
}
