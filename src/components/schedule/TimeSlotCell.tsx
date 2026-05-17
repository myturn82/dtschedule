import type { Assignment, CellState } from '../../types'

interface Props {
  cellState: CellState
  timeSlot: string
  colType: 'vol' | 'plus' | 'role'
  onClick: () => void
  highlightName: string | null
  teamLeaderUserIds?: Set<string>
  roleId?: string | null
}

function getSlotHours(timeSlot: string): number[] {
  const [start, end] = timeSlot.split('-').map(Number)
  if (end - start !== 2) return []
  return [start, start + 1]
}

function assignmentCoversHour(timeSub: string | null, hour: number): boolean {
  if (!timeSub) return true
  if (timeSub.includes('~')) {
    const [s, e] = timeSub.split('~').map(Number)
    return hour >= s && hour <= e
  }
  return Number(timeSub) === hour
}

// Determine tint based on volunteer_type and time slot
function resolveTint(colType: 'vol' | 'plus' | 'role', slotStart: number): { bg: string; ink: string } {
  if (colType === 'plus') return { bg: 'var(--tint-plus)', ink: 'var(--tint-plus-ink)' }
  if (slotStart >= 20)    return { bg: 'var(--tint-moon)', ink: 'var(--tint-moon-ink)' }
  return { bg: 'var(--tint-sun)', ink: 'var(--tint-sun-ink)' }
}

// Striped closed-cell pattern matching design
const STRIPE_STYLE = {
  background: 'repeating-linear-gradient(135deg, transparent 0 6px, rgba(20,23,28,0.03) 6px 12px)',
} as const
const HOLIDAY_STRIPE_STYLE = {
  background: 'repeating-linear-gradient(135deg, transparent 0 8px, oklch(0.96 0.02 25 / 0.6) 8px 16px)',
} as const

