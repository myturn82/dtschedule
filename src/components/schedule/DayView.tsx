import type { Assignment, SlotSetting, ScheduleRule, DateOverride, ModalTarget, Profile, TenantRole, TimeSlot } from '../../types'
import { getCellState } from '../../utils/cellState'
import { parseSlotLabel } from '../../utils/timeSlots'
import { LockIcon } from '../icons/LockIcons'

const DAY_KR = ['일', '월', '화', '수', '목', '금', '토']

const BREAK_STRIPE = {
  background: 'repeating-linear-gradient(135deg, var(--color-surface-secondary) 0 7px, var(--color-surface-hover) 7px 14px)',
} as const

const HOLIDAY_STRIPE = {
  background: 'repeating-linear-gradient(135deg, transparent 0 8px, oklch(0.96 0.02 25 / 0.5) 8px 16px)',
  borderColor: 'oklch(0.88 0.04 25)',
} as const

interface Props {
  year: number
  month: number
  day: number
  timeSlots: TimeSlot[]
  assignments: Parameters<typeof getCellState>[7]
  slotSettings: SlotSetting[]
  scheduleRules: ScheduleRule[]
  dateOverrides: DateOverride[]
  profile: Profile | null
  splitRoles?: TenantRole[]
  isSplitMode?: boolean
  slotLabels?: Record<string, string>
  onCellClick: (target: ModalTarget) => void
  displayAssignmentFilter?: (a: Assignment) => boolean
  withdrawnUserIds?: Set<string>
}

function PersonChip({ a, withdrawnUserIds, onClick }: { a: Assignment; withdrawnUserIds?: Set<string>; onClick?: () => void }) {
  const isW = !!(a.user_id && withdrawnUserIds?.has(a.user_id)) || a.account_deleted
  const initial = a.member_name?.charAt(0) ?? '?'
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-[10px] self-start max-w-full bg-[var(--color-surface-secondary)] border border-[var(--color-border)] ${onClick ? 'cursor-pointer hover:border-[var(--color-brand-primary)] hover:bg-[var(--color-surface-hover)] transition-colors' : ''}`}
      onClick={onClick}
    >
      <span
        className="w-[26px] h-[26px] rounded-full flex-shrink-0 flex items-center justify-center text-[11.5px] font-bold"
        style={isW
          ? { background: 'oklch(0.97 0.02 25)', color: 'oklch(0.55 0.16 25)' }
          : { background: 'oklch(0.95 0.045 28)', color: 'oklch(0.45 0.14 28)' }
        }
      >
        {initial}
      </span>
      <span className={`text-sm font-semibold tracking-tight ${isW ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text-primary)]'}`}>
        {a.member_name}
      </span>
      {isW && (
        <span className="text-[10px] px-1.5 rounded" style={{ background: 'oklch(0.97 0.02 25)', color: 'oklch(0.55 0.16 25)' }}>
          삭제됨
        </span>
      )}
      {!isW && a.customer_phone && (
        <span className="text-xs text-[var(--color-text-muted)] truncate">· {a.customer_phone}</span>
      )}
      {!isW && a.note && (
        <span className="text-xs text-[var(--color-text-muted)] truncate">· {a.note}</span>
      )}
    </div>
  )
}

function AssignButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-[10px] w-full text-[13px] font-semibold border border-dashed border-[var(--color-border-strong)] text-[var(--color-text-muted)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] transition-colors"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" width="15" height="15">
        <path d="M12 5v14M5 12h14" />
      </svg>
      등록
    </button>
  )
}

