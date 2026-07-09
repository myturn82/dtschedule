import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useShareTenantSettings } from '../hooks/useShareTenantSettings'
import { useTenantRoles } from '../hooks/useTenantRoles'
import { useSchedule } from '../hooks/useSchedule'
import { ScheduleHeader } from '../components/schedule/ScheduleHeader'
import { ScheduleGrid } from '../components/schedule/ScheduleGrid'
import { WeekGrid } from '../components/schedule/WeekGrid'
import { getCellState } from '../utils/cellState'
import { getWeekDays, slotStartLabel } from '../utils/timeSlots'
import { getOptionUnit } from '../types'
import { fmtNumber } from '../lib/format'
import type { ViewType, ModalTarget } from '../types'

const DAY_KR = ['일', '월', '화', '수', '목', '금', '토']

export function EmbedPage() {
  const [params, setParams] = useSearchParams()
  const tidFromUrl = params.get('tid') ?? ''
  const today = new Date()
  const year = parseInt(params.get('year') ?? String(today.getFullYear()))
  const month = parseInt(params.get('month') ?? String(today.getMonth() + 1))
  const day = parseInt(params.get('day') ?? String(today.getDate()))
  const viewType: ViewType = params.get('view') === 'week' ? 'week' : 'month'

  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null)
  const [clickY, setClickY] = useState<number | null>(null)

  const {
    tenantId, timeSlots, isFreeformTenant, tenantModeReady, detailFields,
  } = useShareTenantSettings(tidFromUrl)

  const { roles: tenantRoles } = useTenantRoles(tenantId)
  const splitRoles = tenantRoles.filter(r => r.split_cell && !r.indicator_bar)
  const indicatorBarRoles = tenantRoles.filter(r => r.indicator_bar)
  const isSplitMode = splitRoles.length > 0

  const weekDays = getWeekDays(year, month, day)
  const _anchorDow = new Date(year, month - 1, day).getDay()
  const _mondayOffset = (_anchorDow + 6) % 7
  const _sundayDate = new Date(year, month - 1, day - _mondayOffset + 6)
  const adjYear = _sundayDate.getFullYear()
  const adjMonth = _sundayDate.getMonth() + 1
  const needsAdj = viewType === 'week' && (adjYear !== year || adjMonth !== month)

  const { assignments: primaryAssignments, slotSettings, scheduleRules, dateOverrides, loading } = useSchedule(tenantId, year, month)
  const { assignments: adjAssignments, dateOverrides: adjDateOverrides } = useSchedule(needsAdj ? tenantId : '', adjYear, adjMonth)
  const assignments = needsAdj ? [...primaryAssignments, ...adjAssignments] : primaryAssignments
  const weekDateOverrides = needsAdj ? [...dateOverrides, ...adjDateOverrides] : dateOverrides

  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(entries => {
      const height = Math.ceil(entries[0].contentRect.height)
      window.parent.postMessage({ source: 'dts-embed', type: 'resize', height }, '*')
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  function setView(v: ViewType) {
    const t = new Date()
    setParams({ tid: tidFromUrl, view: v, year: String(t.getFullYear()), month: String(t.getMonth() + 1), day: String(t.getDate()) })
  }

  function shiftWeek(delta: number) {
    const d = new Date(year, month - 1, day)
    d.setDate(d.getDate() + delta)
    setParams({ tid: tidFromUrl, view: viewType, year: String(d.getFullYear()), month: String(d.getMonth() + 1), day: String(d.getDate()) })
  }

  function shiftMonth(delta: number) {
    let y = year
    let m = month + delta
    if (m < 1) { y -= 1; m = 12 }
    if (m > 12) { y += 1; m = 1 }
    setParams({ tid: tidFromUrl, view: viewType, year: String(y), month: String(m), day: String(day) })
  }

  function handleCellClick(t: ModalTarget) {
    const cs = getCellState(t.day, t.timeSlot, t.year, t.month, scheduleRules, slotSettings, weekDateOverrides, assignments)
    if (cs.assignments.filter(a => a.member_type !== 'admin_note').length > 0) setModalTarget(t)
  }

  if (!tenantModeReady) {
    return <div ref={rootRef} className="p-4 text-center text-xs text-gray-400">로딩 중...</div>
  }

  if (!isFreeformTenant) {
    return (
      <div ref={rootRef} className="p-4 text-center text-xs text-gray-400">
        이 위젯은 비회원 모드 조직에서만 사용할 수 있습니다.
      </div>
    )
  }

  const modalCellState = modalTarget
    ? getCellState(modalTarget.day, modalTarget.timeSlot, modalTarget.year, modalTarget.month, scheduleRules, slotSettings, weekDateOverrides, assignments)
    : null

  const MODAL_EST_HEIGHT = 420
  const modalTop = Math.min(
    Math.max((clickY ?? window.innerHeight / 2) - 20, 12),
    Math.max(window.innerHeight - MODAL_EST_HEIGHT, 12)
  )

  return (
    <div ref={rootRef} className="bg-white dark:bg-gray-800 p-2">
      <ScheduleHeader
        year={year} month={month} day={day}
        viewType={viewType}
        onViewTypeChange={setView}
        weekDays={weekDays}
        onPrev={() => (viewType === 'month' ? shiftMonth(-1) : shiftWeek(-7))}
        onNext={() => (viewType === 'month' ? shiftMonth(1) : shiftWeek(7))}
      />
      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">로딩 중...</div>
      ) : (
        <div onClick={e => setClickY(e.clientY)}>
          {viewType === 'month' ? (
            <ScheduleGrid
              year={year} month={month}
              timeSlots={timeSlots}
              assignments={assignments} slotSettings={slotSettings}
              scheduleRules={scheduleRules} dateOverrides={dateOverrides}
              splitRoles={splitRoles}
              indicatorBarRoles={indicatorBarRoles}
              isSplitMode={isSplitMode}
              highlightName={null}
              canAdd={false}
              onCellClick={handleCellClick}
            />
          ) : (
            <WeekGrid
              weekDays={weekDays}
              timeSlots={timeSlots}
              assignments={assignments} slotSettings={slotSettings}
              scheduleRules={scheduleRules} dateOverrides={weekDateOverrides}
              highlightName={null}
              profile={null}
              isPrivileged
              splitRoles={splitRoles}
              indicatorBarRoles={indicatorBarRoles}
              isSplitMode={isSplitMode}
              canAdd={false}
              onCellClick={handleCellClick}
            />
          )}
        </div>
      )}

      {modalTarget && modalCellState && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setModalTarget(null)}
        >
          <div
            className="fixed left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-5 w-[calc(100%-2rem)] max-w-sm"
            style={{ top: modalTop }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-base font-bold text-[var(--color-text-primary)]">
                  {modalTarget.month}월 {modalTarget.day}일 ({DAY_KR[new Date(modalTarget.year, modalTarget.month - 1, modalTarget.day).getDay()]})
                </span>
                <span className="ml-2 text-sm text-[var(--color-text-muted)]">
                  {slotStartLabel(modalTarget.timeSlot)}
                </span>
              </div>
              <button
                onClick={() => setModalTarget(null)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-[var(--color-text-muted)] mb-3">
              {modalCellState.assignments.filter(a => a.member_type !== 'admin_note').length}명 / {modalCellState.maxCapacity}명
            </div>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {modalCellState.assignments
                .filter(a => a.member_type !== 'admin_note')
                .map(a => {
                  const detailChips = detailFields
                    .filter(f => f.type !== 'image_upload')
                    .map(f => {
                      const val = a.extra_data?.[f.id]
                      if (!val) return null
                      const unit = getOptionUnit(f.options?.find(o => o.value === val)?.value_type)
                      return { key: f.id, label: f.label, value: `${fmtNumber(val)}${unit}` }
                    })
                    .filter((c): c is { key: string; label: string; value: string } => c !== null)
                  if (a.note) detailChips.push({ key: 'note', label: '메모', value: a.note })

                  return (
                    <div key={a.id} className="flex flex-col gap-1.5 px-3 py-2 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold bg-[oklch(0.95_0.045_28)] text-[oklch(0.45_0.14_28)]">
                          {a.member_name?.charAt(0) ?? '?'}
                        </span>
                        <span className="text-sm font-semibold text-[var(--color-text-primary)]">{a.member_name}</span>
                      </div>
                      {detailChips.length > 0 && (
                        <div className="flex flex-wrap gap-1 pl-9">
                          {detailChips.map(c => (
                            <span key={c.key} className="text-[11px] font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border)] px-1.5 py-0.5 rounded-md">
                              {c.label}: {c.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
