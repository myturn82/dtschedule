import { useState } from 'react'
import { getCellState } from '../../utils/cellState'
import { slotStartLabel } from '../../utils/timeSlots'
import { TimeSlotCell } from './TimeSlotCell'
import type { Assignment, SlotSetting, ScheduleRule, DateOverride, TimeSlot, ModalTarget, TenantRole } from '../../types'

interface Props {
  year: number
  month: number
  timeSlots: TimeSlot[]
  slotLabels?: Record<string, string>
  assignments: Assignment[]
  slotSettings: SlotSetting[]
  scheduleRules: ScheduleRule[]
  dateOverrides: DateOverride[]
  highlightName: string | null
  splitRoles?: TenantRole[]
  isSplitMode?: boolean
  displayAssignmentFilter?: (a: Assignment) => boolean
  onCellClick: (target: ModalTarget) => void
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export function MobileScheduleView({ year, month, timeSlots, slotLabels = {}, assignments, slotSettings, scheduleRules, dateOverrides, highlightName, splitRoles = [], isSplitMode = false, displayAssignmentFilter, onCellClick }: Props) {
  const daysCount = new Date(year, month, 0).getDate()
  const days = Array.from({ length: daysCount }, (_, i) => i + 1)
  const [selectedDay, setSelectedDay] = useState(1)
  const dayLabel = DAY_LABELS[new Date(year, month - 1, selectedDay).getDay()]
  const isSun = dayLabel === '일'
  const isSat = dayLabel === '토'

  return (
    <div>
      <div className="flex overflow-x-auto gap-1 pb-2 mb-3">
        {days.map(d => {
          const dl = DAY_LABELS[new Date(year, month - 1, d).getDay()]
          const isSunDay = dl === '일'
          const isSatDay = dl === '토'
          return (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`flex-shrink-0 w-10 h-12 rounded text-xs font-medium border
                ${selectedDay === d ? 'bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)]' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 dark:text-gray-200'}
                ${isSunDay && selectedDay !== d ? 'text-red-500' : ''}
                ${isSatDay && selectedDay !== d ? 'text-blue-600' : ''}`}
            >
              <div>{d}</div>
              <div>{dl}</div>
            </button>
          )
        })}
      </div>

      <div className="text-sm font-bold mb-2 text-gray-700 dark:text-gray-200">
        {month}월 {selectedDay}일 ({dayLabel})
        {(isSun || isSat) && (
          <span className={`ml-2 text-xs ${isSun ? 'text-red-500' : 'text-blue-500'}`}>
            {isSun ? '일요일' : '토요일'}
          </span>
        )}
      </div>
      <div className="space-y-1">
        {timeSlots.map(slot => {
          const cellState = getCellState(selectedDay, slot, year, month, scheduleRules, slotSettings, dateOverrides, assignments)
          const displayCellState = displayAssignmentFilter
            ? { ...cellState, assignments: cellState.assignments.filter(displayAssignmentFilter) }
            : cellState
          return (
            <div key={slot} className="flex items-stretch gap-2">
              <div className="w-16 text-xs font-medium text-[var(--tint-brand-ink)] flex items-center justify-center bg-[var(--tint-brand)] rounded px-1 truncate">{slotLabels[slot] ?? slotStartLabel(slot)}</div>
              <div className="flex-1 flex gap-1">
                {isSplitMode && splitRoles.length > 0 ? (
                  splitRoles.map(role => (
                    <div key={role.id} className="flex-1 min-w-0">
                      <TimeSlotCell
                        cellState={displayCellState}
                        timeSlot={slot}
                        colType="role"
                        roleId={role.id}
                        highlightName={highlightName}
                        onClick={() => onCellClick({ year, month, day: selectedDay, timeSlot: slot, memberType: 'member', roleId: role.id })}
                      />
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex-1">
                      <TimeSlotCell
                        cellState={displayCellState}
                        timeSlot={slot}
                        colType="vol"
                        highlightName={highlightName}
                        onClick={() => onCellClick({ year, month, day: selectedDay, timeSlot: slot, memberType: 'member' })}
                      />
                    </div>
                    {!isSat && (
                      <div className="w-[40%]">
                        <TimeSlotCell
                          cellState={displayCellState}
                          timeSlot={slot}
                          colType="plus"
                          highlightName={highlightName}
                          onClick={() => onCellClick({ year, month, day: selectedDay, timeSlot: slot, memberType: '50plus' })}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
