import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTenant } from '../contexts/TenantContext'
import { ROLE_LABELS } from '../types'
import { useSchedule } from '../hooks/useSchedule'
import { useProfiles } from '../hooks/useProfiles'
import { useTenantRoles } from '../hooks/useTenantRoles'
import { getCellState } from '../utils/cellState'
import { ScheduleHeader } from '../components/schedule/ScheduleHeader'
import { ScheduleGrid } from '../components/schedule/ScheduleGrid'
import { WeekGrid } from '../components/schedule/WeekGrid'
import { DayView } from '../components/schedule/DayView'
import { Legend } from '../components/schedule/Legend'
import { FilterBar } from '../components/shared/FilterBar'
import { ExportButton } from '../components/shared/ExportButton'
import { LoginModal } from '../components/auth/LoginModal'
import { SlotEditModal } from '../components/modals/SlotEditModal'
import { CapacityModal } from '../components/modals/CapacityModal'
import { HolidayNoteModal } from '../components/modals/HolidayNoteModal'
import { ConfirmDialog } from '../components/shared/ConfirmDialog'
import { AutoAssignPreviewModal } from '../components/modals/AutoAssignPreviewModal'
import { computeAutoAssignments } from '../utils/autoAssign'
import type { ProposedAssignment } from '../utils/autoAssign'
import type { ModalTarget, ViewType } from '../types'

interface Props {
  isDark: boolean
  onToggleDark: () => void
}

