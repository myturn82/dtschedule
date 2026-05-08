import type { CellState } from '../../types'

interface Props {
  cellState: CellState
  onClick: () => void
  highlightName: string | null
}

export function TimeSlotCell({ cellState, onClick, highlightName }: Props) {
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
        <span className="sm:hidden text-[8px]">{isHoliday ? '휴' : '✕'}</span>
        <span className="hidden sm:inline text-xs">{isHoliday ? '휴관' : 'CLOSE'}</span>
      </div>
    )
  }

  const bgClass = isNightShift
    ? 'bg-schedule-night dark:bg-pink-950 hover:bg-schedule-night-hover dark:hover:bg-pink-900'
    : isSaturdayShift
    ? 'bg-schedule-saturday dark:bg-yellow-950 hover:bg-schedule-saturday-hover dark:hover:bg-yellow-900'
    : 'bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-950'

  return (
    <button
      onClick={onClick}
      className={`min-h-[2rem] sm:min-h-[2.5rem] w-full text-left px-0.5 sm:px-1 py-0.5 border border-gray-200 dark:border-gray-600 ${bgClass} transition-colors`}
    >
      {isNightShift && <span className="text-pink-400 mr-0.5 text-[8px] sm:text-xs">★</span>}
      {isSaturdayShift && !isNightShift && <span className="text-yellow-400 mr-0.5 text-[8px] sm:text-xs">★</span>}
      <div className="flex flex-col gap-0.5">
        {assignments.map(a => (
          <span
            key={a.id}
            className={`text-[8px] sm:text-xs truncate dark:text-gray-200 ${highlightName && a.volunteer_name.includes(highlightName) ? 'bg-schedule-highlight dark:bg-yellow-700 font-bold rounded px-0.5' : ''}`}
          >
            {a.volunteer_name}{a.note ? `(${a.note})` : ''}
          </span>
        ))}
        {isFull && (
          <span className="text-red-400 text-[8px] sm:text-xs">
            <span className="sm:hidden">마감</span>
            <span className="hidden sm:inline">(정원 마감)</span>
          </span>
        )}
      </div>
    </button>
  )
}
