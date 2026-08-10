# Lesson Stats Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `feature_flags.lesson_packages`가 true인 대시보드에 레슨권 통계 패널을 추가한다. 드롭다운으로 통계 항목을 선택하면 해당 통계를 조회한다.

**Architecture:** `LessonStatsPanel` 컴포넌트를 `src/components/dashboard/`에 신규 생성한다. `useLessonPackages(tenantId)` 훅으로 패키지 데이터를 자체 조회하며, `viewYear`/`viewMonth`를 prop으로 받아 월별/누적 통계를 모두 지원한다. `DashboardPage`의 커스텀 위젯 섹션 바로 아래에 `getFF(ff, 'lesson_packages')` 조건으로 삽입한다.

**Tech Stack:** React, TypeScript, Tailwind CSS, Supabase (useLessonPackages 훅 재사용)

## Global Constraints

- 하드코딩 금지: 조직별 설정은 DB/컨텍스트에서 읽는다
- `getFF(ff, 'lesson_packages')` 로만 기능 노출 여부를 판단한다
- 데이터 표시는 `fmtNumber()` from `src/lib/format.ts` 사용
- 타입 체크: `npx tsc -b` 로 확인 (루트 `npx tsc --noEmit` 사용 금지)
- CSS: 기존 `var(--color-*)` CSS 변수 체계 유지

---

## File Structure

| 작업 | 파일 | 역할 |
|------|------|------|
| 생성 | `src/components/dashboard/LessonStatsPanel.tsx` | 드롭다운 + 통계 렌더링 전담 |
| 수정 | `src/pages/DashboardPage.tsx` | LessonStatsPanel import 및 조건부 렌더링 삽입 |

---

## Task 1: LessonStatsPanel 컴포넌트 생성

**Files:**
- Create: `src/components/dashboard/LessonStatsPanel.tsx`

**Interfaces:**
- Produces:
  ```ts
  export function LessonStatsPanel(props: {
    tenantId: string
    viewYear: number
    viewMonth: number
    memberNameMap: Map<string, string>  // userId → 이름
  }): JSX.Element
  ```

**통계 항목 (StatKey):**
```ts
type StatKey =
  | 'active_holders'      // 현재 유효 레슨권 보유 인원 (누적)
  | 'type_sales_ranking'  // 레슨권 종류별 판매 건수 (누적)
  | 'consumption_rate'    // 소진율 현황 (누적)
  | 'expired_remaining'   // 만료 시 평균 잔여 회차 (누적)
  | 'repurchase'          // 재구매 회원 현황 (누적)
  | 'monthly_new'         // 해당 월 신규 결제 건수 (월별)
  | 'monthly_consumption' // 해당 월 결제 레슨권 소진율 (월별)
```

- [ ] **Step 1: 파일 생성 — 기본 구조 및 드롭다운**

