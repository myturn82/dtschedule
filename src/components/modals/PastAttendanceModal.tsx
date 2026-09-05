import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../contexts/TenantContext'
import { useLessonPackages } from '../../hooks/useLessonPackages'
import { MemberSearchSelect } from '../shared/MemberSearchSelect'
import { DatePickerModal } from '../schedule/DatePickerModal'
import { DevFileLabel } from '../DevFileLabel'

interface Row {
  id: number
  date: string
  time_slot: string
}

interface SavedItem {
  id: string
  year: number
  month: number
  day: number
  time_slot: string
  note: string | null
}

interface ScheduleRule {
  day_of_week: number
  time_slot: string
  is_open: boolean
}

interface DateOverride {
  date: string
  is_open: boolean | null
  is_holiday: boolean
}

interface Props {
  tenantId: string
  members: { id: string; name: string }[]
  prefillUserId?: string
  prefillPackageId?: string
  onClose: () => void
  onSaved?: () => void
}

let _rowId = 0

const inputCls = 'px-2.5 py-1.5 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30 focus:border-[var(--color-brand-primary)]'

function pad2(n: number) { return String(n).padStart(2, '0') }

export function PastAttendanceModal({ tenantId, members, prefillUserId, prefillPackageId, onClose, onSaved }: Props) {
  const { timeSlots, slotLabels } = useTenant()
  const { packages } = useLessonPackages(tenantId)

  const [userId, setUserId] = useState(prefillUserId ?? '')
  const [packageId, setPackageId] = useState(prefillPackageId ?? '')
  const [rows, setRows] = useState<Row[]>([{ id: ++_rowId, date: '', time_slot: timeSlots[0] ?? '' }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedItems, setSavedItems] = useState<SavedItem[] | null>(null)
  const [skippedCount, setSkippedCount] = useState(0)
  const [openPickerRowId, setOpenPickerRowId] = useState<number | null>(null)

  const [scheduleRules, setScheduleRules] = useState<ScheduleRule[]>([])
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([])

  useEffect(() => {
    if (!tenantId) return
    Promise.all([
      supabase.from('schedule_rules').select('day_of_week,time_slot,is_open').eq('tenant_id', tenantId),
      supabase.from('date_overrides').select('date,is_open,is_holiday').eq('tenant_id', tenantId),
    ]).then(([rulesRes, overridesRes]) => {
      setScheduleRules((rulesRes.data ?? []) as ScheduleRule[])
      setDateOverrides((overridesRes.data ?? []) as DateOverride[])
    })
  }, [tenantId])

  // 달력에서 선택 가능한 날짜 여부 (날짜 수준 체크)
  function isDateOperational(year: number, month: number, day: number): boolean {
    const dateStr = `${year}-${pad2(month)}-${pad2(day)}`
    // 결제권이 선택된 경우 결제일 이전은 선택 불가
    if (selectedPackage && dateStr < selectedPackage.payment_date) return false
    const override = dateOverrides.find(o => o.date === dateStr)
    if (override?.is_holiday) return false
    if (override?.is_open === false) return false
    if (override?.is_open === true) return true
    if (scheduleRules.length === 0) return true
    const dow = new Date(year, month - 1, day).getDay()
    return scheduleRules.some(r => r.day_of_week === dow && r.is_open)
  }

  // 저장 시 최종 안전망 체크 (날짜+슬롯 수준)
  function isNonOperational(date: string, time_slot: string): boolean {
    if (!date) return false
    const override = dateOverrides.find(o => o.date === date)
    if (override?.is_holiday) return true
    if (override?.is_open === false) return true
    if (override?.is_open === true) return false
    const [y, m, d] = date.split('-').map(Number)
    const dow = new Date(y, m - 1, d).getDay()
    const rule = scheduleRules.find(r => r.day_of_week === dow && r.time_slot === time_slot)
    return rule !== undefined && !rule.is_open
  }

  const memberName = members.find(m => m.id === userId)?.name ?? ''
  const userPackages = packages.filter(p => p.user_id === userId)
  const selectedPackage = userPackages.find(p => p.id === packageId)

  const validRows = rows.filter(r => r.date && r.time_slot)
  const remaining = selectedPackage ? selectedPackage.total_sessions - selectedPackage.used_sessions : null
  const afterRemaining = remaining !== null && packageId ? remaining - validRows.length : null

  function addRow() {
    const last = rows[rows.length - 1]
    setRows(prev => [...prev, {
      id: ++_rowId,
      date: '',
      time_slot: last?.time_slot ?? (timeSlots[0] ?? ''),
    }])
  }

  function removeRow(id: number) {
    setRows(prev => prev.filter(r => r.id !== id))
  }

  function updateRow(id: number, field: keyof Omit<Row, 'id'>, value: string) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const handleSave = useCallback(async () => {
    if (!userId) { setError('회원을 선택해 주세요.'); return }
    if (validRows.length === 0) { setError('날짜와 시간 슬롯이 입력된 행이 없습니다.'); return }
    if (!memberName) { setError('유효하지 않은 회원입니다.'); return }

    const nonOpRows = validRows.filter(r => isNonOperational(r.date, r.time_slot))
    if (nonOpRows.length > 0) {
      setError(`비운영일은 등록할 수 없습니다: ${nonOpRows.map(r => r.date).join(', ')}`)
      return
    }

    setSaving(true); setError(null)

    const parsed = validRows.map(r => {
      const parts = r.date.split('-').map(Number)
      return {
        tenant_id: tenantId,
        year: parts[0],
        month: parts[1],
        day: parts[2],
        time_slot: r.time_slot,
        member_name: memberName,
        member_type: 'member',
        user_id: userId,
        note: null,
        lesson_package_id: packageId || null,
      }
    })

    // unique_member_assignment가 partial index라 upsert onConflict 미사용.
    // 삽입 전 기존 슬롯을 조회해 중복을 클라이언트에서 걸러낸다.
    const years = [...new Set(parsed.map(r => r.year))]
    const { data: existing, error: fetchErr } = await supabase
      .from('assignments')
      .select('year,month,day,time_slot')
      .eq('tenant_id', tenantId)
      .eq('member_name', memberName)
      .in('year', years)

    if (fetchErr) { setSaving(false); setError(fetchErr.message); return }

    const existingKeys = new Set(
      (existing ?? []).map(e => `${e.year}-${e.month}-${e.day}-${e.time_slot}`)
    )
    const toInsert = parsed.filter(r => !existingKeys.has(`${r.year}-${r.month}-${r.day}-${r.time_slot}`))
    const skipped = parsed.length - toInsert.length

    if (toInsert.length === 0) {
      setSaving(false)
      setSkippedCount(skipped)
      setSavedItems([])
      onSaved?.()
      return
    }

    const { error: dbErr } = await supabase.from('assignments').insert(toInsert)

    if (dbErr) { setSaving(false); setError(dbErr.message); return }

    // insert().select() 가 RLS 설정에 따라 빈 배열을 반환할 수 있으므로
    // 별도 SELECT로 방금 삽입한 항목의 ID를 조회한다.
    const insertedKeys = new Set(toInsert.map(r => `${r.year}-${r.month}-${r.day}-${r.time_slot}`))
    const { data: fetched } = await supabase
      .from('assignments')
      .select('id,year,month,day,time_slot,note')
      .eq('tenant_id', tenantId)
      .eq('member_name', memberName)
      .in('year', years)

    const justInserted = (fetched ?? []).filter(row =>
      insertedKeys.has(`${row.year}-${row.month}-${row.day}-${row.time_slot}`)
    ) as SavedItem[]

    setSaving(false)
    setSkippedCount(skipped)
    setSavedItems(justInserted)
    onSaved?.()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, validRows, memberName, tenantId, packageId, onSaved])

  async function handleDeleteSaved(id: string) {
    await supabase.from('assignments').delete().eq('id', id).eq('tenant_id', tenantId)
    setSavedItems(prev => prev?.filter(i => i.id !== id) ?? [])
    onSaved?.()
  }

  // ── 날짜 피커 팝업 ──────────────────────────────────────────
  const pickerRow = openPickerRowId !== null ? rows.find(r => r.id === openPickerRowId) : null
  const pickerInit = (() => {
    if (!pickerRow) return null
    if (pickerRow.date) {
      const [y, m, d] = pickerRow.date.split('-').map(Number)
      return { year: y, month: m, day: d }
    }
    const t = new Date()
    return { year: t.getFullYear(), month: t.getMonth() + 1, day: t.getDate() }
  })()

  // ── 저장 완료 화면 ─────────────────────────────────────────
  if (savedItems !== null) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 w-full max-w-sm shadow-xl flex flex-col gap-3 max-h-[80vh]">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 shrink-0"><path d="M20 6L9 17l-5-5"/></svg>
            <p className="font-bold text-[var(--color-text-primary)]">
              {savedItems.length}건 등록 완료
              {skippedCount > 0 && (
                <span className="text-xs font-normal text-[var(--color-text-muted)] ml-1">(중복 {skippedCount}건 건너뜀)</span>
              )}
            </p>
          </div>

          {savedItems.length > 0 ? (
            <>
              <p className="text-xs text-[var(--color-text-muted)]">잘못 등록한 항목은 X 버튼으로 삭제할 수 있습니다.</p>
              <div className="flex-1 overflow-y-auto flex flex-col gap-1 min-h-0">
                {savedItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[var(--color-surface-secondary)]">
                    <span className="text-sm text-[var(--color-text-secondary)] tabular-nums">
                      {item.year}-{pad2(item.month)}-{pad2(item.day)}
                      <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                        {slotLabels?.[item.time_slot] ?? item.time_slot}
                      </span>
                    </span>
                    <button
                      onClick={() => handleDeleteSaved(item.id)}
                      className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="삭제"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-[var(--color-text-muted)]">모두 이미 등록된 항목이었습니다.</p>
          )}

          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] text-sm font-semibold hover:bg-[var(--color-brand-primary-hover)]"
          >
            닫기
          </button>
        </div>
        <DevFileLabel file="PastAttendanceModal.tsx" />
      </div>
    )
  }

  // ── 입력 화면 ──────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 w-full max-w-xl shadow-xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[var(--color-text-primary)] text-[16px]">소급 출석 입력</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* 회원 + 결제권 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-0">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">회원 *</label>
            <MemberSearchSelect
              value={userId}
              onChange={v => { setUserId(v); setPackageId('') }}
              options={members}
              className={inputCls + ' w-full'}
              placeholder="회원 검색..."
            />
          </div>
          <div className="flex-1 min-w-0">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">
              결제권 <span className="font-normal text-[var(--color-text-muted)]">선택</span>
            </label>
            <select
              value={packageId}
              onChange={e => setPackageId(e.target.value)}
              disabled={!userId || userPackages.length === 0}
              className={inputCls + ' w-full'}
            >
              <option value="">결제권 없음</option>
              {userPackages.map(p => (
                <option key={p.id} value={p.id}>
                  {p.package_name} (잔여 {p.total_sessions - p.used_sessions}회)
                </option>
              ))}
            </select>
            {selectedPackage && (
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                결제일 <span className="font-semibold text-[var(--color-text-secondary)]">{selectedPackage.payment_date}</span> 이후만 선택 가능
              </p>
            )}
          </div>
        </div>

        {/* 행 목록 */}
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_28px] gap-2 px-1">
            <span className="text-xs font-semibold text-[var(--color-text-muted)]">날짜</span>
            <span className="text-xs font-semibold text-[var(--color-text-muted)]">시간 슬롯</span>
            <span />
          </div>

          {rows.map(row => (
            <div key={row.id} className="grid grid-cols-[1fr_1fr_28px] gap-2 items-center">
              <button
                type="button"
                onClick={() => setOpenPickerRowId(row.id)}
                className={inputCls + ' w-full text-left truncate' + (!row.date ? ' text-[var(--color-text-muted)]' : '')}
              >
                {row.date || '날짜 선택'}
              </button>
              <select
                value={row.time_slot}
                onChange={e => updateRow(row.id, 'time_slot', e.target.value)}
                className={inputCls + ' w-full'}
              >
                {timeSlots.map(ts => (
                  <option key={ts} value={ts}>{slotLabels?.[ts] ?? ts}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                disabled={rows.length === 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-500 hover:border-red-200 disabled:opacity-30 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary-hover)] transition-colors mt-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            행 추가
          </button>
        </div>

        {/* 요약 */}
        <div className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-secondary)] rounded-xl px-3.5 py-2.5 flex flex-wrap gap-x-4 gap-y-1">
          <span>총 <strong className="text-[var(--color-text-primary)]">{validRows.length}건</strong> 등록 예정</span>
          {packageId && remaining !== null && afterRemaining !== null && (
            <span>
              결제권 잔여{' '}
              <strong className="text-[var(--color-text-primary)]">{remaining}회</strong>
              {' → '}
              <strong className={afterRemaining < 0 ? 'text-red-500' : 'text-[var(--color-text-primary)]'}>
                {afterRemaining}회
              </strong>
            </span>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !userId}
            className="flex-1 px-4 py-2 rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] text-sm font-semibold hover:bg-[var(--color-brand-primary-hover)] disabled:opacity-40 transition-colors"
          >
            {saving ? '저장 중...' : '일괄 저장'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
          >
            취소
          </button>
        </div>
      </div>

      {/* 날짜 피커 */}
      {pickerInit && (
        <DatePickerModal
          year={pickerInit.year}
          month={pickerInit.month}
          day={pickerInit.day}
          mode="full"
          isValidDate={isDateOperational}
          onConfirm={(y, m, d) => {
            updateRow(openPickerRowId!, 'date', `${y}-${pad2(m)}-${pad2(d!)}`)
            setOpenPickerRowId(null)
          }}
          onClose={() => setOpenPickerRowId(null)}
        />
      )}

      <DevFileLabel file="PastAttendanceModal.tsx" />
    </div>
  )
}
