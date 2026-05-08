import { Fragment } from 'react'
import { getCellState } from '../../utils/cellState'
import { TIME_SLOTS } from '../../types'
import { TimeSlotCell } from './TimeSlotCell'
import type { Assignment, SlotSetting, ScheduleRule, DateOverride, TimeSlot, ModalTarget, Profile } from '../../types'

interface Props {
  year: number
  month: number
  assignments: Assignment[]
  slotSettings: SlotSetting[]
  scheduleRules: ScheduleRule[]
  dateOverrides: DateOverride[]
  highlightName: string | null
  profile?: Profile | null
  onCellClick: (target: ModalTarget) => void
  onHolidayCellClick?: (day: number, startHour: number, endHour: number) => void
}

// 월요일 시작: 월~일
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0]
const DOW_LABELS = ['월', '화', '수', '목', '금', '토', '일']

function getCalendarWeeks(year: number, month: number): (number | null)[][] {
  const count = new Date(year, month, 0).getDate()
  const weeks: (number | null)[][] = []
  let currentWeek: (number | null)[] = new Array(7).fill(null)

  for (let day = 1; day <= count; day++) {
    const dow = new Date(year, month - 1, day).getDay()
    const idx = (dow + 6) % 7  // Mon=0 ... Sun=6
    currentWeek[idx] = day
    if (idx === 6) {
      weeks.push([...currentWeek])
      currentWeek = new Array(7).fill(null)
    }
  }
  if (currentWeek.some(d => d !== null)) weeks.push(currentWeek)
  return weeks
}

function parseTimeSub(ts: string): [number, number] {
  if (ts.includes('~')) { const [s, e] = ts.split('~').map(Number); return [s, e + 1] }
  return [Number(ts), Number(ts) + 1]
}

function computeSlotGroups(
  notes: Assignment[],
  coveredSlots: TimeSlot[]
): { count: number; note: Assignment | null; startHour: number; endHour: number }[] {
  const groups: { count: number; note: Assignment | null; startHour: number; endHour: number }[] = []
  for (const slot of coveredSlots) {
    const [ss, se] = slot.split('-').map(Number)
    const note = notes.find(n => {
      if (!n.time_sub) return false
      const [ns, ne] = parseTimeSub(n.time_sub)
      return ns < se && ne > ss
    }) ?? null
    const last = groups[groups.length - 1]
    if (last && last.note?.id === note?.id) { last.count++; last.endHour = se }
    else groups.push({ count: 1, note, startHour: ss, endHour: se })
  }
  return groups
}

type CellMerge = {
  skip: boolean      // 위 rowspan 셀에 이미 포함됨 → 렌더링 스킵
  rowspan: number    // 1 = 단독, >1 = 머지
  isHoliday: boolean
  label: string | null
}

function getSlotAssignmentKey(day: number, slot: TimeSlot, assignments: Assignment[]): string {
  const slotA = assignments.filter(a =>
    a.day === day && a.time_slot === slot && a.volunteer_type !== 'admin_note'
  )
  if (slotA.length === 0) return ''
  return slotA.map(a => `${a.volunteer_type}:${a.volunteer_name}`).sort().join('|')
}

function buildMergeMap(
  week: (number | null)[],
  year: number,
  month: number,
  scheduleRules: ScheduleRule[],
  slotSettings: SlotSetting[],
  dateOverrides: DateOverride[],
  assignments: Assignment[]
): Map<string, CellMerge> {
  const map = new Map<string, CellMerge>()

  week.forEach((day, dowIdx) => {
    if (!day) return

    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const overrideLabel = dateOverrides.find(d => d.date === dateKey)?.label ?? null

    let i = 0
    while (i < TIME_SLOTS.length) {
      const slot = TIME_SLOTS[i] as TimeSlot
      const s = getCellState(day, slot, year, month, scheduleRules, slotSettings, dateOverrides, assignments)

      if (s.isClosed || s.isHoliday) {
        let j = i + 1
        while (j < TIME_SLOTS.length) {
          const ns = getCellState(day, TIME_SLOTS[j] as TimeSlot, year, month, scheduleRules, slotSettings, dateOverrides, assignments)
          if (ns.isClosed || ns.isHoliday) j++
          else break
        }
        const span = j - i
        map.set(`${dowIdx}-${i}`, { skip: false, rowspan: span, isHoliday: s.isHoliday, label: overrideLabel })
        for (let k = i + 1; k < j; k++) {
          map.set(`${dowIdx}-${k}`, { skip: true, rowspan: 0, isHoliday: false, label: null })
        }
        i = j
      } else {
        // 연속 동일 근무자 머지
        const assignKey = getSlotAssignmentKey(day, slot, assignments)
        let span = 1
        if (assignKey) {
          let j = i + 1
          while (j < TIME_SLOTS.length) {
            const ns = getCellState(day, TIME_SLOTS[j] as TimeSlot, year, month, scheduleRules, slotSettings, dateOverrides, assignments)
            if (ns.isClosed || ns.isHoliday) break
            if (getSlotAssignmentKey(day, TIME_SLOTS[j] as TimeSlot, assignments) === assignKey) j++
            else break
          }
          span = j - i
        }
        map.set(`${dowIdx}-${i}`, { skip: false, rowspan: span, isHoliday: false, label: null })
        for (let k = i + 1; k < i + span; k++) {
          map.set(`${dowIdx}-${k}`, { skip: true, rowspan: 0, isHoliday: false, label: null })
        }
        i += span
      }
    }
  })

  return map
}