export function SchedulePage({ isDark, onToggleDark }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [day, setDay] = useState(today.getDate())
  const [viewType, setViewType] = useState<ViewType>('month')
  const [highlightName, setHighlightName] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const [showCapacity, setShowCapacity] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showNoClearTarget, setShowNoClearTarget] = useState(false)
  const [autoProposals, setAutoProposals] = useState<ProposedAssignment[] | null>(null)
  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null)
  const [holidayTarget, setHolidayTarget] = useState<{ day: number; startHour: number; endHour: number } | null>(null)

  const navigate = useNavigate()
  const { profile, loading: authLoading, signIn, signUp, signInWithGoogle, signInWithKakao, signOut, deleteAccount } = useAuth()
  const { tenant, tenantRole, memberships, timeSlots, slotLabels, legendItems, resetTenantSelection, customFields } = useTenant()
  const memberRoleId = memberships.find(m => m.tenant_id === tenant?.id)?.role_id ?? null
  const isPrivileged = profile?.is_super_admin || tenantRole === 'admin'
  const tenantMode = tenant?.settings?.tenant_mode ?? '회원선택'

  useEffect(() => {
    if (!authLoading && !profile) setShowLogin(true)
    if (profile) setShowLogin(false)
  }, [authLoading, profile])

  // 주 뷰에서 월 경계를 넘는 경우 인접 월도 로드
  // 해당 주의 일요일(마지막 날) 계산: 월요일 기준 주이므로 월요일 + 6일
  const _anchorDow = new Date(year, month - 1, day).getDay()
  const _mondayOffset = (_anchorDow + 6) % 7  // 월요일까지 가야 하는 일수
  const _sundayDate = new Date(year, month - 1, day - _mondayOffset + 6)
  const adjYear = _sundayDate.getFullYear()
  const adjMonth = _sundayDate.getMonth() + 1
  const needsAdj = viewType === 'week' && (adjYear !== year || adjMonth !== month)

  const { assignments: primaryAssignments, slotSettings, scheduleRules, dateOverrides, loading, addAssignment, updateAssignment, deleteAssignment, clearAssignments, updateSlotCapacity } = useSchedule(tenant?.id ?? '', year, month)
  const { assignments: adjAssignments, clearAssignments: clearAdjAssignments } = useSchedule(needsAdj ? (tenant?.id ?? '') : '', adjYear, adjMonth)
  const assignments = needsAdj ? [...primaryAssignments, ...adjAssignments] : primaryAssignments
  const { profiles } = useProfiles()
  const teamLeaderUserIds = new Set(profiles.filter(p => p.role === 'team_leader').map(p => p.id))
  const { roles: tenantRoles } = useTenantRoles(tenant?.id ?? '')
  const splitRoles = tenantRoles.filter(r => r.split_cell && !r.indicator_bar)
  const indicatorBarRoles = tenantRoles.filter(r => r.indicator_bar)
  const isSplitMode = splitRoles.length > 0
  // 역할 배정 모달용: split_cell 또는 indicator_bar가 true인 역할 모두 포함
  const assignableRoles = tenantRoles.filter(r => r.split_cell || r.indicator_bar)
  const isAssignableMode = assignableRoles.length > 0

  const filledCount = useMemo(
    () => assignments.filter(a => a.volunteer_type !== 'admin_note').length,
    [assignments]
  )
  const operatingDays = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate()
    let count = 0
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(year, month - 1, d).getDay()
      if (dow !== 0) count++
    }
    return count
  }, [year, month])

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  function shiftDate(delta: number) {
    const d = new Date(year, month - 1, day)
    d.setDate(d.getDate() + delta)
    setYear(d.getFullYear())
    setMonth(d.getMonth() + 1)
    setDay(d.getDate())
  }

  function getWeekDays(y: number, m: number, d: number): Date[] {
    const anchor = new Date(y, m - 1, d)
    const dow = anchor.getDay()
    const monday = new Date(anchor)
    monday.setDate(anchor.getDate() - ((dow + 6) % 7))
    return Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(monday)
      dd.setDate(monday.getDate() + i)
      return dd
    })
  }

  const weekDays = getWeekDays(year, month, day)

  function getTargetDays(): Date[] {
    if (viewType === 'month') {
      const count = new Date(year, month, 0).getDate()
      return Array.from({ length: count }, (_, i) => new Date(year, month - 1, i + 1))
    }
    if (viewType === 'week') return weekDays
    return [new Date(year, month - 1, day)]
  }

  function handleAutoAssign() {
    if (tenantMode !== '회원선택') return
    const proposals = computeAutoAssignments({
      days: getTargetDays(),
      timeSlots,
      assignments,
      slotSettings,
      scheduleRules,
      dateOverrides,
      profiles,
      splitRoles,
      isSplitMode,
    })
    if (!proposals.length) {
      alert('배정할 빈 슬롯이 없거나 배정 가능한 회원이 없습니다.')
      return
    }
    setAutoProposals(proposals)
  }

  const selectedCellState = modalTarget
    ? getCellState(modalTarget.day, modalTarget.timeSlot, modalTarget.year, modalTarget.month, scheduleRules, slotSettings, dateOverrides, assignments)
    : null

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)]">
      {/* Sticky glass toolbar */}
      <header className="sticky top-0 z-30 px-2 pt-2 pb-1 sm:px-4 sm:pt-3 sm:pb-2">
        <div className="bg-[var(--color-surface)]/90 backdrop-blur-xl border border-[var(--color-border)] rounded-2xl shadow-[var(--shadow-md)] px-3 py-2 sm:px-4 sm:py-2.5 flex flex-wrap items-center gap-2 justify-between">
          <FilterBar value={highlightName} onChange={setHighlightName} />

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={onToggleDark}
              aria-label="다크모드 토글"
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-all duration-200 hover:scale-[1.05] active:scale-[0.95]"
            >
              <span className="text-sm leading-none">{isDark ? '☀️' : '🌙'}</span>
            </button>

            <ExportButton year={year} month={month} />

            {profile ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                {profile.is_super_admin && (
                  <button
                    onClick={() => navigate('/superadmin')}
                    className="text-xs font-medium px-2.5 py-1 rounded-xl border border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-all duration-200"
                  >
                    슈퍼어드민
                  </button>
                )}
                {profile.is_super_admin && tenant && (
                  <button
                    onClick={resetTenantSelection}
                    className="text-xs font-medium px-2.5 py-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-all duration-200"
                  >
                    {tenant.name} · 조직 변경
                  </button>
                )}

                <span className="text-xs text-[var(--color-text-secondary)] font-medium px-2.5 py-1 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)]">
                  {profile.name}
                  <span className="ml-1 text-[var(--color-text-muted)]">· {ROLE_LABELS[profile.role]}</span>
                </span>

                {isPrivileged && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="px-3 py-1.5 text-xs font-medium rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    관리자
                  </button>
                )}
                {isPrivileged && (
                  <button
                    onClick={() => setShowCapacity(true)}
                    className="px-3 py-1.5 text-xs font-medium rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-hover)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    인원 설정
                  </button>
                )}
                {isPrivileged && tenantMode === '회원선택' && (
                  <button
                    onClick={handleAutoAssign}
                    className="px-3 py-1.5 text-xs font-medium rounded-xl border border-blue-200 dark:border-blue-800/40 text-blue-500 dark:text-blue-400 bg-[var(--color-surface-secondary)] hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    자동배정
                  </button>
                )}
                {isPrivileged && (
                  <button
                    onClick={() => {
                      const hasClearTarget = viewType === 'month'
                        ? assignments.some(a => a.year === year && a.month === month)
                        : viewType === 'week'
                        ? assignments.some(a => weekDays.some(d => d.getFullYear() === a.year && d.getMonth() + 1 === a.month && d.getDate() === a.day))
                        : assignments.some(a => a.year === year && a.month === month && a.day === day)
                      if (!hasClearTarget) {
                        setShowNoClearTarget(true)
                        return
                      }
                      setShowClearConfirm(true)
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-xl border border-red-200 dark:border-red-800/40 text-red-500 dark:text-red-400 bg-[var(--color-surface-secondary)] hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    초기화
                  </button>
                )}

                <button
                  onClick={signOut}
                  className="px-3 py-1.5 text-xs font-medium rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-secondary)] transition-all duration-200"
                >
                  로그아웃
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 text-xs font-medium rounded-xl border border-red-200 dark:border-red-800/40 text-red-500 dark:text-red-400 bg-[var(--color-surface-secondary)] hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
                >
                  회원탈퇴
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="px-4 py-1.5 text-sm font-semibold rounded-xl bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-hover)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_2px_10px_rgba(37,99,235,0.35)]"
              >
                로그인
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="px-2 py-2 sm:px-4 sm:py-3">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-[var(--shadow-lg)] overflow-hidden animate-fade-up">
          <div className="px-3 py-3 sm:px-5 sm:py-4 border-b border-[var(--color-border)]">
            <ScheduleHeader
              year={year} month={month} day={day}
              title={tenant?.settings?.title}
              filledCount={filledCount}
              operatingDays={operatingDays}
              viewType={viewType}
              onViewTypeChange={setViewType}
              weekDays={weekDays}
              onPrev={() => viewType === 'month' ? prevMonth() : shiftDate(viewType === 'week' ? -7 : -1)}
              onNext={() => viewType === 'month' ? nextMonth() : shiftDate(viewType === 'week' ? 7 : 1)}
            />
            <Legend legendItems={legendItems} />
          </div>

          <div className="p-1.5 sm:p-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="w-8 h-8 border-2 border-[var(--color-brand-primary)] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-[var(--color-text-muted)]">스케줄을 불러오는 중...</span>
              </div>
            ) : viewType === 'month' ? (
              <ScheduleGrid
                year={year} month={month}
                timeSlots={timeSlots}
                assignments={assignments} slotSettings={slotSettings}
                scheduleRules={scheduleRules} dateOverrides={dateOverrides}
                highlightName={highlightName || null}
                profile={profile}
                tenantRole={tenantRole}
                memberRoleId={memberRoleId}
                teamLeaderUserIds={teamLeaderUserIds}
                splitRoles={splitRoles}
                indicatorBarRoles={indicatorBarRoles}
                isSplitMode={isSplitMode}
                slotLabels={slotLabels}
                onCellClick={target => {
                  if (isSplitMode) {
                    if (tenantRole === 'member') {
                      if (!memberRoleId || target.roleId !== memberRoleId) return
                    }
                    setModalTarget(target)
                    return
                  }
                  setModalTarget(target)
                }}
                onHolidayCellClick={profile && isPrivileged
                  ? (d, startHour, endHour) => setHolidayTarget({ day: d, startHour, endHour })
                  : undefined}
              />
            ) : viewType === 'week' ? (
              <>
                <WeekGrid
                  weekDays={weekDays}
                  timeSlots={timeSlots}
                  assignments={assignments} slotSettings={slotSettings}
                  scheduleRules={scheduleRules} dateOverrides={dateOverrides}
                  highlightName={highlightName || null}
                  profile={profile}
                  splitRoles={splitRoles}
                  isSplitMode={isSplitMode}
                  slotLabels={slotLabels}
                  selectedDay={new Date(year, month - 1, day)}
                  onDateHeaderClick={d => {
                    setYear(d.getFullYear())
                    setMonth(d.getMonth() + 1)
                    setDay(d.getDate())
                  }}
                  onCellClick={target => {
                    setDay(target.day)
                    if (isSplitMode && tenantRole === 'member') {
                      if (!memberRoleId || target.roleId !== memberRoleId) return
                    }
                    setModalTarget(target)
                  }}
                />
                {/* 선택된 날짜 상세 */}
                <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                  <DayView
                    year={year} month={month} day={day}
                    timeSlots={timeSlots}
                    assignments={assignments} slotSettings={slotSettings}
                    scheduleRules={scheduleRules} dateOverrides={dateOverrides}
                    profile={profile}
                    splitRoles={splitRoles}
                    isSplitMode={isSplitMode}
                    slotLabels={slotLabels}
                    onCellClick={target => {
                      if (isSplitMode && tenantRole === 'member') {
                        if (!memberRoleId || target.roleId !== memberRoleId) return
                      }
                      setModalTarget(target)
                    }}
                  />
                </div>
              </>
            ) : (
              <DayView
                year={year} month={month} day={day}
                timeSlots={timeSlots}
                assignments={assignments} slotSettings={slotSettings}
                scheduleRules={scheduleRules} dateOverrides={dateOverrides}
                profile={profile}
                splitRoles={splitRoles}
                isSplitMode={isSplitMode}
                slotLabels={slotLabels}
                onCellClick={target => {
                  if (isSplitMode && tenantRole === 'member') {
                    if (!memberRoleId || target.roleId !== memberRoleId) return
                  }
                  setModalTarget(target)
                }}
              />
            )}
          </div>
        </div>
      </main>

      {showLogin && (
        <LoginModal
          onClose={() => { if (profile) setShowLogin(false) }}
          onSignIn={signIn}
          onSignUp={signUp}
          onGoogle={signInWithGoogle}
          onKakao={signInWithKakao}
          hideCancelButton={!profile}
        />
      )}

      {modalTarget && selectedCellState && (
        <SlotEditModal
          target={modalTarget}
          cellState={selectedCellState}
          profile={profile}
          tenantRole={tenantRole}
          memberRoleId={memberRoleId}
          splitRoles={assignableRoles}
          isSplitMode={isAssignableMode}
          tenantMode={tenantMode}
          customFields={customFields}
          slotLabels={slotLabels}
          onClose={() => setModalTarget(null)}
          onAdd={(name, note, volunteerType, timeSub, color, userId, roleId, customerName, customerPhone, extraData) => addAssignment({
            tenant_id: tenant!.id,
            year, month, day: modalTarget.day,
            time_slot: modalTarget.timeSlot,
            volunteer_name: name,
            note: note?.trim() || undefined,
            volunteer_type: volunteerType,
            time_sub: timeSub || undefined,
            color: color || undefined,
            user_id: userId ?? profile!.id,
            role_id: roleId ?? null,
            customer_name: customerName ?? null,
            customer_phone: customerPhone ?? null,
            extra_data: extraData,
          })}
          onUpdate={(id, name, note, volunteerType, timeSub, color, roleId, customerName, customerPhone, extraData) => updateAssignment(id, {
            volunteer_name: name,
            note,
            volunteer_type: volunteerType,
            time_sub: timeSub ?? undefined,
            color: color ?? undefined,
            role_id: roleId ?? null,
            customer_name: customerName ?? null,
            customer_phone: customerPhone ?? null,
            extra_data: extraData,
          })}
          onDelete={deleteAssignment}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title="회원탈퇴"
          message={`정말 탈퇴하시겠습니까?\n탈퇴 후 모든 데이터가 삭제되며\n동일한 이메일로 재가입이 가능합니다.`}
          confirmLabel="탈퇴하기"
          cancelLabel="취소"
          danger
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={async () => {
            setShowDeleteConfirm(false)
            const err = await deleteAccount()
            if (err) alert(err)
          }}
        />
      )}

      {autoProposals !== null && (
        <AutoAssignPreviewModal
          proposals={autoProposals}
          onClose={() => setAutoProposals(null)}
          onConfirm={async (selected) => {
            const errors: string[] = []
            for (const p of selected) {
              const err = await addAssignment({
                tenant_id: tenant!.id,
                year: p.year,
                month: p.month,
                day: p.day,
                time_slot: p.timeSlot,
                volunteer_name: p.userName,
                volunteer_type: p.volunteerType,
                user_id: p.userId,
                role_id: p.roleId ?? null,
              })
              if (err) errors.push(err)
            }
            setAutoProposals(null)
            if (errors.length) {
              alert(`${selected.length - errors.length}건 저장 완료, ${errors.length}건 실패`)
            }
          }}
        />
      )}

      {showNoClearTarget && (
        <ConfirmDialog
          title="초기화 대상 없음"
          message="해당 기간에 초기화할 스케줄이 없습니다."
          confirmLabel="확인"
          hideCancelButton
          onConfirm={() => setShowNoClearTarget(false)}
          onCancel={() => setShowNoClearTarget(false)}
        />
      )}

      {showClearConfirm && (
        <ConfirmDialog
          title="스케줄 초기화"
          message={
            viewType === 'month'
              ? `${year}년 ${month}월 스케줄을 전체 삭제합니다.\n이 작업은 되돌릴 수 없습니다.`
              : viewType === 'week'
              ? `${weekDays[0].getMonth() + 1}월 ${weekDays[0].getDate()}일 ~ ${weekDays[6].getMonth() + 1}월 ${weekDays[6].getDate()}일\n해당 주의 스케줄을 삭제합니다.\n이 작업은 되돌릴 수 없습니다.`
              : `${year}년 ${month}월 ${day}일 스케줄을 삭제합니다.\n이 작업은 되돌릴 수 없습니다.`
          }
          confirmLabel="삭제"
          cancelLabel="취소"
          danger
          onCancel={() => setShowClearConfirm(false)}
          onConfirm={async () => {
            setShowClearConfirm(false)
            let err: string | null = null
            if (viewType === 'month') {
              err = await clearAssignments()
            } else if (viewType === 'day') {
              err = await clearAssignments([day])
            } else {
              // week: split days by month
              const primaryDays = weekDays.filter(d => d.getFullYear() === year && d.getMonth() + 1 === month).map(d => d.getDate())
              if (primaryDays.length) err = await clearAssignments(primaryDays)
              if (!err && needsAdj) {
                const adjDays = weekDays.filter(d => d.getFullYear() === adjYear && d.getMonth() + 1 === adjMonth).map(d => d.getDate())
                if (adjDays.length) err = await clearAdjAssignments(adjDays)
              }
            }
            if (err) alert(err)
          }}
        />
      )}

      {showCapacity && profile && isPrivileged && (
        <CapacityModal slotSettings={slotSettings} timeSlots={timeSlots} slotLabels={slotLabels} onClose={() => setShowCapacity(false)} onUpdate={updateSlotCapacity} />
      )}

      {holidayTarget !== null && profile && isPrivileged && (
        <HolidayNoteModal
          year={year} month={month} day={holidayTarget.day}
          assignments={assignments}
          profile={profile}
          initialStartHour={holidayTarget.startHour}
          initialEndHour={holidayTarget.endHour}
          onClose={() => setHolidayTarget(null)}
          onAdd={(params) => addAssignment({ ...params, tenant_id: tenant!.id })}
          onUpdate={(id, params) => updateAssignment(id, params)}
          onDelete={deleteAssignment}
        />
      )}
    </div>
  )
}
