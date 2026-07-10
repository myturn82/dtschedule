import type { Assignment, ScheduleRule, SlotSetting, DateOverride, TimeSlot } from '../types'
import { getCellState } from './cellState'

export interface DayAssignmentEntry {
  timeSlot: TimeSlot
  startHour: number
  assignment: Assignment
}

export function getDayAssignmentEntries(
  day: number,
  year: number,
  month: number,
  timeSlots: TimeSlot[],
  scheduleRules: ScheduleRule[],
  slotSettings: SlotSetting[],
  dateOverrides: DateOverride[],
  assignments: Assignment[],
  displayAssignmentFilter?: (a: Assignment) => boolean
): DayAssignmentEntry[] {
  const entries: DayAssignmentEntry[] = []

  for (const timeSlot of timeSlots) {
    const cellState = getCellState(day, timeSlot, year, month, scheduleRules, slotSettings, dateOverrides, assignments)
    if (cellState.isClosed) continue

    const startHour = Number(timeSlot.split('-')[0])
    for (const assignment of cellState.assignments) {
      if (assignment.member_type === 'admin_note') continue
      if (displayAssignmentFilter && !displayAssignmentFilter(assignment)) continue
      entries.push({ timeSlot, startHour, assignment })
    }
  }

  return entries.sort((a, b) => a.startHour - b.startHour)
}
