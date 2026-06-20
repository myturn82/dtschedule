import { useSearchParams } from 'react-router-dom'
import { DevFileLabel } from '../components/DevFileLabel'
import { useSchedule } from '../hooks/useSchedule'
import { useTenant } from '../contexts/TenantContext'
import { useAuth } from '../hooks/useAuth'
import { ScheduleHeader } from '../components/schedule/ScheduleHeader'
import { ScheduleGrid } from '../components/schedule/ScheduleGrid'
import { Legend } from '../components/schedule/Legend'

export function SharePage() {
  const [params] = useSearchParams()
  const year = parseInt(params.get('year') ?? String(new Date().getFullYear()))
  const month = parseInt(params.get('month') ?? String(new Date().getMonth() + 1))
  const tidFromUrl = params.get('tid') ?? ''

  const { profile } = useAuth()
  const { tenant, timeSlots } = useTenant()
  // URL의 tid 파라미터를 우선 사용, 없으면 현재 컨텍스트의 tenant
  const tenantId = tidFromUrl || tenant?.id || ''

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
      <DevFileLabel file="SharePage.tsx" />
    </div>
  )
}
