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
