import { Fragment } from 'react'
import { getCellState } from '../../utils/cellState'
import { TIME_SLOTS } from '../../types'
import { TimeSlotCell } from './TimeSlotCell'
import type { Assignment, SlotSetting, ScheduleRule, DateOverride, TimeSlot, ModalTarget } from '../../types'

interface Props {
  year: number
  month: number
  assignments: Assignment[]
  slotSettings: SlotSetting[]
  scheduleRules: ScheduleRule[]
  dateOverrides: DateOverride[]
  highlightName: string | null
  onCellClick: (target: ModalTarget) => void
}

// 열 순서: 일, 월, 화, 수, 목, 금, 토
const DOW_ORDER = [0, 1, 2, 3, 4, 5, 6]
const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function getCalendarWeeks(year: number, month: number): (number | null)[][] {
  const count = new Date(year, month, 0).getDate()
  const days = Array.from({ length: count }, (_, i) => i + 1)
  const weeks: (number | null)[][] = []
  let currentWeek: (number | null)[] = new Array(7).fill(null)

  for (const day of days) {
    const dow = new Date(year, month - 1, day).getDay()
    currentWeek[dow] = day
    if (dow === 6) {
      weeks.push([...currentWeek])
      currentWeek = new Array(7).fill(null)
    }
  }
  if (currentWeek.some(d => d !== null)) weeks.push(currentWeek)
  return weeks
}

export function ScheduleGrid({ year, month, assignments, slotSettings, scheduleRules, dateOverrides, highlightName, onCellClick }: Props) {
  const weeks = getCalendarWeeks(year, month)

  return (
    <div className="overflow-x-auto -mx-2 sm:mx-0">
      <table className="border-collapse text-sm w-full">
        <thead>
          <tr>
            <th className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 px-1 sm:px-2 py-1 text-[10px] sm:text-xs sticky left-0 z-10 whitespace-nowrap min-w-[3rem] sm:min-w-fit">
              <span className="hidden sm:inline">시간/일자</span>
              <span className="sm:hidden">시간</span>
            </th>
            {DOW_ORDER.map((dow, i) => (
              <th
                key={dow}
                className={`border border-gray-300 dark:border-gray-600 px-0.5 sm:px-2 py-1 text-[10px] sm:text-xs font-medium min-w-[2.75rem] sm:min-w-[5rem]
                  ${dow === 0 ? 'text-red-500 bg-red-50 dark:bg-red-950' : dow === 6 ? 'text-blue-600 bg-blue-50 dark:bg-blue-950' : 'bg-gray-50 dark:bg-gray-700 dark:text-gray-200'}`}
              >
                {DOW_LABELS[i]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIdx) => (
            <Fragment key={weekIdx}>
              <tr>
                <td className="border-t-2 border-gray-400 dark:border-gray-500 border-x border-b border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 px-1 sm:px-2 py-1 text-[10px] sm:text-xs font-bold text-center sticky left-0 z-10">
                  {weekIdx + 1}주
                </td>
                {week.map((day, dowIdx) => {
                  const dow = DOW_ORDER[dowIdx]
                  return (
                    <td
                      key={dowIdx}
                      className={`border-t-2 border-gray-400 dark:border-gray-500 border-x border-b border-gray-200 dark:border-gray-600 text-center text-[10px] sm:text-xs font-semibold py-1
                        ${!day ? 'bg-gray-50 dark:bg-gray-800' : dow === 0 ? 'text-red-500 bg-red-50 dark:bg-red-950' : dow === 6 ? 'text-blue-600 bg-blue-50 dark:bg-blue-950' : 'bg-gray-50 dark:bg-gray-700 dark:text-gray-200'}`}
                    >
                      {day ?? ''}
                    </td>
                  )
                })}
              </tr>
              {TIME_SLOTS.map(slot => (
                <tr key={slot}>
                  <td className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 px-0.5 sm:px-2 py-1 text-[10px] sm:text-xs font-medium text-center sticky left-0 z-10 whitespace-nowrap">
                    {slot}
                  </td>
                  {week.map((day, dowIdx) => {
                    if (!day) {
                      return (
                        <td key={dowIdx} className="border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800" />
                      )
                    }
                    const cellState = getCellState(day, slot as TimeSlot, year, month, scheduleRules, slotSettings, dateOverrides, assignments)
                    return (
                      <td key={dowIdx} className="border border-gray-200 dark:border-gray-600 p-0">
                        <TimeSlotCell
                          cellState={cellState}
                          highlightName={highlightName}
                          onClick={() => onCellClick({ year, month, day, timeSlot: slot as TimeSlot })}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
