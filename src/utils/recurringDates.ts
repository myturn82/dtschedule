import type { ScheduleRule, DateOverride } from '../types'
import { isKoreanHoliday } from './koreanHolidays'

export function getDatesForPattern(
  startDate: Date,
  endDate: Date,
  daysOfWeek: number[],
  timeSlot: string,
  scheduleRules: ScheduleRule[],
  dateOverrides: DateOverride[]
): { year: number; month: number; day: number }[] {
  const overrideMap = new Map<string, boolean>()
  for (const o of dateOverrides) overrideMap.set(o.date, o.is_open)

  const ruleMap = new Map<string, boolean>()
  for (const r of scheduleRules) ruleMap.set(`${r.day_of_week}-${r.time_slot}`, r.is_open)

  const results: { year: number; month: number; day: number }[] = []
  const cur = new Date(startDate)
  cur.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  while (cur <= end) {
    const dow = cur.getDay()
    if (daysOfWeek.includes(dow)) {
      const year = cur.getFullYear()
      const month = cur.getMonth() + 1
      const day = cur.getDate()
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

      if (overrideMap.has(dateStr)) {
        if (overrideMap.get(dateStr) === true) results.push({ year, month, day })
        // is_open=false → skip
      } else if (isKoreanHoliday(dateStr)) {
        // public holidays skipped unless overridden above
      } else {
        const isOpen = ruleMap.get(`${dow}-${timeSlot}`) ?? true
        if (isOpen) results.push({ year, month, day })
      }
    }
    cur.setDate(cur.getDate() + 1)
  }

  return results
}

// 매일: all days of week (reuses existing logic)
export function getDatesForDaily(
  startDate: Date, endDate: Date, timeSlot: string,
  scheduleRules: ScheduleRule[], dateOverrides: DateOverride[]
) {
  return getDatesForPattern(startDate, endDate, [0,1,2,3,4,5,6], timeSlot, scheduleRules, dateOverrides)
}

// 매월: same day-of-month each month
export function getDatesForMonthly(
  startDate: Date, endDate: Date, dayOfMonth: number, timeSlot: string,
  scheduleRules: ScheduleRule[], dateOverrides: DateOverride[]
): { year: number; month: number; day: number }[] {
  const overrideMap = new Map<string, boolean>()
  for (const o of dateOverrides) overrideMap.set(o.date, o.is_open)
  const ruleMap = new Map<string, boolean>()
  for (const r of scheduleRules) ruleMap.set(`${r.day_of_week}-${r.time_slot}`, r.is_open)
  const s0 = new Date(startDate); s0.setHours(0,0,0,0)
  const e0 = new Date(endDate); e0.setHours(23,59,59,999)

  const results: { year: number; month: number; day: number }[] = []
  let year = startDate.getFullYear(), month = startDate.getMonth() + 1
  const endY = endDate.getFullYear(), endM = endDate.getMonth() + 1

  while (year < endY || (year === endY && month <= endM)) {
    const daysInMonth = new Date(year, month, 0).getDate()
    const day = Math.min(dayOfMonth, daysInMonth)
    const target = new Date(year, month - 1, day)
    if (target >= s0 && target <= e0) {
      const dow = target.getDay()
      const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
      if (overrideMap.has(dateStr)) {
        if (overrideMap.get(dateStr)) results.push({ year, month, day })
      } else if (!isKoreanHoliday(dateStr) && (ruleMap.get(`${dow}-${timeSlot}`) ?? true)) {
        results.push({ year, month, day })
      }
    }
    month++; if (month > 12) { year++; month = 1 }
  }
  return results
}

// 매년: same month+day each year
export function getDatesForYearly(
  startDate: Date, endDate: Date, monthOfYear: number, dayOfMonth: number, timeSlot: string,
  scheduleRules: ScheduleRule[], dateOverrides: DateOverride[]
): { year: number; month: number; day: number }[] {
  const overrideMap = new Map<string, boolean>()
  for (const o of dateOverrides) overrideMap.set(o.date, o.is_open)
  const ruleMap = new Map<string, boolean>()
  for (const r of scheduleRules) ruleMap.set(`${r.day_of_week}-${r.time_slot}`, r.is_open)
  const s0 = new Date(startDate); s0.setHours(0,0,0,0)
  const e0 = new Date(endDate); e0.setHours(23,59,59,999)

  const results: { year: number; month: number; day: number }[] = []
  for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
    const daysInMonth = new Date(year, monthOfYear, 0).getDate()
    const day = Math.min(dayOfMonth, daysInMonth)
    const target = new Date(year, monthOfYear - 1, day)
    if (target >= s0 && target <= e0) {
      const dow = target.getDay()
      const dateStr = `${year}-${String(monthOfYear).padStart(2,'0')}-${String(day).padStart(2,'0')}`
      if (overrideMap.has(dateStr)) {
        if (overrideMap.get(dateStr)) results.push({ year, month: monthOfYear, day })
      } else if (!isKoreanHoliday(dateStr) && (ruleMap.get(`${dow}-${timeSlot}`) ?? true)) {
        results.push({ year, month: monthOfYear, day })
      }
    }
  }
  return results
}
