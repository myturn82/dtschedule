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

function getDaysInMonth(year: number, month: number): number[] {
  const count = new Date(year, month, 0).getDate()
  return Array.from({ length: count }, (_, i) => i + 1)
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export function ScheduleGrid({ year, month, assignments, slotSettings, scheduleRules, dateOverrides, highlightName, onCellClick }: Props) {
  const days = getDaysInMonth(year, month)

  // 휴관일 판별
  const holidayDays = new Set(
    days.filter(day => {
      if (new Date(year, month - 1, day).getDay() === 0) return true
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      return dateOverrides.some(d => d.date === dateStr && d.is_holiday)
    })
  )

  // 모든 셀 상태 미리 계산 [dayIdx][slotIdx]
  const allCellStates = days.map(day =>
    TIME_SLOTS.map(slot =>
      getCellState(day, slot as TimeSlot, year, month, scheduleRules, slotSettings, dateOverrides, assignments)
    )
  )

  // 연속 CLOSE 슬롯 병합 스팬 계산 (-1 = 생략, 1+ = rowSpan 값)
  const closeSpanMap: number[][] = days.map((day, dayIdx) => {
    if (holidayDays.has(day)) return new Array(TIME_SLOTS.length).fill(1)
    const spans = new Array(TIME_SLOTS.length).fill(1)
    let i = 0
    while (i < TIME_SLOTS.length) {
      const state = allCellStates[dayIdx][i]
      if (state.isClosed && !state.isBreaktime) {
        let span = 1
        while (i + span < TIME_SLOTS.length) {
          const next = allCellStates[dayIdx][i + span]
          if (next.isClosed && !next.isBreaktime) span++
          else break
        }
        if (span > 1) {
          spans[i] = span
          for (let k = 1; k < span; k++) spans[i + k] = -1
        }
        i += span
      } else {
        i++
      }
    }
    return spans
  })

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-sm w-full min-w-max">
        <thead>
          <tr>
            <th className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 text-xs sticky left-0 z-10">시간/일자</th>
            {days.map(day => {
              const label = DAY_LABELS[new Date(year, month - 1, day).getDay()]
              const isSat = label === '토'
              const isSun = label === '일'
              return (
                <th
                  key={day}
                  className={`border border-gray-300 dark:border-gray-600 px-1 py-1 text-xs font-medium min-w-[4.5rem]
                    ${isSun ? 'text-red-500 bg-red-50 dark:bg-red-950' : isSat ? 'text-blue-600 bg-blue-50 dark:bg-blue-950' : 'bg-gray-50 dark:bg-gray-700 dark:text-gray-200'}`}
                >
                  <span>{day}</span><br />{label}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map((slot, slotIndex) => (
            <tr key={slot}>
              <td className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 text-xs font-medium text-center sticky left-0 z-10 whitespace-nowrap">
                {slot}
              </td>
              {days.map((day, dayIdx) => {
                // 휴관일: 첫 행에만 병합 셀, 나머지 생략
                if (holidayDays.has(day)) {
                  if (slotIndex === 0) {
                    return (
                      <td key={day} rowSpan={TIME_SLOTS.length}
                        className="border border-gray-200 dark:border-gray-600 bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-xs text-center align-middle">
                        휴관
                      </td>
                    )
                  }
                  return null
                }

                const spanValue = closeSpanMap[dayIdx][slotIndex]
                if (spanValue === -1) return null

                const cellState = allCellStates[dayIdx][slotIndex]

                // 연속 CLOSE 병합 셀
                if (spanValue > 1 && cellState.isClosed && !cellState.isBreaktime) {
                  return (
                    <td key={day} rowSpan={spanValue}
                      className="border border-gray-200 dark:border-gray-600 bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-xs text-center align-middle">
                      CLOSE
                    </td>
                  )
                }

                return (
                  <td key={day} className="border border-gray-200 dark:border-gray-600 p-0">
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
        </tbody>
      </table>
    </div>
  )
}
