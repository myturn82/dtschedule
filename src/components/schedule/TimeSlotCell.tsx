import type { Assignment, CellState, TenantRole } from '../../types'
import { fmtPhone, maskPhone } from '../../lib/format'
import { formatTimeSub } from '../../utils/timeSlots'
import { LockIcon } from '../icons/LockIcons'
import { INDICATOR_BAR_COLOR, indicatorBarColorFor } from '../../utils/indicatorBarColors'
import { isAssignmentHighlighted } from '../../utils/highlightMatch'

interface Props {
  cellState: CellState
  timeSlot: string
  colType: 'vol' | 'plus' | 'role'
  onClick: () => void
  highlightName: string | null
  teamLeaderUserIds?: Set<string>
  roleId?: string | null
  indicatorBarRoles?: TenantRole[]
  canInteract?: boolean
  onIndicatorBarClick?: () => void
  withdrawnUserIds?: Set<string>
  highlighted?: boolean
  isAdmin?: boolean
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

// Determine tint based on member_type — 배정된 일반 셀은 조직 포인트 컬러를 반영
function resolveTint(colType: 'vol' | 'plus' | 'role', _slotStart: number): { bg: string; ink: string } {
  if (colType === 'plus') return { bg: 'var(--tint-plus)', ink: 'var(--tint-plus-ink)' }
  return { bg: 'var(--tint-brand)', ink: 'var(--tint-brand-ink)' }
}

// Striped closed-cell pattern matching design
const STRIPE_STYLE = {
  background: 'repeating-linear-gradient(135deg, transparent 0 6px, rgba(20,23,28,0.03) 6px 12px)',
} as const
const HOLIDAY_STRIPE_STYLE = {
  background: 'repeating-linear-gradient(135deg, transparent 0 8px, oklch(0.96 0.02 25 / 0.6) 8px 16px)',
} as const

function NameChips({ assignments, highlightName, tintBg, tintInk, teamLeaderUserIds, small, showTimeSub, withdrawnUserIds, isAdmin }: {
  assignments: Assignment[]
  highlightName: string | null
  tintBg: string
  tintInk: string
  teamLeaderUserIds?: Set<string>
  small?: boolean
  showTimeSub?: boolean
  withdrawnUserIds?: Set<string>
  isAdmin?: boolean
}) {
  const visible = assignments.filter(a => !(a.user_id && teamLeaderUserIds?.has(a.user_id ?? '')))
  if (!visible.length) return null
  const textSize = small ? 'text-[6px] sm:text-[9px]' : 'text-[8px] sm:text-[11px]'
  const subSize = small ? 'text-[5px]' : 'text-[6px] sm:text-[8px]'
  return (
    <div className="flex flex-col gap-0.5 w-full px-0.5">
      {visible.map(a => {
        const isHighlighted = isAssignmentHighlighted(a, highlightName)
        const isWithdrawn = !!(a.user_id && withdrawnUserIds?.has(a.user_id)) || a.account_deleted
        const nameLabel = a.extra_data?._nf ? (a.extra_data._cl ?? '') : a.member_name
        const displayText = a.note ? `${nameLabel}(${a.note})` : nameLabel
        const timeLabel = showTimeSub && a.time_sub ? formatTimeSub(a.time_sub) : null
        return (
          <div
            key={a.id}
            className={`rounded-[6px] px-1.5 py-0.5 leading-tight ${textSize} font-semibold w-full truncate text-center`}
            style={isHighlighted
              ? { background: '#fef08a', color: '#92400e' }
              : isWithdrawn
                ? { background: 'oklch(0.97 0.02 25)', color: 'oklch(0.55 0.16 25)', opacity: 0.85 }
                : { background: tintBg, color: tintInk }}
          >
            <span style={isWithdrawn ? { textDecoration: 'line-through' } : undefined}>{displayText}</span>
            {a.is_locked && <span title="고정됨" className="inline-flex items-center"><LockIcon size={9} className="ml-0.5" /></span>}
            {isWithdrawn && <span className={`block ${subSize} font-normal`}>삭제됨</span>}
            {timeLabel && (
              <span className={`block ${subSize} font-normal opacity-60`}>{timeLabel}</span>
            )}
            {a.customer_name && (
              <span className={`block ${subSize} font-normal opacity-70 truncate`}>
                {a.customer_name}{a.customer_phone ? ` · ${isAdmin ? fmtPhone(a.customer_phone) : maskPhone(a.customer_phone)}` : ''}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function EmptyHint() {
  return null
}

function EmptyOrLockHint({ isLocked }: { isLocked: boolean }) {
  if (isLocked) {
    return <LockIcon size={11} className="text-[var(--color-text-muted)]" />
  }
  return <EmptyHint />
}

export function TimeSlotCell({ cellState, timeSlot, colType, onClick, highlightName, teamLeaderUserIds, roleId, indicatorBarRoles, canInteract = true, onIndicatorBarClick, withdrawnUserIds, highlighted = false, isAdmin }: Props) {
  const { isBreaktime, isClosed, isHoliday, isSaturdayShift, isLocked, assignments, isFull } = cellState
  const [slotStart, slotEnd] = timeSlot.split('-').map(Number)
  const cellMinH = slotEnd - slotStart === 1
    ? 'min-h-[1.25rem] sm:min-h-[1.75rem]'
    : 'min-h-[2rem] sm:min-h-[2.5rem]'

  // 토요일도 평일과 동일한 배경색을 사용한다 (isSaturdayShift는 plus 회원 병합 표시에만 사용)
  const tint = resolveTint(colType, slotStart)
  const effectiveTint = tint

  // ── CLOSE states ─────────────────────────────────────────────────────────────
  if (isBreaktime) {
    if (colType === 'plus') return <div className={`h-full ${cellMinH}`} style={STRIPE_STYLE} />
    return <div className={`h-full ${cellMinH}`} style={STRIPE_STYLE} />
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
    return <div className={`h-full ${cellMinH}`} style={STRIPE_STYLE} />
  }

  const slotHours = getSlotHours(timeSlot)

  // indicator_bar 역할 배정 감지 (colType 무관하게 공통 계산)
  const indicatorBarUserIds = new Set(
    (indicatorBarRoles ?? []).flatMap(role =>
      assignments.filter(a => a.role_id === role.id).map(a => a.user_id)
    )
  )
  const hasIndicatorBar = indicatorBarUserIds.size > 0

  // user_id -> 이 셀 안에서 보유한 bar 역할 id 집합 (동일 인물의 다른 시간대/컬럼 배정도 신원 기준으로 포함)
  const userIdToBarRoleIds = new Map<string, Set<string>>()
  for (const role of indicatorBarRoles ?? []) {
    for (const a of assignments) {
      if (a.role_id === role.id && a.user_id) {
        if (!userIdToBarRoleIds.has(a.user_id)) userIdToBarRoleIds.set(a.user_id, new Set())
        userIdToBarRoleIds.get(a.user_id)!.add(role.id)
      }
    }
  }
  function barRolesForSubset(subset: Assignment[]): TenantRole[] {
    const roleIds = new Set<string>()
    for (const a of subset) {
      // user_id 없는 자유입력/비회원 배정도 놓치지 않도록 해당 배정 자체의 role_id도 직접 포함
      if (a.role_id) roleIds.add(a.role_id)
      if (a.user_id && userIdToBarRoleIds.has(a.user_id)) {
        for (const rid of userIdToBarRoleIds.get(a.user_id)!) roleIds.add(rid)
      }
    }
    return (indicatorBarRoles ?? []).filter(r => roleIds.has(r.id))
  }
  // 바표시 역할이 하나면 단색 바, 여러 개면 셀 안에서 색상별로 균등 분할해 표시
  function renderBarOverlay(subset: Assignment[]) {
    const barRoles = barRolesForSubset(subset)
    const hasBar = barRoles.length > 0
    if (onIndicatorBarClick) {
      return (
        <div role="button" tabIndex={0}
          onClick={e => { e.stopPropagation(); onIndicatorBarClick() }}
          onKeyDown={e => e.key === 'Enter' && (e.stopPropagation(), onIndicatorBarClick())}
          className={`absolute left-0 top-0 bottom-0 z-10 flex flex-col cursor-pointer transition-all duration-150
            ${hasBar ? 'w-[3px] hover:w-2 hover:brightness-90 active:brightness-75' : 'w-[3px] opacity-0 group-hover:opacity-30 group-hover:w-3'}`}
        >
          {hasBar
            ? barRoles.map(r => <span key={r.id} className="flex-1" style={{ background: indicatorBarColorFor(r, indicatorBarRoles ?? []) }} />)
            : <span className="flex-1" style={{ background: INDICATOR_BAR_COLOR }} />}
        </div>
      )
    }
    if (!hasBar) return null
    return (
      <span className="absolute left-0 top-0 bottom-0 w-[3px] flex flex-col">
        {barRoles.map(r => <span key={r.id} className="flex-1" style={{ background: indicatorBarColorFor(r, indicatorBarRoles ?? []) }} />)}
      </span>
    )
  }

  // ── role column (split mode) ─────────────────────────────────────────────────
  if (colType === 'role') {
    const roleAssignments = assignments.filter(a => a.role_id === roleId)
    const hasAssignments = roleAssignments.length > 0
    const shouldSplitRole = slotHours.length === 2 && roleAssignments.some(a => a.time_sub && !a.time_sub.includes('~'))

    if (shouldSplitRole) {
      const fullSlotRole = roleAssignments.filter(a => !a.time_sub || a.time_sub.includes('~'))
      return (
        <div className="flex flex-col h-full">
          {fullSlotRole.length > 0 && (
            <button onClick={onClick}
              className="relative flex flex-col items-center justify-center px-0.5 py-0.5 border-b border-[var(--color-border-table)] group"
              style={{ background: tint.bg }}
            >
              {renderBarOverlay(fullSlotRole)}
              <NameChips assignments={fullSlotRole} highlightName={highlightName} tintBg={tint.bg} tintInk={tint.ink} teamLeaderUserIds={teamLeaderUserIds} showTimeSub withdrawnUserIds={withdrawnUserIds} isAdmin={isAdmin} />
            </button>
          )}
          <div className="flex flex-col divide-y divide-[var(--color-border-table)] flex-1">
            {slotHours.map(hour => {
              const hourA = roleAssignments.filter(a => a.time_sub && !a.time_sub.includes('~') && assignmentCoversHour(a.time_sub, hour))
              const hourAllAssignments = assignments.filter(a => assignmentCoversHour(a.time_sub, hour))
              return (
                <button key={hour} onClick={onClick}
                  className={`relative flex-1 min-h-[1rem] flex flex-col items-center justify-center transition-all duration-150 active:scale-[0.98] group`}
                  style={{ background: hourA.length ? tint.bg : 'var(--color-surface)' }}
                >
                  {renderBarOverlay(hourAllAssignments)}
                  {hourA.length
                    ? <NameChips assignments={hourA} highlightName={highlightName} tintBg={tint.bg} tintInk={tint.ink} teamLeaderUserIds={teamLeaderUserIds} showTimeSub withdrawnUserIds={withdrawnUserIds} isAdmin={isAdmin} />
                    : canInteract && <EmptyOrLockHint isLocked={isLocked} />
                  }
                </button>
              )
            })}
          </div>
        </div>
      )
    }

    return (
      <button onClick={onClick}
        className={`relative w-full h-full ${cellMinH} flex flex-col items-center justify-center transition-all duration-150 active:scale-[0.98] group`}
        style={{ background: hasAssignments ? tint.bg : 'var(--color-surface)' }}
      >
        {highlighted && !hasAssignments && (
          <span className="absolute inset-[2px] rounded pointer-events-none" style={{ border: '2px dashed var(--color-brand-primary)' }} />
        )}
        {renderBarOverlay(assignments)}
        {hasAssignments
          ? <>
              <NameChips assignments={roleAssignments} highlightName={highlightName} tintBg={tint.bg} tintInk={tint.ink} teamLeaderUserIds={teamLeaderUserIds} withdrawnUserIds={withdrawnUserIds} isAdmin={isAdmin} />
              {isFull && <span className="text-[7px] sm:text-[9px] font-semibold mt-0.5 px-1.5 py-0.5 rounded-full" style={{ background: 'oklch(0.97 0.02 25)', color: 'oklch(0.55 0.16 25)' }}>마감</span>}
            </>
          : highlighted && !isLocked
            ? null
            : canInteract && <EmptyOrLockHint isLocked={isLocked} />
        }
      </button>
    )
  }

  // ── legacy vol / plus columns ────────────────────────────────────────────────
  const volunteerAssignments = assignments.filter(a => !a.member_type || a.member_type === 'member')
  const plusAssignments = assignments.filter(a => a.member_type === '50plus')
  const saturdayAssignments = isSaturdayShift ? [...volunteerAssignments, ...plusAssignments] : volunteerAssignments
  const hasTeamLeaderInVol = !!(teamLeaderUserIds && volunteerAssignments.some(a => teamLeaderUserIds.has(a.user_id ?? '')))

  const teamLeaderTint = { bg: 'oklch(0.95 0.07 85)', ink: 'oklch(0.42 0.12 80)' }

  const indicatorTint = { bg: 'oklch(0.97 0.04 60)', ink: 'oklch(0.45 0.12 60)' }

  if (colType === 'vol') {
    const activeTint = hasTeamLeaderInVol ? teamLeaderTint : effectiveTint
    const visibleAssignments = saturdayAssignments.filter(a => !teamLeaderUserIds?.has(a.user_id ?? '') && !indicatorBarUserIds.has(a.user_id ?? ''))
    const hasAssign = visibleAssignments.length > 0
    const shouldSplit = slotHours.length === 2 && saturdayAssignments.some(a => a.time_sub && !a.time_sub.includes('~'))

    if (shouldSplit) {
      const fullSlotVol = saturdayAssignments.filter(a => !a.time_sub || a.time_sub.includes('~'))
      const fullSlotHasLeader = !!(teamLeaderUserIds && fullSlotVol.some(a => teamLeaderUserIds.has(a.user_id ?? '')))
      const fullSlotVisible = fullSlotVol.filter(a => !teamLeaderUserIds?.has(a.user_id ?? '') && !indicatorBarUserIds.has(a.user_id ?? ''))
      const fullSlotTint = fullSlotHasLeader ? teamLeaderTint : effectiveTint
      return (
        <div className="flex flex-col h-full">
          {fullSlotVisible.length > 0 && (
            <button onClick={onClick}
              className="relative flex flex-col items-center justify-center px-0.5 py-0.5 border-b border-[var(--color-border-table)] group"
              style={{ background: fullSlotTint.bg }}
            >
              {renderBarOverlay(fullSlotVol)}
              <NameChips assignments={fullSlotVisible} highlightName={highlightName} tintBg={fullSlotTint.bg} tintInk={fullSlotTint.ink} showTimeSub withdrawnUserIds={withdrawnUserIds} isAdmin={isAdmin} />
            </button>
          )}
          <div className="flex flex-col divide-y divide-[var(--color-border-table)] flex-1">
            {slotHours.map(hour => {
              const hourVol = saturdayAssignments.filter(a => a.time_sub && !a.time_sub.includes('~') && assignmentCoversHour(a.time_sub, hour))
              const hourHasLeader = !!(teamLeaderUserIds && hourVol.some(a => teamLeaderUserIds.has(a.user_id ?? '')))
              const hourHasBar = hourVol.some(a => indicatorBarUserIds.has(a.user_id ?? ''))
              const hourVisible = hourVol.filter(a => !teamLeaderUserIds?.has(a.user_id ?? '') && !indicatorBarUserIds.has(a.user_id ?? ''))
              const hourTint = hourHasLeader ? teamLeaderTint : hourHasBar && !hourVisible.length ? indicatorTint : effectiveTint
              return (
                <button key={hour} onClick={onClick}
                  className={`relative flex-1 min-h-[1rem] flex flex-col items-center justify-center transition-all duration-150 active:scale-[0.98] group`}
                  style={{ background: (hourVisible.length || hourHasBar) ? hourTint.bg : 'var(--color-surface)' }}
                >
                  {renderBarOverlay(hourVol)}
                  {hourVisible.length
                    ? <NameChips assignments={hourVisible} highlightName={highlightName} tintBg={hourTint.bg} tintInk={hourTint.ink} teamLeaderUserIds={teamLeaderUserIds} showTimeSub withdrawnUserIds={withdrawnUserIds} isAdmin={isAdmin} />
                    : canInteract && <EmptyOrLockHint isLocked={isLocked} />
                  }
                </button>
              )
            })}
          </div>
        </div>
      )
    }

    const cellTint = hasTeamLeaderInVol ? teamLeaderTint : hasIndicatorBar && !hasAssign ? indicatorTint : activeTint
    return (
      <button onClick={onClick}
        className={`relative w-full h-full ${cellMinH} flex flex-col items-center justify-center transition-all duration-150 active:scale-[0.98] group`}
        style={{
          background: hasAssign || hasIndicatorBar ? cellTint.bg : 'var(--color-surface)',
        }}
      >
        {highlighted && !hasAssign && (
          <span className="absolute inset-[2px] rounded pointer-events-none" style={{ border: '1px dashed oklch(0.72 0.16 80)' }} />
        )}
        {renderBarOverlay(assignments)}
        {hasAssign
          ? <>
              <NameChips assignments={visibleAssignments} highlightName={highlightName} tintBg={cellTint.bg} tintInk={cellTint.ink} teamLeaderUserIds={teamLeaderUserIds} withdrawnUserIds={withdrawnUserIds} isAdmin={isAdmin} />
              {isFull && <span className="text-[7px] sm:text-[9px] font-semibold mt-0.5 px-1.5 py-0.5 rounded-full" style={{ background: 'oklch(0.97 0.02 25)', color: 'oklch(0.55 0.16 25)' }}>마감</span>}
            </>
          : highlighted && !isLocked
            ? null
            : canInteract && <EmptyOrLockHint isLocked={isLocked} />
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
              className={`flex-1 min-h-[1rem] flex flex-col items-center justify-center transition-all duration-150 active:scale-[0.98] group`}
              style={{ background: hourPlus.length ? plusTint.bg : 'var(--color-surface)' }}
            >
              {hourPlus.length
                ? <NameChips assignments={hourPlus} highlightName={highlightName} tintBg={plusTint.bg} tintInk={plusTint.ink} teamLeaderUserIds={teamLeaderUserIds} small withdrawnUserIds={withdrawnUserIds} isAdmin={isAdmin} />
                : canInteract && <EmptyOrLockHint isLocked={isLocked} />
              }
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <button onClick={onClick}
      className={`w-full h-full ${cellMinH} flex flex-col items-center justify-center transition-all duration-150 active:scale-[0.98] group`}
      style={{ background: hasPlusAssign ? plusTint.bg : 'var(--color-surface)' }}
    >
      {hasPlusAssign
        ? <NameChips assignments={plusAssignments} highlightName={highlightName} tintBg={plusTint.bg} tintInk={plusTint.ink} teamLeaderUserIds={teamLeaderUserIds} small withdrawnUserIds={withdrawnUserIds} isAdmin={isAdmin} />
        : canInteract && <EmptyOrLockHint isLocked={isLocked} />
      }
    </button>
  )
}
