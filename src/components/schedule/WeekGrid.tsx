import { useRef, useEffect } from 'react'
import type { Assignment, SlotSetting, ScheduleRule, DateOverride, ModalTarget, Profile, TenantRole, TimeSlot, TenantAccessRole } from '../../types'
import { getCellState } from '../../utils/cellState'
import { shortSlotLabel, slotStartLabel, formatTimeSub } from '../../utils/timeSlots'
import { LockIcon } from '../icons/LockIcons'

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']
const INDICATOR_BAR_COLOR = 'var(--color-brand-primary)'
const EMPTY_SET: Set<string> = new Set()

const STRIPE_STYLE = {
  background: 'repeating-linear-gradient(135deg, transparent 0 6px, rgba(20,23,28,0.03) 6px 12px)',
} as const
const HOLIDAY_STRIPE = {
  background: 'var(--color-schedule-close)',
} as const


function EmptyOrLockHint({ isLocked }: { isLocked: boolean }) {
  if (isLocked) {
    return <LockIcon size={11} className="text-[var(--color-text-muted)]" />
  }
  return null
}

interface Props {
  weekDays: Date[]
  timeSlots: TimeSlot[]
  assignments: Assignment[]
  slotSettings: SlotSetting[]
  scheduleRules: ScheduleRule[]
  dateOverrides: DateOverride[]
  highlightName: string | null
  profile: Profile | null
  splitRoles?: TenantRole[]
  indicatorBarRoles?: TenantRole[]
  isSplitMode?: boolean
  hiddenRoleIds?: Set<string>
  slotLabels?: Record<string, string>
  selectedDay?: Date | null
  onDateHeaderClick?: (date: Date) => void
  onCellClick: (target: ModalTarget) => void
  memberRoleId?: string | null
  tenantRole?: TenantAccessRole | null
  teamLeaderUserIds?: Set<string>
  isPrivileged?: boolean
  displayAssignmentFilter?: (a: Assignment) => boolean
  withdrawnUserIds?: Set<string>
  highlightedSlots?: Set<string>
  canAdd?: boolean
  selectionRange?: { minDay: number; maxDay: number; minSlotIdx: number; maxSlotIdx: number; minColIdx: number; maxColIdx: number } | null
  copyRange?: { minDay: number; maxDay: number; minSlotIdx: number; maxSlotIdx: number; minColIdx: number; maxColIdx: number } | null
}

