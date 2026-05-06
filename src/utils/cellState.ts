import type { TimeSlot, Assignment, SlotSetting, ScheduleRule, DateOverride, CellState } from '../types'

export function getCellState(
  day: number,
  timeSlot: TimeSlot,
  year: number,
  month: number,
  scheduleRules: ScheduleRule[],
  slotSettings: SlotSetting[],
  dateOverrides: DateOverride[],
  allAssignments: Assignment[]
): CellState {
  const date = new Date(year, month - 1, day)
  const dayOfWeek = date.getDay()
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const isBreaktime = timeSlot === '12-13'
  const override = dateOverrides.find(d => d.date === dateStr)
  const isHoliday = override?.is_holiday === true || dayOfWeek === 0

  if (isHoliday || isBreaktime) {
    return { isBreaktime, isClosed: true, isHoliday, isNightShift: false, isSaturdayShift: false, assignments: [], maxCapacity: 0, isFull: false }
  }

  const rule = scheduleRules.find(r => r.day_of_week === dayOfWeek && r.time_slot === timeSlot)
  const isClosed = rule ? !rule.is_open : true

  const isNightShift = timeSlot === '18-20' || timeSlot === '20-22'
  const isSaturdayShift = dayOfWeek === 6

  const dayAssignments = allAssignments.filter(
    a => a.year === year && a.month === month && a.day === day && a.time_slot === timeSlot
  )

  const setting = slotSettings.find(s => s.time_slot === timeSlot)
  const maxCapacity = setting?.max_capacity ?? 2

  return {
    isBreaktime: false,
    isClosed,
    isHoliday: false,
    isNightShift,
    isSaturdayShift,
    assignments: dayAssignments,
    maxCapacity,
    isFull: dayAssignments.length >= maxCapacity,
  }
}