export function ScheduleGrid({ year, month, assignments, slotSettings, scheduleRules, dateOverrides, highlightName, profile, onCellClick, onHolidayCellClick }: Props) {
  const isAdmin = profile?.role === 'admin'
  const weeks = getCalendarWeeks(year, month)

  return (
    <div className="sm:overflow-x-auto">
      <table className="border-collapse text-sm w-full table-fixed sm:table-auto">
        <thead>
          <tr>
            <th className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 px-0.5 sm:px-2 py-1 text-[10px] sm:text-xs sticky left-0 z-10 w-9 sm:w-auto whitespace-nowrap">
              <span className="hidden sm:inline">시간/일자</span>
              <span className="sm:hidden">시간</span>
            </th>
            {DOW_ORDER.map((dow, i) => (
              <th
                key={dow}
                className={`border border-gray-300 dark:border-gray-600 px-0 sm:px-2 py-1 text-[10px] sm:text-xs font-medium sm:min-w-[5rem]
                  ${dow === 0 ? 'text-red-500 bg-red-50 dark:bg-red-950' : dow === 6 ? 'text-blue-600 bg-blue-50 dark:bg-blue-950' : 'bg-gray-50 dark:bg-gray-700 dark:text-gray-200'}`}
              >
                {DOW_LABELS[i]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIdx) => {
            const mergeMap = buildMergeMap(week, year, month, scheduleRules, slotSettings, dateOverrides, assignments)

            return (
              <Fragment key={weekIdx}>
                {/* 주차 날짜 헤더 */}
                <tr>
                  <td className="border-t-2 border-gray-400 dark:border-gray-500 border-x border-b border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 px-0.5 sm:px-2 py-1 text-[10px] sm:text-xs font-bold text-center sticky left-0 z-10 w-9 sm:w-auto">
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

                {/* 시간 슬롯 행 */}
                {TIME_SLOTS.map((slot, slotIdx) => (
                  <tr key={slot}>
                    <td className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 px-0.5 sm:px-2 py-1 text-[10px] sm:text-xs font-medium text-center sticky left-0 z-10 w-9 sm:w-auto">
                      <span className="sm:hidden">{slot.split('-')[0]}</span>
                      <span className="hidden sm:inline whitespace-nowrap">{slot}</span>
                    </td>
                    {week.map((day, dowIdx) => {
                      if (!day) {
                        return <td key={dowIdx} className="border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800" />
                      }

                      const merge = mergeMap.get(`${dowIdx}-${slotIdx}`)
                      if (!merge || merge.skip) return null

                      // 머지 셀 (rowspan > 1인 CLOSE/휴관) — 시간대별 색상 분할
                      if (merge.rowspan > 1) {
                        const dayNotes = assignments.filter(
                          a => a.day === day && a.volunteer_type === 'admin_note'
                        )
                        const coveredSlots = TIME_SLOTS.slice(slotIdx, slotIdx + merge.rowspan) as TimeSlot[]
                        const slotGroups = computeSlotGroups(dayNotes, coveredSlots)
                        return (
                          <td
                            key={dowIdx}
                            rowSpan={merge.rowspan}
                            className="border border-gray-200 dark:border-gray-600 p-0 bg-gray-200 dark:bg-gray-600"
                            style={{ height: '1px' }}
                          >
                            <div className="flex flex-col h-full w-full">
                              {slotGroups.map((group, gi) => (
                                <div
                                  key={gi}
                                  style={{
                                    flex: group.count,
                                    minHeight: `${group.count * 2}rem`,
                                    backgroundColor: group.note?.volunteer_name || (group.note ? 'rgba(255,255,255,0.55)' : undefined),
                                  }}
                                  onClick={isAdmin && onHolidayCellClick
                                    ? (e) => { e.stopPropagation(); onHolidayCellClick(day, group.startHour, group.endHour) }
                                    : undefined}
                                  className={`flex flex-col items-center justify-center px-0.5 py-0.5 text-center
                                    ${isAdmin && onHolidayCellClick ? 'cursor-pointer hover:brightness-95 transition-colors' : ''}`}
                                >
                                  {!group.note ? (
                                    <>
                                      <span className="sm:hidden text-[9px] text-gray-500 dark:text-gray-400 font-medium">
                                        {merge.isHoliday ? '휴관' : '✕'}
                                      </span>
                                      <span className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 font-medium">
                                        {merge.isHoliday ? '휴관' : 'CLOSE'}
                                      </span>
                                      {gi === 0 && merge.label && (
                                        <span className="text-[8px] sm:text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{merge.label}</span>
                                      )}
                                      {isAdmin && onHolidayCellClick && (
                                        <span className="hidden sm:block text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">+ 비고</span>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <span className="hidden sm:block text-[10px] font-semibold text-gray-700 leading-tight">
                                        {group.note.time_sub ? (() => { const [s, e] = parseTimeSub(group.note.time_sub!); return `${s}~${e}시` })() : ''}
                                      </span>
                                      <span className="hidden sm:block text-[10px] text-gray-700 leading-tight break-all">{group.note.note}</span>
                                      <span className="sm:hidden w-2 h-2 rounded-full bg-gray-500/40 block" />
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        )
                      }

                      // 일반 셀 (rowspan > 1이면 연속 동일 근무자 머지)
                      const cellState = getCellState(day, slot as TimeSlot, year, month, scheduleRules, slotSettings, dateOverrides, assignments)
                      return (
                        <td key={dowIdx} rowSpan={merge.rowspan > 1 ? merge.rowspan : undefined} className="border border-gray-200 dark:border-gray-600 p-0">
                          <TimeSlotCell
                            cellState={cellState}
                            highlightName={highlightName}
                            onClickVolunteer={() => onCellClick({ year, month, day, timeSlot: slot as TimeSlot, volunteerType: 'volunteer' })}
                            onClickPlus={() => onCellClick({ year, month, day, timeSlot: slot as TimeSlot, volunteerType: '50plus' })}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
