import { useSearchParams } from 'react-router-dom'
import { useSchedule } from '../hooks/useSchedule'
import { useTenant } from '../contexts/TenantContext'
import { ScheduleHeader } from '../components/schedule/ScheduleHeader'
import { ScheduleGrid } from '../components/schedule/ScheduleGrid'
import { Legend } from '../components/schedule/Legend'

export function SharePage() {
  const [params] = useSearchParams()
  const year = parseInt(params.get('year') ?? String(new Date().getFullYear()))
  const month = parseInt(params.get('month') ?? String(new Date().getMonth() + 1))

  // Use current tenant from context (works when logged in).
  // Anonymous share links require a public RLS policy (future enhancement).
  const { tenant, timeSlots } = useTenant()
  const tenantId = tenant?.id ?? ''

  const { assignments, slotSettings, scheduleRules, dateOverrides, loading } = useSchedule(tenantId, year, month)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 max-w-full">
        <div className="mb-2 text-xs text-gray-400 dark:text-gray-500 text-right">읽기 전용 공유 뷰</div>
        <ScheduleHeader year={year} month={month} onPrev={() => {}} onNext={() => {}} />
        <Legend />
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">로딩 중...</div>
        ) : (
          <ScheduleGrid
            year={year} month={month}
            timeSlots={timeSlots}
            assignments={assignments} slotSettings={slotSettings}
            scheduleRules={scheduleRules} dateOverrides={dateOverrides}
            highlightName={null}
            onCellClick={() => {}}
          />
        )}
      </div>
    </div>
  )
}
