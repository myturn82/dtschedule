import { useState, useMemo, useEffect } from 'react'
import { DevFileLabel } from '../DevFileLabel'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../contexts/TenantContext'
import { useAuth } from '../../hooks/useAuth'
import { useProfiles } from '../../hooks/useProfiles'
import { useAiParse } from '../../hooks/useAiParse'
import { parseBookingText, type BookingProposal, type BookingAction, type BookingTargetScope } from '../../lib/aiParse'
import { fuzzyMatchName } from '../../lib/fuzzyMatch'
import { getDatesForPattern } from '../../utils/recurringDates'
import { parseSlotLabel } from '../../utils/timeSlots'
import type { CustomFieldDef, ScheduleRule, DateOverride, Assignment } from '../../types'

interface Props {
  onClose: () => void
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const pad = (n: number) => String(n).padStart(2, '0')
const ymdNum = (a: { year: number; month: number; day: number }) => a.year * 10000 + a.month * 100 + a.day

function getTenantToday(timezone: string): { date: string; weekday: number } {
  const now = new Date()
  const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now)
  const weekdayStr = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short' }).format(now)
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return { date: dateStr, weekday: map[weekdayStr] ?? now.getDay() }
}

function parseYmd(ymd: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd)
  if (!m) return null
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) }
}

