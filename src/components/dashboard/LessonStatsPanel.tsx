import { useState, useMemo } from 'react'
import { useLessonPackages } from '../../hooks/useLessonPackages'
import { fmtNumber } from '../../lib/format'

type StatKey =
  | 'active_holders'
  | 'type_sales_ranking'
  | 'consumption_rate'
  | 'expired_remaining'
  | 'repurchase'
  | 'monthly_new'
  | 'monthly_consumption'

const STAT_OPTIONS: { key: StatKey; label: string; badge: '누적' | '월별' }[] = [
  { key: 'active_holders',      label: '현재 유효 레슨권 보유 인원', badge: '누적' },
  { key: 'type_sales_ranking',  label: '레슨권 종류별 판매 건수',    badge: '누적' },
  { key: 'consumption_rate',    label: '차감률 현황',                badge: '누적' },
  { key: 'expired_remaining',   label: '만료 시 평균 잔여 회차',      badge: '누적' },
  { key: 'repurchase',          label: '재구매 회원 현황',            badge: '누적' },
  { key: 'monthly_new',         label: '해당 월 신규 결제 건수',      badge: '월별' },
  { key: 'monthly_consumption', label: '해당 월 결제 레슨권 차감률',  badge: '월별' },
]

interface Props {
  tenantId: string
  viewYear: number
  viewMonth: number
  memberNameMap: Map<string, string>
}

