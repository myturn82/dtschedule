import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DevFileLabel } from '../components/DevFileLabel'
import { useSchedule } from '../hooks/useSchedule'
import { useTenant } from '../contexts/TenantContext'
import { useAuth } from '../hooks/useAuth'
import { ScheduleHeader } from '../components/schedule/ScheduleHeader'
import { ScheduleGrid } from '../components/schedule/ScheduleGrid'
import { Legend } from '../components/schedule/Legend'
import { supabase } from '../lib/supabase'
import { generateTimeSlots } from '../utils/timeSlots'
import type { TimeSlot } from '../utils/timeSlots'
import type { LegendItem } from '../types'

export function SharePage() {
  const [params, setParams] = useSearchParams()
  const year = parseInt(params.get('year') ?? String(new Date().getFullYear()))
  const month = parseInt(params.get('month') ?? String(new Date().getMonth() + 1))
  const tidFromUrl = params.get('tid') ?? ''

  const { profile } = useAuth()
  const { tenant, timeSlots: contextTimeSlots, legendItems: contextLegendItems } = useTenant()
  const tenantId = tidFromUrl || tenant?.id || ''

  // tid가 컨텍스트 테넌트와 다를 때 직접 테넌트 설정을 조회해 timeSlots·legendItems 계산
  const [fetchedTimeSlots, setFetchedTimeSlots] = useState<TimeSlot[] | null>(null)
  const [fetchedLegendItems, setFetchedLegendItems] = useState<LegendItem[] | null>(null)
  useEffect(() => {
    if (!tidFromUrl || tidFromUrl === tenant?.id) {
      setFetchedTimeSlots(null)
      setFetchedLegendItems(null)
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
      })
  }, [tidFromUrl, tenant?.id])

  const timeSlots = fetchedTimeSlots ?? contextTimeSlots
  const legendItems = fetchedLegendItems ?? contextLegendItems

  const { assignments, slotSettings, scheduleRules, dateOverrides, loading } = useSchedule(tenantId, year, month)

  if (!profile) {
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
            highlightName={null}
            canAdd={false}
            onCellClick={() => {}}
          />
        )}
      </div>
      <DevFileLabel file="SharePage.tsx" />
    </div>
  )
}