function NameChips({ assignments, highlightName, tintBg, tintInk, teamLeaderUserIds, small }: {
  assignments: Assignment[]
  highlightName: string | null
  tintBg: string
  tintInk: string
  teamLeaderUserIds?: Set<string>
  small?: boolean
}) {
  const visible = assignments.filter(a => !teamLeaderUserIds?.has(a.user_id))
  if (!visible.length) return null
  const textSize = small ? 'text-[6px] sm:text-[9px]' : 'text-[8px] sm:text-[11px]'
  return (
    <div className="flex flex-col gap-0.5 w-full px-0.5">
      {visible.map(a => {
        const isHighlighted = !!(highlightName && a.volunteer_name.includes(highlightName))
        const displayText = a.note ? `${a.volunteer_name}(${a.note})` : a.volunteer_name
        return (
          <div
            key={a.id}
            className={`rounded-[6px] px-1.5 py-0.5 leading-tight ${textSize} font-semibold w-full truncate`}
            style={isHighlighted
              ? { background: '#fef08a', color: '#92400e' }
              : { background: tintBg, color: tintInk }}
          >
            {displayText}
            {a.customer_name && (
              <span className={`block ${small ? 'text-[5px]' : 'text-[6px] sm:text-[8px]'} font-normal opacity-70 truncate`}>
                {a.customer_name}{a.customer_phone ? ` · ${a.customer_phone}` : ''}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function EmptyHint() {
  return (
    <span className="text-[var(--color-border-strong)] group-hover:text-[var(--color-brand-primary)] text-lg leading-none transition-colors duration-150 select-none">
      +
    </span>
  )
}

export function TimeSlotCell({ cellState, timeSlot, colType, onClick, highlightName, teamLeaderUserIds, roleId }: Props) {
  const { isBreaktime, isClosed, isHoliday, isSaturdayShift, assignments, isFull } = cellState
  const [slotStart, slotEnd] = timeSlot.split('-').map(Number)
  const cellMinH = slotEnd - slotStart === 1
    ? 'min-h-[1.25rem] sm:min-h-[1.75rem]'
    : 'min-h-[2rem] sm:min-h-[2.5rem]'

  const tint = resolveTint(isSaturdayShift ? 'vol' : colType, slotStart)
  const satTint = { bg: 'var(--tint-sat)', ink: 'var(--tint-sat-ink)' }
  const effectiveTint = isSaturdayShift ? satTint : tint

  // ── CLOSE states ─────────────────────────────────────────────────────────────
  if (isBreaktime) {
    if (colType === 'plus') return <div className={`h-full ${cellMinH}`} style={STRIPE_STYLE} />
    return (
      <div className={`h-full ${cellMinH} flex items-center justify-center`} style={STRIPE_STYLE}>
        <span className="sm:hidden text-[8px] text-[var(--color-text-muted)] font-medium">✕</span>
        <span className="hidden sm:inline text-[9px] text-[var(--color-text-muted)] font-medium tracking-wide">CLOSE</span>
      </div>
    )
  }

  if (isHoliday) {
    if (colType === 'plus') return <div className={`h-full ${cellMinH}`} style={HOLIDAY_STRIPE_STYLE} />
    return (
      <div className={`h-full ${cellMinH} flex items-center justify-center`} style={HOLIDAY_STRIPE_STYLE}>
        <span className="text-[9px] font-medium" style={{ color: 'oklch(0.55 0.16 25)' }}>휴관</span>
      </div>
    )
  }

  if (isClosed) {
    if (colType === 'plus') return <div className={`h-full ${cellMinH}`} style={STRIPE_STYLE} />
    return (
      <div className={`h-full ${cellMinH} flex items-center justify-center`} style={STRIPE_STYLE}>
        <span className="sm:hidden text-[8px] text-[var(--color-text-muted)] font-medium">✕</span>
        <span className="hidden sm:inline text-[9px] text-[var(--color-text-muted)] font-medium tracking-wide">CLOSE</span>
      </div>
    )
  }

  const slotHours = getSlotHours(timeSlot)

  // ── role column (split mode) ─────────────────────────────────────────────────
  if (colType === 'role') {
    const roleAssignments = assignments.filter(a => a.role_id === roleId)
    const hasAssignments = roleAssignments.length > 0
    const shouldSplitRole = slotHours.length === 2 && roleAssignments.some(a => a.time_sub && !a.time_sub.includes('~'))

    if (shouldSplitRole) {
      return (
        <div className="flex flex-col divide-y divide-[var(--color-border-table)] h-full">
          {slotHours.map(hour => {
            const hourA = roleAssignments.filter(a => assignmentCoversHour(a.time_sub, hour))
            return (
              <button key={hour} onClick={onClick}
                className="flex-1 min-h-[1rem] flex flex-col items-center justify-center transition-all duration-150 active:scale-[0.98] group"
                style={{ background: hourA.length ? tint.bg : 'var(--color-surface)' }}
              >
                {hourA.length
                  ? <NameChips assignments={hourA} highlightName={highlightName} tintBg={tint.bg} tintInk={tint.ink} teamLeaderUserIds={teamLeaderUserIds} />
                  : <EmptyHint />
                }
              </button>
            )
          })}
        </div>
      )
    }

    return (
      <button onClick={onClick}
        className={`w-full ${cellMinH} flex flex-col items-center justify-center transition-all duration-150 active:scale-[0.98] group`}
        style={{ background: hasAssignments ? tint.bg : 'var(--color-surface)' }}
      >
        {hasAssignments
          ? <>
              <NameChips assignments={roleAssignments} highlightName={highlightName} tintBg={tint.bg} tintInk={tint.ink} teamLeaderUserIds={teamLeaderUserIds} />
              {isFull && <span className="text-[7px] sm:text-[9px] font-semibold mt-0.5 px-1.5 py-0.5 rounded-full" style={{ background: 'oklch(0.97 0.02 25)', color: 'oklch(0.55 0.16 25)' }}>마감</span>}
            </>
          : <EmptyHint />
        }
      </button>
    )
  }

  // ── legacy vol / plus columns ────────────────────────────────────────────────
  const volunteerAssignments = assignments.filter(a => !a.volunteer_type || a.volunteer_type === 'volunteer')
  const plusAssignments = assignments.filter(a => a.volunteer_type === '50plus')
  const saturdayAssignments = isSaturdayShift ? [...volunteerAssignments, ...plusAssignments] : volunteerAssignments
  const hasTeamLeaderInVol = !!(teamLeaderUserIds && volunteerAssignments.some(a => teamLeaderUserIds.has(a.user_id)))

  const teamLeaderTint = { bg: 'oklch(0.95 0.07 85)', ink: 'oklch(0.42 0.12 80)' }

  if (colType === 'vol') {
    const activeTint = hasTeamLeaderInVol ? teamLeaderTint : effectiveTint
    const hasAssign = saturdayAssignments.filter(a => !teamLeaderUserIds?.has(a.user_id)).length > 0
    const shouldSplit = slotHours.length === 2 && saturdayAssignments.some(a => a.time_sub && !a.time_sub.includes('~'))

    if (shouldSplit) {
      return (
        <div className="flex flex-col divide-y divide-[var(--color-border-table)] h-full">
          {slotHours.map(hour => {
            const hourVol = saturdayAssignments.filter(a => assignmentCoversHour(a.time_sub, hour))
            const hourHasLeader = !!(teamLeaderUserIds && hourVol.some(a => teamLeaderUserIds.has(a.user_id)))
            const hourTint = hourHasLeader ? teamLeaderTint : effectiveTint
            const hourVisible = hourVol.filter(a => !teamLeaderUserIds?.has(a.user_id))
            return (
              <button key={hour} onClick={onClick}
                className="flex-1 min-h-[1rem] flex flex-col items-center justify-center transition-all duration-150 active:scale-[0.98] group"
                style={{ background: hourVisible.length ? hourTint.bg : 'var(--color-surface)' }}
              >
                {hourVisible.length
                  ? <NameChips assignments={hourVol} highlightName={highlightName} tintBg={hourTint.bg} tintInk={hourTint.ink} teamLeaderUserIds={teamLeaderUserIds} />
                  : <EmptyHint />
                }
              </button>
            )
          })}
        </div>
      )
    }

    return (
      <button onClick={onClick}
        className={`w-full ${cellMinH} flex flex-col items-center justify-center transition-all duration-150 active:scale-[0.98] group`}
        style={{ background: hasAssign ? activeTint.bg : 'var(--color-surface)' }}
      >
        {hasAssign
          ? <>
              <NameChips assignments={saturdayAssignments} highlightName={highlightName} tintBg={activeTint.bg} tintInk={activeTint.ink} teamLeaderUserIds={teamLeaderUserIds} />
              {isFull && <span className="text-[7px] sm:text-[9px] font-semibold mt-0.5 px-1.5 py-0.5 rounded-full" style={{ background: 'oklch(0.97 0.02 25)', color: 'oklch(0.55 0.16 25)' }}>마감</span>}
            </>
          : <EmptyHint />
        }
      </button>
    )
  }

  // colType === 'plus'
  const plusTint = { bg: 'var(--tint-plus)', ink: 'var(--tint-plus-ink)' }
  const hasPlusAssign = plusAssignments.length > 0
  const shouldSplitPlus = slotHours.length === 2 && plusAssignments.some(a => a.time_sub && !a.time_sub.includes('~'))

  if (shouldSplitPlus) {
    return (
      <div className="flex flex-col divide-y divide-[var(--color-border-table)] h-full">
        {slotHours.map(hour => {
          const hourPlus = plusAssignments.filter(a => assignmentCoversHour(a.time_sub, hour))
          return (
            <button key={hour} onClick={onClick}
              className="flex-1 min-h-[1rem] flex flex-col items-center justify-center transition-all duration-150 active:scale-[0.98] group"
              style={{ background: hourPlus.length ? plusTint.bg : 'var(--color-surface)' }}
            >
              {hourPlus.length
                ? <NameChips assignments={hourPlus} highlightName={highlightName} tintBg={plusTint.bg} tintInk={plusTint.ink} teamLeaderUserIds={teamLeaderUserIds} small />
                : <EmptyHint />
              }
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <button onClick={onClick}
      className={`w-full ${cellMinH} flex flex-col items-center justify-center transition-all duration-150 active:scale-[0.98] group`}
      style={{ background: hasPlusAssign ? plusTint.bg : 'var(--color-surface)' }}
    >
      {hasPlusAssign
        ? <NameChips assignments={plusAssignments} highlightName={highlightName} tintBg={plusTint.bg} tintInk={plusTint.ink} teamLeaderUserIds={teamLeaderUserIds} small />
        : <EmptyHint />
      }
    </button>
  )
}
