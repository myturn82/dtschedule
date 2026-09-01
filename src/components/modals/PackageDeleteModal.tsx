import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { DevFileLabel } from '../DevFileLabel'

interface Assignment {
  id: string
  year: number
  month: number
  day: number
  time_slot: string
  note: string | null
}

interface Props {
  tenantId: string
  packageId: string
  packageName: string
  memberName: string
  slotLabels: Record<string, string> | null
  onClose: () => void
  onPackageDeleted: () => void
  onAssignmentsChanged: () => void
}

function pad2(n: number) { return String(n).padStart(2, '0') }

export function PackageDeleteModal({
  tenantId, packageId, packageName, memberName, slotLabels,
  onClose, onPackageDeleted, onAssignmentsChanged,
}: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    supabase
      .from('assignments')
      .select('id,year,month,day,time_slot,note')
      .eq('tenant_id', tenantId)
      .eq('lesson_package_id', packageId)
      .order('year').order('month').order('day')
      .then(({ data }) => {
        setAssignments((data ?? []) as Assignment[])
        setLoading(false)
      })
  }, [tenantId, packageId])

  function toggleCheck(id: string) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setChecked(prev =>
      prev.size === assignments.length ? new Set() : new Set(assignments.map(a => a.id))
    )
  }

  async function handleDeleteSelected() {
    if (checked.size === 0) return
    setDeleting(true)
    await supabase
      .from('assignments')
      .delete()
      .in('id', [...checked])
      .eq('tenant_id', tenantId)
    setAssignments(prev => prev.filter(a => !checked.has(a.id)))
    setChecked(new Set())
    setDeleting(false)
    onAssignmentsChanged()
  }

  async function handleDeletePackage() {
    if (!confirm(`"${packageName}" 결제기록과 연결된 출석 기록 ${assignments.length}건을 모두 삭제할까요?`)) return
    setDeleting(true)
    // 연결된 출석 기록 먼저 삭제 (FK 충돌 방지 겸)
    if (assignments.length > 0) {
      await supabase
        .from('assignments')
        .delete()
        .in('id', assignments.map(a => a.id))
        .eq('tenant_id', tenantId)
    }
    await supabase
      .from('lesson_packages')
      .delete()
      .eq('id', packageId)
      .eq('tenant_id', tenantId)
    setDeleting(false)
    onPackageDeleted()
  }

  const allChecked = assignments.length > 0 && checked.size === assignments.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 w-full max-w-sm shadow-xl flex flex-col gap-4 max-h-[80vh]">

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[var(--color-text-primary)] text-[16px]">결제기록 관리</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="text-sm text-[var(--color-text-secondary)]">
          <span className="font-semibold text-[var(--color-text-primary)]">{memberName}</span>
          {' · '}
          {packageName}
        </div>

        {/* 출석 기록 섹션 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
              연결된 출석 기록{loading ? '' : ` (${assignments.length}건)`}
            </span>
            {assignments.length > 0 && (
              <button
                onClick={toggleAll}
                className="text-xs text-[var(--color-brand-primary)] hover:underline"
              >
                {allChecked ? '전체 해제' : '전체 선택'}
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-xs text-[var(--color-text-muted)] text-center py-4">불러오는 중...</p>
          ) : assignments.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)] text-center py-4 bg-[var(--color-surface-secondary)] rounded-xl">
              연결된 출석 기록이 없습니다.
            </p>
          ) : (
            <div className="overflow-y-auto flex flex-col gap-1 max-h-48">
              {assignments.map(a => (
                <label
                  key={a.id}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[var(--color-surface-secondary)] cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checked.has(a.id)}
                    onChange={() => toggleCheck(a.id)}
                    className="w-4 h-4 rounded accent-[var(--color-brand-primary)]"
                  />
                  <span className="text-sm text-[var(--color-text-secondary)] tabular-nums">
                    {a.year}-{pad2(a.month)}-{pad2(a.day)}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {slotLabels?.[a.time_slot] ?? a.time_slot}
                  </span>
                  {a.note && (
                    <span className="text-xs text-[var(--color-text-muted)] truncate ml-auto">{a.note}</span>
                  )}
                </label>
              ))}
            </div>
          )}

          <button
            onClick={handleDeleteSelected}
            disabled={checked.size === 0 || deleting}
            className="w-full py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 transition-colors"
          >
            등록일별 삭제{checked.size > 0 ? ` (${checked.size}건)` : ''}
          </button>
        </div>

        {/* 결제기록 전체 삭제 */}
        <div className="border-t border-[var(--color-border)] pt-3 flex flex-col gap-1.5">
          <button
            onClick={handleDeletePackage}
            disabled={deleting}
            className="w-full py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-40 transition-colors"
          >
            결제기록 전체 삭제
          </button>
          <p className="text-[10px] text-[var(--color-text-muted)] text-center">
            연결된 출석 기록도 함께 삭제됩니다.
          </p>
        </div>

      </div>
      <DevFileLabel file="PackageDeleteModal.tsx" />
    </div>
  )
}
