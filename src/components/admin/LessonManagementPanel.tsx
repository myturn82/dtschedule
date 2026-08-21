import { useState } from 'react'
import { useLessonPackages } from '../../hooks/useLessonPackages'
import { MemberSearchSelect } from '../shared/MemberSearchSelect'
import { ExpiringPackageSmsModal } from '../modals/ExpiringPackageSmsModal'
import type { TenantMemberWithRole, LessonPackageType } from '../../types'

interface Props {
  tenantId: string
  members: TenantMemberWithRole[]
  profileId: string
}

function pkgStatus(pkg: { total_sessions: number; used_sessions: number; expires_at: string | null }): 'active' | 'warn' | 'expired' | 'done' {
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
  active: '진행중',
  warn: '만료임박',
  expired: '만료',
  done: '사용완료',
}
const STATUS_CLS: Record<ReturnType<typeof pkgStatus>, string> = {
  active:  'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  warn:    'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  expired: 'bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]',
  done:    'bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]',
}

const inputCls = 'px-3 py-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30 focus:border-[var(--color-brand-primary)]'

export function LessonManagementPanel({ tenantId, members, profileId }: Props) {
  const { packageTypes, packages, loading, addPackageType, updatePackageType, deletePackageType, movePackageType, addPackage, deletePackage } = useLessonPackages(tenantId)

  // ── 레슨 종류 폼 ─────────────────────────────────────────
  const [newTypeName, setNewTypeName] = useState('')
  const [newTypeCount, setNewTypeCount] = useState('')
  const [newTypeWeeks, setNewTypeWeeks] = useState('')
  const [editTypeId, setEditTypeId] = useState<string | null>(null)
  const [editTypeData, setEditTypeData] = useState<{ name: string; session_count: string; validity_days: string }>({ name: '', session_count: '', validity_days: '' })
  const [typeSaving, setTypeSaving] = useState(false)
  const [typeError, setTypeError] = useState<string | null>(null)

  // ── 결제 기록 폼 ─────────────────────────────────────────
  const [showAddPkg, setShowAddPkg] = useState(false)
  const [pkgUserId, setPkgUserId] = useState('')
  const [pkgTypeId, setPkgTypeId] = useState('')
  const [pkgDate, setPkgDate] = useState('')
  const [pkgNotes, setPkgNotes] = useState('')
  const [pkgSaving, setPkgSaving] = useState(false)
  const [pkgError, setPkgError] = useState<string | null>(null)
  const [filterUserId, setFilterUserId] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'warn' | 'expired' | 'done'>('all')
  const [viewMode, setViewMode] = useState<'list' | 'group'>('list')
  const [expandedMemberIds, setExpandedMemberIds] = useState<Set<string>>(new Set())
  const [showExpirySms, setShowExpirySms] = useState(false)
  const [thresholdPreset, setThresholdPreset] = useState<'7' | '14' | 'custom'>('7')
  const [customDays, setCustomDays] = useState('7')

  // ── 레슨 종류 빠른 예시 ───────────────────────────────────
  const TYPE_QUICK_EXAMPLES = [
    { name: '1:1 레슨 10회', count: '10', weeks: '12' },
    { name: '그룹 수업 20회', count: '20', weeks: '12' },
    { name: '체험 레슨 3회', count: '3', weeks: '4' },
  ]
  function applyTypeExample(ex: typeof TYPE_QUICK_EXAMPLES[0]) {
    setNewTypeName(ex.name)
    setNewTypeCount(ex.count)
    setNewTypeWeeks(ex.weeks)
    setTypeError(null)
  }

  // ── 레슨 종류 추가 ────────────────────────────────────────
  async function handleAddType(e: React.FormEvent) {
    e.preventDefault()
    if (!newTypeName.trim() || !newTypeCount) return
    setTypeSaving(true); setTypeError(null)
    const count = parseInt(newTypeCount)
    const weeks = newTypeWeeks ? parseInt(newTypeWeeks) : null
    const maxOrder = packageTypes.reduce((m, t) => Math.max(m, t.display_order), -1)
    const err = await addPackageType({
      name: newTypeName.trim(),
      session_count: count,
      validity_days: weeks ? weeks * 7 : null,
      display_order: maxOrder + 1,
    })
    setTypeSaving(false)
    if (err) { setTypeError(err); return }
    setNewTypeName(''); setNewTypeCount(''); setNewTypeWeeks('')
  }

  // ── 레슨 종류 수정 ────────────────────────────────────────
  function startEditType(t: LessonPackageType) {
    setEditTypeId(t.id)
    setEditTypeData({
      name: t.name,
      session_count: String(t.session_count),
      validity_days: t.validity_days ? String(t.validity_days / 7) : '',
    })
  }

  async function saveEditType() {
    if (!editTypeId) return
    setTypeSaving(true); setTypeError(null)
    const err = await updatePackageType(editTypeId, {
      name: editTypeData.name.trim(),
      session_count: parseInt(editTypeData.session_count),
      validity_days: editTypeData.validity_days ? parseInt(editTypeData.validity_days) * 7 : null,
    })
    setTypeSaving(false)
    if (err) { setTypeError(err); return }
    setEditTypeId(null)
  }

  async function handleDeleteType(id: string) {
    if (!confirm('이 레슨 종류를 삭제할까요? 기존 결제 기록의 종류 정보는 유지됩니다.')) return
    await deletePackageType(id)
  }

  async function toggleActive(t: LessonPackageType) {
    await updatePackageType(t.id, { is_active: !t.is_active })
  }

  // ── 결제 기록 추가 ────────────────────────────────────────
  const selectedType = packageTypes.find(t => t.id === pkgTypeId)

  async function handleAddPackage(e: React.FormEvent) {
    e.preventDefault()
    if (!pkgUserId) { setPkgError('회원을 선택해 주세요.'); return }
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
      user_id: pkgUserId,
      package_type_id: pkgTypeId || null,
      package_name: type?.name ?? '레슨권',
      total_sessions: type?.session_count ?? 1,
      payment_date: pkgDate,
      expires_at: expiresAt,
      notes: pkgNotes.trim() || null,
      created_by: profileId,
    })
    setPkgSaving(false)
    if (err) { setPkgError(err); return }
    setShowAddPkg(false)
    setPkgUserId(''); setPkgTypeId(''); setPkgDate(''); setPkgNotes('')
  }

  const memberMap = new Map(members.map(m => [m.user_id, m.profile?.name ?? m.user_id]))
  const phoneMap = new Map(members.map(m => [m.user_id, m.profile?.phone ?? '']))
  // 관리자는 레슨권 결제 대상에서 제외
  const approvedMembers = members.filter(m => m.is_approved !== false && m.role !== 'admin')
  const memberOptions = approvedMembers.map(m => ({ id: m.user_id, name: m.profile?.name ?? m.user_id }))

  const userFilteredPackages = filterUserId
    ? packages.filter(p => p.user_id === filterUserId)
    : packages

  const statusCounts = {
    all:     userFilteredPackages.length,
    active:  userFilteredPackages.filter(p => pkgStatus(p) === 'active').length,
    warn:    userFilteredPackages.filter(p => pkgStatus(p) === 'warn').length,
    expired: userFilteredPackages.filter(p => pkgStatus(p) === 'expired').length,
    done:    userFilteredPackages.filter(p => pkgStatus(p) === 'done').length,
  }

  const filteredPackages = statusFilter === 'all'
    ? userFilteredPackages
    : userFilteredPackages.filter(p => pkgStatus(p) === statusFilter)

  const groupedPackages = filteredPackages.reduce<Record<string, typeof filteredPackages>>((acc, pkg) => {
    const uid = pkg.user_id ?? ''
    if (!acc[uid]) acc[uid] = []
    acc[uid].push(pkg)
    return acc
  }, {})

  const sortedGroupIds = Object.keys(groupedPackages).sort((a, b) =>
    (memberMap.get(a) ?? '').localeCompare(memberMap.get(b) ?? '', 'ko')
  )

  function toggleMember(uid: string) {
    setExpandedMemberIds(prev => {
      const next = new Set(prev)
      next.has(uid) ? next.delete(uid) : next.add(uid)
      return next
    })
  }

  // 만료 도래 기준일 (선택한 프리셋 또는 직접 입력한 n일)
  const thresholdDays = thresholdPreset === 'custom'
    ? Math.max(1, parseInt(customDays) || 0)
    : parseInt(thresholdPreset)

  // 선택한 기간 내 만료가 도래하지만 아직 사용하지 않은 레슨권 보유 회원 (이용 독려 문자 대상)
  const expiringUnusedRecipients = packages
    .filter(p => {
      if (p.used_sessions >= p.total_sessions) return false
      if (!p.expires_at) return false
      const daysLeft = Math.ceil((new Date(p.expires_at).getTime() - Date.now()) / 86400000)
      return daysLeft >= 0 && daysLeft <= thresholdDays
    })
    .map(p => {
      const daysLeft = Math.ceil((new Date(p.expires_at!).getTime() - Date.now()) / 86400000)
      return {
        id: p.id,
        name: memberMap.get(p.user_id ?? '') ?? '알 수 없음',
        phone: phoneMap.get(p.user_id ?? '') ?? '',
        packageName: p.package_name,
        expiresAt: p.expires_at ?? '',
        remaining: p.total_sessions - p.used_sessions,
        daysLeft,
      }
    })

  return (
    <div className="space-y-8 max-w-[720px]">
      {/* ── 만료 임박 알림 배너 ──────────────────────────── */}
      <section className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-400">⏰ 만료 임박 레슨권 미사용 회원 {expiringUnusedRecipients.length}명</p>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/70 mt-0.5">선택한 기간 내 만료가 도래하지만 아직 다 사용하지 않은 회원입니다. 문자로 이용을 독려해 보세요.</p>
          </div>
          <button
            onClick={() => setShowExpirySms(true)}
            disabled={expiringUnusedRecipients.length === 0}
            className="shrink-0 h-[36px] px-4 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            📱 문자 발송
          </button>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-xs font-semibold text-amber-800/80 dark:text-amber-400/80">만료 도래 기준</span>
          <div className="flex gap-1">
            <button
              onClick={() => setThresholdPreset('7')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${thresholdPreset === '7' ? 'bg-amber-600 text-white border-amber-600' : 'border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40'}`}
            >
              1주일 전
            </button>
            <button
              onClick={() => setThresholdPreset('14')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${thresholdPreset === '14' ? 'bg-amber-600 text-white border-amber-600' : 'border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40'}`}
            >
              2주일 전
            </button>
            <button
              onClick={() => setThresholdPreset('custom')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${thresholdPreset === 'custom' ? 'bg-amber-600 text-white border-amber-600' : 'border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40'}`}
            >
              직접입력
            </button>
          </div>
          {thresholdPreset === 'custom' && (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                value={customDays}
                onChange={e => setCustomDays(e.target.value)}
                className="w-14 px-2 py-1 rounded-lg border border-amber-300 dark:border-amber-700 bg-[var(--color-surface)] text-xs text-center focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              <span className="text-xs text-amber-800/80 dark:text-amber-400/80">일 전</span>
            </div>
          )}
        </div>
      </section>

      {/* ── 레슨 종류 설정 ──────────────────────────────── */}
      <section>
        <header className="mb-3">
          <h2 className="text-[17px] font-bold text-[var(--color-text-primary)]">레슨 종류 설정</h2>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">회차·유효기간을 정의합니다. 결제 기록 시 선택할 수 있습니다.</p>
        </header>

        {/* 유효기간 안내 */}
        <div className="mb-4 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-700/30 px-3.5 py-3 text-xs">
          <p className="font-semibold text-amber-900 dark:text-amber-200 mb-1">유효 기간 계산 방법</p>
          <p className="text-amber-700 dark:text-amber-400 leading-relaxed">
            결제일을 기준으로 만료일이 자동 계산돼요.
            예: 결제일 1/1 + 12주 → 3/27 만료 · 비워두면 차감 완료 시까지 무기한
          </p>
        </div>

        {typeError && (
          <p className="mb-3 text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{typeError}</p>
        )}

        {packageTypes.length > 0 && (
          <div className="mb-4 rounded-2xl border border-[var(--color-border)] overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
                  <th className="text-center px-2.5 sm:px-4 py-2.5 text-xs font-semibold text-[var(--color-text-muted)] whitespace-nowrap">이름</th>
                  <th className="text-center px-2 sm:px-3 py-2.5 text-xs font-semibold text-[var(--color-text-muted)] whitespace-nowrap">횟수</th>
                  <th className="text-center px-2 sm:px-3 py-2.5 text-xs font-semibold text-[var(--color-text-muted)] whitespace-nowrap">유효기간</th>
                  <th className="text-center px-2 sm:px-3 py-2.5 text-xs font-semibold text-[var(--color-text-muted)] whitespace-nowrap">활성</th>
                  <th className="px-2 sm:px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {[...packageTypes].sort((a, b) => a.display_order - b.display_order).map((t, idx, sortedTypes) => (
                  <tr key={t.id} className="bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]">
                    {editTypeId === t.id ? (
                      <>
                        <td className="px-2 sm:px-3 py-2">
                          <input value={editTypeData.name} onChange={e => setEditTypeData(p => ({ ...p, name: e.target.value }))}
                            className={inputCls + ' w-full'} />
                        </td>
                        <td className="px-2 sm:px-3 py-2">
                          <input type="number" min={1} value={editTypeData.session_count}
                            onChange={e => setEditTypeData(p => ({ ...p, session_count: e.target.value }))}
                            className={inputCls + ' w-16 text-center'} />
                        </td>
                        <td className="px-2 sm:px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <input type="number" min={1} value={editTypeData.validity_days}
                              onChange={e => setEditTypeData(p => ({ ...p, validity_days: e.target.value }))}
                              placeholder="무제한"
                              className={inputCls + ' w-16 text-center'} />
                            <span className="text-xs text-[var(--color-text-muted)]">주</span>
                          </div>
                        </td>
                        <td />
                        <td className="px-2 sm:px-3 py-2">
                          <div className="flex gap-1 justify-center">
                            <button onClick={saveEditType} disabled={typeSaving}
                              className="px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] disabled:opacity-40 whitespace-nowrap">
                              저장
                            </button>
                            <button onClick={() => setEditTypeId(null)}
                              className="px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-lg border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] whitespace-nowrap">
                              취소
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-2.5 sm:px-4 py-2.5 text-center font-medium text-[var(--color-text-primary)] whitespace-nowrap">{t.name}</td>
                        <td className="px-2 sm:px-3 py-2.5 text-center text-[var(--color-text-secondary)] whitespace-nowrap">{t.session_count}회</td>
                        <td className="px-2 sm:px-3 py-2.5 text-center text-[var(--color-text-muted)] text-xs whitespace-nowrap">
                          {t.validity_days ? `${t.validity_days / 7}주` : '무제한'}
                        </td>
                        <td className="px-2 sm:px-3 py-2.5 text-center">
                          <button onClick={() => toggleActive(t)}
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full border transition-colors whitespace-nowrap ${
                              t.is_active
                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
                                : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] border-[var(--color-border)]'
                            }`}>
                            {t.is_active ? '활성' : '비활성'}
                          </button>
                        </td>
                        <td className="px-2 sm:px-3 py-2.5">
                          <div className="flex gap-0.5 sm:gap-1 justify-center items-center">
                            <button type="button" onClick={() => movePackageType(t.id, -1)} disabled={idx === 0}
                              className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center shrink-0 text-xs border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-hover)] disabled:opacity-30 text-[var(--color-text-muted)]">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                            </button>
                            <button type="button" onClick={() => movePackageType(t.id, 1)} disabled={idx === sortedTypes.length - 1}
                              className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center shrink-0 text-xs border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-hover)] disabled:opacity-30 text-[var(--color-text-muted)]">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
                            </button>
                            <button onClick={() => startEditType(t)}
                              className="px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-lg border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] whitespace-nowrap">
                              수정
                            </button>
                            <button onClick={() => handleDeleteType(t.id)}
                              className="px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 whitespace-nowrap">
                              삭제
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* 빠른 예시 */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className="text-xs text-[var(--color-text-muted)] self-center">빠른 예시:</span>
          {TYPE_QUICK_EXAMPLES.map(ex => (
            <button
              key={ex.name}
              type="button"
              onClick={() => applyTypeExample(ex)}
              className="px-2.5 py-1 text-xs rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors select-none"
            >
              {ex.name} · {ex.weeks}주
            </button>
          ))}
        </div>

        {/* 추가 폼 */}
        <form onSubmit={handleAddType} className="flex items-end gap-2 flex-wrap">
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)]">이름</label>
            <input value={newTypeName} onChange={e => setNewTypeName(e.target.value)}
              placeholder="예: 4회 레슨" className={inputCls} />
          </div>
          <div className="flex flex-col gap-1 w-20">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)]">횟수</label>
            <input type="number" min={1} value={newTypeCount} onChange={e => setNewTypeCount(e.target.value)}
              placeholder="4" className={inputCls + ' text-center'} />
          </div>
          <div className="flex flex-col gap-1 w-24">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)]">유효기간(주) <span className="font-normal text-[var(--color-text-muted)]">선택</span></label>
            <input type="number" min={1} value={newTypeWeeks} onChange={e => setNewTypeWeeks(e.target.value)}
              placeholder="8" className={inputCls + ' text-center'} />
          </div>
          <button type="submit" disabled={typeSaving || !newTypeName.trim() || !newTypeCount}
            className="h-[38px] px-4 rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] text-sm font-semibold hover:bg-[var(--color-brand-primary-hover)] disabled:opacity-40 transition-colors whitespace-nowrap">
            + 추가
          </button>
        </form>
      </section>

      {/* ── 결제 기록 ────────────────────────────────────── */}
      <section>
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="flex-1 min-w-0 truncate text-[17px] font-bold text-[var(--color-text-primary)]">결제 기록</h2>
            {/* 뷰 토글 */}
            <div className="flex rounded-xl border border-[var(--color-border-strong)] overflow-hidden shrink-0">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${viewMode === 'list' ? 'bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)]' : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'}`}
              >
                목록
              </button>
              <button
                onClick={() => setViewMode('group')}
                className={`px-3 py-1.5 text-xs font-semibold border-l border-[var(--color-border-strong)] transition-colors ${viewMode === 'group' ? 'bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)]' : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'}`}
              >
                회원별
              </button>
            </div>
            <div className="w-24 sm:w-40 shrink-0">
              <MemberSearchSelect
                value={filterUserId}
                onChange={setFilterUserId}
                options={memberOptions}
                placeholder="전체 회원"
                clearLabel="전체 회원"
                className={inputCls + ' w-full'}
              />
            </div>
            {packageTypes.some(t => t.is_active) && (
              <button onClick={() => setShowAddPkg(true)}
                className="h-[38px] px-4 rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] text-sm font-semibold hover:bg-[var(--color-brand-primary-hover)] transition-colors whitespace-nowrap shrink-0">
                + 결제 추가
              </button>
            )}
          </div>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-1">회원별 레슨권 구매 이력과 차감 현황을 관리합니다.</p>
        </div>

        {/* ── 상태 필터 탭 ──────────────────────────────── */}
        <div className="flex gap-1 flex-wrap mb-3">
          {([
            ['all',     '전체'],
            ['active',  '진행중'],
            ['warn',    '만료임박'],
            ['expired', '만료'],
            ['done',    '사용완료'],
          ] as const).map(([key, label]) => {
            const count = statusCounts[key]
            const isActive = statusFilter === key
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                  isActive
                    ? 'bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] border-[var(--color-brand-primary)]'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border-strong)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                {label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-white/20 text-[var(--color-brand-primary-contrast)]'
                    : count === 0
                    ? 'text-[var(--color-text-muted)]'
                    : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {loading ? (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-8">불러오는 중...</p>
        ) : filteredPackages.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-8">결제 기록이 없습니다.</p>
        ) : viewMode === 'group' ? (
          <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden divide-y divide-[var(--color-border)]">
            {sortedGroupIds.map(uid => {
              const pkgs = groupedPackages[uid]
              const memberName = memberMap.get(uid) ?? '-'
              const isExpanded = expandedMemberIds.has(uid)
              const activeCnt = pkgs.filter(p => pkgStatus(p) === 'active').length
              const warnCnt   = pkgs.filter(p => pkgStatus(p) === 'warn').length
              const doneCnt   = pkgs.filter(p => pkgStatus(p) === 'done' || pkgStatus(p) === 'expired').length
              const totalRemaining = pkgs.reduce((sum, p) => sum + Math.max(0, p.total_sessions - p.used_sessions), 0)
              return (
                <div key={uid}>
                  <button
                    onClick={() => toggleMember(uid)}
                    className="w-full flex items-center gap-2.5 px-4 py-3 bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] transition-colors text-left"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      className={`shrink-0 text-[var(--color-text-muted)] transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                    <span className="font-semibold text-sm text-[var(--color-text-primary)] min-w-[4rem]">{memberName}</span>
                    <div className="flex gap-1 flex-wrap">
                      {activeCnt > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">진행중 {activeCnt}</span>}
                      {warnCnt  > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">만료임박 {warnCnt}</span>}
                      {doneCnt  > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]">완료/만료 {doneCnt}</span>}
                    </div>
                    <span className="ml-auto text-xs font-medium text-[var(--color-text-muted)] whitespace-nowrap shrink-0">잔여 {totalRemaining}회 · {pkgs.length}건</span>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-[var(--color-border)]">
                      <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-[var(--color-border)]">
                          {pkgs.map(pkg => {
                            const status = pkgStatus(pkg)
                            const pct = Math.min(100, Math.round(pkg.used_sessions / pkg.total_sessions * 100))
                            return (
                              <tr key={pkg.id} className={`bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-hover)] transition-opacity ${status === 'done' || status === 'expired' ? 'opacity-55' : ''}`}>
                                <td className="px-2.5 sm:px-4 py-2.5 text-center text-[var(--color-text-secondary)] whitespace-nowrap text-xs">{pkg.package_name}</td>
                                <td className="px-2 sm:px-3 py-2.5 text-center text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                                  <div>{pkg.payment_date}</div>
                                  <div className="sm:hidden">{pkg.expires_at ?? '무제한'}</div>
                                </td>
                                <td className="px-2 sm:px-3 py-2.5 text-center text-xs text-[var(--color-text-muted)] hidden sm:table-cell whitespace-nowrap">{pkg.expires_at ?? '무제한'}</td>
                                <td className="px-2 sm:px-3 py-2.5">
                                  <div className="flex flex-col items-center gap-1 min-w-[52px]">
                                    <span className="text-xs font-semibold tabular-nums text-[var(--color-text-primary)]">{pkg.used_sessions}/{pkg.total_sessions}</span>
                                    <div className="w-full h-1.5 rounded-full bg-[var(--color-surface)] overflow-hidden">
                                      <div className={`h-full rounded-full transition-all ${status === 'done' || status === 'expired' ? 'bg-[var(--color-text-muted)]' : status === 'warn' ? 'bg-amber-500' : 'bg-[var(--color-brand-primary)]'}`} style={{ width: `${pct}%` }} />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-2 sm:px-3 py-2.5 text-center hidden md:table-cell whitespace-nowrap">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_CLS[status]}`}>{STATUS_LABEL[status]}</span>
                                </td>
                                <td className="px-2 sm:px-3 py-2.5 text-center whitespace-nowrap">
                                  <button onClick={() => { if (confirm('이 결제 기록을 삭제할까요?')) deletePackage(pkg.id) }}
                                    className="text-xs text-red-500 hover:text-red-700 font-semibold">삭제</button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
                  <th className="text-center px-2.5 sm:px-4 py-2.5 text-xs font-semibold text-[var(--color-text-muted)] whitespace-nowrap">회원</th>
                  <th className="text-center px-2 sm:px-3 py-2.5 text-xs font-semibold text-[var(--color-text-muted)] whitespace-nowrap">레슨종류</th>
                  <th className="text-center px-2 sm:px-3 py-2.5 text-xs font-semibold text-[var(--color-text-muted)] whitespace-nowrap">
                    <div>결제일</div>
                    <div className="sm:hidden">만료일</div>
                  </th>
                  <th className="text-center px-2 sm:px-3 py-2.5 text-xs font-semibold text-[var(--color-text-muted)] hidden sm:table-cell whitespace-nowrap">만료일</th>
                  <th className="text-center px-2 sm:px-3 py-2.5 text-xs font-semibold text-[var(--color-text-muted)] whitespace-nowrap">차감</th>
                  <th className="text-center px-2 sm:px-3 py-2.5 text-xs font-semibold text-[var(--color-text-muted)] hidden md:table-cell whitespace-nowrap">상태</th>
                  <th className="px-2 sm:px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredPackages.map(pkg => {
                  const status = pkgStatus(pkg)
                  const pct = Math.min(100, Math.round(pkg.used_sessions / pkg.total_sessions * 100))
                  return (
                    <tr key={pkg.id} className={`bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] transition-opacity ${status === 'done' || status === 'expired' ? 'opacity-55' : ''}`}>
                      <td className="px-2.5 sm:px-4 py-3 text-center font-medium text-[var(--color-text-primary)] whitespace-nowrap">
                        {memberMap.get(pkg.user_id ?? '') ?? '-'}
                      </td>
                      <td className="px-2 sm:px-3 py-3 text-center text-[var(--color-text-secondary)] whitespace-nowrap">{pkg.package_name}</td>
                      <td className="px-2 sm:px-3 py-3 text-center text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                        <div>{pkg.payment_date}</div>
                        <div className="sm:hidden">{pkg.expires_at ?? '무제한'}</div>
                      </td>
                      <td className="px-2 sm:px-3 py-3 text-center text-xs text-[var(--color-text-muted)] hidden sm:table-cell whitespace-nowrap">
                        {pkg.expires_at ?? '무제한'}
                      </td>
                      <td className="px-2 sm:px-3 py-3">
                        <div className="flex flex-col items-center gap-1 min-w-[52px] sm:min-w-[60px]">
                          <span className="text-xs font-semibold tabular-nums text-[var(--color-text-primary)]">
                            {pkg.used_sessions}/{pkg.total_sessions}
                          </span>
                          <div className="w-full h-1.5 rounded-full bg-[var(--color-surface-secondary)] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                status === 'done' || status === 'expired'
                                  ? 'bg-[var(--color-text-muted)]'
                                  : status === 'warn'
                                  ? 'bg-amber-500'
                                  : 'bg-[var(--color-brand-primary)]'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 py-3 text-center hidden md:table-cell whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_CLS[status]}`}>
                          {STATUS_LABEL[status]}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 py-3 text-center whitespace-nowrap">
                        <button onClick={() => { if (confirm('이 결제 기록을 삭제할까요?')) deletePackage(pkg.id) }}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold">
                          삭제
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </section>

      {/* ── 결제 추가 모달 ───────────────────────────────── */}
      {showAddPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h3 className="font-bold text-[var(--color-text-primary)] text-[16px]">결제 추가</h3>
            <form onSubmit={handleAddPackage} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">회원 *</label>
                <MemberSearchSelect
                  value={pkgUserId}
                  onChange={setPkgUserId}
                  options={memberOptions}
                  className={inputCls + ' w-full'}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">레슨 종류 *</label>
                <select value={pkgTypeId} onChange={e => setPkgTypeId(e.target.value)} required className={inputCls + ' w-full'}>
                  <option value="">종류 선택...</option>
                  {packageTypes.filter(t => t.is_active).map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.session_count}회{t.validity_days ? ` · ${t.validity_days / 7}주` : ''})
                    </option>
                  ))}
                </select>
              </div>
              {selectedType && (
                <div className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-secondary)] rounded-lg px-3 py-2">
                  {selectedType.session_count}회권
                  {selectedType.validity_days ? ` · 유효기간 ${selectedType.validity_days / 7}주` : ' · 무제한'}
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">결제일 *</label>
                <input type="date" value={pkgDate} onChange={e => setPkgDate(e.target.value)} required
                  className={inputCls + ' w-full'} />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">메모 <span className="font-normal text-[var(--color-text-muted)]">선택</span></label>
                <input value={pkgNotes} onChange={e => setPkgNotes(e.target.value)}
                  placeholder="예: 카드결제" className={inputCls + ' w-full'} />
              </div>
              {pkgError && <p className="text-xs text-red-500">{pkgError}</p>}
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={pkgSaving}
                  className="flex-1 px-4 py-2 rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] text-sm font-semibold hover:bg-[var(--color-brand-primary-hover)] disabled:opacity-40 transition-colors">
                  {pkgSaving ? '저장 중...' : '저장'}
                </button>
                <button type="button" onClick={() => { setShowAddPkg(false); setPkgError(null); setPkgUserId('') }}
                  className="flex-1 px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]">
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 만료 알림 문자 발송 모달 ─────────────────────── */}
      {showExpirySms && (
        <ExpiringPackageSmsModal
          tenantId={tenantId}
          recipients={expiringUnusedRecipients}
          onClose={() => setShowExpirySms(false)}
        />
      )}
    </div>
  )
}
