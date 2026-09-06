import { useState } from 'react'
import { useLessonPackages } from '../../hooks/useLessonPackages'
import { useTenant } from '../../contexts/TenantContext'
import { PastAttendanceModal } from './PastAttendanceModal'
import { PackageDeleteModal } from './PackageDeleteModal'
import { DevFileLabel } from '../DevFileLabel'
import type { LessonPackageWithUsage } from '../../types'

interface Props {
  tenantId: string
  userId: string
  memberName: string
  profileId: string
  onClose: () => void
  onChanged: () => void
}

function pkgStatus(pkg: Pick<LessonPackageWithUsage, 'total_sessions' | 'used_sessions' | 'expires_at'>): 'active' | 'warn' | 'expired' | 'done' {
  const today = new Date().toISOString().slice(0, 10)
  if (pkg.used_sessions >= pkg.total_sessions) return 'done'
  if (pkg.expires_at && pkg.expires_at < today) return 'expired'
  if (pkg.expires_at) {
    const daysLeft = Math.ceil((new Date(pkg.expires_at).getTime() - Date.now()) / 86400000)
    if (daysLeft <= 7) return 'warn'
  }
  return 'active'
}

const STATUS_LABEL: Record<ReturnType<typeof pkgStatus>, string> = {
  active: '진행중', warn: '만료임박', expired: '만료', done: '사용완료',
}
const STATUS_CLS: Record<ReturnType<typeof pkgStatus>, string> = {
  active: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  warn: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  expired: 'bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]',
  done: 'bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]',
}

const inputCls = 'px-3 py-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30 focus:border-[var(--color-brand-primary)]'