export function WeekGrid({
  weekDays, timeSlots, assignments, slotSettings, scheduleRules, dateOverrides,
  highlightName, splitRoles = [], indicatorBarRoles = [], isSplitMode = false, hiddenRoleIds = EMPTY_SET, slotLabels = {},
  selectedDay, onDateHeaderClick, onCellClick,
  memberRoleId, teamLeaderUserIds, isPrivileged = false, displayAssignmentFilter, withdrawnUserIds, highlightedSlots, canAdd = true,
  selectionRange, copyRange,
}: Props) {
  function inRange(d: number, si: number, ci: number, r: { minDay: number; maxDay: number; minSlotIdx: number; maxSlotIdx: number; minColIdx: number; maxColIdx: number }) {
    return d >= r.minDay && d <= r.maxDay && si >= r.minSlotIdx && si <= r.maxSlotIdx && ci >= r.minColIdx && ci <= r.maxColIdx
  }

  const pad2 = (n: number) => String(n).padStart(2, '0')
  const today = new Date()
  const todayColRef = useRef<HTMLButtonElement>(null)

  // 주간 뷰 진입 시 오늘 열이 화면에 보이도록 스크롤
  useEffect(() => {
    todayColRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'nearest', inline: 'center' })
  }, [weekDays])

  const activeRoles = isSplitMode && splitRoles.length > 0 ? splitRoles : []
  const visibleActiveRoles = activeRoles.length > 0
    ? (() => { const v = activeRoles.filter(r => !hiddenRoleIds.has(r.id)); return v.length > 0 ? v : activeRoles })()
    : activeRoles
  const isAdmin = isPrivileged
  const indicatorBarRoleIds = new Set(indicatorBarRoles.map(r => r.id))

  function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
  }

  const timeColW = 72
  const dayColMinW = visibleActiveRoles.length > 1 ? visibleActiveRoles.length * 52 : 64
  const minTotalW = timeColW + 7 * dayColMinW

  return (
    <div>
      <div className="overflow-x-auto -mx-1 framed:mx-0 rounded-xl border border-[var(--color-border)]">
      <div style={{ minWidth: minTotalW }}>

        {/* ── Day header row ── */}
        <div
          className="grid sticky top-0 z-10 bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]"
          style={{ gridTemplateColumns: `${timeColW}px repeat(7, 1fr)` }}
        >
          {/* Corner */}
          <div className="px-2 py-2 text-[9px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide border-r border-[var(--color-border)] flex items-center justify-center sticky left-0 z-20 bg-[var(--color-surface-secondary)]">
            시간
          </div>

          {weekDays.map((d, i) => {
            const isToday = isSameDay(d, today)
            const isSelected = selectedDay ? isSameDay(d, selectedDay) : false
            const dow = d.getDay()
            const isSat = dow === 6
            const isSun = dow === 0

            return (
              <button
                key={i}
                ref={isToday ? todayColRef : undefined}
                onClick={() => onDateHeaderClick?.(d)}
                className={`border-l border-[var(--color-border)] px-1 pt-1 pb-0.5 sm:pt-2 sm:pb-1 text-center transition-colors hover:bg-[var(--color-surface-hover)] ${
                  isSelected ? 'bg-[var(--color-brand-primary)]/8' : ''
                }`}
              >
                <div className={`text-[10px] font-semibold leading-none mb-0.5 text-center ${
                  isSun ? 'text-red-400' : isSat ? 'text-blue-400' : 'text-[var(--color-text-muted)]'
                }`}>
                  {DAY_LABELS[i]}
                </div>
                <div className={`text-base font-bold leading-none text-center ${
                  isToday ? 'text-[var(--color-brand-primary)]' :
                  isSun ? 'text-red-400' : isSat ? 'text-blue-400' : 'text-[var(--color-text-primary)]'
                }`}>
                  {d.getDate()}
                </div>

                {/* Role sub-headers */}
                {visibleActiveRoles.length > 0 && (
                  <div className="mt-1.5 grid overflow-hidden" style={{ gridTemplateColumns: `repeat(${visibleActiveRoles.length}, 1fr)` }}>
                    {visibleActiveRoles.map((role, ri) => (
                      <div
                        key={role.id}
                        className={`text-[8px] font-medium text-[var(--color-text-muted)] truncate py-0.5 min-w-0 ${
                          ri > 0 ? 'pl-1 border-l border-dashed border-[var(--color-border-strong)]' : ''
                        }`}
                        title={role.name}
                      >
                        {role.name}
                      </div>
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Time slot rows ── */}
        {timeSlots.map((slot, slotIdx) => {
          const [slotStartNum] = slot.split('-').map(Number)
          const isMoon = slotStartNum >= 20
          const isRowClosed = weekDays.every(d => {
            const cs = getCellState(d.getDate(), slot, d.getFullYear(), d.getMonth() + 1, scheduleRules, slotSettings, dateOverrides, assignments)
            return cs.isBreaktime || cs.isClosed || cs.isHoliday
          })
          return (
            <div
              key={slot}
              className={`grid border-t border-[var(--color-border)] ${isMoon ? 'bg-[oklch(0.99_0.005_280)]' : ''}`}
              style={{ gridTemplateColumns: `${timeColW}px repeat(7, 1fr)`, minHeight: isRowClosed ? 28 : 52 }}
            >
              {/* Time label */}
              <div className={`px-1 py-1 sm:px-1.5 sm:py-1.5 flex flex-col justify-center items-center text-center border-r border-[var(--color-border)] sticky left-0 z-[1] ${isMoon ? 'bg-[oklch(0.99_0.005_280)]' : 'bg-[var(--color-surface-secondary)]'}`}>
                <span className="text-[9px] font-medium text-[var(--color-text-secondary)] leading-snug break-all">
                  {slotLabels[slot] ?? (
                    <>
                      <span className="hidden sm:inline">{shortSlotLabel(slot)}</span>
                      <span className="sm:hidden">{slotStartLabel(slot)}</span>
                    </>
                  )}
                </span>
              </div>

              {/* 7 day cells */}
              {weekDays.map((d, di) => {
                const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate()
                const cs = getCellState(day, slot, y, m, scheduleRules, slotSettings, dateOverrides, assignments)
                const displayCs = displayAssignmentFilter
                  ? { ...cs, assignments: cs.assignments.filter(displayAssignmentFilter) }
                  : cs

                if (cs.isHoliday) {
                  return (
                    <div key={di}
                      className="border-l border-[var(--color-border)] flex items-center justify-center"
                      style={HOLIDAY_STRIPE}
                    >
                      <span className="text-[9px] text-[var(--color-text-muted)] font-medium">휴관</span>
                    </div>
                  )
                }

                if (cs.isBreaktime) {
                  return (
                    <div key={di}
                      className="border-l border-[var(--color-border)] flex items-center justify-center text-[9px] text-[var(--color-text-muted)]"
                      style={STRIPE_STYLE}
                    />
                  )
                }

                if (cs.isClosed) {
                  return (
                    <div key={di}
                      className="border-l border-[var(--color-border)] flex items-center justify-center text-[9px] text-[var(--color-text-muted)]"
                      style={STRIPE_STYLE}
                    >
                      ✕
                    </div>
                  )
                }

                // ── Split mode: role sub-columns ──
                if (activeRoles.length > 0) {
                  const hasBar = displayCs.assignments.some(a => a.role_id && indicatorBarRoleIds.has(a.role_id))
                  const hlKey = `${y}-${pad2(m)}-${pad2(day)}|${slot}`
                  const isSlotHighlighted = !displayCs.assignments.length && (highlightedSlots?.has(hlKey) ?? false)
                  return (
                    <div
                      key={di}
                      className="relative border-l border-[var(--color-border)] grid"
                      style={{ gridTemplateColumns: `repeat(${visibleActiveRoles.length}, 1fr)` }}
                    >
                      {isSlotHighlighted && (
                        <span className="absolute inset-[2px] rounded pointer-events-none z-20" style={{ border: '1px dashed oklch(0.72 0.16 80)' }} />
                      )}
                      {hasBar && (
                        <span className="absolute left-0 top-0 bottom-0 w-[3px] z-10 pointer-events-none" style={{ background: INDICATOR_BAR_COLOR }} />
                      )}
                      {visibleActiveRoles.map((role) => {
                        const ri = activeRoles.findIndex(r => r.id === role.id)
                        const roleAssigns = displayCs.assignments.filter(
                          a => a.role_id === role.id && !(a.user_id && teamLeaderUserIds?.has(a.user_id))
                        )
                        const canClick = isAdmin || memberRoleId === role.id
                        const tint = { bg: 'var(--tint-brand)', ink: 'var(--tint-brand-ink)' }

                        return (
                          <button
                            key={role.id}
                            disabled={!canClick}
                            onClick={() => {
                              if (!canClick) return
                              onCellClick({ year: y, month: m, day, timeSlot: slot, memberType: 'member', roleId: role.id })
                            }}
                            className={`relative flex flex-col items-center justify-center gap-0.5 p-0.5 sm:p-1 transition-colors ${
                              ri > 0 ? 'border-l border-dashed border-[var(--color-border-strong)]' : ''
                            } ${canClick ? (roleAssigns.length > 0 ? 'group hover:brightness-95' : 'group hover:bg-[var(--color-surface-hover)]') : 'cursor-default'}`}
                            style={{ background: roleAssigns.length > 0 ? tint.bg : undefined }}
                          >
                            {selectionRange && day && inRange(day, slotIdx, ri, selectionRange) && (
                              <div className="absolute inset-0 bg-blue-400/20 pointer-events-none z-10" />
                            )}
                            {copyRange && day && inRange(day, slotIdx, ri, copyRange) && (
                              <div className="absolute inset-0 border-2 border-dashed border-blue-500 pointer-events-none z-10" />
                            )}
                            {roleAssigns.length > 0 ? (
                              roleAssigns.map(a => {
                                const _hq = highlightName?.toLowerCase() ?? ''
                                const isHighlighted = !!(highlightName && (
                                  a.member_name.toLowerCase().includes(_hq) ||
                                  (a.note && a.note.toLowerCase().includes(_hq)) ||
                                  (a.customer_name && a.customer_name.toLowerCase().includes(_hq)) ||
                                  (a.customer_phone && a.customer_phone.includes(_hq)) ||
                                  (a.extra_data && Object.values(a.extra_data).some(v => String(v ?? '').toLowerCase().includes(_hq)))
                                ))
                                const timeLbl = a.time_sub ? formatTimeSub(a.time_sub) : null
                                const isWithdrawn = !!(a.user_id && withdrawnUserIds?.has(a.user_id)) || a.account_deleted
                                return (
                                  <div
                                    key={a.id}
                                    className="w-full rounded-md px-1 py-0.5 text-[8px] sm:text-[10px] font-semibold text-center"
                                    style={isHighlighted
                                      ? { background: '#fef08a', color: '#92400e' }
                                      : isWithdrawn
                                        ? { background: 'oklch(0.97 0.02 25)', color: 'oklch(0.55 0.16 25)', opacity: 0.85 }
                                        : { background: tint.bg, color: tint.ink }}
                                  >
                                    <span className="flex items-center justify-center gap-0.5 w-full">
                                      <span className="truncate min-w-0" style={isWithdrawn ? { textDecoration: 'line-through' } : undefined}>{a.extra_data?._nf ? (a.extra_data._cl ?? '') : a.member_name}</span>
                                      {a.is_locked && <LockIcon size={8} className="shrink-0" />}
                                    </span>
                                    {isWithdrawn && <span className="block text-[6px] sm:text-[8px] font-normal">삭제됨</span>}
                                    {timeLbl && <span className="block text-[6px] sm:text-[8px] font-normal opacity-60">{timeLbl}</span>}
                                  </div>
                                )
                              })
                            ) : canClick ? (
                              <EmptyOrLockHint isLocked={cs.isLocked} />
                            ) : null}
                          </button>
                        )
                      })}
                    </div>
                  )
                }

                // ── Non-split mode: single cell ──
                const hasBar = displayCs.assignments.some(a => a.role_id && indicatorBarRoleIds.has(a.role_id))
                const visibleAssigns = displayCs.assignments.filter(
                  a => a.member_type !== 'admin_note' && !(a.user_id && teamLeaderUserIds?.has(a.user_id)) && !indicatorBarRoleIds.has(a.role_id ?? '')
                )
                const baseTint = { bg: 'var(--tint-brand)', ink: 'var(--tint-brand-ink)' }
                const plusTint = { bg: 'var(--tint-plus)', ink: 'var(--tint-plus-ink)' }
                const isAllPlus = visibleAssigns.length > 0 && visibleAssigns.every(a => a.member_type === '50plus')
                const cellTint = isAllPlus ? plusTint : baseTint
                const hlKey = `${y}-${pad2(m)}-${pad2(day)}|${slot}`
                const isHighlighted = !visibleAssigns.length && (highlightedSlots?.has(hlKey) ?? false)


                return (
                  <button
                    key={di}
                    onClick={() => onCellClick({ year: y, month: m, day, timeSlot: slot, memberType: 'member' })}
                    className={`relative border-l border-[var(--color-border)] flex flex-col items-center justify-center gap-0.5 p-1 group transition-colors ${visibleAssigns.length > 0 ? 'hover:brightness-95' : 'hover:bg-[var(--color-surface-hover)]'}`}
                    style={{
                      background: visibleAssigns.length > 0 ? cellTint.bg : undefined,
                    }}
                  >
                    {isHighlighted && (
                      <span className="absolute inset-[2px] rounded pointer-events-none" style={{ border: '2px dashed var(--color-brand-primary)' }} />
                    )}
                    {hasBar && (
                      <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: INDICATOR_BAR_COLOR }} />
                    )}
                    {selectionRange && day && inRange(day, slotIdx, 0, selectionRange) && (
                      <div className="absolute inset-0 bg-blue-400/20 pointer-events-none z-10" />
                    )}
                    {copyRange && day && inRange(day, slotIdx, 0, copyRange) && (
                      <div className="absolute inset-0 border-2 border-dashed border-blue-500 pointer-events-none z-10" />
                    )}
                    {visibleAssigns.length > 0 ? (
                      visibleAssigns.map(a => {
                        const _hq = highlightName?.toLowerCase() ?? ''
                        const isHighlighted = !!(highlightName && (
                          a.member_name.toLowerCase().includes(_hq) ||
                          (a.note && a.note.toLowerCase().includes(_hq)) ||
                          (a.customer_name && a.customer_name.toLowerCase().includes(_hq)) ||
                          (a.customer_phone && a.customer_phone.includes(_hq)) ||
                          (a.extra_data && Object.values(a.extra_data).some(v => String(v ?? '').toLowerCase().includes(_hq)))
                        ))
                        const chipTint = a.member_type === '50plus' ? plusTint : baseTint
                        const timeLbl = a.time_sub ? formatTimeSub(a.time_sub) : null
                        const isWithdrawn = !!(a.user_id && withdrawnUserIds?.has(a.user_id)) || a.account_deleted
                        return (
                          <div
                            key={a.id}
                            className="w-full rounded-md px-1 py-0.5 text-[8px] sm:text-[10px] font-semibold text-center"
                            style={isHighlighted
                              ? { background: '#fef08a', color: '#92400e' }
                              : isWithdrawn
                                ? { background: 'oklch(0.97 0.02 25)', color: 'oklch(0.55 0.16 25)', opacity: 0.85 }
                                : { background: chipTint.bg, color: chipTint.ink }}
                          >
                            <span className="flex items-center justify-center gap-0.5 w-full">
                              <span className="truncate min-w-0" style={isWithdrawn ? { textDecoration: 'line-through' } : undefined}>{a.extra_data?._nf ? (a.extra_data._cl ?? '') : a.member_name}</span>
                              {a.is_locked && <LockIcon size={8} className="shrink-0" />}
                            </span>
                            {isWithdrawn && <span className="block text-[6px] sm:text-[8px] font-normal">삭제됨</span>}
                            {timeLbl && <span className="block text-[6px] sm:text-[8px] font-normal opacity-60">{timeLbl}</span>}
                          </div>
                        )
                      })
                    ) : canAdd ? (
                      <EmptyOrLockHint isLocked={cs.isLocked} />
                    ) : null}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
      </div>
    </div>
  )
}
