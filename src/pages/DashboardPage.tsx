import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTenant } from '../contexts/TenantContext'
import { useDashboard } from '../hooks/useDashboard'
import { DashboardNav } from '../components/DashboardNav'
import { shortSlotLabel } from '../utils/timeSlots'

export function DashboardPage() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const { tenant, memberships, resetTenantSelection, slotLabels } = useTenant()
  const tenantMode = tenant?.settings?.tenant_mode ?? '회원선택'
  const { pendingMembers, members, assignments, slotSettings, tenantRoles, loading, approveUser, rejectUser } = useDashboard(tenant?.id ?? '')
  const [confirmReject, setConfirmReject] = useState<string | null>(null)

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const memberStats = useMemo(() => {
    const countByName = new Map<string, number>()
    for (const a of assignments) {
      if (a.volunteer_name) countByName.set(a.volunteer_name, (countByName.get(a.volunteer_name) ?? 0) + 1)
    }
    return [...members]
      .map(m => ({ ...m, count: countByName.get(m.profile.name) ?? 0 }))
      .sort((a, b) => b.count - a.count || a.profile.name.localeCompare(b.profile.name))
  }, [members, assignments])

  const roleStats = useMemo(() => {
    if (tenantMode !== '직접입력') return []
    const countById = new Map<string, number>()
    for (const a of assignments) {
      if (a.role_id) countById.set(a.role_id, (countById.get(a.role_id) ?? 0) + 1)
    }
    return tenantRoles.map(r => ({ ...r, count: countById.get(r.id) ?? 0 }))
  }, [tenantMode, assignments, tenantRoles])

  const slotStats = useMemo(() => {
    const slotCount = new Map<string, number>()
    for (const a of assignments) {
      slotCount.set(a.time_slot, (slotCount.get(a.time_slot) ?? 0) + 1)
    }
    const capacityMap = new Map(slotSettings.map(s => [s.time_slot, s.max_capacity]))
    if (!slotCount.size) return []
    return [...slotCount.keys()]
      .map(slot => ({
        time_slot: slot,
        max_capacity: capacityMap.get(slot) ?? 0,
        label: slotLabels[slot] ?? shortSlotLabel(slot),
        count: slotCount.get(slot)!,
      }))
      .sort((a, b) => a.time_slot.localeCompare(b.time_slot))
  }, [slotSettings, assignments, slotLabels])

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)]">
      <DashboardNav />

      <main className="px-2 py-2 sm:px-4 sm:py-3">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-[var(--shadow-lg)] overflow-hidden animate-fade-up">

          {/* Top bar */}
          <div className="flex items-center justify-between gap-2 px-3 py-3 sm:px-5 sm:py-3.5 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-bold text-[var(--color-text)] truncate">{tenant?.name}</span>
              <span className="hidden sm:inline text-xs text-[var(--color-text-muted)]">대시보드</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {profile && (
                <span className="text-sm font-semibold text-[var(--color-text-primary)] hidden sm:block">{profile.name}</span>
              )}
              {(memberships.length > 1 || profile?.is_super_admin) && (
                <button
                  onClick={() => { resetTenantSelection(); navigate('/') }}
                  className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-lg transition-colors whitespace-nowrap"
                >
                  조직 변경
                </button>
              )}
              <button
                onClick={signOut}
                className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-lg transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-5 space-y-6">
            {loading ? (
              <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">로딩 중...</div>
            ) : (
              <>
                {/* 섹션 1: 승인 대기 */}
                {pendingMembers.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <h2 className="text-sm font-semibold text-[var(--color-text)]">승인 대기</h2>
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">
                        {pendingMembers.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {pendingMembers.map(m => (
                        <div
                          key={m.id}
                          className="flex items-center gap-3 px-3 py-2.5 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)]"
                        >
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 text-[13px] font-bold flex items-center justify-center shrink-0 select-none">
                            {(m.profile.name ?? '?').charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-[var(--color-text)] truncate">{m.profile.name}</p>
                            <p className="text-[11px] text-[var(--color-text-muted)] truncate">{m.profile.email}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => approveUser(m.user_id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                            >
                              승인
                            </button>
                            <button
                              onClick={() => setConfirmReject(m.user_id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-secondary)] bg-[var(--color-surface)] hover:bg-red-50 hover:text-red-600 border border-[var(--color-border)] rounded-lg transition-colors"
                            >
                              거절
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 섹션 2: 이번 달 참여 현황 */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-[var(--color-text)]">이번 달 참여 현황</h2>
                    <span className="text-[11px] text-[var(--color-text-muted)]">{year}년 {month}월</span>
                  </div>

                  {tenantMode === '직접입력' ? (
                    roleStats.length === 0 ? (
                      <p className="text-[13px] text-[var(--color-text-muted)] text-center py-6">역할이 없습니다.</p>
                    ) : (
                      <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                        {roleStats.map((r, idx) => (
                          <div
                            key={r.id}
                            className={`flex items-center gap-3 px-3 py-2.5 ${idx < roleStats.length - 1 ? 'border-b border-[var(--color-border)]' : ''}`}
                          >
                            <div className="w-7 h-7 rounded-full bg-[var(--color-surface-secondary)] text-[12px] font-bold text-[var(--color-text-muted)] flex items-center justify-center shrink-0 select-none">
                              {r.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[13px] font-medium text-[var(--color-text)] truncate block">{r.name}</span>
                            </div>
                            <span className={`text-[13px] font-semibold tabular-nums shrink-0 ${r.count === 0 ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text)]'}`}>
                              {r.count === 0 ? '—' : `${r.count}건`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    memberStats.length === 0 ? (
                      <p className="text-[13px] text-[var(--color-text-muted)] text-center py-6">멤버가 없습니다.</p>
                    ) : (
                      <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                        {memberStats.map((m, idx) => (
                          <div
                            key={m.id}
                            className={`flex items-center gap-3 px-3 py-2.5 ${idx < memberStats.length - 1 ? 'border-b border-[var(--color-border)]' : ''}`}
                          >
                            <div className="w-7 h-7 rounded-full bg-[var(--color-surface-secondary)] text-[12px] font-bold text-[var(--color-text-muted)] flex items-center justify-center shrink-0 select-none">
                              {(m.profile.name ?? '?').charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[13px] font-medium text-[var(--color-text)] truncate block">{m.profile.name}</span>
                              {m.tenant_role?.name && (
                                <span className="text-[11px] text-[var(--color-text-muted)]">{m.tenant_role.name}</span>
                              )}
                            </div>
                            <span className={`text-[13px] font-semibold tabular-nums shrink-0 ${m.count === 0 ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text)]'}`}>
                              {m.count === 0 ? '—' : `${m.count}건`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </section>

                {/* 섹션 3: 슬롯별 현황 */}
                {slotStats.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-[var(--color-text)]">이번 달 슬롯 현황</h2>
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        총 {slotStats.reduce((acc, x) => acc + x.count, 0)}건
                      </span>
                    </div>
                    <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                      {slotStats.map((s, idx) => {
                        const pct = s.max_capacity > 0 ? Math.min(100, Math.round((s.count / s.max_capacity) * 100)) : 0
                        return (
                          <div
                            key={s.time_slot}
                            className={`flex items-center gap-3 px-3 py-2.5 ${idx < slotStats.length - 1 ? 'border-b border-[var(--color-border)]' : ''}`}
                          >
                            <span className="text-[13px] font-medium text-[var(--color-text)] w-20 shrink-0 truncate">{s.label}</span>
                            <div className="flex-1 min-w-0 h-1.5 rounded-full bg-[var(--color-surface-secondary)] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-blue-400 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[12px] tabular-nums text-[var(--color-text-muted)] shrink-0 w-14 text-right">
                              {s.max_capacity > 0 ? `${s.count} / ${s.max_capacity}` : `${s.count}건`}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* 거절 확인 다이얼로그 */}
      {confirmReject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setConfirmReject(null)}
        >
          <div
            className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-lg)] p-6 mx-4 max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-[15px] font-semibold text-[var(--color-text)] mb-2">가입 거절</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-5">해당 멤버의 가입 신청을 거절하시겠습니까?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmReject(null)}
                className="flex-1 py-2 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-xl transition-colors"
              >
                취소
              </button>
              <button
                onClick={async () => { await rejectUser(confirmReject); setConfirmReject(null) }}
                className="flex-1 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
              >
                거절
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
