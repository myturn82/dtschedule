import { useState, useRef, useEffect } from 'react'
import { getKoreanHolidayName } from '../../utils/koreanHolidays'
import { getDayAssignmentEntries } from '../../utils/dayAssignments'
import { rangeSlotLabel, slotStartHourLabel } from '../../utils/timeSlots'
import { getCellState } from '../../utils/cellState'
import { LockIcon } from '../icons/LockIcons'
import { indicatorBarColorFor } from '../../utils/indicatorBarColors'
import type { Assignment, SlotSetting, ScheduleRule, DateOverride, TimeSlot, ModalTarget, TenantRole } from '../../types'

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']
const MAX_VISIBLE = 4
const EMPTY_SET: Set<string> = new Set()

interface Props {
  weekDays: Date[]
  timeSlots: TimeSlot[]
  assignments: Assignment[]
  slotSettings: SlotSetting[]
  scheduleRules: ScheduleRule[]
  dateOverrides: DateOverride[]
  splitRoles?: TenantRole[]
  indicatorBarRoles?: TenantRole[]
  isSplitMode?: boolean
  hiddenRoleIds?: Set<string>
  displayAssignmentFilter?: (a: Assignment) => boolean
  withdrawnUserIds?: Set<string>
  canAdd?: boolean
  memberRoleId?: string | null
  onCellClick: (target: ModalTarget) => void
}

export function WeekScheduleByDay({
  weekDays, timeSlots, assignments, slotSettings, scheduleRules, dateOverrides,
  splitRoles = [], indicatorBarRoles = [], isSplitMode = false, hiddenRoleIds = EMPTY_SET,
  displayAssignmentFilter, withdrawnUserIds, canAdd = true, memberRoleId = null, onCellClick,
}: Props) {
  function barRoleFor(roleId: string | null): TenantRole | undefined {
    return roleId ? indicatorBarRoles.find(r => r.id === roleId) : undefined
  }
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const today = new Date()
  const todayColRef = useRef<HTMLTableCellElement>(null)

  useEffect(() => {
    todayColRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'nearest', inline: 'center' })
  }, [weekDays])

  function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  }

  function roleName(roleId: string | null): string | null {
    if (!isSplitMode || !roleId) return null
    return splitRoles.find(r => r.id === roleId)?.name ?? null
  }

  function toggleExpanded(key: string) {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-sm w-full table-fixed" style={{ minWidth: 640 }}>
        <thead>
          <tr>
            {weekDays.map((date, i) => {
              const dow = date.getDay()
              const holidayName = getKoreanHolidayName(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`)
              return (
                <th
                  key={i}
                  className={`border border-[var(--color-border-table)] px-2 py-1 text-xs font-semibold text-center
                    ${holidayName || dow === 0 ? 'text-red-500 bg-red-50/70 dark:bg-red-950/40'
                      : dow === 6 ? 'text-blue-500 bg-blue-50/70 dark:bg-blue-950/40'
                      : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'}`}
                >
                  {date.getDate()}일 ({DAY_LABELS[i]})
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          <tr>
            {weekDays.map((date, i) => {
              const isToday = isSameDay(date, today)
              const dow = date.getDay()
              const year = date.getFullYear()
              const month = date.getMonth() + 1
              const day = date.getDate()
              const key = `${year}-${month}-${day}`
              const holidayName = getKoreanHolidayName(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
              const allEntries = getDayAssignmentEntries(day, year, month, timeSlots, scheduleRules, slotSettings, dateOverrides, assignments, displayAssignmentFilter)
              const entries = isSplitMode
                ? allEntries.filter(e => !e.assignment.role_id || !hiddenRoleIds.has(e.assignment.role_id))
                : allEntries
              const isExpanded = expandedDays.has(key)
              const visibleEntries = isExpanded ? entries : entries.slice(0, MAX_VISIBLE)
              const hiddenCount = entries.length - visibleEntries.length
              const openSlots = canAdd
                ? timeSlots.filter(slot => {
                    const cs = getCellState(day, slot, year, month, scheduleRules, slotSettings, dateOverrides, assignments)
                    return !cs.isBreaktime && !cs.isClosed && !cs.isHoliday
                  })
                : []

              return (
                <td
                  key={i}
                  ref={isToday ? todayColRef : undefined}
                  className={`border border-[var(--color-border-table)] align-top px-1 py-1
                    ${holidayName || dow === 0 ? 'bg-red-50/50 dark:bg-red-950/30' : dow === 6 ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''}
                    ${isToday ? 'ring-2 ring-inset ring-[var(--color-brand-primary)]' : ''}`}
                  style={{ height: '12rem' }}
                >
                  {entries.length === 0 && openSlots.length === 0 ? (
                    <div className="text-[10px] text-[var(--color-text-muted)]">-</div>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {visibleEntries.map(({ timeSlot, assignment }) => {
                        const isWithdrawn = !!(assignment.user_id && withdrawnUserIds?.has(assignment.user_id)) || assignment.account_deleted
                        const rname = roleName(assignment.role_id)
                        const barRole = barRoleFor(assignment.role_id)
                        return (
                          <button
                            key={assignment.id}
                            onClick={() => onCellClick({ year, month, day, timeSlot, memberType: assignment.member_type, roleId: assignment.role_id })}
                            className="text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate bg-[var(--tint-brand)] text-[var(--tint-brand-ink)] hover:brightness-95"
                            style={barRole ? { borderLeft: `3px solid ${indicatorBarColorFor(barRole, indicatorBarRoles)}` } : undefined}
                            title={rangeSlotLabel(timeSlot)}
                          >
                            <span className="font-mono-num">{slotStartHourLabel(timeSlot)}</span>{' '}
                            {rname && <span className="opacity-70">[{rname}]</span>}{' '}
                            <span className={isWithdrawn ? 'line-through opacity-70' : ''}>{assignment.member_name}</span>
                            {assignment.is_locked && <LockIcon size={8} className="inline-block ml-0.5" />}
                          </button>
                        )
                      })}
                      {hiddenCount > 0 && (
                        <button onClick={() => toggleExpanded(key)} className="text-[10px] text-[var(--color-brand-primary)] font-medium text-left px-1">
                          +{hiddenCount}건 더
                        </button>
                      )}
                      {isExpanded && entries.length > MAX_VISIBLE && (
                        <button onClick={() => toggleExpanded(key)} className="text-[10px] text-[var(--color-text-muted)] text-left px-1">
                          접기
                        </button>
                      )}
                      {openSlots.length > 0 && (
                        <select
                          aria-label="스케줄 등록"
                          value=""
                          onChange={e => {
                            const slot = e.target.value
                            if (slot) onCellClick({ year, month, day, timeSlot: slot as TimeSlot, memberType: 'member', roleId: isSplitMode ? memberRoleId : undefined })
                          }}
                          className="text-[10px] leading-tight px-1 py-0.5 rounded border border-dashed border-[var(--color-border-strong)] text-[var(--color-text-muted)] bg-transparent hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] cursor-pointer"
                        >
                          <option value="">+ 등록</option>
                          {openSlots.map(slot => (
                            <option key={slot} value={slot}>{rangeSlotLabel(slot)}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </td>
              )
            })}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
