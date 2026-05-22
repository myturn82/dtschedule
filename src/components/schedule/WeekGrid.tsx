import type { Assignment, SlotSetting, ScheduleRule, DateOverride, ModalTarget, Profile, TenantRole, TimeSlot, TenantAccessRole } from '../../types'
import { getCellState } from '../../utils/cellState'
import { parseSlotLabel } from '../../utils/timeSlots'

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

const STRIPE_STYLE = {
  background: 'repeating-linear-gradient(135deg, transparent 0 6px, rgba(20,23,28,0.03) 6px 12px)',
} as const
const HOLIDAY_STRIPE = {
  background: 'repeating-linear-gradient(135deg, transparent 0 8px, oklch(0.96 0.02 25 / 0.6) 8px 16px)',
} as const

const ROLE_TINTS = [
  { bg: 'var(--tint-sun)',  ink: 'var(--tint-sun-ink)' },
  { bg: 'var(--tint-plus)', ink: 'var(--tint-plus-ink)' },
  { bg: 'var(--tint-moon)', ink: 'var(--tint-moon-ink)' },
]

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
  isSplitMode?: boolean
  slotLabels?: Record<string, string>
  selectedDay?: Date | null
  onDateHeaderClick?: (date: Date) => void
  onCellClick: (target: ModalTarget) => void
  memberRoleId?: string | null
  tenantRole?: TenantAccessRole | null
  teamLeaderUserIds?: Set<string>
  isPrivileged?: boolean
}

