import { getCellState } from '../../utils/cellState'
import { TIME_SLOTS } from '../../types'
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

// 열 순서: 일, 월, 화, 수, 목, 금, 토
const DOW_ORDER = [0, 1, 2, 3, 4, 5, 6]
const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export function ScheduleGrid({ year, month, assignments, slotSettings, scheduleRules, dateOverrides, highlightName, onCellClick }: Props) {
  const days = getDaysInMonth(year, month)

  // 요일별 날짜 그룹
  const datesByDow = DOW_ORDER.map(dow =>
    days.filter(d => new Date(year, month - 1, d).getDay() === dow)
  )

  // 모든 셀 상태 미리 계산 [dowIdx][dateIdx][slotIdx]
  const allCellStates = datesByDow.map(dowDates =>
    dowDates.map(day =>
      TIME_SLOTS.map(slot =>
        getCellState(day, slot as TimeSlot, year, month, scheduleRules, slotSettings, dateOverrides, assignments)
      )
    )
  )

  // 해당 요일의 모든 날짜가 휴관인지 (일요일 전체)
  const isHolidayDow = datesByDow.map((dates, dowIdx) =>
    dates.length > 0 && dates.every((_, dateIdx) => allCellStates[dowIdx][dateIdx][0]?.isHoliday)
  )

  // 요일×슬롯 단위로 모든 날짜가 CLOSE인지 확인 (BREAKTIME 제외)
  const allClosedBySlot = datesByDow.map((dates, dowIdx) =>
    TIME_SLOTS.map((_, slotIdx) =>
      dates.length > 0 &&
      dates.every((_, dateIdx) => {
        const s = allCellStates[dowIdx][dateIdx][slotIdx]
        return s.isClosed && !s.isBreaktime && !s.isHoliday
      })
    )
  )

  // 연속 all-CLOSE 슬롯 rowSpan 계산 (-1=생략, 1+=rowSpan)
  const closeSpanByDow = datesByDow.map((_, dowIdx) => {
    if (isHolidayDow[dowIdx]) return new Array(TIME_SLOTS.length).fill(1)
    const spans = new Array(TIME_SLOTS.length).fill(1)
    let i = 0
    while (i < TIME_SLOTS.length) {
      if (allClosedBySlot[dowIdx][i]) {
        let span = 1
        while (i + span < TIME_SLOTS.length && allClosedBySlot[dowIdx][i + span]) span++
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
      <table className="border-collapse text-sm w-full">
        <thead>
          <tr>
            <th className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 text-xs sticky left-0 z-10 whitespace-nowrap">
              시간/일자
            </th>
            {DOW_ORDER.map((dow, dowIdx) => {
              const isSun = dow === 0
              const isSat = dow === 6
              return (
                <th
                  key={dow}
                  className={`border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs font-medium min-w-[7rem]
                    ${isSun ? 'text-red-500 bg-red-50 dark:bg-red-950' : isSat ? 'text-blue-600 bg-blue-50 dark:bg-blue-950' : 'bg-gray-50 dark:bg-gray-700 dark:text-gray-200'}`}
                >
                  <div>{DOW_LABELS[dowIdx]}</div>
                  <div className="font-normal text-xs opacity-60 mt-0.5">
                    {datesByDow[dowIdx].join(' · ')}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map((slot, slotIdx) => (
            <tr key={slot}>
              <td className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 text-xs font-medium text-center sticky left-0 z-10 whitespace-nowrap">
                {slot}
              </td>
              {DOW_ORDER.map((dow, dowIdx) => {
                const dates = datesByDow[dowIdx]

                // 1. 휴관 요일 처리 (일요일 전체 병합 - BREAKTIME보다 먼저)
                if (isHolidayDow[dowIdx]) {
                  if (slotIdx === 0) {
                    return (
                      <td key={dow} rowSpan={TIME_SLOTS.length}
                        className="border border-gray-200 dark:border-gray-600 bg-gray-200 dark:bg-gray-600 text-xs text-gray-500 dark:text-gray-400 text-center align-middle">
                        휴관
                      </td>
                    )
                  }
                  return null
                }

                // 2. BREAKTIME 행
                if (slot === '12-13') {
                  return (
                    <td key={dow} className="border border-gray-200 dark:border-gray-600 bg-schedule-breaktime dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center py-1">
                      BREAKTIME
                    </td>
                  )
                }

                // 3. 연속 all-CLOSE 병합
                const spanValue = closeSpanByDow[dowIdx][slotIdx]
                if (spanValue === -1) return null
                if (spanValue > 1) {
                  return (
                    <td key={dow} rowSpan={spanValue}
                      className="border border-gray-200 dark:border-gray-600 bg-schedule-close dark:bg-gray-600 text-xs text-gray-500 dark:text-gray-400 text-center align-middle">
                      CLOSE
                    </td>
                  )
                }

                // 4. 일반 셀: 날짜별 항목 표시
                const isNightSlot = slot === '18-20' || slot === '20-22'
                const isSatSlot = dow === 6

                return (
                  <td key={dow} className="border border-gray-200 dark:border-gray-600 p-0">
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {dates.map((day, dateIdx) => {
                        const state = allCellStates[dowIdx][dateIdx][slotIdx]

                        if (state.isHoliday) {
                          return (
                            <div key={day} className="flex items-center gap-1 px-1 py-0.5 bg-gray-200 dark:bg-gray-600 text-xs text-gray-400">
                              <span className="w-5 text-right flex-shrink-0 font-medium">{day}</span>
                              <span>휴관</span>
                            </div>
                          )
                        }

                        if (state.isClosed) {
                          return (
                            <div key={day} className="flex items-center gap-1 px-1 py-0.5 bg-schedule-close dark:bg-gray-600 text-xs text-gray-400">
                              <span className="w-5 text-right flex-shrink-0 font-medium">{day}</span>
                              <span>CLOSE</span>
                            </div>
                          )
                        }

                        const rowBg = isNightSlot
                          ? 'bg-schedule-night dark:bg-pink-950 hover:bg-schedule-night-hover'
                          : isSatSlot
                          ? 'bg-schedule-saturday dark:bg-yellow-950 hover:bg-schedule-saturday-hover'
                          : 'bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-950'

                        return (
                          <button
                            key={day}
                            onClick={() => onCellClick({ year, month, day, timeSlot: slot as TimeSlot })}
                            className={`w-full flex items-start gap-1 px-1 py-0.5 transition-colors text-left ${rowBg}`}
                          >
                            <span className="text-gray-400 dark:text-gray-500 text-xs w-5 text-right flex-shrink-0 font-medium">{day}</span>
                            <div className="flex flex-col min-w-0">
                              {isNightSlot && <span className="text-pink-400 text-xs leading-none">★</span>}
                              {isSatSlot && !isNightSlot && <span className="text-yellow-400 text-xs leading-none">★</span>}
                              {state.assignments.map(a => (
                                <span
                                  key={a.id}
                                  className={`text-xs truncate dark:text-gray-200 ${highlightName && a.volunteer_name.includes(highlightName) ? 'bg-schedule-highlight dark:bg-yellow-700 font-bold rounded px-0.5' : ''}`}
                                >
                                  {a.volunteer_name}{a.note ? `(${a.note})` : ''}
                                </span>
                              ))}
                              {state.isFull && <span className="text-xs text-red-400">마감</span>}
                            </div>
                          </button>
                        )
                      })}
                    </div>
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