export function QuickBookingModal({ onClose }: Props) {
  const { tenant, tenantRole } = useTenant()
  const { profile } = useAuth()
  const isPrivileged = !!profile?.is_super_admin || tenantRole === 'admin'
  const isFreeform = tenant?.settings?.tenant_mode === '비회원'
  const { profiles } = useProfiles()
  const today = useMemo(() => getTenantToday(tenant?.settings?.timezone || 'Asia/Seoul'), [tenant?.settings?.timezone])

  const timeSlots = tenant?.settings?.time_slots ?? []
  const slotLabels = tenant?.settings?.slot_labels ?? {}
  const customFields: CustomFieldDef[] = tenant?.settings?.custom_fields ?? []

  const [text, setText] = useState('')
  const [proposal, setProposal] = useState<BookingProposal | null>(null)
  const { run, loading, error } = useAiParse(parseBookingText)
  const action: BookingAction = proposal?.action ?? 'create'

  const [isRecurring, setIsRecurring] = useState(false)
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])

  // 단일 날짜 모드
  const [targetYear, setTargetYear] = useState(() => Number(today.date.slice(0, 4)))
  const [targetMonth, setTargetMonth] = useState(() => Number(today.date.slice(5, 7)))
  const [targetDay, setTargetDay] = useState<number | null>(null)
  const [weekdayMismatch, setWeekdayMismatch] = useState(false)

  // 반복 등록 모드 (자동배정/반복등록의 요일 패턴 방식과 동일, create 전용)
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState<number[]>([])
  const [recurrenceStart, setRecurrenceStart] = useState('')
  const [recurrenceEnd, setRecurrenceEnd] = useState('')

  // update/delete 대상 범위 (single: 특정 하루, range: 기간 전체 — "7월 전체" 등)
  const [targetScope, setTargetScope] = useState<BookingTargetScope>('single')
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')

  const [note, setNote] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [extraData, setExtraData] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [doneMessage, setDoneMessage] = useState<string | null>(null)

  // update/delete 대상 후보 (복수 선택 가능 — 기본은 전체 선택, 필요하면 체크 해제)
  const [candidates, setCandidates] = useState<Assignment[]>([])
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([])
  const [newTimeSlot, setNewTimeSlot] = useState('')
  const [newNoteValue, setNewNoteValue] = useState('')

  // schedule_rules는 요일×슬롯 개폐 여부만 담고 있어 날짜와 무관 — 테넌트 단위로 한 번만 조회
  const [scheduleRules, setScheduleRules] = useState<ScheduleRule[]>([])
  useEffect(() => {
    const tenantId = tenant?.id
    if (!tenantId) return
    supabase.from('schedule_rules').select('*').eq('tenant_id', tenantId).then(({ data }) => setScheduleRules(data ?? []))
  }, [tenant?.id])

  // 휴일·휴관 오버라이드는 create의 등록 대상 계산에만 필요 — 단일 날짜 또는 반복 기간만 조회
  const effectiveRange = useMemo(() => {
    if (isRecurring) {
      if (!recurrenceStart || !recurrenceEnd) return null
      return { start: recurrenceStart, end: recurrenceEnd }
    }
    if (action !== 'create' || !targetDay) return null
    const d = `${targetYear}-${pad(targetMonth)}-${pad(targetDay)}`
    return { start: d, end: d }
  }, [action, isRecurring, recurrenceStart, recurrenceEnd, targetYear, targetMonth, targetDay])

  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([])
  useEffect(() => {
    const tenantId = tenant?.id
    if (!tenantId || !effectiveRange) return
    supabase.from('date_overrides').select('*').eq('tenant_id', tenantId)
      .gte('date', effectiveRange.start).lte('date', effectiveRange.end)
      .then(({ data }) => setDateOverrides(data ?? []))
  }, [tenant?.id, effectiveRange])

  const nameMatches = useMemo(() => {
    if (isFreeform || !proposal || !proposal.person_name_guess) return []
    return fuzzyMatchName(proposal.person_name_guess, profiles.map(p => ({ id: p.id, name: p.name })))
  }, [isFreeform, proposal, profiles])

  const memberName = isFreeform ? customerName.trim() : (profiles.find(p => p.id === selectedUserId)?.name ?? '')

  // create: 등록 대상 (날짜, 시간대) 쌍 — 단일 날짜도 "반복 1회"로 취급해 동일한 로직(휴무일 필터링 포함)을 공유
  const targetPairs = useMemo(() => {
    if (action !== 'create' || !selectedSlots.length) return []
    if (isRecurring) {
      if (!recurrenceWeekdays.length || !recurrenceStart || !recurrenceEnd) return []
      const start = new Date(recurrenceStart)
      const end = new Date(recurrenceEnd)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return []
      return selectedSlots.flatMap(slot =>
        getDatesForPattern(start, end, recurrenceWeekdays, slot, scheduleRules, dateOverrides).map(d => ({ ...d, time_slot: slot }))
      )
    }
    if (!targetDay) return []
    const target = new Date(targetYear, targetMonth - 1, targetDay)
    const wd = target.getDay()
    return selectedSlots.flatMap(slot =>
      getDatesForPattern(target, target, [wd], slot, scheduleRules, dateOverrides).map(d => ({ ...d, time_slot: slot }))
    )
  }, [action, isRecurring, selectedSlots, recurrenceWeekdays, recurrenceStart, recurrenceEnd, targetDay, targetYear, targetMonth, scheduleRules, dateOverrides])

  const uniqueDateKeys = useMemo(() => [...new Set(targetPairs.map(p => `${p.year}-${p.month}-${p.day}`))], [targetPairs])

  // update/delete: 대상 후보(들) 조회 — 대상자(+선택한 시간대)로 단일 날짜 또는 기간 전체에서 기존 배정을 찾는다
  useEffect(() => {
    const tenantId = tenant?.id
    if (!tenantId || action === 'create' || !memberName) return

    if (targetScope === 'range') {
      const s = parseYmd(rangeStart)
      const e = parseYmd(rangeEnd)
      if (!s || !e) return
      let query = supabase.from('assignments').select('*')
        .eq('tenant_id', tenantId).eq('member_name', memberName)
        .gte('year', s.year).lte('year', e.year)
      if (selectedSlots.length > 0) query = query.in('time_slot', selectedSlots)
      query.then(({ data }) => {
        const startNum = ymdNum(s)
        const endNum = ymdNum(e)
        const rows = ((data ?? []) as Assignment[]).filter(a => {
          const n = ymdNum(a)
          return n >= startNum && n <= endNum
        })
        setCandidates(rows)
        setSelectedCandidateIds(rows.map(r => r.id))
      })
      return
    }

    if (!targetDay) return
    let query = supabase.from('assignments').select('*')
      .eq('tenant_id', tenantId).eq('year', targetYear).eq('month', targetMonth).eq('day', targetDay)
      .eq('member_name', memberName)
    if (selectedSlots.length > 0) query = query.in('time_slot', selectedSlots)
    query.then(({ data }) => {
      const rows = (data ?? []) as Assignment[]
      setCandidates(rows)
      setSelectedCandidateIds(rows.map(r => r.id))
    })
  }, [tenant?.id, action, targetScope, targetYear, targetMonth, targetDay, rangeStart, rangeEnd, memberName, selectedSlots])

  function toggleSlot(slot: string) {
    setSelectedSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot])
  }

  function toggleWeekday(dow: number) {
    setRecurrenceWeekdays(prev => prev.includes(dow) ? prev.filter(d => d !== dow) : [...prev, dow])
  }

  function toggleCandidate(id: string) {
    setSelectedCandidateIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleParse() {
    if (!text.trim() || !tenant) return
    setProposal(null); setSubmitError(null); setDoneMessage(null)
    setCandidates([]); setSelectedCandidateIds([]); setNewTimeSlot(''); setNewNoteValue(''); setNote('')
    const result = await run(text, {
      today: today.date,
      todayWeekday: today.weekday,
      timeSlots,
      customFields: customFields.map(f => ({ id: f.id, label: f.label, type: f.type })),
    })
    if (!result) return
    setProposal(result)

    setIsRecurring(result.action === 'create' && !!result.is_recurring)
    setSelectedSlots(result.time_slots_guess.filter(s => timeSlots.includes(s)))
    setCustomerName(isFreeform ? (result.person_name_guess ?? '') : '')
    setExtraData(result.custom_field_guesses ?? {})
    setTargetScope(result.target_scope === 'range' ? 'range' : 'single')

    if (result.action === 'update') {
      setNewTimeSlot(result.new_time_slot_guess && timeSlots.includes(result.new_time_slot_guess) ? result.new_time_slot_guess : '')
    }

    if (result.action === 'create' && result.is_recurring) {
      setRecurrenceWeekdays(result.recurrence_weekdays ?? [])
      setRecurrenceStart(result.recurrence_start_date ?? '')
      setRecurrenceEnd(result.recurrence_end_date ?? '')
      setTargetDay(null)
    } else if (result.action !== 'create' && result.target_scope === 'range') {
      setRangeStart(result.range_start_date ?? '')
      setRangeEnd(result.range_end_date ?? '')
      setTargetDay(null)
    } else {
      const ymd = parseYmd(result.resolved_date)
      if (ymd) {
        setTargetYear(ymd.year); setTargetMonth(ymd.month); setTargetDay(ymd.day)
        const actualWeekday = new Date(ymd.year, ymd.month - 1, ymd.day).getDay()
        setWeekdayMismatch(actualWeekday !== result.weekday_guess)
      } else {
        setTargetDay(null)
      }
    }

    if (!isFreeform && result.person_name_guess) {
      const matches = fuzzyMatchName(result.person_name_guess, profiles.map(p => ({ id: p.id, name: p.name })))
      setSelectedUserId(matches[0]?.score >= 0.6 ? matches[0].id : '')
    } else {
      setSelectedUserId('')
    }
  }

  const requiredFields = customFields.filter(f => f.required)
  const missingRequiredFields = requiredFields.filter(f => !extraData[f.id]?.trim())

  const canSubmit =
    action === 'create' ? (targetPairs.length > 0 && !!memberName && missingRequiredFields.length === 0)
    : action === 'update' ? (selectedCandidateIds.length > 0 && (!!newTimeSlot || newNoteValue.trim() !== ''))
    : selectedCandidateIds.length > 0 // delete

  async function handleConfirmCreate() {
    if (!tenant || targetPairs.length === 0 || !memberName) return
    const member = profiles.find(p => p.id === selectedUserId)
    const years = targetPairs.map(p => p.year)
    const { data: existing } = await supabase
      .from('assignments')
      .select('year, month, day, time_slot')
      .eq('tenant_id', tenant.id)
      .eq('member_name', memberName)
      .gte('year', Math.min(...years))
      .lte('year', Math.max(...years))

    const existingSet = new Set((existing ?? []).map(e => `${e.year}-${e.month}-${e.day}-${e.time_slot}`))
    const toInsert = targetPairs
      .filter(p => !existingSet.has(`${p.year}-${p.month}-${p.day}-${p.time_slot}`))
      .map(p => ({
        tenant_id: tenant.id,
        year: p.year,
        month: p.month,
        day: p.day,
        time_slot: p.time_slot,
        member_name: memberName,
        member_type: 'member',
        user_id: isFreeform ? null : (selectedUserId || null),
        role_id: member?.tenantRoleId ?? null,
        customer_name: isFreeform ? memberName : null,
        note: note.trim() || null,
        extra_data: Object.keys(extraData).length > 0 ? extraData : undefined,
      }))

    const skipped = targetPairs.length - toInsert.length
    if (toInsert.length > 0) {
      const { error: err } = await supabase.from('assignments').insert(toInsert)
      if (err) { setSubmitError(err.message); return }
    }
    setDoneMessage(`${toInsert.length}건 등록했어요${skipped > 0 ? ` (중복 ${skipped}건 제외)` : ''}`)
  }

  async function handleConfirmUpdate() {
    if (selectedCandidateIds.length === 0) return
    const changes: { time_slot?: string; note?: string } = {}
    if (newTimeSlot) changes.time_slot = newTimeSlot
    if (newNoteValue.trim()) changes.note = newNoteValue.trim()
    if (Object.keys(changes).length === 0) { setSubmitError('바꿀 내용을 입력해주세요.'); return }
    const { error: err } = await supabase.from('assignments').update(changes).in('id', selectedCandidateIds)
    if (err) { setSubmitError(err.message); return }
    setDoneMessage(`${selectedCandidateIds.length}건 변경했어요.`)
  }

  async function handleConfirmDelete() {
    if (selectedCandidateIds.length === 0) return
    const { error: err } = await supabase.from('assignments').delete().in('id', selectedCandidateIds)
    if (err) { setSubmitError(err.message); return }
    setDoneMessage(`${selectedCandidateIds.length}건 삭제했어요.`)
  }

  async function handleConfirm() {
    if (!tenant || submitting) return
    setSubmitting(true); setSubmitError(null)
    if (action === 'create') await handleConfirmCreate()
    else if (action === 'update') await handleConfirmUpdate()
    else await handleConfirmDelete()
    setSubmitting(false)
  }

  if (!tenant || !isPrivileged) return null

  const dateSummary = isRecurring
    ? (recurrenceStart && recurrenceEnd
        ? `${recurrenceStart} ~ ${recurrenceEnd} · 매주 ${recurrenceWeekdays.map(d => DAY_LABELS[d]).join('·') || '(요일 미지정)'}`
        : '기간을 인식하지 못했어요.')
    : (action !== 'create' && targetScope === 'range')
      ? (rangeStart && rangeEnd ? `${rangeStart} ~ ${rangeEnd} 전체` : '기간을 인식하지 못했어요.')
      : (targetDay
          ? `${targetYear}년 ${targetMonth}월 ${targetDay}일 (${DAY_LABELS[new Date(targetYear, targetMonth - 1, targetDay).getDay()]})`
          : '날짜를 인식하지 못했어요.')

  const submitLabel = submitting ? '처리 중...'
    : action === 'create' ? `${targetPairs.length}건 등록`
    : action === 'update' ? `${selectedCandidateIds.length}건 변경`
    : `${selectedCandidateIds.length}건 삭제`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-1.5">
            <span className="text-base leading-none select-none">✨</span> 자연어로 예약 관리
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        {doneMessage ? (
          <div className="text-center py-4 space-y-2">
            <div className="text-3xl">✅</div>
            <p className="text-sm text-[var(--color-text-secondary)]">{doneMessage}</p>
            <button
              onClick={onClose}
              className="mt-2 px-4 py-2 text-sm font-medium rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] hover:bg-[var(--color-brand-primary-hover)] transition-colors"
            >
              닫기
            </button>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">등록·변경·취소를 자유롭게 입력하세요</label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="예: 홍길동님 이번주 일요일 9시부터 12시까지 / 홍길동님 7월 20일 9시 예약을 10시로 변경 / 홍길동님 7월 전체 15시 일정 삭제"
                rows={3}
                className="w-full border border-[var(--color-border-strong)] rounded-xl px-3 py-2 text-sm bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] focus:outline-none resize-y"
              />
            </div>

            {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>}

            <button
              onClick={handleParse}
              disabled={!text.trim() || loading}
              className="w-full py-2 text-sm font-semibold rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] hover:bg-[var(--color-brand-primary-hover)] disabled:opacity-50 transition-colors"
            >
              {loading ? 'AI가 분석 중...' : proposal ? '내용 수정했어요 · 다시 분석하기' : '분석하기'}
            </button>

            {proposal && (
              <div className="space-y-3 border border-[var(--color-border)] rounded-xl p-3 bg-[var(--color-surface-secondary)]">
                <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
                  {action === 'create' ? '아래 내용을 확인하고 등록해주세요' : action === 'update' ? '변경할 예약을 확인해주세요' : '삭제할 예약을 확인해주세요'}
                </p>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">
                    {isRecurring ? '반복 기간·요일' : (action !== 'create' && targetScope === 'range') ? '대상 기간' : '날짜'}
                  </label>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{dateSummary}</p>
                  {weekdayMismatch && !isRecurring && targetScope === 'single' && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">⚠ AI가 계산한 요일과 실제 날짜의 요일이 달라요. 날짜를 다시 확인해주세요.</p>
                  )}

                  {isRecurring && action === 'create' && (
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-1">
                        {DAY_LABELS.map((label, dow) => (
                          <button
                            key={dow}
                            type="button"
                            onClick={() => toggleWeekday(dow)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              recurrenceWeekdays.includes(dow)
                                ? 'bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)]'
                                : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2 items-center">
                        <input type="date" value={recurrenceStart} onChange={e => setRecurrenceStart(e.target.value)}
                          className="flex-1 border border-[var(--color-border-strong)] rounded-lg px-2 py-1.5 text-xs bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none" />
                        <span className="text-[var(--color-text-muted)] text-xs shrink-0">~</span>
                        <input type="date" value={recurrenceEnd} onChange={e => setRecurrenceEnd(e.target.value)}
                          className="flex-1 border border-[var(--color-border-strong)] rounded-lg px-2 py-1.5 text-xs bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none" />
                      </div>
                    </div>
                  )}

                  {action !== 'create' && targetScope === 'range' && (
                    <div className="flex gap-2 items-center mt-2">
                      <input type="date" value={rangeStart} onChange={e => setRangeStart(e.target.value)}
                        className="flex-1 border border-[var(--color-border-strong)] rounded-lg px-2 py-1.5 text-xs bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none" />
                      <span className="text-[var(--color-text-muted)] text-xs shrink-0">~</span>
                      <input type="date" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)}
                        className="flex-1 border border-[var(--color-border-strong)] rounded-lg px-2 py-1.5 text-xs bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">
                    {action === 'create' ? '시간대 (복수 선택 가능)' : '검색할 시간대 (비워두면 전체에서 찾기)'}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {timeSlots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => toggleSlot(slot)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          selectedSlots.includes(slot)
                            ? 'bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] border-[var(--color-brand-primary)]'
                            : 'border-[var(--color-border)] text-[var(--color-text-secondary)] bg-[var(--color-surface)]'
                        }`}
                      >
                        {slotLabels[slot] || parseSlotLabel(slot)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">대상자</label>
                  {isFreeform ? (
                    <input
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="이름"
                      className="w-full border border-[var(--color-border-strong)] rounded-lg px-2.5 py-1.5 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none"
                    />
                  ) : (
                    <>
                      <select
                        value={selectedUserId}
                        onChange={e => setSelectedUserId(e.target.value)}
                        className="w-full border border-[var(--color-border-strong)] rounded-lg px-2.5 py-1.5 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none"
                      >
                        <option value="">직접 선택해주세요</option>
                        {nameMatches.map(m => (
                          <option key={m.id} value={m.id}>{m.name}{m.score < 1 ? ' (유사)' : ''}</option>
                        ))}
                        {profiles.filter(p => !nameMatches.some(m => m.id === p.id)).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      {proposal.person_name_guess && nameMatches.length === 0 && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                          "{proposal.person_name_guess}"와 일치하는 회원을 찾지 못했어요. 직접 선택해주세요.
                        </p>
                      )}
                    </>
                  )}
                </div>

                {action !== 'create' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-medium text-[var(--color-text-muted)]">
                        대상 예약{candidates.length > 0 ? ` (${selectedCandidateIds.length}/${candidates.length}건 선택)` : ''}
                      </label>
                      {candidates.length > 1 && (
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setSelectedCandidateIds(candidates.map(c => c.id))} className="text-[11px] text-[var(--color-brand-primary)] font-semibold">전체 선택</button>
                          <button type="button" onClick={() => setSelectedCandidateIds([])} className="text-[11px] text-[var(--color-text-muted)] font-semibold">전체 해제</button>
                        </div>
                      )}
                    </div>
                    {!memberName ? (
                      <p className="text-xs text-[var(--color-text-muted)]">대상자를 먼저 선택해주세요.</p>
                    ) : candidates.length === 0 ? (
                      <p className="text-xs text-[var(--color-text-muted)]">해당 {targetScope === 'range' ? '기간' : '날짜'}·대상자로 등록된 예약을 찾지 못했어요.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {candidates.map(c => (
                          <label
                            key={c.id}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer ${
                              selectedCandidateIds.includes(c.id) ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/8' : 'border-[var(--color-border)]'
                            }`}
                          >
                            <input type="checkbox" checked={selectedCandidateIds.includes(c.id)} onChange={() => toggleCandidate(c.id)} />
                            {targetScope === 'range' && <span className="text-[var(--color-text-muted)]">{c.month}/{c.day}</span>}
                            <span className="font-medium text-[var(--color-text-primary)]">{slotLabels[c.time_slot] || parseSlotLabel(c.time_slot)}</span>
                            {c.note && <span className="text-[var(--color-text-muted)]">· {c.note}</span>}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {action === 'update' && selectedCandidateIds.length > 0 && (
                  <>
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">새 시간 (변경 안 하면 비워두세요)</label>
                      <select
                        value={newTimeSlot}
                        onChange={e => setNewTimeSlot(e.target.value)}
                        className="w-full border border-[var(--color-border-strong)] rounded-lg px-2.5 py-1.5 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none"
                      >
                        <option value="">변경 안 함</option>
                        {timeSlots.map(s => (
                          <option key={s} value={s}>{slotLabels[s] || parseSlotLabel(s)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">새 메모 (변경 안 하면 비워두세요)</label>
                      <input
                        value={newNoteValue}
                        onChange={e => setNewNoteValue(e.target.value)}
                        className="w-full border border-[var(--color-border-strong)] rounded-lg px-2.5 py-1.5 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {action === 'delete' && selectedCandidateIds.length > 0 && (
                  <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
                    선택한 {selectedCandidateIds.length}건을 삭제합니다. 되돌릴 수 없어요.
                  </p>
                )}

                {action === 'create' && requiredFields.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium text-[var(--color-text-muted)]">필수 입력 정보</p>
                    {requiredFields.map(f => (
                      <input
                        key={f.id}
                        value={extraData[f.id] ?? ''}
                        onChange={e => setExtraData(prev => ({ ...prev, [f.id]: e.target.value }))}
                        placeholder={f.label}
                        className="w-full border border-[var(--color-border-strong)] rounded-lg px-2.5 py-1.5 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none"
                      />
                    ))}
                  </div>
                )}

                {action === 'create' && (
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">메모</label>
                    <input
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      className="w-full border border-[var(--color-border-strong)] rounded-lg px-2.5 py-1.5 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none"
                    />
                  </div>
                )}

                {action === 'create' && selectedSlots.length > 0 && (
                  targetPairs.length > 0 ? (
                    <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
                      등록 예정: <span className="text-[var(--color-brand-primary)] font-bold">{targetPairs.length}건</span>
                      {selectedSlots.length > 1 && (
                        <span className="text-[var(--color-text-muted)] ml-1.5">({uniqueDateKeys.length}일 × {selectedSlots.length}시간대)</span>
                      )}
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--color-text-muted)]">선택한 조건에 해당하는 날짜가 없어요 (휴무일이거나 기간·요일을 다시 확인해주세요).</p>
                  )
                )}

                {submitError && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{submitError}</p>}

                <button
                  onClick={handleConfirm}
                  disabled={!canSubmit || submitting}
                  className={`w-full py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 ${
                    action === 'delete'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] hover:bg-[var(--color-brand-primary-hover)]'
                  }`}
                >
                  {submitLabel}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <DevFileLabel file="QuickBookingModal.tsx" />
    </div>
  )
}