```tsx
// src/components/dashboard/LessonStatsPanel.tsx
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
  { key: 'consumption_rate',    label: '소진율 현황',                badge: '누적' },
  { key: 'expired_remaining',   label: '만료 시 평균 잔여 회차',      badge: '누적' },
  { key: 'repurchase',          label: '재구매 회원 현황',            badge: '누적' },
  { key: 'monthly_new',         label: '해당 월 신규 결제 건수',      badge: '월별' },
  { key: 'monthly_consumption', label: '해당 월 결제 레슨권 소진율',  badge: '월별' },
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

  // 1. 현재 유효 레슨권 보유 인원 (누적)
  const activeHolders = useMemo(() => {
    return packages.filter(p =>
      p.used_sessions < p.total_sessions &&
      (!p.expires_at || p.expires_at >= today)
    ).map(p => ({
      name: memberNameMap.get(p.user_id ?? '') ?? '알 수 없음',
      packageName: p.package_name,
      remaining: p.total_sessions - p.used_sessions,
      expiresAt: p.expires_at,
    }))
  }, [packages, memberNameMap, today])

  // 2. 레슨권 종류별 판매 건수 (누적)
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

  // 3. 소진율 현황 (누적)
  const consumptionRate = useMemo(() => {
    const done     = packages.filter(p => p.used_sessions >= p.total_sessions).length
    const expired  = packages.filter(p => p.used_sessions < p.total_sessions && !!p.expires_at && p.expires_at < today).length
    const active   = packages.filter(p => p.used_sessions < p.total_sessions && (!p.expires_at || p.expires_at >= today)).length
    const total    = packages.length
    return { done, expired, active, total }
  }, [packages, today])

  // 4. 만료 시 평균 잔여 회차 (누적)
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

  // 5. 재구매 회원 현황 (누적)
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

  // 6. 해당 월 신규 결제 건수 (월별)
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

  // 7. 해당 월 결제 레슨권 소진율 (월별)
  const monthlyConsumption = useMemo(() => {
    const filtered = packages.filter(p => p.payment_date.startsWith(monthPrefix))
    if (filtered.length === 0) return { avgPct: 0, rows: [] }
    const rows = filtered.map(p => {
      const pct = Math.min(100, Math.round(p.used_sessions / p.total_sessions * 100))
      const isDone    = p.used_sessions >= p.total_sessions
      const isExpired = !!p.expires_at && p.expires_at < today
      const status    = isDone ? '소진완료' : isExpired ? '만료' : '진행중'
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

  // ── 렌더 헬퍼 ───────────────────────────────────────────

  const selectedOption = STAT_OPTIONS.find(o => o.key === selected)!

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
            {activeHolders.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">유효한 레슨권이 없습니다.</p>
            ) : (
              <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
                      <th className="text-center px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">회원</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">레슨권</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">잔여</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">만료일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {activeHolders.map((r, i) => (
                      <tr key={i} className="bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]">
                        <td className="text-center px-3 py-2.5 font-medium text-[var(--color-text-primary)]">{r.name}</td>
                        <td className="text-center px-3 py-2.5 text-[var(--color-text-secondary)] text-xs">{r.packageName}</td>
                        <td className="text-center px-3 py-2.5 font-semibold tabular-nums text-[var(--color-text-primary)]">{r.remaining}회</td>
                        <td className="text-center px-3 py-2.5 text-xs text-[var(--color-text-muted)]">{r.expiresAt ?? '무기한'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )

      case 'type_sales_ranking':
        return (
          <div>
            <div className="flex items-baseline gap-1.5 mb-4">
              <span className="text-[32px] font-bold tabular-nums text-[var(--color-text-primary)]">{fmtNumber(packages.length)}</span>
              <span className="text-[15px] font-semibold text-[var(--color-text-muted)]">건 (전체)</span>
            </div>
            {typeSalesRanking.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">데이터가 없습니다.</p>
            ) : (
              <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
                      <th className="text-center px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">레슨권 종류</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">판매 건수</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">점유율</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {typeSalesRanking.map((r, i) => (
                      <tr key={i} className="bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]">
                        <td className="text-center px-3 py-2.5 font-medium text-[var(--color-text-primary)]">{r.name}</td>
                        <td className="text-center px-3 py-2.5 font-semibold tabular-nums text-[var(--color-text-primary)]">{fmtNumber(r.count)}건</td>
                        <td className="text-center px-3 py-2.5 tabular-nums text-[var(--color-text-secondary)]">{r.pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
              {[
                { label: '진행중', value: consumptionRate.active,  color: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
                { label: '소진완료', value: consumptionRate.done,  color: 'bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]' },
                { label: '만료',    value: consumptionRate.expired, color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' },
              ].map(item => (
                <div key={item.label} className={`rounded-xl border border-[var(--color-border)] px-3 py-3 text-center ${item.color}`}>
                  <p className="text-xs font-semibold mb-1">{item.label}</p>
                  <p className="text-[22px] font-bold tabular-nums">{item.value}</p>
                  <p className="text-[11px] mt-0.5">
                    {consumptionRate.total > 0 ? Math.round(item.value / consumptionRate.total * 100) : 0}%
                  </p>
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
            {expiredRemaining.rows.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">만료된 레슨권이 없습니다.</p>
            ) : (
              <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
                      <th className="text-center px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">회원</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">레슨권</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">잔여 회차</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">만료일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {expiredRemaining.rows.map((r, i) => (
                      <tr key={i} className="bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]">
                        <td className="text-center px-3 py-2.5 font-medium text-[var(--color-text-primary)]">{r.name}</td>
                        <td className="text-center px-3 py-2.5 text-xs text-[var(--color-text-secondary)]">{r.packageName}</td>
                        <td className="text-center px-3 py-2.5 font-semibold tabular-nums text-red-600">{r.remaining}회</td>
                        <td className="text-center px-3 py-2.5 text-xs text-[var(--color-text-muted)]">{r.expiresAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )

      case 'repurchase':
        return (
          <div>
            <div className="flex items-baseline gap-1.5 mb-4">
              <span className="text-[32px] font-bold tabular-nums text-[var(--color-text-primary)]">{repurchase.length}</span>
              <span className="text-[15px] font-semibold text-[var(--color-text-muted)]">명</span>
            </div>
            {repurchase.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">재구매 회원이 없습니다.</p>
            ) : (
              <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
                      <th className="text-center px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">회원</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">구매 횟수</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">첫 구매</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">최근 구매</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {repurchase.map((r, i) => (
                      <tr key={i} className="bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]">
                        <td className="text-center px-3 py-2.5 font-medium text-[var(--color-text-primary)]">{r.name}</td>
                        <td className="text-center px-3 py-2.5 font-semibold tabular-nums text-[var(--color-text-primary)]">{r.count}회</td>
                        <td className="text-center px-3 py-2.5 text-xs text-[var(--color-text-muted)]">{r.first}</td>
                        <td className="text-center px-3 py-2.5 text-xs text-[var(--color-text-muted)]">{r.last}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )

      case 'monthly_new':
        return (
          <div>
            <div className="flex items-baseline gap-1.5 mb-4">
              <span className="text-[32px] font-bold tabular-nums text-[var(--color-text-primary)]">{monthlyNew.count}</span>
              <span className="text-[15px] font-semibold text-[var(--color-text-muted)]">건</span>
            </div>
            {monthlyNew.rows.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">이 달 결제 기록이 없습니다.</p>
            ) : (
              <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
                      <th className="text-center px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">회원</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">레슨권</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">결제일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {monthlyNew.rows.map((r, i) => (
                      <tr key={i} className="bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]">
                        <td className="text-center px-3 py-2.5 font-medium text-[var(--color-text-primary)]">{r.name}</td>
                        <td className="text-center px-3 py-2.5 text-xs text-[var(--color-text-secondary)]">{r.packageName}</td>
                        <td className="text-center px-3 py-2.5 text-xs text-[var(--color-text-muted)]">{r.paymentDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )

      case 'monthly_consumption':
        return (
          <div>
            <div className="flex items-baseline gap-1.5 mb-4">
              <span className="text-[32px] font-bold tabular-nums text-[var(--color-text-primary)]">{monthlyConsumption.avgPct}</span>
              <span className="text-[15px] font-semibold text-[var(--color-text-muted)]">% 평균 소진율</span>
            </div>
            {monthlyConsumption.rows.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">이 달 결제 기록이 없습니다.</p>
            ) : (
              <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
                      <th className="text-center px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">회원</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">레슨권</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">소진</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {monthlyConsumption.rows.map((r, i) => (
                      <tr key={i} className="bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]">
                        <td className="text-center px-3 py-2.5 font-medium text-[var(--color-text-primary)]">{r.name}</td>
                        <td className="text-center px-3 py-2.5 text-xs text-[var(--color-text-secondary)]">{r.packageName}</td>
                        <td className="text-center px-3 py-2.5 tabular-nums text-[var(--color-text-primary)]">{r.used}/{r.total}회</td>
                        <td className="text-center px-3 py-2.5">
                          <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                            r.status === '소진완료' ? 'bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]'
                            : r.status === '만료' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          }`}>{r.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <section className="border border-[var(--color-border)] rounded-[16px] bg-[var(--color-surface)] p-5">
      {/* 헤더 + 드롭다운 */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2 className="text-[15px] font-bold tracking-tight text-[var(--color-text-primary)]">레슨권 통계</h2>
        <div className="flex items-center gap-2">
          {selectedOption.badge === '월별' && (
            <span className="text-xs font-semibold text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 px-2 py-0.5 rounded-full">
              {viewYear}년 {viewMonth}월
            </span>
          )}
          {selectedOption.badge === '누적' && (
            <span className="text-xs font-semibold text-[var(--color-text-muted)] bg-[var(--color-surface-secondary)] px-2 py-0.5 rounded-full border border-[var(--color-border)]">
              누적
            </span>
          )}
          <select
            value={selected}
            onChange={e => setSelected(e.target.value as StatKey)}
            className="text-sm border border-[var(--color-border-strong)] rounded-lg px-2 py-1.5 bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
          >
            {STAT_OPTIONS.map(opt => (
              <option key={opt.key} value={opt.key}>
                {opt.label} ({opt.badge})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 통계 본문 */}
      {renderStat()}
    </section>
  )
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc -b 2>&1 | head -30
```

Expected: 출력 없음 (오류 없음)

- [ ] **Step 3: 커밋**

```bash
git add src/components/dashboard/LessonStatsPanel.tsx
git commit -m "feat: LessonStatsPanel 컴포넌트 생성 — 레슨권 7종 통계"
```

---

## Task 2: DashboardPage에 LessonStatsPanel 통합

**Files:**
- Modify: `src/pages/DashboardPage.tsx`

**Interfaces:**
- Consumes:
  ```ts
  // Task 1에서 생성
  import { LessonStatsPanel } from '../components/dashboard/LessonStatsPanel'
  // 기존 import 추가
  import { getFF } from '../lib/featureFlags'
  ```

- [ ] **Step 1: import 추가**

`DashboardPage.tsx` 상단 import 블록에 아래 두 줄을 추가한다.

```ts
import { LessonStatsPanel } from '../components/dashboard/LessonStatsPanel'
import { getFF } from '../lib/featureFlags'
```

- [ ] **Step 2: memberNameMap useMemo 추가**

`DashboardPage` 함수 내부, 기존 `useMemo` 블록들 아래에 추가한다.

```ts
const memberNameMap = useMemo(
  () => new Map(members.map(m => [m.user_id, m.profile?.name ?? m.user_id])),
  [members]
)
```

- [ ] **Step 3: LessonStatsPanel 렌더링 삽입**

DashboardPage 렌더 영역에서 `{/* ── 사용자 정의 통계 위젯 ── */}` 섹션의 닫는 `)}` 직후이자 `{isAdmin && (` 버튼 블록 이후,  탈퇴 요청 블록 `{currentMembership && currentMembership.withdrawal_status === 'none' && ...}` 이전에 삽입한다.

정확한 삽입 위치 (기존 코드 패턴):

```tsx
                {isAdmin && (
                  <button
                    onClick={() => { setEditingWidget(null); setShowWidgetModal(true) }}
                    className="w-full py-3 border-2 border-dashed border-[var(--color-border)] rounded-[16px] text-sm text-[var(--color-text-muted)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] transition-colors"
                  >
                    + 통계 위젯 추가
                  </button>
                )}

                {/* ── 레슨권 통계 ── */}
                {getFF(tenant?.settings?.feature_flags, 'lesson_packages') && (
                  <LessonStatsPanel
                    tenantId={tenant?.id ?? ''}
                    viewYear={viewYear}
                    viewMonth={viewMonth}
                    memberNameMap={memberNameMap}
                  />
                )}

                {currentMembership && currentMembership.withdrawal_status === 'none' && (
```

- [ ] **Step 4: 타입 체크**

```bash
npx tsc -b 2>&1 | head -30
```

Expected: 출력 없음

- [ ] **Step 5: 커밋**

```bash
git add src/pages/DashboardPage.tsx
git commit -m "feat: DashboardPage에 LessonStatsPanel 통합"
```

---

## 완료 후 확인 사항

1. `feature_flags.lesson_packages = true`인 조직의 대시보드에서 "레슨권 통계" 섹션이 보임
2. 드롭다운에서 7개 항목을 모두 선택해 렌더링 오류가 없음
3. 월별 항목(`monthly_new`, `monthly_consumption`)은 월 변경 시 데이터가 바뀜
4. `feature_flags.lesson_packages = false`인 조직에서는 섹션이 표시되지 않음
5. `npx tsc -b` 오류 없음