export function WeekGrid({
  weekDays, timeSlots, assignments, slotSettings, scheduleRules, dateOverrides,
  highlightName, splitRoles = [], isSplitMode = false, slotLabels = {},
  selectedDay, onDateHeaderClick, onCellClick,
  memberRoleId, teamLeaderUserIds, isPrivileged = false,
}: Props) {
  const today = new Date()
  const activeRoles = isSplitMode && splitRoles.length > 0 ? splitRoles : []
  const isAdmin = isPrivileged

  function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
  }

  const timeColW = 68
  const dayColMinW = activeRoles.length > 1 ? activeRoles.length * 52 : 64
  const minTotalW = timeColW + 7 * dayColMinW

  return (
    <div className="overflow-x-auto -mx-1 sm:mx-0 rounded-xl border border-[var(--color-border)]">
      <div style={{ minWidth: minTotalW }}>

        {/* ── Day header row ── */}
        <div
          className="grid sticky top-0 z-10 bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]"
          style={{ gridTemplateColumns: `${timeColW}px repeat(7, 1fr)` }}
        >
          {/* Corner */}
          <div className="px-2 py-2 text-[9px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide border-r border-[var(--color-border)] flex items-end">
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
                onClick={() => onDateHeaderClick?.(d)}
                className={`border-l border-[var(--color-border)] px-1.5 pt-2 pb-1 text-left transition-colors hover:bg-[var(--color-surface-hover)] ${
                  isSelected ? 'bg-[var(--color-brand-primary)]/8' : ''
                }`}
              >
                <div className={`text-[10px] font-semibold leading-none mb-0.5 ${
                  isSun ? 'text-red-400' : isSat ? 'text-blue-400' : 'text-[var(--color-text-muted)]'
                }`}>
                  {DAY_LABELS[i]}
                </div>
                <div className={`text-base font-bold leading-none ${
                  isToday ? 'text-[var(--color-brand-primary)]' :
                  isSun ? 'text-red-400' : isSat ? 'text-blue-400' : 'text-[var(--color-text-primary)]'
                }`}>
                  {d.getDate()}
                </div>

                {/* Role sub-headers */}
                {activeRoles.length > 0 && (
                  <div className="mt-1.5 grid" style={{ gridTemplateColumns: `repeat(${activeRoles.length}, 1fr)` }}>
                    {activeRoles.map((role, ri) => (
                      <div
                        key={role.id}
                        className={`text-[8px] font-medium text-[var(--color-text-muted)] truncate py-0.5 ${
                          ri > 0 ? 'pl-1 border-l border-dashed border-[var(--color-border-strong)]' : ''
                        }`}
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
        {timeSlots.map(slot => {
          const [slotStartNum] = slot.split('-').map(Number)
          const isMoon = slotStartNum >= 20
          const slotLabel = slotLabels[slot] || parseSlotLabel(slot)

          return (
            <div
              key={slot}
              className={`grid border-t border-[var(--color-border)] ${isMoon ? 'bg-[oklch(0.99_0.005_280)]' : ''}`}
              style={{ gridTemplateColumns: `${timeColW}px repeat(7, 1fr)`, minHeight: 52 }}
            >
              {/* Time label */}
              <div className="px-2 py-1.5 flex flex-col justify-center border-r border-[var(--color-border)]">
                <span className="text-[10px] font-medium text-[var(--color-text-secondary)] leading-snug whitespace-nowrap">
                  {slotLabel}
                </span>
              </div>

              {/* 7 day cells */}
              {weekDays.map((d, di) => {
                const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate()
                const cs = getCellState(day, slot, y, m, scheduleRules, slotSettings, dateOverrides, assignments)

                if (cs.isHoliday) {
                  return (
                    <div key={di}
                      className="border-l border-[var(--color-border)] flex items-center justify-center"
                      style={HOLIDAY_STRIPE}
                    >
                      <span className="text-[9px] font-medium" style={{ color: 'oklch(0.55 0.16 25)' }}>휴관</span>
                    </div>
                  )
                }

                if (cs.isBreaktime || cs.isClosed) {
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
                  return (
                    <div
                      key={di}
                      className="border-l border-[var(--color-border)] grid"
                      style={{ gridTemplateColumns: `repeat(${activeRoles.length}, 1fr)` }}
                    >
                      {activeRoles.map((role, ri) => {
                        const roleAssigns = cs.assignments.filter(
                          a => a.role_id === role.id && !teamLeaderUserIds?.has(a.user_id)
                        )
                        const canClick = isAdmin || memberRoleId === role.id
                        const tint = ROLE_TINTS[ri % ROLE_TINTS.length]

                        return (
                          <button
                            key={role.id}
                            disabled={!canClick}
                            onClick={() => {
                              if (!canClick) return
                              onCellClick({ year: y, month: m, day, timeSlot: slot, volunteerType: 'volunteer', roleId: role.id })
                            }}
                            className={`flex flex-col items-center justify-center gap-0.5 p-1 transition-colors ${
                              ri > 0 ? 'border-l border-dashed border-[var(--color-border-strong)]' : ''
                            } ${canClick ? 'group hover:bg-[var(--color-surface-hover)]' : 'cursor-default'}`}
                          >
                            {roleAssigns.length > 0 ? (
                              roleAssigns.map(a => {
                                const isHighlighted = !!(highlightName && a.volunteer_name.includes(highlightName))
                                return (
                                  <div
                                    key={a.id}
                                    className="w-full rounded-md px-1 py-0.5 text-[8px] sm:text-[10px] font-semibold text-center truncate"
                                    style={isHighlighted
                                      ? { background: '#fef08a', color: '#92400e' }
                                      : { background: tint.bg, color: tint.ink }}
                                  >
                                    {a.volunteer_name}
                                  </div>
                                )
                              })
                            ) : canClick ? (
                              <span className="text-base leading-none text-[var(--color-border-strong)] group-hover:text-[var(--color-brand-primary)] transition-colors select-none">+</span>
                            ) : null}
                          </button>
                        )
                      })}
                    </div>
                  )
                }

                // ── Non-split mode: single cell ──
                const visibleAssigns = cs.assignments.filter(
                  a => a.volunteer_type !== 'admin_note' && !teamLeaderUserIds?.has(a.user_id)
                )
                const tint = isMoon
                  ? { bg: 'var(--tint-moon)', ink: 'var(--tint-moon-ink)' }
                  : { bg: 'var(--tint-sun)',  ink: 'var(--tint-sun-ink)' }

                return (
                  <button
                    key={di}
                    onClick={() => onCellClick({ year: y, month: m, day, timeSlot: slot, volunteerType: 'volunteer' })}
                    className="border-l border-[var(--color-border)] flex flex-col items-center justify-center gap-0.5 p-1 group hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    {visibleAssigns.length > 0 ? (
                      visibleAssigns.map(a => {
                        const isHighlighted = !!(highlightName && a.volunteer_name.includes(highlightName))
                        return (
                          <div
                            key={a.id}
                            className="w-full rounded-md px-1 py-0.5 text-[8px] sm:text-[10px] font-semibold text-center truncate"
                            style={isHighlighted
                              ? { background: '#fef08a', color: '#92400e' }
                              : { background: tint.bg, color: tint.ink }}
                          >
                            {a.volunteer_name}
                          </div>
                        )
                      })
                    ) : (
                      <span className="text-base leading-none text-[var(--color-border-strong)] group-hover:text-[var(--color-brand-primary)] transition-colors select-none">+</span>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