export function LessonStatsPanel({ tenantId, viewYear, viewMonth, memberNameMap }: Props) {
  const { packages, loading } = useLessonPackages(tenantId)
  const [selected, setSelected] = useState<StatKey>('active_holders')

  const monthPrefix = `${viewYear}-${String(viewMonth).padStart(2, '0')}`
  const today = new Date().toISOString().slice(0, 10)

  // ── 통계 계산 ────────────────────────────────────────────

  const activeHolders = useMemo(() =>
    packages.filter(p =>
      p.used_sessions < p.total_sessions &&
      (!p.expires_at || p.expires_at >= today)
    ).map(p => ({
      name: memberNameMap.get(p.user_id ?? '') ?? '알 수 없음',
      packageName: p.package_name,
      remaining: p.total_sessions - p.used_sessions,
      expiresAt: p.expires_at,
    }))
  , [packages, memberNameMap, today])

  const typeSalesRanking = useMemo(() => {
    const countMap = new Map<string, number>()
    for (const p of packages) {
      countMap.set(p.package_name, (countMap.get(p.package_name) ?? 0) + 1)
    }
    const total = packages.length
    return [...countMap.entries()]
      .map(([name, count]) => ({ name, count, pct: total > 0 ? Math.round(count / total * 100) : 0 }))
      .sort((a, b) => b.count - a.count)
  }, [packages])

  const consumptionRate = useMemo(() => {
    const done    = packages.filter(p => p.used_sessions >= p.total_sessions).length
    const expired = packages.filter(p => p.used_sessions < p.total_sessions && !!p.expires_at && p.expires_at < today).length
    const active  = packages.filter(p => p.used_sessions < p.total_sessions && (!p.expires_at || p.expires_at >= today)).length
    return { done, expired, active, total: packages.length }
  }, [packages, today])

  const expiredRemaining = useMemo(() => {
    const expired = packages.filter(p => !!p.expires_at && p.expires_at < today && p.used_sessions < p.total_sessions)
    const avgRemaining = expired.length > 0
      ? Math.round(expired.reduce((s, p) => s + (p.total_sessions - p.used_sessions), 0) / expired.length * 10) / 10
      : 0
    return {
      count: expired.length,
      avgRemaining,
      rows: expired.map(p => ({
        name: memberNameMap.get(p.user_id ?? '') ?? '알 수 없음',
        packageName: p.package_name,
        remaining: p.total_sessions - p.used_sessions,
        expiresAt: p.expires_at ?? '',
      })),
    }
  }, [packages, memberNameMap, today])

  const repurchase = useMemo(() => {
    const countMap = new Map<string, { count: number; first: string; last: string }>()
    for (const p of packages) {
      if (!p.user_id) continue
      const prev = countMap.get(p.user_id)
      if (!prev) {
        countMap.set(p.user_id, { count: 1, first: p.payment_date, last: p.payment_date })
      } else {
        countMap.set(p.user_id, {
          count: prev.count + 1,
          first: p.payment_date < prev.first ? p.payment_date : prev.first,
          last:  p.payment_date > prev.last  ? p.payment_date : prev.last,
        })
      }
    }
    return [...countMap.entries()]
      .filter(([, v]) => v.count > 1)
      .map(([userId, v]) => ({
        name: memberNameMap.get(userId) ?? '알 수 없음',
        count: v.count,
        first: v.first,
        last: v.last,
      }))
      .sort((a, b) => b.count - a.count)
  }, [packages, memberNameMap])

  const monthlyNew = useMemo(() => {
    const filtered = packages.filter(p => p.payment_date.startsWith(monthPrefix))
    return {
      count: filtered.length,
      rows: filtered.map(p => ({
        name: memberNameMap.get(p.user_id ?? '') ?? '알 수 없음',
        packageName: p.package_name,
        paymentDate: p.payment_date,
      })),
    }
  }, [packages, memberNameMap, monthPrefix])

  const monthlyConsumption = useMemo(() => {
    const filtered = packages.filter(p => p.payment_date.startsWith(monthPrefix))
    if (filtered.length === 0) return { avgPct: 0, rows: [] as { name: string; packageName: string; pct: number; used: number; total: number; status: string }[] }
    const rows = filtered.map(p => {
      const pct       = Math.min(100, Math.round(p.used_sessions / p.total_sessions * 100))
      const isDone    = p.used_sessions >= p.total_sessions
      const isExpired = !!p.expires_at && p.expires_at < today
      const status    = isDone ? '사용완료' : isExpired ? '만료' : '진행중'
      return {
        name: memberNameMap.get(p.user_id ?? '') ?? '알 수 없음',
        packageName: p.package_name,
        pct,
        used: p.used_sessions,
        total: p.total_sessions,
        status,
      }
    })
    const avgPct = Math.round(rows.reduce((s, r) => s + r.pct, 0) / rows.length)
    return { avgPct, rows }
  }, [packages, memberNameMap, monthPrefix, today])

  // ── 렌더 ────────────────────────────────────────────────

  const selectedOption = STAT_OPTIONS.find(o => o.key === selected)!

  const thCls = 'text-center px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]'
  const tdCls = 'text-center px-3 py-2.5'
  const trCls = 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]'

  function renderStat() {
    if (loading) {
      return <p className="text-sm text-[var(--color-text-muted)] text-center py-8">로딩 중...</p>
    }

    switch (selected) {
      case 'active_holders':
        return (
          <div>
            <div className="flex items-baseline gap-1.5 mb-4">
              <span className="text-[32px] font-bold tabular-nums text-[var(--color-text-primary)]">{activeHolders.length}</span>
              <span className="text-[15px] font-semibold text-[var(--color-text-muted)]">명</span>
            </div>
            {activeHolders.length === 0
              ? <p className="text-sm text-[var(--color-text-muted)] text-center py-4">유효한 레슨권이 없습니다.</p>
              : <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
                      <th className={thCls}>회원</th><th className={thCls}>레슨권</th>
                      <th className={thCls}>잔여</th><th className={thCls}>만료일</th>
                    </tr></thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {activeHolders.map((r, i) => (
                        <tr key={i} className={trCls}>
                          <td className={`${tdCls} font-medium text-[var(--color-text-primary)]`}>{r.name}</td>
                          <td className={`${tdCls} text-xs text-[var(--color-text-secondary)]`}>{r.packageName}</td>
                          <td className={`${tdCls} font-semibold tabular-nums text-[var(--color-text-primary)]`}>{r.remaining}회</td>
                          <td className={`${tdCls} text-xs text-[var(--color-text-muted)]`}>{r.expiresAt ?? '무기한'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            }
          </div>
        )

      case 'type_sales_ranking':
        return (
          <div>
            <div className="flex items-baseline gap-1.5 mb-4">
              <span className="text-[32px] font-bold tabular-nums text-[var(--color-text-primary)]">{fmtNumber(packages.length)}</span>
              <span className="text-[15px] font-semibold text-[var(--color-text-muted)]">건 (전체)</span>
            </div>
            {typeSalesRanking.length === 0
              ? <p className="text-sm text-[var(--color-text-muted)] text-center py-4">데이터가 없습니다.</p>
              : <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
                      <th className={thCls}>레슨권 종류</th><th className={thCls}>판매 건수</th><th className={thCls}>점유율</th>
                    </tr></thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {typeSalesRanking.map((r, i) => (
                        <tr key={i} className={trCls}>
                          <td className={`${tdCls} font-medium text-[var(--color-text-primary)]`}>{r.name}</td>
                          <td className={`${tdCls} font-semibold tabular-nums text-[var(--color-text-primary)]`}>{fmtNumber(r.count)}건</td>
                          <td className={`${tdCls} tabular-nums text-[var(--color-text-secondary)]`}>{r.pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            }
          </div>
        )

      case 'consumption_rate':
        return (
          <div>
            <div className="flex items-baseline gap-1.5 mb-4">
              <span className="text-[32px] font-bold tabular-nums text-[var(--color-text-primary)]">{consumptionRate.total}</span>
              <span className="text-[15px] font-semibold text-[var(--color-text-muted)]">건 (전체)</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {([
                { label: '진행중',  value: consumptionRate.active,  cls: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
                { label: '사용완료', value: consumptionRate.done,   cls: 'bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]' },
                { label: '만료',    value: consumptionRate.expired, cls: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' },
              ] as const).map(item => (
                <div key={item.label} className={`rounded-xl border border-[var(--color-border)] px-3 py-3 text-center ${item.cls}`}>
                  <p className="text-xs font-semibold mb-1">{item.label}</p>
                  <p className="text-[22px] font-bold tabular-nums">{item.value}</p>
                  <p className="text-[11px] mt-0.5">{consumptionRate.total > 0 ? Math.round(item.value / consumptionRate.total * 100) : 0}%</p>
                </div>
              ))}
            </div>
          </div>
        )

      case 'expired_remaining':
        return (
          <div>
            <div className="flex items-baseline gap-3 mb-4">
              <div>
                <span className="text-[32px] font-bold tabular-nums text-[var(--color-text-primary)]">{expiredRemaining.avgRemaining}</span>
                <span className="text-[15px] font-semibold text-[var(--color-text-muted)] ml-1">회 평균 잔여</span>
              </div>
              <span className="text-sm text-[var(--color-text-muted)]">({expiredRemaining.count}건)</span>
            </div>
            {expiredRemaining.rows.length === 0
              ? <p className="text-sm text-[var(--color-text-muted)] text-center py-4">만료된 레슨권이 없습니다.</p>
              : <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
                      <th className={thCls}>회원</th><th className={thCls}>레슨권</th>
                      <th className={thCls}>잔여 회차</th><th className={thCls}>만료일</th>
                    </tr></thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {expiredRemaining.rows.map((r, i) => (
                        <tr key={i} className={trCls}>
                          <td className={`${tdCls} font-medium text-[var(--color-text-primary)]`}>{r.name}</td>
                          <td className={`${tdCls} text-xs text-[var(--color-text-secondary)]`}>{r.packageName}</td>
                          <td className={`${tdCls} font-semibold tabular-nums text-red-600`}>{r.remaining}회</td>
                          <td className={`${tdCls} text-xs text-[var(--color-text-muted)]`}>{r.expiresAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            }
          </div>
        )

      case 'repurchase':
        return (
          <div>
            <div className="flex items-baseline gap-1.5 mb-4">
              <span className="text-[32px] font-bold tabular-nums text-[var(--color-text-primary)]">{repurchase.length}</span>
              <span className="text-[15px] font-semibold text-[var(--color-text-muted)]">명</span>
            </div>
            {repurchase.length === 0
              ? <p className="text-sm text-[var(--color-text-muted)] text-center py-4">재구매 회원이 없습니다.</p>
              : <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
                      <th className={thCls}>회원</th><th className={thCls}>구매 횟수</th>
                      <th className={thCls}>첫 구매</th><th className={thCls}>최근 구매</th>
                    </tr></thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {repurchase.map((r, i) => (
                        <tr key={i} className={trCls}>
                          <td className={`${tdCls} font-medium text-[var(--color-text-primary)]`}>{r.name}</td>
                          <td className={`${tdCls} font-semibold tabular-nums text-[var(--color-text-primary)]`}>{r.count}회</td>
                          <td className={`${tdCls} text-xs text-[var(--color-text-muted)]`}>{r.first}</td>
                          <td className={`${tdCls} text-xs text-[var(--color-text-muted)]`}>{r.last}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            }
          </div>
        )

      case 'monthly_new':
        return (
          <div>
            <div className="flex items-baseline gap-1.5 mb-4">
              <span className="text-[32px] font-bold tabular-nums text-[var(--color-text-primary)]">{monthlyNew.count}</span>
              <span className="text-[15px] font-semibold text-[var(--color-text-muted)]">건</span>
            </div>
            {monthlyNew.rows.length === 0
              ? <p className="text-sm text-[var(--color-text-muted)] text-center py-4">이 달 결제 기록이 없습니다.</p>
              : <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
                      <th className={thCls}>회원</th><th className={thCls}>레슨권</th><th className={thCls}>결제일</th>
                    </tr></thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {monthlyNew.rows.map((r, i) => (
                        <tr key={i} className={trCls}>
                          <td className={`${tdCls} font-medium text-[var(--color-text-primary)]`}>{r.name}</td>
                          <td className={`${tdCls} text-xs text-[var(--color-text-secondary)]`}>{r.packageName}</td>
                          <td className={`${tdCls} text-xs text-[var(--color-text-muted)]`}>{r.paymentDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            }
          </div>
        )

      case 'monthly_consumption':
        return (
          <div>
            <div className="flex items-baseline gap-1.5 mb-4">
              <span className="text-[32px] font-bold tabular-nums text-[var(--color-text-primary)]">{monthlyConsumption.avgPct}</span>
              <span className="text-[15px] font-semibold text-[var(--color-text-muted)]">% 평균 차감률</span>
            </div>
            {monthlyConsumption.rows.length === 0
              ? <p className="text-sm text-[var(--color-text-muted)] text-center py-4">이 달 결제 기록이 없습니다.</p>
              : <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
                      <th className={thCls}>회원</th><th className={thCls}>레슨권</th>
                      <th className={thCls}>차감</th><th className={thCls}>상태</th>
                    </tr></thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {monthlyConsumption.rows.map((r, i) => (
                        <tr key={i} className={trCls}>
                          <td className={`${tdCls} font-medium text-[var(--color-text-primary)]`}>{r.name}</td>
                          <td className={`${tdCls} text-xs text-[var(--color-text-secondary)]`}>{r.packageName}</td>
                          <td className={`${tdCls} tabular-nums text-[var(--color-text-primary)]`}>{r.used}/{r.total}회</td>
                          <td className={tdCls}>
                            <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                              r.status === '사용완료' ? 'bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]'
                              : r.status === '만료' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            }`}>{r.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            }
          </div>
        )

      default:
        return null
    }
  }

  return (
    <section className="border border-[var(--color-border)] rounded-[16px] bg-[var(--color-surface)] p-5">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2 className="text-[15px] font-bold tracking-tight text-[var(--color-text-primary)]">레슨권 통계</h2>
        <div className="flex items-center gap-2">
          {selectedOption.badge === '월별'
            ? <span className="text-xs font-semibold text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 px-2 py-0.5 rounded-full">
                {viewYear}년 {viewMonth}월
              </span>
            : <span className="text-xs font-semibold text-[var(--color-text-muted)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] px-2 py-0.5 rounded-full">
                누적
              </span>
          }
          <select
            value={selected}
            onChange={e => setSelected(e.target.value as StatKey)}
            className="text-sm border border-[var(--color-border-strong)] rounded-lg px-2 py-1.5 bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
          >
            {STAT_OPTIONS.map(opt => (
              <option key={opt.key} value={opt.key}>{opt.label} ({opt.badge})</option>
            ))}
          </select>
        </div>
      </div>
      {renderStat()}
    </section>
  )
}
