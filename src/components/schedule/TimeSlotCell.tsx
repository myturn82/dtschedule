import type { CellState, VolunteerType } from '../../types'

interface Props {
  cellState: CellState
  onClickVolunteer: () => void
  onClickPlus: () => void
  highlightName: string | null
}

function formatTimeSub(ts: string | null): string {
  if (!ts) return ''
  if (ts.includes('~')) {
    const [s, e] = ts.split('~').map(Number)
    return `(${s}~${e + 1}시)`
  }
  return `(${ts}시)`
}

function NameList({ assignments, highlightName }: {
  assignments: CellState['assignments']
  highlightName: string | null
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {assignments.map(a => (
        <span
          key={a.id}
          className={`text-[8px] sm:text-xs truncate leading-tight rounded px-0.5
            ${highlightName && a.volunteer_name.includes(highlightName) ? 'bg-schedule-highlight dark:bg-yellow-700 font-bold' : ''}`}
          style={a.color ? { backgroundColor: a.color } : undefined}
        >
          {a.volunteer_name}{formatTimeSub(a.time_sub)}
        </span>
      ))}
    </div>
  )
}

export function TimeSlotCell({ cellState, onClickVolunteer, onClickPlus, highlightName }: Props) {
  const { isBreaktime, isClosed, isHoliday, isNightShift, isSaturdayShift, assignments, isFull } = cellState

  if (isBreaktime) {
    return (
      <div className="min-h-[2rem] sm:min-h-[2.5rem] bg-schedule-breaktime dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
        <span className="sm:hidden text-[8px]">BR</span>
        <span className="hidden sm:inline text-xs">BREAKTIME</span>
      </div>
    )
  }

  if (isHoliday || isClosed) {
    return (
      <div className="min-h-[2rem] sm:min-h-[2.5rem] bg-schedule-close dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
        <span className="sm:hidden text-[8px]">{isHoliday ? '휴관' : '✕'}</span>
        <span className="hidden sm:inline text-xs">{isHoliday ? '휴관' : 'CLOSE'}</span>
      </div>
    )
  }

  const bgClass = isNightShift
    ? 'bg-schedule-night dark:bg-pink-950 hover:bg-pink-100 dark:hover:bg-pink-900'
    : isSaturdayShift
    ? 'bg-schedule-saturday dark:bg-yellow-950 hover:bg-yellow-100 dark:hover:bg-yellow-900'
    : 'bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-950'

  const shiftIcon = isNightShift
    ? <span className="text-pink-400 text-[8px] sm:text-[10px]">★</span>
    : isSaturdayShift
    ? <span className="text-yellow-400 text-[8px] sm:text-[10px]">★</span>
    : null

  const volunteerAssignments = assignments.filter(a => !a.volunteer_type || a.volunteer_type === 'volunteer')
  const plusAssignments = assignments.filter(a => a.volunteer_type === '50plus')

  const halfClass = `flex-1 min-h-[2rem] sm:min-h-[2.5rem] text-left px-0.5 sm:px-1 py-0.5 transition-colors ${bgClass}`

  return (
    <div className="flex divide-x divide-gray-200 dark:divide-gray-600 border border-gray-200 dark:border-gray-600">
      {/* 자원봉사자 */}
      <button onClick={onClickVolunteer} className={halfClass}>
        {shiftIcon}
        <NameList assignments={volunteerAssignments} highlightName={highlightName} />
        {isFull && volunteerAssignments.length > 0 && (
          <span className="text-red-400 text-[8px] sm:text-xs block">마감</span>
        )}
      </button>
      {/* 50플러스활동가 — 토요일 제외 */}
      {!isSaturdayShift && (
        <button onClick={onClickPlus} className={`${halfClass} bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-50 dark:hover:bg-purple-950/40`}>
          <NameList assignments={plusAssignments} highlightName={highlightName} />
        </button>
      )}
    </div>
  )
}
