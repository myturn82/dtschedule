import { getCellState } from './cellState'
import type { Assignment, SlotSetting, ScheduleRule, DateOverride, TenantRole, VolunteerType } from '../types'
import type { ProfileWithRole } from '../hooks/useProfiles'

export interface ProposedAssignment {
  id: string
  year: number
  month: number
  day: number
  timeSlot: string
  volunteerType: VolunteerType
  roleId: string | null
  userId: string
  userName: string
  roleName: string
  dayLabel: string
}

interface AutoAssignParams {
  days: Date[]
  timeSlots: string[]
  assignments: Assignment[]
  slotSettings: SlotSetting[]
  scheduleRules: ScheduleRule[]
  dateOverrides: DateOverride[]
  profiles: ProfileWithRole[]
  splitRoles: TenantRole[]
  isSplitMode: boolean
}

function formatDayLabel(date: Date): string {
  const dow = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
  return `${date.getMonth() + 1}월 ${date.getDate()}일(${dow})`
}

function getEmptySlots(
  days: Date[],
  timeSlots: string[],
  assignments: Assignment[],
  scheduleRules: ScheduleRule[],
  slotSettings: SlotSetting[],
  dateOverrides: DateOverride[],
  isSlotTaken: (year: number, month: number, day: number, slot: string) => boolean,
): { year: number; month: number; day: number; slot: string }[] {
  const result: { year: number; month: number; day: number; slot: string }[] = []
  for (const date of days) {
    const y = date.getFullYear()
    const m = date.getMonth() + 1
    const d = date.getDate()
    for (const slot of timeSlots) {
      const cs = getCellState(d, slot, y, m, scheduleRules, slotSettings, dateOverrides, assignments)
      if (cs.isClosed || cs.isHoliday || cs.isBreaktime) continue
      if (!isSlotTaken(y, m, d, slot)) {
        result.push({ year: y, month: m, day: d, slot })
      }
    }
  }
  return result
}

function roundRobin(
  members: ProfileWithRole[],
  emptySlots: { year: number; month: number; day: number; slot: string }[],
  existingAssignments: Assignment[],
  countMatchFn: (a: Assignment) => boolean,
  volunteerType: VolunteerType,
  roleId: string | null,
  roleName: string,
): ProposedAssignment[] {
  if (!members.length || !emptySlots.length) return []

  const countMap = new Map<string, number>()
  members.forEach(m => countMap.set(m.id, 0))
  existingAssignments.forEach(a => {
    if (countMatchFn(a) && countMap.has(a.user_id)) {
      countMap.set(a.user_id, (countMap.get(a.user_id) ?? 0) + 1)
    }
  })

  const sorted = [...members].sort((a, b) =>
    (countMap.get(a.id) ?? 0) - (countMap.get(b.id) ?? 0)
  )

  return emptySlots.map((s, i) => ({
    id: `${s.year}-${s.month}-${s.day}-${s.slot}-${roleId ?? volunteerType}-${i}`,
    year: s.year,
    month: s.month,
    day: s.day,
    timeSlot: s.slot,
    volunteerType,
    roleId,
    userId: sorted[i % sorted.length].id,
    userName: sorted[i % sorted.length].name,
    roleName,
    dayLabel: formatDayLabel(new Date(s.year, s.month - 1, s.day)),
  }))
}

export function computeAutoAssignments(params: AutoAssignParams): ProposedAssignment[] {
  const {
    days, timeSlots, assignments, slotSettings, scheduleRules, dateOverrides,
    profiles, splitRoles, isSplitMode,
  } = params

  const proposals: ProposedAssignment[] = []

  if (isSplitMode) {
    for (const role of splitRoles) {
      const members = profiles.filter(p => p.tenantRoleId === role.id)
      if (!members.length) continue

      const emptySlots = getEmptySlots(
        days, timeSlots, assignments, scheduleRules, slotSettings, dateOverrides,
        (y, m, d, slot) => assignments.some(a =>
          a.year === y && a.month === m && a.day === d &&
          a.time_slot === slot && a.role_id === role.id
        )
      )

      proposals.push(...roundRobin(
        members, emptySlots, assignments,
        (a) => a.role_id === role.id,
        'volunteer',
        role.id,
        role.name,
      ))
    }
  } else {
    for (const { members, volunteerType, roleName } of [
      { members: profiles, volunteerType: 'volunteer' as VolunteerType, roleName: '자원봉사자' },
    ]) {
      if (!members.length) continue
      const vt = volunteerType

      const emptySlots = getEmptySlots(
        days, timeSlots, assignments, scheduleRules, slotSettings, dateOverrides,
        (y, m, d, slot) => assignments.some(a =>
          a.year === y && a.month === m && a.day === d &&
          a.time_slot === slot && (a.volunteer_type ?? 'volunteer') === vt && !a.role_id
        )
      )

      proposals.push(...roundRobin(
        members, emptySlots, assignments,
        (a) => (a.volunteer_type ?? 'volunteer') === vt,
        vt, null, roleName,
      ))
    }
  }

  return proposals.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    if (a.month !== b.month) return a.month - b.month
    if (a.day !== b.day) return a.day - b.day
    return a.timeSlot.localeCompare(b.timeSlot)
  })
}