export function PackageManageModal({ tenantId, userId, memberName, profileId, onClose, onChanged }: Props) {
  const { slotLabels } = useTenant()
  const { packageTypes, packages, loading, addPackage, updatePackage, reload } = useLessonPackages(tenantId)
  const userPackages = packages.filter(p => p.user_id === userId)
  const activeTypes = packageTypes.filter(t => t.is_active)

  // ── 결제 추가 폼 ─────────────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false)
  const [pkgTypeId, setPkgTypeId] = useState('')
  const [pkgDate, setPkgDate] = useState('')
  const [pkgInitialUsed, setPkgInitialUsed] = useState('')
  const [pkgNotes, setPkgNotes] = useState('')
  const [pkgSaving, setPkgSaving] = useState(false)
  const [pkgError, setPkgError] = useState<string | null>(null)

  // ── 결제 수정 폼 ─────────────────────────────────────────
  const [editPkg, setEditPkg] = useState<{
    id: string; packageName: string; totalSessions: number
    initialUsed: string; paymentDate: string; expiresAt: string; notes: string
  } | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // ── 서브 모달 ────────────────────────────────────────────
  const [pastAttTarget, setPastAttTarget] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ pkgId: string; pkgName: string } | null>(null)

  const selectedType = packageTypes.find(t => t.id === pkgTypeId)

  async function handleAddPackage(e: React.FormEvent) {
    e.preventDefault()
    if (!pkgDate) return
    setPkgSaving(true); setPkgError(null)
    const type = packageTypes.find(t => t.id === pkgTypeId)
    let expiresAt: string | null = null
    if (type?.validity_days) {
      const d = new Date(pkgDate)
      d.setDate(d.getDate() + type.validity_days)
      expiresAt = d.toISOString().slice(0, 10)
    }
    const err = await addPackage({
      user_id: userId,
      package_type_id: pkgTypeId || null,
      package_name: type?.name ?? '레슨권',
      total_sessions: type?.session_count ?? 1,
      initial_used_sessions: pkgInitialUsed ? parseInt(pkgInitialUsed) : 0,
      payment_date: pkgDate,
      expires_at: expiresAt,
      notes: pkgNotes.trim() || null,
      created_by: profileId,
    })
    setPkgSaving(false)
    if (err) { setPkgError(err); return }
    setShowAddForm(false); setPkgTypeId(''); setPkgDate(''); setPkgInitialUsed(''); setPkgNotes('')
    onChanged()
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editPkg) return
    setEditSaving(true); setEditError(null)
    const initialUsedNum = parseInt(editPkg.initialUsed) || 0
    if (initialUsedNum > editPkg.totalSessions) {
      setEditError(`총 횟수(${editPkg.totalSessions}회)를 초과할 수 없습니다.`)
      setEditSaving(false); return
    }
    const err = await updatePackage(editPkg.id, {
      initial_used_sessions: initialUsedNum,
      payment_date: editPkg.paymentDate,
      expires_at: editPkg.expiresAt || null,
      notes: editPkg.notes.trim() || null,
    })
    setEditSaving(false)
    if (err) { setEditError(err); return }
    setEditPkg(null); onChanged()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] w-full max-w-sm shadow-xl flex flex-col max-h-[85vh] overflow-hidden">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] shrink-0">
          <div>
            <p className="text-[11px] font-bold text-[var(--color-text-muted)] mb-0.5">{memberName}</p>
            <h3 className="font-bold text-[var(--color-text-primary)] text-[16px]">결제권 관리</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-3">

          {/* 결제권 목록 */}
          {loading ? (
            <p className="text-xs text-[var(--color-text-muted)] text-center py-6">불러오는 중...</p>
          ) : userPackages.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)] text-center py-6 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)]">
              등록된 결제권이 없습니다.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {userPackages.map(pkg => {
                const status = pkgStatus(pkg)
                const pct = Math.min(100, Math.round(pkg.used_sessions / pkg.total_sessions * 100))
                const isEditing = editPkg?.id === pkg.id

                return (
                  <div
                    key={pkg.id}
                    className={`rounded-xl border px-3.5 py-3 transition-opacity ${
                      status === 'done' || status === 'expired' ? 'opacity-60' : ''
                    } border-[var(--color-border)] bg-[var(--color-surface-secondary)]`}
                  >
                    {isEditing ? (
                      <form onSubmit={handleEditSave} className="flex flex-col gap-2.5">
                        <p className="text-xs font-bold text-[var(--color-text-secondary)]">
                          {editPkg.packageName} · {editPkg.totalSessions}회권 수정
                        </p>
                        <div>
                          <label className="text-[11px] font-semibold text-[var(--color-text-muted)] block mb-1">결제일 *</label>
                          <input
                            type="date"
                            value={editPkg.paymentDate}
                            onChange={e => setEditPkg(p => p ? { ...p, paymentDate: e.target.value } : p)}
                            required
                            className={inputCls + ' w-full'}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-[var(--color-text-muted)] block mb-1">
                            만료일 <span className="font-normal">(없으면 무제한)</span>
                          </label>
                          <input
                            type="date"
                            value={editPkg.expiresAt}
                            onChange={e => setEditPkg(p => p ? { ...p, expiresAt: e.target.value } : p)}
                            className={inputCls + ' w-full'}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-[var(--color-text-muted)] block mb-1">
                            시스템 도입 전 사용 횟수 <span className="font-normal">(선택)</span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={editPkg.totalSessions}
                            value={editPkg.initialUsed}
                            onChange={e => setEditPkg(p => p ? { ...p, initialUsed: e.target.value } : p)}
                            placeholder="0"
                            className={inputCls + ' w-full text-center'}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-[var(--color-text-muted)] block mb-1">메모 <span className="font-normal">(선택)</span></label>
                          <input
                            value={editPkg.notes}
                            onChange={e => setEditPkg(p => p ? { ...p, notes: e.target.value } : p)}
                            placeholder="예: 카드결제"
                            className={inputCls + ' w-full'}
                          />
                        </div>
                        {editError && <p className="text-xs text-red-500">{editError}</p>}
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={editSaving}
                            className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] hover:bg-[var(--color-brand-primary-hover)] disabled:opacity-40 transition-colors"
                          >
                            {editSaving ? '저장 중...' : '저장'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditPkg(null); setEditError(null) }}
                            className="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                          >
                            취소
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{pkg.package_name}</p>
                            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                              {pkg.payment_date}{pkg.expires_at ? ` ~ ${pkg.expires_at}` : ' · 무제한'}
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_CLS[status]}`}>
                            {STATUS_LABEL[status]}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2.5">
                          <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface)] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                status === 'done' || status === 'expired'
                                  ? 'bg-[var(--color-text-muted)]'
                                  : status === 'warn' ? 'bg-amber-500' : 'bg-[var(--color-brand-primary)]'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold tabular-nums text-[var(--color-text-primary)] shrink-0">
                            {pkg.used_sessions}/{pkg.total_sessions}회
                          </span>
                        </div>

                        <div className="flex gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setPastAttTarget(pkg.id)}
                            className="text-xs font-semibold text-[var(--color-brand-primary)] px-2.5 py-1 rounded-lg bg-[color-mix(in_srgb,var(--color-brand-primary)_8%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-brand-primary)_15%,transparent)] transition-colors"
                          >
                            소급입력
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditPkg({
                                id: pkg.id,
                                packageName: pkg.package_name,
                                totalSessions: pkg.total_sessions,
                                initialUsed: String(pkg.initial_used_sessions ?? 0),
                                paymentDate: pkg.payment_date,
                                expiresAt: pkg.expires_at ?? '',
                                notes: pkg.notes ?? '',
                              })
                              setEditError(null)
                            }}
                            className="text-xs font-semibold text-[var(--color-text-secondary)] px-2.5 py-1 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ pkgId: pkg.id, pkgName: pkg.package_name })}
                            className="text-xs font-semibold text-red-500 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* 결제 추가 */}
          {showAddForm ? (
            <form onSubmit={handleAddPackage} className="border border-[var(--color-border)] rounded-xl px-3.5 py-3 flex flex-col gap-2.5">
              <p className="text-xs font-bold text-[var(--color-text-secondary)]">결제 추가</p>
              <div>
                <label className="text-[11px] font-semibold text-[var(--color-text-muted)] block mb-1">레슨 종류 *</label>
                <select
                  value={pkgTypeId}
                  onChange={e => setPkgTypeId(e.target.value)}
                  required
                  className={inputCls + ' w-full'}
                >
                  <option value="">종류 선택...</option>
                  {activeTypes.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.session_count}회{t.validity_days ? ` · ${t.validity_days / 7}주` : ''})
                    </option>
                  ))}
                </select>
                {selectedType && (
                  <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                    {selectedType.session_count}회권
                    {selectedType.validity_days ? ` · 유효기간 ${selectedType.validity_days / 7}주` : ' · 무제한'}
                  </p>
                )}
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--color-text-muted)] block mb-1">결제일 *</label>
                <input
                  type="date"
                  value={pkgDate}
                  onChange={e => setPkgDate(e.target.value)}
                  required
                  className={inputCls + ' w-full'}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--color-text-muted)] block mb-1">
                  소급 사용 횟수 <span className="font-normal">(선택)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={pkgInitialUsed}
                  onChange={e => setPkgInitialUsed(e.target.value)}
                  placeholder="0"
                  className={inputCls + ' w-full text-center'}
                />
                {pkgInitialUsed && selectedType && parseInt(pkgInitialUsed) > 0 && (
                  <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                    잔여 {selectedType.session_count - parseInt(pkgInitialUsed)}회로 시작
                  </p>
                )}
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--color-text-muted)] block mb-1">메모 <span className="font-normal">(선택)</span></label>
                <input
                  value={pkgNotes}
                  onChange={e => setPkgNotes(e.target.value)}
                  placeholder="예: 카드결제"
                  className={inputCls + ' w-full'}
                />
              </div>
              {pkgError && <p className="text-xs text-red-500">{pkgError}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={pkgSaving || !pkgTypeId || !pkgDate}
                  className="flex-1 py-2 text-sm font-semibold rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] hover:bg-[var(--color-brand-primary-hover)] disabled:opacity-40 transition-colors"
                >
                  {pkgSaving ? '저장 중...' : '저장'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setPkgError(null) }}
                  className="flex-1 py-2 text-sm font-semibold rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              disabled={activeTypes.length === 0}
              className="flex items-center justify-center gap-1.5 w-full py-2.5 text-sm font-semibold rounded-xl border-2 border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-brand-primary)]/50 hover:text-[var(--color-brand-primary)] hover:bg-[color-mix(in_srgb,var(--color-brand-primary)_4%,transparent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              {activeTypes.length === 0 ? '등록 가능한 레슨 종류 없음' : '결제 추가'}
            </button>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-5 py-3 border-t border-[var(--color-border)] shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm font-semibold rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            닫기
          </button>
        </div>
      </div>

      {/* 소급 출석 입력 */}
      {pastAttTarget && (
        <PastAttendanceModal
          tenantId={tenantId}
          members={[{ id: userId, name: memberName }]}
          prefillUserId={userId}
          prefillPackageId={pastAttTarget}
          onClose={() => setPastAttTarget(null)}
          onSaved={() => { reload(); onChanged() }}
        />
      )}

      {/* 결제기록 삭제 */}
      {deleteTarget && (
        <PackageDeleteModal
          tenantId={tenantId}
          packageId={deleteTarget.pkgId}
          packageName={deleteTarget.pkgName}
          memberName={memberName}
          slotLabels={slotLabels ?? null}
          onClose={() => setDeleteTarget(null)}
          onPackageDeleted={() => { setDeleteTarget(null); reload(); onChanged() }}
          onAssignmentsChanged={() => { reload(); onChanged() }}
        />
      )}

      <DevFileLabel file="PackageManageModal.tsx" />
    </div>
  )
}
