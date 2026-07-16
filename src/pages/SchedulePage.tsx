import { useState, useEffect, useMemo, useRef } from 'react'
import { rangeFromCells, nextCellSelection, legacyCellSelection, colIdxForRole, colIdxForMemberType, type CellPos } from '../utils/excelSelection'
import { DevFileLabel } from '../components/DevFileLabel'
import { useAssignmentSnapshot, type SnapshotInfo, type SnapshotScope } from '../hooks/useAssignmentSnapshot'
import { useSlotHighlights } from '../hooks/useSlotHighlights'
import { useAuth } from '../hooks/useAuth'
import { useTenant } from '../contexts/TenantContext'
import { useSchedule } from '../hooks/useSchedule'
import { useProfiles } from '../hooks/useProfiles'
import { useTenantRoles } from '../hooks/useTenantRoles'
import { getCellState } from '../utils/cellState'
import { getTimeSubOptions, remapTimeSub, getWeekDays } from '../utils/timeSlots'
import { AppHeader } from '../components/AppHeader'
import { ScheduleHeader } from '../components/schedule/ScheduleHeader'
import { ScheduleGrid } from '../components/schedule/ScheduleGrid'
import { WeekGrid } from '../components/schedule/WeekGrid'
import { MonthScheduleByDay } from '../components/schedule/MonthScheduleByDay'
import { WeekScheduleByDay } from '../components/schedule/WeekScheduleByDay'
import { DayView } from '../components/schedule/DayView'
import { Legend } from '../components/schedule/Legend'
import { FilterBar } from '../components/shared/FilterBar'
import { ExportButton } from '../components/shared/ExportButton'
import { SlotEditModal } from '../components/modals/SlotEditModal'
import { RecurringModal } from '../components/modals/RecurringModal'
import { CapacityModal } from '../components/modals/CapacityModal'
import { HolidayNoteModal } from '../components/modals/HolidayNoteModal'
import { ConfirmDialog } from '../components/shared/ConfirmDialog'
import { LockIcon, UnlockIcon } from '../components/icons/LockIcons'
import { AutoAssignPreviewModal } from '../components/modals/AutoAssignPreviewModal'
import { SmsModal } from '../components/modals/SmsModal'
import { computeAutoAssignments } from '../utils/autoAssign'
import { exportMonthScheduleToExcel, exportMonthScheduleToCsv, exportMonthScheduleToDocx, exportMonthScheduleToPdf } from '../utils/exportSchedule'
import type { ProposedAssignment } from '../utils/autoAssign'
import type { ModalTarget, ViewType, TenantMode, Assignment, DateOverride, CustomFieldDef, CustomFieldOption } from '../types'
import { supabase } from '../lib/supabase'

// 날짜 단위 잠금(date_overrides.is_locked) 기준으로 고정/해제 대상이 있는지 확인
function hasDateLockTarget(dateOverrides: DateOverride[], dates: string[], locked: boolean): boolean {
  return dates.some(dateStr => {
    const isLocked = dateOverrides.find(o => o.date === dateStr)?.is_locked === true
    return locked ? !isLocked : isLocked
  })
}