export function DayView({
  year, month, day, timeSlots, assignments, slotSettings, scheduleRules, dateOverrides,
  profile: _profile, splitRoles = [], isSplitMode = false, slotLabels = {},
  onCellClick, displayAssignmentFilter, withdrawnUserIds,
}: Props) {
  const dow = new Date(year, month - 1, day).getDay()

  let totalAssigned = 0
  let totalOpen = 0
  timeSlots.forEach(slot => {
    const cs = getCellState(day, slot, year, month, scheduleRules, slotSettings, dateOverrides, assignments)
    if (cs.isBreaktime || cs.isClosed || cs.isHoliday) return
    const displayCs = displayAssignmentFilter
      ? { ...cs, assignments: cs.assignments.filter(displayAssignmentFilter) }
      : cs
    const vis = isSplitMode ? displayCs.assignments : displayCs.assignments.filter(a => a.member_type !== 'admin_note')
    totalAssigned += vis.length
    totalOpen += Math.max(0, cs.maxCapacity - vis.length)
  })

  const allClosed = timeSlots.every(slot => {
    const cs = getCellState(day, slot, year, month, scheduleRules, slotSettings, dateOverrides, assignments)
    return cs.isBreaktime || cs.isClosed || cs.isHoliday
  })

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-baseline justify-between px-1 pb-1 flex-wrap gap-2">
        <h2 className="text-[15px] font-bold text-[var(--color-text-secondary)] tracking-tight">
          {month}월 {day}일 ({DAY_KR[dow]}요일)
        </h2>
        <span className="text-xs font-semibold text-[var(--color-text-muted)] flex items-center gap-1 shrink-0">
          배정 <b style={{ color: 'oklch(0.45 0.14 28)' }}>{totalAssigned}</b> · 빈자리 {totalOpen}
        </span>
      </div>

      {allClosed && (
        <p className="text-sm text-[var(--color-text-muted)] text-center py-10">이날 운영하는 시간대가 없습니다.</p>
      )}

      <div className="flex flex-col gap-3">
        {timeSlots.map(slot => {
          const cs = getCellState(day, slot, year, month, scheduleRules, slotSettings, dateOverrides, assignments)
          const displayCs = displayAssignmentFilter
            ? { ...cs, assignments: cs.assignments.filter(displayAssignmentFilter) }
            : cs
          const timeLabel = parseSlotLabel(slot)
          const customLabel = slotLabels[slot] ?? null
          const visible = isSplitMode
            ? displayCs.assignments
            : displayCs.assignments.filter(a => a.member_type !== 'admin_note')

          if (cs.isBreaktime || cs.isClosed) {
            return (
              <div key={slot} className="rounded-[18px] border border-[var(--color-border)] overflow-hidden" style={BREAK_STRIPE}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <span className="text-sm font-bold font-mono text-[var(--color-text-muted)]">{timeLabel}</span>
                  {customLabel && <span className="text-xs text-[var(--color-text-muted)]">{customLabel}</span>}
                  <span className="text-[10px] font-bold bg-[var(--color-surface)] border border-[var(--color-border)] px-2.5 py-0.5 rounded-full text-[var(--color-text-muted)]">
                    휴게
                  </span>
                </div>
              </div>
            )
          }

          if (cs.isHoliday) {
            return (
              <div key={slot} className="rounded-[18px] overflow-hidden border" style={HOLIDAY_STRIPE}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <span className="text-sm font-bold font-mono" style={{ color: 'oklch(0.65 0.12 25)' }}>{timeLabel}</span>
                  {customLabel && <span className="text-xs" style={{ color: 'oklch(0.65 0.12 25)' }}>{customLabel}</span>}
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: 'oklch(0.97 0.02 25)', color: 'oklch(0.55 0.16 25)' }}>
                    휴관
                  </span>
                </div>
              </div>
            )
          }

          const isFull = cs.isFull
          const capacityCount = visible.length

          return (
            <div key={slot} className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden" style={{ boxShadow: '0 1px 0 rgba(20,23,28,0.02), 0 6px 16px -12px rgba(20,23,28,0.18)' }}>
              {/* Slot header */}
              <div className="flex items-center gap-3 px-4 py-3.5">
                <span className="text-[15.5px] font-bold tracking-tight font-mono text-[var(--color-text-primary)]">
                  {timeLabel}
                </span>
                {customLabel && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border)] whitespace-nowrap">
                    {customLabel}
                  </span>
                )}
                {cs.isLocked && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] border border-[var(--color-border)] whitespace-nowrap">
                    <LockIcon size={10} />
                    고정
                  </span>
                )}
                <span className="ml-auto flex-shrink-0 text-xs font-bold px-3 py-1 rounded-full bg-[var(--color-surface-secondary)] border border-[var(--color-border)] whitespace-nowrap">
                  <b style={isFull ? { color: 'oklch(0.56 0.11 150)' } : { color: 'var(--color-text-primary)' }}>
                    {capacityCount}
                  </b>
                  <span className="text-[var(--color-text-secondary)]">/{cs.maxCapacity}명</span>
                </span>
              </div>

              {/* Slot body */}
              {isSplitMode && splitRoles.length > 0 ? (
                <div
                  className="border-t border-[var(--color-border)] grid"
                  style={{
                    gridTemplateColumns: `repeat(${Math.min(splitRoles.length, 2)}, 1fr)`,
                    gap: '1px',
                    background: 'var(--color-border)',
                  }}
                >
                  {splitRoles.map(role => {
                    const roleAssigns = visible.filter(a => a.role_id === role.id)
                    return (
                      <div key={role.id} className="p-4 flex flex-col gap-2 min-w-0 bg-[var(--color-surface)]">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                          {role.name}
                        </span>
                        {roleAssigns.map(a => (
                          <PersonChip key={a.id} a={a} withdrawnUserIds={withdrawnUserIds} onClick={() => onCellClick({ year, month, day, timeSlot: slot, memberType: 'member', roleId: role.id })} />
                        ))}
                        <AssignButton onClick={() => onCellClick({ year, month, day, timeSlot: slot, memberType: 'member', roleId: role.id })} />
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="border-t border-[var(--color-border)] p-4 flex flex-col gap-2">
                  {visible.map(a => (
                    <PersonChip key={a.id} a={a} withdrawnUserIds={withdrawnUserIds} onClick={() => onCellClick({ year, month, day, timeSlot: slot, memberType: 'member' })} />
                  ))}
                  <AssignButton onClick={() => onCellClick({ year, month, day, timeSlot: slot, memberType: 'member' })} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