function NavIcon({ children, active, danger }: { children: React.ReactNode; active?: boolean; danger?: boolean }) {
  return (
    <span
      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
        active
          ? 'bg-[var(--color-brand-primary)] border-transparent text-[var(--color-brand-primary-contrast)]'
          : danger
          ? 'bg-[var(--color-surface)] border-[var(--color-border)] text-red-500 group-hover:border-red-200 group-hover:bg-red-50'
          : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] group-hover:border-[var(--color-border-strong)]'
      }`}
    >
      {children}
    </span>
  )
}

export function SchedulePage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [day, setDay] = useState(today.getDate())
  const [viewType, setViewType] = useState<ViewType>('month')
  const [displayMode, setDisplayMode] = useState<'time' | 'day'>('time')
  const [hiddenRoleIds, setHiddenRoleIds] = useState<Set<string>>(new Set())
  const [highlightName, setHighlightName] = useState('')
  const [showCapacity, setShowCapacity] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  // ── 셀 선택 / 복사 붙여넣기 ─────────────────────────────────────────────────
  const isShiftRef = useRef(false)
  type CopiedCell = {
    dayOffset: number; slotOffset: number; colOffset: number
    sourceTimeSlot: string
    assignments: Array<{ member_name: string; note: string | null; member_type: string; role_id: string | null; user_id: string | null; time_sub: string | null; color: string | null; customer_name: string | null; customer_phone: string | null; extra_data?: Record<string, string> }>
  }
  const [excelMode, setExcelMode] = useState(false)
  const [cellSel, setCellSel] = useState<{ anchor: CellPos; cursor: CellPos } | null>(null)
  const [copyBuf, setCopyBuf] = useState<{ origin: CellPos; cells: CopiedCell[] } | null>(null)
  // 엑셀모드에 진입한 시점부터 누적되는 붙여넣기 되돌리기 스택. 각 원소는 한 번의 붙여넣기로 생성된 배정 id 묶음.
  // 엑셀모드를 끄거나 다시 켜면 비워져서, "엑셀모드 진입 시점"이 되돌리기의 끝점이 된다.
  const [pasteHistory, setPasteHistory] = useState<string[][]>([])
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showNoClearTarget, setShowNoClearTarget] = useState(false)
  const [lockAction, setLockAction] = useState<'lock' | 'unlock' | null>(null)
  const [showNoLockTarget, setShowNoLockTarget] = useState<'lock' | 'unlock' | null>(null)
  const [autoProposals, setAutoProposals] = useState<ProposedAssignment[] | null>(null)
  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null)
  const [directRegMsg, setDirectRegMsg] = useState<string | null>(null)
  const [showRecurring, setShowRecurring] = useState(false)
  const [showSms, setShowSms] = useState(false)
  const [holidayTarget, setHolidayTarget] = useState<{ day: number; startHour: number; endHour: number } | null>(null)
  const [memberNotice, setMemberNotice] = useState<string | null>(null)
  const [lastSnapshot, setLastSnapshot] = useState<SnapshotInfo | null>(null)
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)

  const [filterMemberId, setFilterMemberId] = useState<string | null>(null)
  const [swipeAnim, setSwipeAnim] = useState<'next' | 'prev' | null>(null)
  const [animKey, setAnimKey] = useState(0)

  const pad2 = (n: number) => String(n).padStart(2, '0')

  const { profile } = useAuth()
  const { tenant, tenantRole, memberships, timeSlots, slotLabels, legendItems, customFields, typeLabels } = useTenant()

  // 최신 커스텀 필드를 DB에서 직접 조회 (TenantContext stale 방지)
  const [freshCustomFields, setFreshCustomFields] = useState<CustomFieldDef[] | null>(null)
  useEffect(() => {
    if (!tenant?.id) return
    let cancelled = false
    supabase.from('tenants').select('settings').eq('id', tenant.id).single()
      .then(({ data }) => {
        if (cancelled) return
        const raw = (data?.settings?.custom_fields ?? []) as CustomFieldDef[]
        setFreshCustomFields(raw.map(f => ({
          ...f,
          options: f.options?.map((opt): CustomFieldOption =>
            typeof opt === 'string' ? { name: opt, value: opt } : opt
          ),
        })))
      })
    return () => { cancelled = true }
  }, [tenant?.id])
  const effectiveCustomFields = freshCustomFields ?? customFields

  const memberRoleId = memberships.find(m => m.tenant_id === tenant?.id)?.role_id ?? null
  const isPrivileged = profile?.is_super_admin || tenantRole === 'admin'
  const rawMode = tenant?.settings?.tenant_mode ?? '회원선택'
  const tenantMode: TenantMode =
    rawMode === '회원선택' ? '회원공유' :
    rawMode as TenantMode
  const canAdd = tenantMode !== '비회원' || isPrivileged

  const { highlightSet: highlightedSlots, loadHighlights, toggleHighlight, clearAndSnapshotHighlights, restoreHighlights } = useSlotHighlights(tenant?.id ?? '')
  useEffect(() => { if (tenant?.id) loadHighlights(year, month) }, [tenant?.id, year, month]) // eslint-disable-line react-hooks/exhaustive-deps

  const selRange = useMemo(() => {
    if (!cellSel) return null
    return rangeFromCells(cellSel.anchor, cellSel.cursor)
  }, [cellSel])

  const cpRange = useMemo(() => {
    if (!copyBuf || !copyBuf.cells.length) return null
    const maxDO = Math.max(...copyBuf.cells.map(c => c.dayOffset))
    const maxSO = Math.max(...copyBuf.cells.map(c => c.slotOffset))
    const maxCO = Math.max(...copyBuf.cells.map(c => c.colOffset))
    return {
      minDay: copyBuf.origin.day,
      maxDay: copyBuf.origin.day + maxDO,
      minSlotIdx: copyBuf.origin.slotIdx,
      maxSlotIdx: copyBuf.origin.slotIdx + maxSO,
      minColIdx: copyBuf.origin.colIdx,
      maxColIdx: copyBuf.origin.colIdx + maxCO,
    }
  }, [copyBuf])

  const displayAssignmentFilter = useMemo<((a: Assignment) => boolean) | undefined>(() => {
    if (tenantMode !== '회원개별') return undefined
    if (isPrivileged) {
      if (filterMemberId === '__unassigned__') return (a: Assignment) => a.user_id === null
      return filterMemberId ? (a: Assignment) => a.user_id === filterMemberId : undefined
    }
    return (a: Assignment) => a.user_id === (profile?.id ?? '')
  }, [tenantMode, isPrivileged, filterMemberId, profile?.id])

  // 소셜 회원가입 탭에서 이미 가입된 조직 감지 → localStorage 플래그 수거
  useEffect(() => {
    if (!profile) return
    const notice = localStorage.getItem('vs_notice_already_member') ?? localStorage.getItem('vs_notice_join_requested')
    if (notice) {
      localStorage.removeItem('vs_notice_already_member')
      localStorage.removeItem('vs_notice_join_requested')
      setMemberNotice(notice)
    }
  }, [profile?.id])

  // 주 뷰에서 월 경계를 넘는 경우 인접 월도 로드
  // 해당 주의 일요일(마지막 날) 계산: 월요일 기준 주이므로 월요일 + 6일
  const _anchorDow = new Date(year, month - 1, day).getDay()
  const _mondayOffset = (_anchorDow + 6) % 7  // 월요일까지 가야 하는 일수
  const _sundayDate = new Date(year, month - 1, day - _mondayOffset + 6)
  const adjYear = _sundayDate.getFullYear()
  const adjMonth = _sundayDate.getMonth() + 1
  const needsAdj = viewType === 'week' && (adjYear !== year || adjMonth !== month)

  const { assignments: primaryAssignments, slotSettings, scheduleRules, dateOverrides, loading, addAssignment, addAssignmentWithId, updateAssignment, deleteAssignment, clearAssignments, lockAssignments, updateSlotCapacity } = useSchedule(tenant?.id ?? '', year, month)
  const { assignments: adjAssignments, dateOverrides: adjDateOverrides, clearAssignments: clearAdjAssignments, lockAssignments: lockAdjAssignments } = useSchedule(needsAdj ? (tenant?.id ?? '') : '', adjYear, adjMonth)
  const { saveSnapshot, restoreSnapshot } = useAssignmentSnapshot(tenant?.id ?? '')
  const assignments = needsAdj ? [...primaryAssignments, ...adjAssignments] : primaryAssignments
  const weekDateOverrides = needsAdj ? [...dateOverrides, ...adjDateOverrides] : dateOverrides
  const { profiles, memberPreferences } = useProfiles()
  const teamLeaderUserIds = new Set<string>()
  const { roles: tenantRoles } = useTenantRoles(tenant?.id ?? '')
  const splitRoles = tenantRoles.filter(r => r.split_cell && !r.indicator_bar)
  const indicatorBarRoles = tenantRoles.filter(r => r.indicator_bar)
  const isSplitMode = splitRoles.length > 0

  const withdrawnUserIds = useMemo(() => {
    const activeProfileIds = new Set(profiles.map(p => p.id))
    const withdrawn = memberships
      .filter(m => m.tenant_id === tenant?.id && m.withdrawal_status === 'approved')
      .map(m => m.user_id)
    const deleted = assignments
      .map(a => a.user_id)
      .filter((uid): uid is string => !!uid && !activeProfileIds.has(uid))
    return new Set([...withdrawn, ...deleted])
  }, [memberships, tenant?.id, profiles, assignments])
  // 역할 배정 모달용: split_cell 또는 indicator_bar가 true인 역할 모두 포함
  const memberTenantRoleName = tenantRoles.find(r => r.id === memberRoleId)?.name ?? null

  const memberSelectEl = tenantMode === '회원개별' && isPrivileged ? (
    <select
      value={filterMemberId ?? ''}
      onChange={e => setFilterMemberId(e.target.value || null)}
      className="max-w-[130px] sm:max-w-none px-2 py-1 text-xs border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
    >
      <option value="">전체 회원</option>
      {profiles.filter(p => p.memberRole !== 'admin').map(p => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  ) : null

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }
  function handleViewTypeChange(v: ViewType) {
    if (v === 'week' || v === 'day') {
      const t = new Date()
      setYear(t.getFullYear())
      setMonth(t.getMonth() + 1)
      setDay(t.getDate())
    }
    setViewType(v)
  }
  function toggleRole(id: string) {
    setHiddenRoleIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (splitRoles.filter(r => !next.has(r.id)).length > 1) {
        next.add(id)
      }
      return next
    })
  }

  // ── 복사/붙여넣기 실행 (키보드·버튼 공용) ──────────────────────────────────
  function runCopy() {
    if (!selRange) return
    const cells: CopiedCell[] = []
    for (let ci = selRange.minColIdx; ci <= selRange.maxColIdx; ci++) {
      for (let si = selRange.minSlotIdx; si <= selRange.maxSlotIdx; si++) {
        if (si < 0 || si >= timeSlots.length) continue
        for (let d = selRange.minDay; d <= selRange.maxDay; d++) {
          const cs = getCellState(d, timeSlots[si], year, month, scheduleRules, slotSettings, dateOverrides, assignments)
          const colAssignments = cs.assignments.filter(a => {
            if (a.member_type === 'admin_note') return false
            if (isSplitMode) return a.role_id === (splitRoles[ci]?.id ?? null)
            return colIdxForMemberType(a.member_type) === ci
          })
          cells.push({
            dayOffset: d - selRange.minDay,
            slotOffset: si - selRange.minSlotIdx,
            colOffset: ci - selRange.minColIdx,
            sourceTimeSlot: timeSlots[si],
            assignments: colAssignments.map(a => ({ member_name: a.member_name, note: a.note, member_type: a.member_type, role_id: a.role_id, user_id: a.user_id, time_sub: a.time_sub, color: a.color, customer_name: a.customer_name, customer_phone: a.customer_phone, extra_data: a.extra_data })),
          })
        }
      }
    }
    setCopyBuf({ origin: { day: selRange.minDay, slotIdx: selRange.minSlotIdx, colIdx: selRange.minColIdx }, cells })
    // 모바일(두 번 탭 규칙)은 복사 후에도 단일 칸 상태가 남아있으면 다음 탭이 범위 확장으로 처리되므로 선택을 비운다.
    // PC는 클릭이 항상 새 선택이라 이 문제가 없고, 오히려 비우면 'Ctrl+C 후 바로 Ctrl+V로 같은 자리에 붙여넣기'가 막히므로 비우지 않는다.
    if (isCoarsePointerDevice()) setCellSel(null)
  }

  async function runPaste() {
    if (!copyBuf || !cellSel || !isPrivileged) return
    const daysInMonth = new Date(year, month, 0).getDate()
    const insertedIds: string[] = []
    const roleMismatchNames = new Set<string>()

    // 한 칸(td, tsi, tci)에 cell의 배정들을 붙여넣는다. 이 칸 자신의 날짜/슬롯/열을 기준으로 time_slot/role_id 등을 정한다.
    async function pasteCellAt(cell: CopiedCell, td: number, tsi: number, tci: number) {
      if (td < 1 || td > daysInMonth || tsi < 0 || tsi >= timeSlots.length) return

      let targetRoleId: string | null = null
      let targetMemberType = 'member'
      if (isSplitMode) {
        const role = splitRoles[tci]
        if (!role) return
        targetRoleId = role.id
      } else {
        if (tci < 0 || tci > 1) return
        const dow = new Date(year, month - 1, td).getDay()
        if (tci === 1 && dow === 6) return // 토요일은 50+ 열이 없음 — 붙여넣으면 화면에 안 보이는 고아 데이터가 됨
        targetMemberType = tci === 1 ? '50plus' : 'member'
      }

      const ts = timeSlots[tsi]
      const cs = getCellState(td, ts, year, month, scheduleRules, slotSettings, dateOverrides, assignments)
      if (cs.isHoliday || cs.isBreaktime || cs.isClosed || cs.isLocked) return
      for (const a of cell.assignments) {
        // 역할 분리 모드: 등록된 회원은 자신이 속한 역할의 셀에만 배정될 수 있다(일반 등록과 동일한 규칙).
        // 복사한 배정의 원래 role_id와 붙여넣을 열의 role_id가 다르면 건너뛰고 알림으로 안내한다.
        if (isSplitMode && a.role_id !== targetRoleId) {
          roleMismatchNames.add(a.member_name)
          continue
        }
        const { error, id } = await addAssignmentWithId({
          tenant_id: tenant!.id, year, month, day: td, time_slot: ts,
          member_name: a.member_name, note: a.note ?? undefined,
          member_type: isSplitMode ? a.member_type : targetMemberType,
          user_id: a.user_id,
          role_id: isSplitMode ? targetRoleId : null,
          time_sub: remapTimeSub(cell.sourceTimeSlot, a.time_sub, ts), color: a.color ?? undefined,
          customer_name: a.customer_name, customer_phone: a.customer_phone,
          extra_data: a.extra_data,
        })
        if (!error && id) insertedIds.push(id)
      }
    }

    const destIsMultiCell = !!selRange && (
      selRange.minDay !== selRange.maxDay || selRange.minSlotIdx !== selRange.maxSlotIdx || selRange.minColIdx !== selRange.maxColIdx
    )

    if (copyBuf.cells.length === 1 && destIsMultiCell && selRange) {
      // 복사한 셀이 1개뿐인데 붙여넣을 대상으로 여러 칸을 선택한 경우 — 선택한 모든 칸에 각자의 날짜/슬롯/열로 동일하게 채워 넣는다.
      const sourceCell = copyBuf.cells[0]
      for (let tci = selRange.minColIdx; tci <= selRange.maxColIdx; tci++) {
        for (let tsi = selRange.minSlotIdx; tsi <= selRange.maxSlotIdx; tsi++) {
          for (let td = selRange.minDay; td <= selRange.maxDay; td++) {
            await pasteCellAt(sourceCell, td, tsi, tci)
          }
        }
      }
    } else {
      // 기존 동작: 복사한 모양을 붙여넣기 시작 칸(선택 영역의 최소 좌표)에 상대 오프셋 그대로 재현
      const pasteDay = Math.min(cellSel.anchor.day, cellSel.cursor.day)
      const pasteSlotIdx = Math.min(cellSel.anchor.slotIdx, cellSel.cursor.slotIdx)
      const pasteColIdx = Math.min(cellSel.anchor.colIdx, cellSel.cursor.colIdx)
      for (const cell of copyBuf.cells) {
        await pasteCellAt(cell, pasteDay + cell.dayOffset, pasteSlotIdx + cell.slotOffset, pasteColIdx + cell.colOffset)
      }
    }

    if (insertedIds.length) setPasteHistory(prev => [...prev, insertedIds])
    if (roleMismatchNames.size) {
      alert(`다른 역할의 칸에는 붙여넣을 수 없어 건너뛰었습니다: ${[...roleMismatchNames].join(', ')}`)
    }
    // 모바일은 동일한 이유로 붙여넣기 후에도 선택을 비워 다음 탭이 새 붙여넣기 위치로 쓰이게 함. PC는 비우지 않음.
    if (isCoarsePointerDevice()) setCellSel(null)
  }

  // 가장 마지막 붙여넣기 묶음을 하나씩 되돌린다. 반복 호출하면 엑셀모드 진입 시점까지 거슬러 되돌릴 수 있다 (redo 없음)
  async function runUndo() {
    if (!pasteHistory.length || !isPrivileged) return
    const ids = pasteHistory[pasteHistory.length - 1]
    setPasteHistory(prev => prev.slice(0, -1))
    for (const id of ids) {
      await deleteAssignment(id)
    }
  }

  // ── 키보드: Shift 추적 + Ctrl+C/V/Escape ──────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Shift') { isShiftRef.current = true; return }
      if (!excelMode) return
      if (e.key === 'Escape') { setCellSel(null); setCopyBuf(null); return }
      if (!(e.ctrlKey || e.metaKey)) return

      if (e.key === 'c') {
        e.preventDefault()
        runCopy()
      }

      if (e.key === 'v') {
        e.preventDefault()
        runPaste()
      }

      if (e.key === 'z') {
        e.preventDefault()
        runUndo()
      }
    }
    function onKeyUp(e: KeyboardEvent) { if (e.key === 'Shift') isShiftRef.current = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excelMode, cellSel, selRange, copyBuf, pasteHistory, isPrivileged, isSplitMode, splitRoles, timeSlots, year, month, scheduleRules, slotSettings, dateOverrides, assignments, addAssignmentWithId, deleteAssignment, tenant])

  const swipeTouchStartX = useRef<number | null>(null)
  const swipeTouchStartY = useRef<number | null>(null)
  const swipeScrollableEl = useRef<HTMLElement | null>(null)

  function findHScrollable(target: EventTarget | null): HTMLElement | null {
    let node = target as HTMLElement | null
    while (node && node !== document.body) {
      const ox = window.getComputedStyle(node).overflowX
      if ((ox === 'auto' || ox === 'scroll') && node.scrollWidth > node.clientWidth) return node
      node = node.parentElement
    }
    return null
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length !== 1) { swipeTouchStartX.current = null; swipeTouchStartY.current = null; return }
    swipeTouchStartX.current = e.touches[0].clientX
    swipeTouchStartY.current = e.touches[0].clientY
    swipeScrollableEl.current = findHScrollable(e.touches[0].target)
  }
  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length > 1) { swipeTouchStartX.current = null; swipeTouchStartY.current = null }
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (swipeTouchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - swipeTouchStartX.current
    const dy = e.changedTouches[0].clientY - (swipeTouchStartY.current ?? 0)
    swipeTouchStartX.current = null
    swipeTouchStartY.current = null
    // 수평 이동이 수직 이동의 2배 이상일 때만 스와이프로 인식 (약 27도 이내)
    if (Math.abs(dx) < 120 || Math.abs(dx) < Math.abs(dy) * 2) return
    // 가로 스크롤 가능 영역에서 스크롤 방향으로 이동 중이면 네비게이션 무시
    const sc = swipeScrollableEl.current
    if (sc) {
      if (dx < 0 && sc.scrollLeft + sc.clientWidth < sc.scrollWidth - 5) return
      if (dx > 0 && sc.scrollLeft > 5) return
    }
    const dir = dx < 0 ? 'next' : 'prev'
    setSwipeAnim(dir)
    setAnimKey(k => k + 1)
    if (dx < 0) {
      viewType === 'month' ? nextMonth() : shiftDate(viewType === 'week' ? 7 : 1)
    } else {
      viewType === 'month' ? prevMonth() : shiftDate(viewType === 'week' ? -7 : -1)
    }
  }

  function shiftDate(delta: number) {
    const d = new Date(year, month - 1, day)
    d.setDate(d.getDate() + delta)
    setYear(d.getFullYear())
    setMonth(d.getMonth() + 1)
    setDay(d.getDate())
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
    if (!isPrivileged) return
    if (tenantMode === '비회원') return
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
      memberPreferences,
      roleRatios: tenant?.settings?.role_ratios,
      volunteerLabel: typeLabels.member,
    })
    if (!proposals.length) {
      alert('배정할 빈 슬롯이 없거나 배정 가능한 회원이 없습니다.')
      return
    }
    setAutoProposals(proposals)
  }

  const exportParams = () => ({
    year, month,
    tenantName: tenant?.settings?.title || tenant?.name || '스케줄',
    timeSlots, assignments, slotSettings, scheduleRules, dateOverrides,
    slotLabels, splitRoles, isSplitMode, withdrawnUserIds, displayAssignmentFilter,
    isAdmin: isPrivileged,
  })
  async function handleExportExcel() { await exportMonthScheduleToExcel(exportParams()) }
  function handleExportCsv() { exportMonthScheduleToCsv(exportParams()) }
  async function handleExportDocx() { await exportMonthScheduleToDocx(exportParams()) }
  async function handleExportPdf() { await exportMonthScheduleToPdf(exportParams()) }

  function handleClearClick() {
    const hasClearTarget = viewType === 'month'
      ? assignments.some(a => a.year === year && a.month === month)
      : viewType === 'week'
      ? assignments.some(a => weekDays.some(d => d.getFullYear() === a.year && d.getMonth() + 1 === a.month && d.getDate() === a.day))
      : assignments.some(a => a.year === year && a.month === month && a.day === day)
    if (!hasClearTarget) { setShowNoClearTarget(true); return }
    setShowClearConfirm(true)
  }

  function handleLockClick(locked: boolean) {
    const isSuperAdmin = !!profile?.is_super_admin

    let assignmentTarget: boolean
    let dateTarget: boolean
    if (viewType === 'month') {
      assignmentTarget = assignments.some(a => a.year === year && a.month === month && a.is_locked === !locked)
      const daysInMonth = new Date(year, month, 0).getDate()
      const dates = Array.from({ length: daysInMonth }, (_, i) => `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`)
      dateTarget = hasDateLockTarget(dateOverrides, dates, locked)
    } else if (viewType === 'week') {
      assignmentTarget = assignments.some(a => weekDays.some(d => d.getFullYear() === a.year && d.getMonth() + 1 === a.month && d.getDate() === a.day) && a.is_locked === !locked)
      const primaryDates = weekDays
        .filter(d => d.getFullYear() === year && d.getMonth() + 1 === month)
        .map(d => `${year}-${String(month).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
      const adjDates = weekDays
        .filter(d => d.getFullYear() === adjYear && d.getMonth() + 1 === adjMonth)
        .map(d => `${adjYear}-${String(adjMonth).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
      dateTarget = hasDateLockTarget(dateOverrides, primaryDates, locked) || hasDateLockTarget(adjDateOverrides, adjDates, locked)
    } else {
      assignmentTarget = assignments.some(a => a.year === year && a.month === month && a.day === day && a.is_locked === !locked)
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      dateTarget = hasDateLockTarget(dateOverrides, [dateStr], locked)
    }

    const hasTarget = dateTarget || ((locked || isSuperAdmin) && assignmentTarget)
    if (!hasTarget) { setShowNoLockTarget(locked ? 'lock' : 'unlock'); return }
    setLockAction(locked ? 'lock' : 'unlock')
  }

  function colIdxOf(target: ModalTarget): number {
    if (isSplitMode) return colIdxForRole(splitRoles.map(r => r.id), target.roleId)
    return colIdxForMemberType(target.memberType)
  }

  // 터치 기기(모바일/태블릿)는 Shift 키가 없으므로 두 번 탭 방식, PC는 기존 클릭=새선택/Shift+클릭=확장 방식을 그대로 사용
  function isCoarsePointerDevice(): boolean {
    return typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true
  }

  async function handleCellClick(target: ModalTarget) {
    const slotIdx = timeSlots.indexOf(target.timeSlot)

    // 엑셀 모드: 선택만 하고 팝업 열지 않음
    if (excelMode) {
      const pos: CellPos = { day: target.day, slotIdx, colIdx: colIdxOf(target) }
      const isTouch = isCoarsePointerDevice()
      setCellSel(prev => isTouch
        ? nextCellSelection(prev, pos, isShiftRef.current)
        : legacyCellSelection(prev, pos, isShiftRef.current))
      return
    }

    if (isSplitMode && tenantRole === 'member' && tenantMode !== '비회원') {
      if (!memberRoleId || target.roleId !== memberRoleId) return
    }

    // 비회원 모드는 커스텀 필드(이름 등)를 직접 입력해야 하므로 모달을 거쳐야 함
    const useDynamicFieldsHere = tenantMode === '비회원' && effectiveCustomFields.length > 0

    if (
      tenantMode !== '회원개별' &&
      !useDynamicFieldsHere &&
      !isPrivileged &&
      profile
    ) {
      const cs = getCellState(
        target.day, target.timeSlot, target.year, target.month,
        scheduleRules, slotSettings, dateOverrides, assignments
      )
      if (!cs.isClosed && !cs.isHoliday && !cs.isBreaktime && !cs.isLocked) {
        const alreadyIn = cs.assignments.some(a => a.user_id === profile.id)
        if (!alreadyIn) {
          const roleAssigns = target.roleId
            ? cs.assignments.filter(a => a.role_id === target.roleId)
            : cs.assignments
          const remaining = cs.maxCapacity - roleAssigns.length
          if (remaining > 0) {
            const timeSubOptions = getTimeSubOptions(target.timeSlot)
            const timeSub = timeSubOptions ? timeSubOptions[timeSubOptions.length - 1].value : undefined
            const err = await addAssignment({
              tenant_id: tenant!.id,
              year: target.year, month: target.month, day: target.day,
              time_slot: target.timeSlot,
              member_name: profile.name,
              member_type: 'member',
              user_id: profile.id,
              role_id: target.roleId ?? null,
              note: undefined,
              time_sub: timeSub,
              color: undefined,
              customer_name: null,
              customer_phone: null,
            })
            if (!err) {
              setDirectRegMsg('등록되었습니다')
              setTimeout(() => setDirectRegMsg(null), 2000)
            }
            return
          }
        }
      }
    }

    // 비회원 모드 일반회원: 모달 없음
    if (tenantMode === '비회원' && !isPrivileged) return

    setModalTarget(target)
  }

  const selectedCellState = modalTarget
    ? getCellState(modalTarget.day, modalTarget.timeSlot, modalTarget.year, modalTarget.month, scheduleRules, slotSettings, dateOverrides, assignments)
    : null

  const menuItemCls = 'group w-full flex items-center gap-2.5 text-left px-2.5 py-2 text-[13px] font-medium rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors'
  const navLabelCls = 'px-2.5 pt-3 pb-1 text-[10.5px] font-bold uppercase tracking-wide text-[var(--color-text-muted)] first:pt-1'

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)]" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <AppHeader
        leftSlot={<FilterBar value={highlightName} onChange={setHighlightName} />}
        memberSelectSlot={memberSelectEl}
        rightSlot={<ExportButton year={year} month={month} />}
        roleLabel={memberTenantRoleName ?? undefined}
        funcMenuItems={(close) => (
          <>
            {isPrivileged && (
              <>
                <p className={navLabelCls}>화면</p>
                {([
                  { v: 'month' as const, label: '월간' },
                  { v: 'week' as const, label: '주간' },
                  { v: 'day' as const, label: '일간' },
                ]).map(({ v, label }) => (
                  <button
                    key={v}
                    onClick={() => { handleViewTypeChange(v); close() }}
                    className={`${menuItemCls} ${viewType === v ? 'bg-[color-mix(in_srgb,var(--color-brand-primary)_10%,transparent)] text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)]' : ''}`}
                  >
                    <NavIcon active={viewType === v}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v16" /></svg>
                    </NavIcon>
                    <span className="flex-1">{label}</span>
                  </button>
                ))}
                {viewType === 'month' && (
                  <button
                    onClick={() => {
                      setExcelMode(v => { setCellSel(null); setCopyBuf(null); setPasteHistory([]); return !v })
                      close()
                    }}
                    className={`${menuItemCls} ${excelMode ? 'bg-[color-mix(in_srgb,var(--color-brand-primary)_10%,transparent)] text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)]' : ''}`}
                  >
                    <NavIcon active={excelMode}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
                    </NavIcon>
                    <span className="flex-1">엑셀 모드</span>
                    {excelMode && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)]">ON</span>}
                  </button>
                )}
              </>
            )}
            {isPrivileged && tenantMode === '비회원' && (
              <>
                <p className={navLabelCls}>공유</p>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/embed?tid=${tenant?.id ?? ''}`
                    const elId = `dts-widget-${(tenant?.id ?? '').slice(0, 8)}`
                    const code = `<iframe id="${elId}" src="${url}" style="width:100%;border:0;" scrolling="no"></iframe>\n<script>\n(function () {\n  window.addEventListener('message', function (e) {\n    if (e.data && e.data.source === 'dts-embed' && e.data.type === 'resize') {\n      var el = document.getElementById('${elId}');\n      if (el) el.style.height = e.data.height + 'px';\n    }\n  });\n})();\n</script>`
                    navigator.clipboard.writeText(code).then(() => alert('임베드 코드가 클립보드에 복사되었습니다.\n조직 홈페이지의 원하는 위치에 붙여넣으세요.'))
                    close()
                  }}
                  className={menuItemCls}
                >
                  <NavIcon>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                  </NavIcon>
                  <span className="flex-1">임베드 코드 복사</span>
                </button>
              </>
            )}
            <p className={navLabelCls}>문서</p>
            <button onClick={() => setExportOpen(o => !o)} className={menuItemCls}>
              <NavIcon>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
              </NavIcon>
              <span className="flex-1">문서 다운로드</span>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: exportOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}><path d="M4 2l4 4-4 4"/></svg>
            </button>
            {exportOpen && (
              <div className="ml-3 pl-3 border-l-2 border-[var(--color-border)] flex flex-col gap-0.5 mb-1">
                <button onClick={() => { handleExportExcel(); close() }} className={menuItemCls}>
                  <span className="flex items-center gap-2.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
                    Excel (.xlsx)
                  </span>
                </button>
                <button onClick={() => { handleExportCsv(); close() }} className={menuItemCls}>
                  <span className="flex items-center gap-2.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>
                    CSV (.csv)
                  </span>
                </button>
                <button onClick={() => { handleExportDocx(); close() }} className={menuItemCls}>
                  <span className="flex items-center gap-2.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    Word (.docx)
                  </span>
                </button>
                <button onClick={() => { handleExportPdf(); close() }} className={menuItemCls}>
                  <span className="flex items-center gap-2.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h1a2 2 0 0 1 0 4H9v-4z"/><path d="M15 13h1.5a1.5 1.5 0 0 1 0 3H15v-3z"/></svg>
                    PDF (.pdf)
                  </span>
                </button>
              </div>
            )}
            <p className={navLabelCls}>운영</p>
            <button onClick={() => { setShowCapacity(true); close() }} className={menuItemCls}>
              <NavIcon>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </NavIcon>
              인원 설정
            </button>
            {tenantMode !== '비회원' && (
              <button onClick={() => { handleAutoAssign(); close() }} className={menuItemCls}>
                <NavIcon>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8 19 13M17.8 6.2 19 5M12.2 6.2 11 5M12.2 11.8 11 13"/><path d="M3 21l9-9"/><path d="M12.2 6.2 3 15l3 3 9.2-9.2"/></svg>
                </NavIcon>
                자동배정
              </button>
            )}
            {profile && (tenantMode !== '비회원' || isPrivileged) && (
              <button onClick={() => { setShowRecurring(true); close() }} className={menuItemCls}>
                <NavIcon>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>
                </NavIcon>
                반복 등록
              </button>
            )}
            {isPrivileged && (
              <button onClick={() => { setShowSms(true); close() }} className={menuItemCls}>
                <NavIcon>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </NavIcon>
                문자 발송
              </button>
            )}
            {isPrivileged && (
              <>
                <p className={navLabelCls}>잠금</p>
                <button onClick={() => { handleLockClick(true); close() }} className={menuItemCls}>
                  <NavIcon><LockIcon /></NavIcon>
                  전체 고정
                </button>
                <button onClick={() => { handleLockClick(false); close() }} className={menuItemCls}>
                  <NavIcon><UnlockIcon /></NavIcon>
                  전체 고정 해제
                </button>
              </>
            )}
            <div className="h-px bg-[var(--color-border)] mx-2.5 my-2.5" />
            <button onClick={() => { handleClearClick(); close() }} className={menuItemCls}>
              <NavIcon danger>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              </NavIcon>
              <span className="text-red-500 group-hover:text-red-600">초기화</span>
            </button>
          </>
        )}
      />
      {memberNotice && (
        <div className="flex items-center justify-between gap-2 mx-3 mt-2 framed:mx-5 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-700">
          <span>{memberNotice}</span>
          <button onClick={() => setMemberNotice(null)} className="shrink-0 text-blue-400 hover:text-blue-600 transition-colors">
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>
          </button>
        </div>
      )}
      {/* Main content */}
      <main className="framed:px-4 framed:py-3">
        <div className="bg-[var(--color-surface)] framed:border framed:border-[var(--color-border)] framed:rounded-2xl framed:shadow-[var(--shadow-lg)] overflow-hidden animate-fade-up">
          <div className="px-2 py-2 framed:px-5 framed:py-4 framed:border-b framed:border-[var(--color-border)]">
            <ScheduleHeader
              year={year} month={month} day={day}
              title={tenant?.settings?.title || tenant?.name}
              viewType={viewType}
              onViewTypeChange={handleViewTypeChange}
              hideViewSwitcher={isPrivileged}
              displayMode={displayMode}
              onDisplayModeChange={excelMode ? undefined : setDisplayMode}
              roleToggleSlot={isSplitMode && splitRoles.length > 1 && viewType !== 'day' ? (
                <div className="flex items-center gap-1 min-w-0 max-w-full overflow-x-auto">
                  <span className="text-[10.5px] text-[var(--color-text-muted)] shrink-0 whitespace-nowrap">역할:</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {splitRoles.map(role => (
                      <button
                        key={role.id}
                        onClick={() => toggleRole(role.id)}
                        className={`px-2 py-0.5 text-[11px] rounded-full border transition-colors select-none shrink-0 whitespace-nowrap ${
                          !hiddenRoleIds.has(role.id)
                            ? 'bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] border-[var(--color-brand-primary)]'
                            : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]'
                        }`}
                      >
                        {role.name}
                      </button>
                    ))}
                    {hiddenRoleIds.size > 0 && (
                      <button
                        onClick={() => setHiddenRoleIds(new Set())}
                        className="px-2 py-0.5 text-[11px] rounded-full border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] transition-colors shrink-0 whitespace-nowrap"
                      >
                        전체
                      </button>
                    )}
                  </div>
                </div>
              ) : undefined}
              weekDays={weekDays}
              onPrev={() => { setSwipeAnim('prev'); setAnimKey(k => k + 1); viewType === 'month' ? prevMonth() : shiftDate(viewType === 'week' ? -7 : -1) }}
              onNext={() => { setSwipeAnim('next'); setAnimKey(k => k + 1); viewType === 'month' ? nextMonth() : shiftDate(viewType === 'week' ? 7 : 1) }}
              onDateSelect={(y, m, d) => {
                setYear(y)
                setMonth(m)
                if (d !== undefined) setDay(d)
              }}
            />
            <Legend legendItems={legendItems} />
          </div>

          {excelMode && (
            <div className="framed:mx-3 mt-2 mb-0 flex items-center gap-2 px-3 py-2 framed:rounded-xl bg-[color-mix(in_srgb,var(--color-brand-primary)_10%,transparent)] border border-[var(--color-brand-primary)]/30 text-sm text-[var(--color-brand-primary)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
              <span className="flex-1 font-semibold text-xs">엑셀 모드 — 클릭으로 셀 선택, Shift+클릭으로 범위, Ctrl+C/V 복사·붙여넣기</span>
              {copyBuf && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)]">복사됨</span>}
              <button
                onClick={() => { setExcelMode(false); setCellSel(null); setCopyBuf(null); setPasteHistory([]) }}
                className="ml-1 opacity-60 hover:opacity-100 transition-opacity text-xs leading-none"
              >✕</button>
            </div>
          )}
          <div className="framed:p-3 overflow-hidden">
            <div
              key={animKey}
              className={swipeAnim === 'next' ? 'animate-page-next' : swipeAnim === 'prev' ? 'animate-page-prev' : ''}
              onAnimationEnd={() => setSwipeAnim(null)}
            >
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="w-8 h-8 border-2 border-[var(--color-brand-primary)] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-[var(--color-text-muted)]">스케줄을 불러오는 중...</span>
              </div>
            ) : viewType === 'month' ? (
              displayMode === 'day' ? (
                <MonthScheduleByDay
                  year={year} month={month}
                  timeSlots={timeSlots}
                  assignments={assignments} slotSettings={slotSettings}
                  scheduleRules={scheduleRules} dateOverrides={dateOverrides}
                  splitRoles={splitRoles}
                  isSplitMode={isSplitMode}
                  hiddenRoleIds={hiddenRoleIds}
                  displayAssignmentFilter={displayAssignmentFilter}
                  withdrawnUserIds={withdrawnUserIds}
                  canAdd={canAdd}
                  memberRoleId={memberRoleId}
                  onCellClick={handleCellClick}
                />
              ) : (
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
                  hiddenRoleIds={hiddenRoleIds}
                  slotLabels={slotLabels}
                  canAdd={canAdd}
                  onCellClick={handleCellClick}
                  onHolidayCellClick={profile && isPrivileged
                    ? (d, startHour, endHour) => setHolidayTarget({ day: d, startHour, endHour })
                    : undefined}
                  displayAssignmentFilter={displayAssignmentFilter}
                  withdrawnUserIds={withdrawnUserIds}
                  highlightedSlots={highlightedSlots}
                  selectionRange={selRange}
                  copyRange={cpRange}
                />
              )
            ) : viewType === 'week' ? (
              displayMode === 'day' ? (
                <WeekScheduleByDay
                  weekDays={weekDays}
                  timeSlots={timeSlots}
                  assignments={assignments} slotSettings={slotSettings}
                  scheduleRules={scheduleRules} dateOverrides={weekDateOverrides}
                  splitRoles={splitRoles}
                  isSplitMode={isSplitMode}
                  hiddenRoleIds={hiddenRoleIds}
                  displayAssignmentFilter={displayAssignmentFilter}
                  withdrawnUserIds={withdrawnUserIds}
                  canAdd={canAdd}
                  memberRoleId={memberRoleId}
                  onCellClick={handleCellClick}
                />
              ) : (
                <WeekGrid
                  weekDays={weekDays}
                  timeSlots={timeSlots}
                  assignments={assignments} slotSettings={slotSettings}
                  scheduleRules={scheduleRules} dateOverrides={weekDateOverrides}
                  highlightName={highlightName || null}
                  profile={profile}
                  splitRoles={splitRoles}
                  indicatorBarRoles={indicatorBarRoles}
                  isSplitMode={isSplitMode}
                  hiddenRoleIds={hiddenRoleIds}
                  slotLabels={slotLabels}
                  selectedDay={new Date(year, month - 1, day)}
                  memberRoleId={memberRoleId}
                  tenantRole={tenantRole}
                  teamLeaderUserIds={teamLeaderUserIds}
                  isPrivileged={isPrivileged}
                  onDateHeaderClick={d => {
                    setYear(d.getFullYear())
                    setMonth(d.getMonth() + 1)
                    setDay(d.getDate())
                  }}
                  canAdd={canAdd}
                  onCellClick={handleCellClick}
                  displayAssignmentFilter={displayAssignmentFilter}
                  withdrawnUserIds={withdrawnUserIds}
                  highlightedSlots={highlightedSlots}
                  selectionRange={selRange}
                  copyRange={cpRange}
                />
              )
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
                isAdmin={isPrivileged}
                canAdd={canAdd}
                onCellClick={handleCellClick}
                displayAssignmentFilter={displayAssignmentFilter}
                withdrawnUserIds={withdrawnUserIds}
                selectionRange={selRange}
                copyRange={cpRange}
              />
            )}
            </div>
          </div>
        </div>
      </main>

      {modalTarget && selectedCellState && (
        <SlotEditModal
          target={modalTarget}
          cellState={selectedCellState}
          profile={profile}
          tenantRole={tenantRole}
          memberRoleId={memberRoleId}
          splitRoles={[...splitRoles, ...indicatorBarRoles]}
          isSplitMode={isSplitMode}
          tenantRoles={tenantRoles}
          tenantMode={tenantMode}
          customFields={effectiveCustomFields}
          slotLabels={slotLabels}
          typeLabels={typeLabels}
          onClose={() => setModalTarget(null)}
          tenantId={tenant?.id}
          lockedUserId={tenantMode === '회원개별' && isPrivileged ? (filterMemberId ?? undefined) : undefined}
          isHighlighted={highlightedSlots.has(`${modalTarget.year}-${pad2(modalTarget.month)}-${pad2(modalTarget.day)}|${modalTarget.timeSlot}`)}
          onToggleHighlight={isPrivileged ? () => toggleHighlight(`${modalTarget.year}-${pad2(modalTarget.month)}-${pad2(modalTarget.day)}`, modalTarget.timeSlot) : undefined}
          onAdd={(name, note, memberType, timeSub, color, userId, roleId, customerName, customerPhone, extraData) => addAssignment({
            tenant_id: tenant!.id,
            year, month, day: modalTarget.day,
            time_slot: modalTarget.timeSlot,
            member_name: name,
            note: note?.trim() || undefined,
            member_type: memberType,
            time_sub: timeSub || undefined,
            color: color || undefined,
            user_id: userId ?? (tenantMode === '비회원' ? null : profile!.id),
            role_id: roleId ?? null,
            customer_name: customerName ?? null,
            customer_phone: customerPhone ?? null,
            extra_data: extraData,
          })}
          onUpdate={(id, name, note, memberType, timeSub, color, roleId, customerName, customerPhone, extraData) => updateAssignment(id, {
            member_name: name,
            note,
            member_type: memberType,
            time_sub: timeSub ?? undefined,
            color: color ?? undefined,
            role_id: roleId ?? null,
            customer_name: customerName ?? null,
            customer_phone: customerPhone ?? null,
            extra_data: extraData,
          })}
          onDelete={deleteAssignment}
          onToggleLock={(id, locked) => updateAssignment(id, { is_locked: locked })}
        />
      )}

      {autoProposals !== null && (
        <AutoAssignPreviewModal
          proposals={autoProposals}
          memberPreferences={memberPreferences}
          roleRatios={tenant?.settings?.role_ratios}
          tenantRoles={tenantRoles}
          profiles={profiles}
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
                member_name: p.userName,
                member_type: p.memberType,
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

      {showSms && (
        <SmsModal
          assignments={assignments}
          customFields={effectiveCustomFields}
          onClose={() => setShowSms(false)}
        />
      )}

      {showRecurring && tenant && (
        <RecurringModal
          tenantId={tenant.id}
          tenantMode={rawMode}
          timeSlots={timeSlots}
          slotLabels={slotLabels}
          scheduleRules={scheduleRules}
          dateOverrides={dateOverrides}
          profile={profile}
          tenantRole={tenantRole}
          profiles={profiles}
          splitRoles={[...splitRoles, ...indicatorBarRoles]}
          isSplitMode={isSplitMode}
          initialYear={year}
          initialMonth={month}
          onClose={() => setShowRecurring(false)}
          onSuccess={(inserted, skipped) => {
            setShowRecurring(false)
            setDirectRegMsg(
              `${inserted}건 등록 완료${skipped > 0 ? ` (${skipped}건 중복 건너뜀)` : ''}`
            )
            setTimeout(() => setDirectRegMsg(null), 3000)
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
              ? `${year}년 ${month}월 스케줄을 전체 삭제합니다.\n초기화 후 복구할 수 있습니다.`
              : viewType === 'week'
              ? `${weekDays[0].getMonth() + 1}월 ${weekDays[0].getDate()}일 ~ ${weekDays[6].getMonth() + 1}월 ${weekDays[6].getDate()}일\n해당 주의 스케줄을 삭제합니다.\n초기화 후 복구할 수 있습니다.`
              : `${year}년 ${month}월 ${day}일 스케줄을 삭제합니다.\n초기화 후 복구할 수 있습니다.`
          }
          confirmLabel="삭제"
          cancelLabel="취소"
          danger
          onCancel={() => setShowClearConfirm(false)}
          onConfirm={async () => {
            setShowClearConfirm(false)

            // 삭제 대상(미잠금) 수집 → 스냅샷 저장
            let toDelete: typeof assignments
            let snapshotDays: number[] | undefined
            if (viewType === 'month') {
              toDelete = assignments.filter(a => a.year === year && a.month === month && !a.is_locked)
            } else if (viewType === 'day') {
              toDelete = assignments.filter(a => a.year === year && a.month === month && a.day === day && !a.is_locked)
              snapshotDays = [day]
            } else {
              toDelete = assignments.filter(a =>
                weekDays.some(d => d.getFullYear() === a.year && d.getMonth() + 1 === a.month && d.getDate() === a.day) && !a.is_locked
              )
              // primary month 기준 days (인접 월은 snapshot_data에서 자동 판단)
              snapshotDays = weekDays.filter(d => d.getFullYear() === year && d.getMonth() + 1 === month).map(d => d.getDate())
            }

            // 빈 슬롯 알림(하이라이트)도 함께 초기화 → 복구용으로 보관
            let highlightDates: string[]
            if (viewType === 'month') {
              const daysInMonth = new Date(year, month, 0).getDate()
              highlightDates = Array.from({ length: daysInMonth }, (_, i) => `${year}-${pad2(month)}-${pad2(i + 1)}`)
            } else if (viewType === 'day') {
              highlightDates = [`${year}-${pad2(month)}-${pad2(day)}`]
            } else {
              highlightDates = weekDays.map(d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`)
            }
            const clearedHighlights = await clearAndSnapshotHighlights(highlightDates)

            let snapshotId: string | null = null
            if (toDelete.length > 0) {
              const { snapshotId: sid } = await saveSnapshot(toDelete, {
                year, month, scope: viewType as SnapshotScope, days: snapshotDays, highlights: clearedHighlights,
              })
              snapshotId = sid
            }

            // 실제 삭제 실행
            let err: string | null = null
            const lockedCount = viewType === 'month'
              ? assignments.filter(a => a.year === year && a.month === month && a.is_locked).length
              : viewType === 'week'
              ? assignments.filter(a => weekDays.some(d => d.getFullYear() === a.year && d.getMonth() + 1 === a.month && d.getDate() === a.day) && a.is_locked).length
              : assignments.filter(a => a.year === year && a.month === month && a.day === day && a.is_locked).length
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

            if (err) {
              alert(err)
            } else {
              if (snapshotId && toDelete.length > 0) {
                setLastSnapshot({
                  id: snapshotId, year, month,
                  scope: viewType as SnapshotScope,
                  days: snapshotDays ?? null,
                  deletedCount: toDelete.length,
                })
              }
              if (lockedCount > 0) alert(`고정된 배정 ${lockedCount}건은 삭제되지 않고 유지됩니다.`)
            }
          }}
        />
      )}

      {showNoLockTarget && (
        <ConfirmDialog
          title={showNoLockTarget === 'lock' ? '고정 대상 없음' : '해제 대상 없음'}
          message={`해당 기간에 ${showNoLockTarget === 'lock' ? '고정할' : '해제할'} 스케줄이 없습니다.`}
          confirmLabel="확인"
          hideCancelButton
          onConfirm={() => setShowNoLockTarget(null)}
          onCancel={() => setShowNoLockTarget(null)}
        />
      )}

      {lockAction && (
        <ConfirmDialog
          title={lockAction === 'lock' ? '일정 고정' : '고정 해제'}
          message={
            viewType === 'month'
              ? `${year}년 ${month}월 스케줄을 전체 ${lockAction === 'lock' ? '고정' : '해제'}합니다.`
              : viewType === 'week'
              ? `${weekDays[0].getMonth() + 1}월 ${weekDays[0].getDate()}일 ~ ${weekDays[6].getMonth() + 1}월 ${weekDays[6].getDate()}일\n해당 주의 스케줄을 ${lockAction === 'lock' ? '고정' : '해제'}합니다.`
              : `${year}년 ${month}월 ${day}일 스케줄을 ${lockAction === 'lock' ? '고정' : '해제'}합니다.`
          }
          confirmLabel={lockAction === 'lock' ? '고정' : '해제'}
          cancelLabel="취소"
          onCancel={() => setLockAction(null)}
          onConfirm={async () => {
            const locked = lockAction === 'lock'
            const isSuperAdmin = !!profile?.is_super_admin
            setLockAction(null)
            let err: string | null = null
            if (viewType === 'month') {
              err = await lockAssignments(locked, isSuperAdmin)
            } else if (viewType === 'day') {
              err = await lockAssignments(locked, isSuperAdmin, [day])
            } else {
              const primaryDays = weekDays.filter(d => d.getFullYear() === year && d.getMonth() + 1 === month).map(d => d.getDate())
              if (primaryDays.length) err = await lockAssignments(locked, isSuperAdmin, primaryDays)
              if (!err && needsAdj) {
                const adjDays = weekDays.filter(d => d.getFullYear() === adjYear && d.getMonth() + 1 === adjMonth).map(d => d.getDate())
                if (adjDays.length) err = await lockAdjAssignments(locked, isSuperAdmin, adjDays)
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
          onAdd={(params) => addAssignment({ ...params, tenant_id: tenant!.id, user_id: params.user_id })}
          onUpdate={(id, params) => updateAssignment(id, params)}
          onDelete={deleteAssignment}
        />
      )}

      {lastSnapshot && (
        <div style={{
          position: 'fixed', bottom: directRegMsg ? 60 : 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9998, display: 'flex', alignItems: 'center', gap: 10,
          background: '#14171C', borderRadius: 12, padding: '10px 14px',
          boxShadow: '0 8px 24px -8px rgba(20,23,28,0.55)',
          fontFamily: '"Pretendard Variable", Pretendard, system-ui, sans-serif',
          whiteSpace: 'nowrap',
          transition: 'bottom 0.2s ease',
        }}>
          <span style={{ fontSize: 13, color: '#9AA0AB' }}>
            {lastSnapshot.deletedCount}건 초기화됨
          </span>
          <button
            onClick={() => setShowRestoreConfirm(true)}
            style={{
              background: 'oklch(0.66 0.16 28)', color: '#fff', border: 0,
              borderRadius: 7, padding: '5px 12px', fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
            }}
          >복구하기</button>
          <button
            onClick={() => setLastSnapshot(null)}
            style={{
              background: 'transparent', border: 0, color: '#71767F',
              cursor: 'pointer', padding: '2px 4px', fontSize: 15, lineHeight: 1,
            }}
          >✕</button>
        </div>
      )}

      {showRestoreConfirm && lastSnapshot && (
        <ConfirmDialog
          title="스케줄 복구"
          message={`초기화 이전 스케줄 ${lastSnapshot.deletedCount}건을 복구합니다.\n초기화 이후 등록된 스케줄은 덮어써집니다.\n계속하시겠습니까?`}
          confirmLabel="복구"
          cancelLabel="취소"
          danger
          onCancel={() => setShowRestoreConfirm(false)}
          onConfirm={async () => {
            setShowRestoreConfirm(false)
            const { restoredCount, highlights, error } = await restoreSnapshot(lastSnapshot.id)
            if (error) {
              alert(`복구 실패: ${error}`)
            } else {
              if (highlights.length > 0) {
                await restoreHighlights(highlights)
                await loadHighlights(year, month)
              }
              setLastSnapshot(null)
              setDirectRegMsg(`${restoredCount}건 스케줄이 복구됐습니다.`)
              setTimeout(() => setDirectRegMsg(null), 3000)
            }
          }}
        />
      )}

      {directRegMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] text-sm font-medium shadow-lg animate-fade-up pointer-events-none">
          {directRegMsg}
        </div>
      )}
      {excelMode && (cellSel || copyBuf || pasteHistory.length > 0) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-strong)] shadow-[var(--shadow-lg)]">
          <button
            type="button"
            onClick={runCopy}
            disabled={!selRange}
            className="select-none px-3 py-1.5 rounded-xl text-sm font-semibold bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            📋 복사
          </button>
          <button
            type="button"
            onClick={runPaste}
            disabled={!copyBuf || !isPrivileged}
            className="select-none px-3 py-1.5 rounded-xl text-sm font-semibold bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            📥 붙여넣기
          </button>
          <button
            type="button"
            onClick={runUndo}
            disabled={!pasteHistory.length || !isPrivileged}
            className="select-none px-3 py-1.5 rounded-xl text-sm font-semibold border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ↩️ 되돌리기
          </button>
          <button
            type="button"
            onClick={() => { setCellSel(null); setCopyBuf(null) }}
            className="select-none px-3 py-1.5 rounded-xl text-sm font-semibold border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            ✕ 선택해제
          </button>
        </div>
      )}
      <DevFileLabel file="SchedulePage.tsx" />
    </div>
  )
}
