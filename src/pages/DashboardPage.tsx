import { useMemo, useState, useEffect } from 'react'
import { DevFileLabel } from '../components/DevFileLabel'
import { fmtNumber } from '../lib/format'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCustomerAdmin } from '../hooks/useCustomerAdmin'
import { useTenant } from '../contexts/TenantContext'
import { supabase } from '../lib/supabase'
import { useDashboard } from '../hooks/useDashboard'
import { AppHeader } from '../components/AppHeader'
import { shortSlotLabel } from '../utils/timeSlots'
import { getOptionUnit } from '../types'
import type { CustomFieldDef, CustomFieldOption, DashboardWidgetConfig } from '../types'
import { DashboardWidgetModal } from '../components/modals/DashboardWidgetModal'
import type { AssignmentSummary } from '../hooks/useDashboard'

const WIDGET_COLORS = ['#4f46e5','#06b6d4','#f59e0b','#10b981','#f43f5e','#8b5cf6','#ec4899','#14b8a6','#f97316','#64748b']

interface WidgetDataPoint {
  label: string
  value: number      // 차트 스케일링에 사용 (COUNT: 건수, SUM/AVG: 집계값)
  count: number      // 항상 배정 건수
  storedSum: number | null  // 표시할 저장값 (COUNT: 옵션 금액 합계, SUM/AVG: 집계값)
  unit: string
}

function fmtWidgetCount(count: number, storedSum: number | null, unit: string): string {
  if (storedSum === null) return `${count}건`
  return `${count}건(${fmtNumber(storedSum)}${unit})`
}

function computeWidgetData(
  widget: DashboardWidgetConfig,
  assignments: AssignmentSummary[],
  fields: CustomFieldDef[]
): WidgetDataPoint[] {
  const groupField = fields.find(f => f.id === widget.groupByFieldId)
  if (!groupField) return []
  const groups = new Map<string, AssignmentSummary[]>()
  for (const a of assignments) {
    if (a.member_type === 'close') continue
    const rawVal = a.extra_data?.[widget.groupByFieldId]
    if (rawVal === undefined || rawVal === '') continue
    const keys = groupField.type === 'checkbox_group'
      ? rawVal.split(',').filter(Boolean)
      : [rawVal]
    for (const k of keys) {
      if (!groups.has(k)) groups.set(k, [])
      groups.get(k)!.push(a)
    }
  }
  return [...groups.entries()]
    .map(([key, items]) => {
      let label = key
      if (groupField.type === 'checkbox') label = key === 'true' ? '예' : '아니오'
      else if (groupField.options) label = groupField.options.find(o => o.value === key)?.name ?? key
      let value: number
      let storedSum: number | null = null
      let unit = ''
      if (widget.aggregateOp === 'COUNT') {
        value = items.length
        const option = groupField.options?.find(o => o.value === key)
        if (option?.value_type && option.value_type !== 'none') {
          const optionNumeric = Number(option.value)
          if (!isNaN(optionNumeric)) {
            storedSum = items.length * optionNumeric
            unit = getOptionUnit(option.value_type)
          }
        }
      } else if (widget.aggregateFieldId) {
        const nums = items
          .map(a => Number(a.extra_data?.[widget.aggregateFieldId!]))
          .filter(n => !isNaN(n))
        const aggValue = nums.length === 0 ? 0
          : widget.aggregateOp === 'SUM'
            ? nums.reduce((s, n) => s + n, 0)
            : Math.round(nums.reduce((s, n) => s + n, 0) / nums.length * 10) / 10
        value = aggValue
        storedSum = aggValue
      } else {
        value = items.length
      }
      return { label, value, count: items.length, storedSum, unit }
    })
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)
}

function BarChart({ data }: { data: (WidgetDataPoint & { color: string })[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={i} className="grid items-center gap-2" style={{ gridTemplateColumns: 'minmax(0,80px) 1fr auto' }}>
          <span className="text-[12px] font-semibold text-[var(--color-text-secondary)] truncate">{d.label}</span>
          <div className="h-[10px] rounded-full bg-[var(--color-surface-secondary)] border border-[var(--color-border)] overflow-hidden">
            <div className="h-full rounded-full transition-[width] duration-700"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color }} />
          </div>
          <span className="text-[11px] tabular-nums text-right font-mono text-[var(--color-text-muted)] shrink-0 max-w-[130px] break-all">
            {fmtWidgetCount(d.count, d.storedSum, d.unit)}
          </span>
        </div>
      ))}
    </div>
  )
}

function PieChart({ data }: { data: (WidgetDataPoint & { color: string })[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) return null
  const cx = 70, cy = 70, r = 60
  const toRad = (deg: number) => (deg - 90) * Math.PI / 180
  let cum = 0
  const segments = data.map(d => {
    const start = (cum / total) * 360
    cum += d.value
    const end = (cum / total) * 360
    return { ...d, start, end }
  })
  function arcPath(start: number, end: number) {
    const x1 = cx + r * Math.cos(toRad(start))
    const y1 = cy + r * Math.sin(toRad(start))
    const x2 = cx + r * Math.cos(toRad(end))
    const y2 = cy + r * Math.sin(toRad(end))
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${x2} ${y2} Z`
  }
  return (
    <div className="flex items-center gap-5 flex-wrap">
      <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
        {segments.map((seg, i) => (
          <path key={i} d={arcPath(seg.start, seg.end)} fill={seg.color} stroke="white" strokeWidth="1.5" />
        ))}
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 min-w-0">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: d.color }} />
            <span className="text-[13px] text-[var(--color-text-secondary)] truncate flex-1 min-w-0">{d.label}</span>
            <div className="shrink-0 text-right leading-tight">
              <div className="text-[12px] font-mono font-bold text-[var(--color-text-primary)]">{fmtWidgetCount(d.count, d.storedSum, d.unit)}</div>
              <div className="text-[10px] text-[var(--color-text-muted)]">({Math.round(d.value / total * 100)}%)</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TableChart({ data }: { data: (WidgetDataPoint & { color: string })[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div>
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[var(--color-border)] last:border-0">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
          <span className="text-sm text-[var(--color-text-secondary)] flex-1 truncate min-w-0">{d.label}</span>
          <div className="shrink-0 text-right leading-tight">
            <div className="text-[12px] font-bold font-mono text-[var(--color-text-primary)]">
              {fmtWidgetCount(d.count, d.storedSum, d.unit)}
            </div>
            <div className="text-[10px] text-[var(--color-text-muted)]">
              {total > 0 ? Math.round(d.value / total * 100) : 0}%
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface WidgetCardProps {
  widget: DashboardWidgetConfig
  assignments: AssignmentSummary[]
  customFields: CustomFieldDef[]
  isAdmin: boolean
  onEdit: () => void
  onDelete: () => void
}

function CustomWidgetCard({ widget, assignments, customFields, isAdmin, onEdit, onDelete }: WidgetCardProps) {
  const raw = computeWidgetData(widget, assignments, customFields)
  const colored = raw.map((d, i) => ({ ...d, color: WIDGET_COLORS[i % WIDGET_COLORS.length] }))
  const aggField = customFields.find(f => f.id === widget.aggregateFieldId)
  const aggLabel = widget.aggregateOp === 'COUNT'
    ? '건수'
    : `${aggField?.label ?? ''} ${widget.aggregateOp === 'SUM' ? '합계' : '평균'}`

  return (
    <section className="border border-[var(--color-border)] rounded-[16px] bg-[var(--color-surface)] p-5">
      <div className="flex items-start justify-between mb-4 gap-2">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold tracking-tight text-[var(--color-text-primary)] truncate">{widget.title}</h2>
          <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5 truncate">{aggLabel}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-1 shrink-0">
            <button onClick={onEdit}
              className="px-2 py-1 text-xs border border-[var(--color-border)] rounded hover:bg-[var(--color-surface-hover)]">수정</button>
            <button onClick={() => { if (confirm(`"${widget.title}" 위젯을 삭제할까요?`)) onDelete() }}
              className="px-2 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50">삭제</button>
          </div>
        )}
      </div>
      {colored.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)] text-center py-6">이 달 집계 데이터가 없습니다</p>
      ) : widget.chartType === 'bar' ? (
        <BarChart data={colored} />
      ) : widget.chartType === 'pie' ? (
        <PieChart data={colored} />
      ) : (
        <TableChart data={colored} />
      )}
      {colored.length > 0 && (() => {
        const totalCount = colored.reduce((s, d) => s + d.count, 0)
        const hasStoredSum = colored.some(d => d.storedSum !== null)
        const totalStoredSum = hasStoredSum ? colored.reduce((s, d) => s + (d.storedSum ?? 0), 0) : null
        const unit = colored[0]?.unit ?? ''
        return (
          <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
            <span className="text-[12px] text-[var(--color-text-muted)] font-medium">합계</span>
            <span className="text-[13px] font-bold font-mono text-[var(--color-text-primary)]">
              {fmtWidgetCount(totalCount, totalStoredSum, unit)}
            </span>
          </div>
        )
      })()}
    </section>
  )
}

function formatHours(h: number): string {
  const totalMin = Math.round(h * 60)
  const hrs = Math.floor(totalMin / 60)
  const min = totalMin % 60
  if (hrs === 0) return `${min}분`
  if (min === 0) return `${hrs}시간`
  return `${hrs}시간 ${min}분`
}

function slotDurationHours(slot: string): number {
  const [start, end] = slot.split('-').map(Number)
  return isNaN(end - start) ? 0 : end - start
}

const AVATAR_TINTS = [
  { bg: 'var(--tint-plus)',  fg: 'var(--tint-plus-ink)' },
  { bg: 'var(--tint-break)', fg: 'var(--tint-break-ink)' },
  { bg: 'var(--tint-sat)',   fg: 'var(--tint-sat-ink)' },
  { bg: 'var(--tint-moon)',  fg: 'var(--tint-moon-ink)' },
  { bg: 'var(--tint-sun)',   fg: 'var(--tint-sun-ink)' },
]

export function DashboardPage() {
  const { profile } = useAuth()
  const { isCustomerAdmin } = useCustomerAdmin()
  const navigate = useNavigate()
  const { tenant, memberships, slotLabels, customFields } = useTenant()

  // DashboardPage 마운트 시 DB에서 최신 커스텀 필드 + 위젯 설정을 직접 조회 (TenantContext stale 방지)
  const [freshCustomFields, setFreshCustomFields] = useState<CustomFieldDef[] | null>(null)
  const [widgetConfigs, setWidgetConfigs] = useState<DashboardWidgetConfig[]>([])
  const [showWidgetModal, setShowWidgetModal] = useState(false)
  const [editingWidget, setEditingWidget] = useState<DashboardWidgetConfig | null>(null)
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
        setWidgetConfigs((data?.settings?.dashboard_widgets ?? []) as DashboardWidgetConfig[])
      })
    return () => { cancelled = true }
  }, [tenant?.id])
  const effectiveCustomFields = freshCustomFields ?? customFields

  async function saveWidgetConfigs(configs: DashboardWidgetConfig[]) {
    if (!tenant?.id) return
    const { data: cur } = await supabase.from('tenants').select('settings').eq('id', tenant.id).single()
    const merged = { ...(cur?.settings ?? {}), dashboard_widgets: configs }
    await supabase.from('tenants').update({ settings: merged }).eq('id', tenant.id)
    setWidgetConfigs(configs)
  }

  async function handleWidgetSave(config: DashboardWidgetConfig) {
    const next = editingWidget
      ? widgetConfigs.map(w => w.id === config.id ? config : w)
      : [...widgetConfigs, config]
    await saveWidgetConfigs(next)
    setShowWidgetModal(false)
    setEditingWidget(null)
  }

  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth() + 1
  const [viewYear, setViewYear] = useState(thisYear)
  const [viewMonth, setViewMonth] = useState(thisMonth)

  const { pendingMembers, members, assignments, slotSettings, tenantRoles, loading, approveUser, rejectUser } =
    useDashboard(tenant?.id ?? '', viewYear, viewMonth)
  const [confirmReject, setConfirmReject] = useState<string | null>(null)
  const [participationTab, setParticipationTab] = useState<'역할별' | '사용자별'>('역할별')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const isFreeform = tenant?.settings?.tenant_mode === '비회원'

  const isCurrentMonth = viewYear === thisYear && viewMonth === thisMonth

  function prevMonth() {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (isCurrentMonth) return
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1) }
    else setViewMonth(m => m + 1)
  }

  const roleStats = useMemo(() => {
    const countById = new Map<string, number>()
    if (isFreeform) {
      // 비회원: user_id 없이 assignment의 role_id 직접 집계
      for (const a of assignments) {
        if (!a.role_id || a.member_type === 'close') continue
        countById.set(a.role_id, (countById.get(a.role_id) ?? 0) + 1)
      }
    } else {
      const userRoleMap = new Map<string, string>()
      for (const m of members) {
        if (m.role_id) userRoleMap.set(m.user_id, m.role_id)
      }
      for (const a of assignments) {
        const roleId = a.user_id ? userRoleMap.get(a.user_id) : undefined
        if (roleId) countById.set(roleId, (countById.get(roleId) ?? 0) + 1)
      }
    }
    return tenantRoles.map(r => ({ ...r, count: countById.get(r.id) ?? 0 }))
  }, [assignments, tenantRoles, members, isFreeform])

  const userStats = useMemo(() => {
    const countById = new Map<string, number>()
    const hoursById = new Map<string, number>()
    for (const a of assignments) {
      if (!a.user_id) continue
      countById.set(a.user_id, (countById.get(a.user_id) ?? 0) + 1)
      hoursById.set(a.user_id, (hoursById.get(a.user_id) ?? 0) + slotDurationHours(a.time_slot))
    }
    return [...members]
      .map(m => ({
        ...m,
        count: countById.get(m.user_id) ?? 0,
        hours: hoursById.get(m.user_id) ?? 0,
      }))
      .sort((a, b) => b.count - a.count || a.profile.name.localeCompare(b.profile.name))
  }, [members, assignments])

  const roleMap = useMemo(() => new Map(tenantRoles.map(r => [r.id, r.name])), [tenantRoles])

  const slotStats = useMemo(() => {
    const slotCount = new Map<string, number>()
    const closeBySlot = new Map<string, number>()
    for (const a of assignments) {
      if (a.member_type === 'close') {
        closeBySlot.set(a.time_slot, (closeBySlot.get(a.time_slot) ?? 0) + 1)
        continue
      }
      slotCount.set(a.time_slot, (slotCount.get(a.time_slot) ?? 0) + 1)
    }
    const capacityMap = new Map(slotSettings.map(s => [s.time_slot, s.max_capacity]))
    if (!slotCount.size) return []
    return [...slotCount.keys()]
      .map(slot => ({
        time_slot: slot,
        max_capacity: Math.max(0, (capacityMap.get(slot) ?? 0) - (closeBySlot.get(slot) ?? 0)),
        label: slotLabels[slot] ?? shortSlotLabel(slot),
        count: slotCount.get(slot)!,
      }))
      .sort((a, b) => a.time_slot.localeCompare(b.time_slot))
  }, [slotSettings, assignments, slotLabels])

  const dynamicFieldStats = useMemo(() => {
    const dashFields = effectiveCustomFields.filter(f =>
      f.show_in_dashboard && (
        (['select', 'radio', 'checkbox_group'].includes(f.type) && (f.options?.length ?? 0) > 0) ||
        f.type === 'checkbox'
      )
    )
    return dashFields.map(field => {
      const countByValue = new Map<string, number>()
      for (const a of assignments) {
        const val = a.extra_data?.[field.id]
        if (!val) continue
        if (field.type === 'checkbox_group') {
          val.split(',').filter(Boolean).forEach(v => countByValue.set(v, (countByValue.get(v) ?? 0) + 1))
        } else {
          countByValue.set(val, (countByValue.get(val) ?? 0) + 1)
        }
      }
      const rows = field.type === 'checkbox'
        ? [
            { name: '예', value: 'true', unit: '', count: countByValue.get('true') ?? 0 },
            { name: '아니오', value: 'false', unit: '', count: countByValue.get('false') ?? 0 },
          ]
        : (field.options ?? []).map(opt => ({
            name: opt.name, value: opt.value,
            unit: getOptionUnit(opt.value_type),
            count: countByValue.get(opt.value) ?? 0,
          }))
      return { fieldId: field.id, label: field.label, rows }
    })
  }, [effectiveCustomFields, assignments])

  const dynamicNumberStats = useMemo(() => {
    return effectiveCustomFields
      .filter(f => f.type === 'number')
      .map(field => {
        let sum = 0, count = 0
        for (const a of assignments) {
          const val = a.extra_data?.[field.id]
          if (val !== undefined && val.trim() !== '') {
            const n = Number(val)
            if (!isNaN(n)) { sum += n; count++ }
          }
        }
        return { fieldId: field.id, label: field.label, sum, count, avg: count > 0 ? Math.round(sum / count * 10) / 10 : 0 }
      })
      .filter(s => s.count > 0)
  }, [effectiveCustomFields, assignments])

  const visitorStats = useMemo(() => {
    if (!isFreeform) return []
    const nameCount = new Map<string, number>()
    const nameHours = new Map<string, number>()
    for (const a of assignments) {
      if (!a.member_name || a.member_type === 'close') continue
      nameCount.set(a.member_name, (nameCount.get(a.member_name) ?? 0) + 1)
      nameHours.set(a.member_name, (nameHours.get(a.member_name) ?? 0) + slotDurationHours(a.time_slot))
    }
    return [...nameCount.entries()]
      .map(([name, count]) => ({ name, count, hours: nameHours.get(name) ?? 0 }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }, [isFreeform, assignments])

  const userFieldStats = useMemo(() => {
    if (!selectedUserId) return []
    const dashFields = effectiveCustomFields.filter(f =>
      f.show_in_dashboard && (
        (['select', 'radio', 'checkbox_group'].includes(f.type) && (f.options?.length ?? 0) > 0) ||
        f.type === 'checkbox'
      )
    )
    // 비회원 모드: user_id 없이 member_name으로 식별
    const userAssignments = isFreeform
      ? assignments.filter(a => a.member_name === selectedUserId)
      : assignments.filter(a => a.user_id === selectedUserId)
    return dashFields.map(field => {
      const countByValue = new Map<string, number>()
      for (const a of userAssignments) {
        const val = a.extra_data?.[field.id]
        if (!val) continue
        if (field.type === 'checkbox_group') {
          val.split(',').filter(Boolean).forEach(v => countByValue.set(v, (countByValue.get(v) ?? 0) + 1))
        } else {
          countByValue.set(val, (countByValue.get(val) ?? 0) + 1)
        }
      }
      const rows = field.type === 'checkbox'
        ? [
            { name: '예', value: 'true', unit: '', count: countByValue.get('true') ?? 0 },
            { name: '아니오', value: 'false', unit: '', count: countByValue.get('false') ?? 0 },
          ].filter(r => r.count > 0)
        : (field.options ?? []).map(opt => ({
            name: opt.name, value: opt.value,
            unit: getOptionUnit(opt.value_type),
            count: countByValue.get(opt.value) ?? 0,
          })).filter(r => r.count > 0)
      return { fieldId: field.id, label: field.label, rows }
    }).filter(f => f.rows.length > 0)
  }, [effectiveCustomFields, assignments, selectedUserId, isFreeform])

  const activeMemberCount = useMemo(() => userStats.filter(m => m.count > 0).length, [userStats])
  const totalAssignments = assignments.length

  const effectiveCap = useMemo(() => {
    const totalCap = slotSettings.reduce((acc, s) => acc + s.max_capacity, 0)
    const closedCount = assignments.filter(a => a.member_type === 'close').length
    return Math.max(0, totalCap - closedCount)
  }, [slotSettings, assignments])

  const slotUtilization = useMemo(() => {
    if (!effectiveCap) return null
    const totalBooked = slotStats.reduce((acc, s) => acc + s.count, 0)
    return Math.round(totalBooked / effectiveCap * 100)
  }, [slotStats, effectiveCap])

  const currentMembership = memberships.find(m => m.tenant_id === tenant?.id)
  const isAdmin = currentMembership?.role === 'admin' || !!profile?.is_super_admin || isCustomerAdmin

  async function handleWithdrawalRequest() {
    if (!confirm('정말 이 조직에서 탈퇴를 신청하시겠습니까?\n관리자 승인 후 처리됩니다.')) return
    const { error } = await supabase
      .from('tenant_members')
      .update({
        withdrawal_status: 'pending',
        withdrawal_requested_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenant!.id)
      .eq('user_id', profile!.id)
    if (!error) {
      window.location.reload()
    }
  }

  const panelShadow = '0 1px 0 rgba(20,23,28,0.03), 0 24px 60px -40px rgba(20,23,28,0.22)'

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)]">
      <AppHeader />

      <main className="px-2 py-2 sm:px-4 sm:py-3">
        <div
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[22px] overflow-hidden animate-fade-up"
          style={{ boxShadow: panelShadow }}
        >

          {/* ── Panel Head ── */}
          <header className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4 border-b border-[var(--color-border)]">
            <div
              className="w-[38px] h-[38px] rounded-[11px] text-[17px] font-bold flex items-center justify-center shrink-0 select-none"
              style={tenant?.settings?.theme_color
                ? { background: tenant.settings.theme_color, color: '#fff' }
                : { background: 'var(--tint-break)', color: 'var(--tint-break-ink)' }}
            >
              {tenant?.name?.charAt(0) ?? '?'}
            </div>
            <span className="text-[19px] font-bold tracking-tight text-[var(--color-text-primary)] truncate">
              {tenant?.name}
            </span>
            <span className="text-[13px] text-[var(--color-text-muted)] font-medium hidden sm:inline">
              대시보드
            </span>
          </header>

          {/* ── Body ── */}
          <div className="p-4 sm:p-5 space-y-7">
            {loading ? (
              <div className="py-16 text-center text-sm text-[var(--color-text-muted)]">로딩 중...</div>
            ) : (
              <>

                {/* Month navigator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={prevMonth}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] transition-colors"
                    >
                      <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m12 5-5 5 5 5"/></svg>
                    </button>
                    <span className="text-[14px] font-bold text-[var(--color-text-primary)] tabular-nums w-[90px] text-center">
                      {viewYear}년 {viewMonth}월
                    </span>
                    <button
                      onClick={nextMonth}
                      disabled={isCurrentMonth}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m8 5 5 5-5 5"/></svg>
                    </button>
                  </div>
                  {!isCurrentMonth && (
                    <button
                      onClick={() => { setViewYear(thisYear); setViewMonth(thisMonth) }}
                      className="text-[11px] font-medium text-[var(--color-brand-primary)] hover:underline"
                    >
                      이번 달
                    </button>
                  )}
                </div>

                {/* KPI Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                  {/* 배정 */}
                  <div className="bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[14px] px-4 py-3.5">
                    <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-muted)] font-semibold mb-2.5">
                      <span className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center shrink-0" style={{ background: 'var(--tint-plus)', color: 'var(--tint-plus-ink)' }}>
                        <svg viewBox="0 0 20 20" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 5h12M4 10h12M4 15h8"/></svg>
                      </span>
                      {viewMonth}월 배정
                    </div>
                    <div className="flex items-baseline gap-1 text-[26px] font-bold tracking-tight leading-none font-mono-num">
                      {totalAssignments}
                      <span className="text-[14px] font-semibold text-[var(--color-text-muted)] tracking-normal">건</span>
                    </div>
                    <div className="mt-2 text-[11.5px] text-[var(--color-text-muted)] font-medium">활동 멤버 {activeMemberCount}명</div>
                  </div>

                  {/* 활동 멤버 */}
                  <div className="bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[14px] px-4 py-3.5">
                    <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-muted)] font-semibold mb-2.5">
                      <span className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center shrink-0" style={{ background: 'var(--tint-break)', color: 'var(--tint-break-ink)' }}>
                        <svg viewBox="0 0 20 20" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                          <circle cx="8" cy="7" r="2.5"/><circle cx="14" cy="8" r="2"/>
                          <path d="M3 16c0-2.2 1.8-4 5-4s5 1.8 5 4"/><path d="M13.5 13c1.5.4 2.5 1.6 2.5 3"/>
                        </svg>
                      </span>
                      활동 멤버
                    </div>
                    <div className="flex items-baseline gap-1 text-[26px] font-bold tracking-tight leading-none font-mono-num">
                      {activeMemberCount}
                      <span className="text-[14px] font-semibold text-[var(--color-text-muted)] tracking-normal">명</span>
                    </div>
                    <div className="mt-2 text-[11.5px] text-[var(--color-text-muted)] font-medium">전체 {members.length}명 중</div>
                  </div>

                  {/* 슬롯 가동률 */}
                  <div className="bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[14px] px-4 py-3.5">
                    <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-muted)] font-semibold mb-2.5">
                      <span className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center shrink-0" style={{ background: 'var(--tint-sat)', color: 'var(--tint-sat-ink)' }}>
                        <svg viewBox="0 0 20 20" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                          <path d="M4 14a6 6 0 1 1 12 0"/>
                          <path d="M10 8v3l2 1.5"/>
                        </svg>
                      </span>
                      슬롯 가동률
                    </div>
                    <div className="flex items-baseline gap-1 text-[26px] font-bold tracking-tight leading-none font-mono-num">
                      {slotUtilization !== null ? slotUtilization : '—'}
                      {slotUtilization !== null && <span className="text-[14px] font-semibold text-[var(--color-text-muted)] tracking-normal">%</span>}
                    </div>
                    <div className="mt-2 text-[11.5px] text-[var(--color-text-muted)] font-medium font-mono-num">
                      {slotStats.reduce((a, s) => a + s.count, 0)} / {effectiveCap}건
                    </div>
                  </div>

                  {/* 승인 대기 */}
                  <div
                    className="bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[14px] px-4 py-3.5"
                    style={{ cursor: pendingMembers.length > 0 ? 'pointer' : 'default' }}
                    onClick={pendingMembers.length > 0 ? () => navigate('/admin?tab=pending') : undefined}
                  >
                    <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-muted)] font-semibold mb-2.5">
                      <span
                        className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center shrink-0"
                        style={pendingMembers.length > 0
                          ? { background: 'oklch(0.96 0.07 75)', color: 'oklch(0.48 0.12 65)' }
                          : { background: 'var(--tint-moon)', color: 'var(--tint-moon-ink)' }}
                      >
                        <svg viewBox="0 0 20 20" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                          <circle cx="9" cy="8" r="2.5"/>
                          <path d="M4 17c0-2.5 2-4.5 5-4.5"/>
                          <path d="M15 10l1.5 1.5L18 10"/>
                        </svg>
                      </span>
                      승인 대기
                    </div>
                    <div className="flex items-baseline gap-1 text-[26px] font-bold tracking-tight leading-none font-mono-num">
                      {pendingMembers.length}
                      <span className="text-[14px] font-semibold text-[var(--color-text-muted)] tracking-normal">명</span>
                    </div>
                    <div className="mt-2 text-[11.5px] font-medium" style={{ color: pendingMembers.length > 0 ? 'oklch(0.52 0.14 65)' : 'var(--color-text-muted)' }}>
                      {pendingMembers.length > 0 ? '승인이 필요합니다 →' : '대기 없음'}
                    </div>
                  </div>

                </div>

                {/* ── Approval pending ── */}
                {pendingMembers.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <h2 className="text-[15px] font-bold tracking-tight text-[var(--color-text-primary)]">승인 대기</h2>
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">
                        {pendingMembers.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {pendingMembers.map(m => (
                        <div
                          key={m.id}
                          className="flex items-center gap-3 px-4 py-3 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-secondary)]"
                        >
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 text-[13px] font-bold flex items-center justify-center shrink-0 select-none">
                            {(m.profile.name ?? '?').charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">{m.profile.name}</p>
                            <p className="text-[11px] text-[var(--color-text-muted)] truncate">{m.profile.email}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => approveUser(m.user_id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                            >승인</button>
                            <button
                              onClick={() => setConfirmReject(m.user_id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-secondary)] bg-[var(--color-surface)] hover:bg-red-50 hover:text-red-600 border border-[var(--color-border)] rounded-lg transition-colors"
                            >거절</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* ── Participation ── */}
                <section>
                  <div className="flex items-baseline justify-between mb-3">
                    <h2 className="text-[15px] font-bold tracking-tight text-[var(--color-text-primary)]">참여 현황</h2>
                  </div>

                  {/* Animated toggle pill */}
                  <div className="relative flex bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[11px] p-1 mb-3">
                    <div
                      className="absolute top-1 bottom-1 rounded-[8px] transition-transform duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                      style={{
                        width: 'calc(50% - 4px)',
                        background: 'var(--color-surface)',
                        transform: participationTab === '사용자별' ? 'translateX(calc(100% + 8px))' : 'translateX(0)',
                        boxShadow: '0 1px 0 rgba(20,23,28,0.04), 0 3px 8px -3px rgba(20,23,28,0.14)',
                      }}
                    />
                    {(['역할별', '사용자별'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => { setParticipationTab(tab); setSelectedUserId(null) }}
                        className={`flex-1 h-9 text-[13px] font-semibold rounded-[8px] relative z-10 transition-colors duration-150 ${
                          participationTab === tab
                            ? 'text-[var(--color-text-primary)]'
                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* 역할별 */}
                  {participationTab === '역할별' && (
                    roleStats.length === 0 ? (
                      <p className="text-[13px] text-[var(--color-text-muted)] text-center py-6">역할이 없습니다.</p>
                    ) : (
                      <div className="rounded-[14px] border border-[var(--color-border)] overflow-hidden">
                        {roleStats.map((r, idx) => {
                          const tint = AVATAR_TINTS[idx % AVATAR_TINTS.length]
                          return (
                            <div
                              key={r.id}
                              className={`flex items-center gap-3 px-4 py-3 ${idx < roleStats.length - 1 ? 'border-b border-[var(--color-border)]' : ''}`}
                            >
                              <div
                                className="w-[34px] h-[34px] rounded-[10px] text-[14px] font-bold flex items-center justify-center shrink-0 select-none"
                                style={{ background: tint.bg, color: tint.fg }}
                              >
                                {r.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[14px] font-semibold text-[var(--color-text-primary)] truncate block">{r.name}</span>
                              </div>
                              <span className={`text-[14px] font-bold font-mono-num shrink-0 ${r.count === 0 ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-primary)]'}`}>
                                {r.count === 0 ? '—' : r.count}
                                {r.count > 0 && <span className="text-[11px] text-[var(--color-text-muted)] font-medium ml-0.5">건</span>}
                              </span>
                            </div>
                          )
                        })}
                        <div className="flex items-center gap-3 px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                          <div className="w-[34px] h-[34px] shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">합계</span>
                          </div>
                          <span className="text-[14px] font-bold font-mono-num text-[var(--color-text-primary)]">
                            {roleStats.reduce((acc, r) => acc + r.count, 0)}
                            <span className="text-[11px] text-[var(--color-text-muted)] font-medium ml-0.5">건</span>
                          </span>
                        </div>
                      </div>
                    )
                  )}

                  {/* 사용자별 */}
                  {participationTab === '사용자별' && (
                    isFreeform ? (
                      // 비회원 모드: member_name 기준 방문자 목록
                      visitorStats.length === 0 ? (
                        <p className="text-[13px] text-[var(--color-text-muted)] text-center py-6">등록된 방문자가 없습니다.</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {visitorStats.map((v, idx) => {
                            const isSelected = selectedUserId === v.name
                            const tint = AVATAR_TINTS[idx % AVATAR_TINTS.length]
                            return (
                              <div
                                key={v.name}
                                className="rounded-[14px] border overflow-hidden transition-[border-color,box-shadow] duration-150"
                                style={{
                                  borderColor: isSelected ? 'var(--color-brand-primary)' : 'var(--color-border)',
                                  boxShadow: isSelected ? '0 0 0 3px oklch(0.95 0.04 28)' : undefined,
                                }}
                              >
                                <button
                                  onClick={() => setSelectedUserId(prev => prev === v.name ? null : v.name)}
                                  className={`flex items-center gap-3 w-full px-4 py-3 text-left transition-colors ${
                                    isSelected
                                      ? 'bg-[var(--color-surface-secondary)]'
                                      : 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)]'
                                  }`}
                                >
                                  <div
                                    className="w-[34px] h-[34px] rounded-[10px] text-[14px] font-bold flex items-center justify-center shrink-0 select-none"
                                    style={{ background: tint.bg, color: tint.fg }}
                                  >
                                    {v.name.charAt(0)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[14px] font-bold tracking-tight text-[var(--color-text-primary)] truncate block">{v.name}</span>
                                    <span className="text-[12px] text-[var(--color-text-muted)] font-mono-num">
                                      {v.hours > 0 ? formatHours(v.hours) : '활동 없음'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[14px] font-bold font-mono-num text-[var(--color-text-primary)]">
                                      {v.count}
                                      <span className="text-[11px] text-[var(--color-text-muted)] font-medium ml-0.5">건</span>
                                    </span>
                                    <svg
                                      viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor"
                                      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                                      className={`transition-transform duration-200 ${isSelected ? 'rotate-180 text-[var(--color-text-secondary)]' : 'text-[var(--color-text-muted)]'}`}
                                    >
                                      <path d="m5 8 5 5 5-5"/>
                                    </svg>
                                  </div>
                                </button>

                                {/* Expandable detail */}
                                <div
                                  className="grid transition-[grid-template-rows] duration-[280ms] ease-out"
                                  style={{ gridTemplateRows: isSelected ? '1fr' : '0fr' }}
                                >
                                  <div className="overflow-hidden">
                                    <div className="px-4 pb-4 pt-1">
                                      {userFieldStats.length === 0 ? (
                                        <p className="text-[12px] text-[var(--color-text-muted)] py-2">통계 항목이 없습니다.</p>
                                      ) : (
                                        <div className="space-y-3">
                                          {userFieldStats.map(stat => (
                                            <div key={stat.fieldId}>
                                              <p className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.6px] mb-1.5 font-mono-num">{stat.label}</p>
                                              <div className="rounded-[10px] border border-[var(--color-border)] overflow-hidden">
                                                {stat.rows.map((row) => {
                                                  const fmtValue = fmtNumber(row.value) || row.value
                                                  return (
                                                    <div
                                                      key={row.value}
                                                      className="flex items-center gap-2 px-3 py-2 bg-[var(--color-surface)] border-b border-[var(--color-border)]"
                                                    >
                                                      <span className="text-[12px] font-medium text-[var(--color-text-primary)] flex-1 min-w-0 truncate">{row.name}</span>
                                                      <span className="text-[12px] font-semibold tabular-nums text-[var(--color-text-primary)] shrink-0">{row.count}건({fmtValue}{row.unit})</span>
                                                    </div>
                                                  )
                                                })}
                                                {(() => {
                                                  const totalCount = stat.rows.reduce((acc, r) => acc + r.count, 0)
                                                  const allNumeric = stat.rows.length > 0 && stat.rows.every(r => r.value !== '' && !isNaN(Number(r.value)))
                                                  const valueSum = allNumeric ? stat.rows.reduce((acc, r) => acc + r.count * Number(r.value), 0) : null
                                                  const fmtSum = valueSum !== null ? fmtNumber(valueSum) : null
                                                  const units = stat.rows.map(r => r.unit).filter(Boolean)
                                                  const sumUnit = units.length > 0 && units.every(u => u === units[0]) ? units[0] : ''
                                                  return (
                                                    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-surface-secondary)]">
                                                      <span className="text-[12px] font-semibold text-[var(--color-text-primary)] flex-1">합계</span>
                                                      <span className="text-[12px] font-semibold tabular-nums text-[var(--color-text-primary)] shrink-0">
                                                        {totalCount}건{fmtSum !== null && <span className="font-normal text-[var(--color-text-muted)]">({fmtSum}{sumUnit})</span>}
                                                      </span>
                                                    </div>
                                                  )
                                                })()}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}

                          {/* Total */}
                          <div className="flex items-center gap-3 px-4 py-3 rounded-[14px] bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                            <div className="w-[34px] h-[34px] shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">합계</span>
                            </div>
                            <span className="text-[14px] font-bold font-mono-num text-[var(--color-text-primary)]">
                              {visitorStats.reduce((acc, v) => acc + v.count, 0)}
                              <span className="text-[11px] text-[var(--color-text-muted)] font-medium ml-0.5">건</span>
                            </span>
                            <span className="w-4 shrink-0" />
                          </div>
                        </div>
                      )
                    ) : (
                      // 회원 모드: tenant_members 기준
                      userStats.length === 0 ? (
                        <p className="text-[13px] text-[var(--color-text-muted)] text-center py-6">멤버가 없습니다.</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {userStats.map((m, idx) => {
                            const isSelected = selectedUserId === m.user_id
                            const tint = AVATAR_TINTS[idx % AVATAR_TINTS.length]
                            return (
                              <div
                                key={m.id}
                                className="rounded-[14px] border overflow-hidden transition-[border-color,box-shadow] duration-150"
                                style={{
                                  borderColor: isSelected ? 'var(--color-brand-primary)' : 'var(--color-border)',
                                  boxShadow: isSelected ? '0 0 0 3px oklch(0.95 0.04 28)' : undefined,
                                }}
                              >
                                <button
                                  onClick={() => m.count > 0 && setSelectedUserId(prev => prev === m.user_id ? null : m.user_id)}
                                  className={`flex items-center gap-3 w-full px-4 py-3 text-left transition-colors ${
                                    isSelected
                                      ? 'bg-[var(--color-surface-secondary)]'
                                      : 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)]'
                                  } ${m.count === 0 ? 'opacity-60' : ''}`}
                                  style={{ cursor: m.count === 0 ? 'default' : 'pointer' }}
                                >
                                  <div
                                    className="w-[34px] h-[34px] rounded-[10px] text-[14px] font-bold flex items-center justify-center shrink-0 select-none"
                                    style={{ background: tint.bg, color: tint.fg }}
                                  >
                                    {(m.profile.name ?? '?').charAt(0)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="text-[14px] font-bold tracking-tight text-[var(--color-text-primary)] truncate">{m.profile.name}</span>
                                      {m.role_id && roleMap.get(m.role_id) && (
                                        <span className="text-[10px] font-semibold text-[var(--color-text-muted)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] px-1.5 py-0.5 rounded-md shrink-0 hidden sm:inline">
                                          {roleMap.get(m.role_id)}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[12px] text-[var(--color-text-muted)] font-mono-num">
                                      {m.hours > 0 ? formatHours(m.hours) : '활동 없음'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-[14px] font-bold font-mono-num ${m.count === 0 ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-primary)]'}`}>
                                      {m.count === 0 ? '—' : m.count}
                                      {m.count > 0 && <span className="text-[11px] text-[var(--color-text-muted)] font-medium ml-0.5">건</span>}
                                    </span>
                                    {m.count > 0 && (
                                      <svg
                                        viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor"
                                        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                                        className={`transition-transform duration-200 ${isSelected ? 'rotate-180 text-[var(--color-text-secondary)]' : 'text-[var(--color-text-muted)]'}`}
                                      >
                                        <path d="m5 8 5 5 5-5"/>
                                      </svg>
                                    )}
                                  </div>
                                </button>

                                {/* Expandable detail */}
                                <div
                                  className="grid transition-[grid-template-rows] duration-[280ms] ease-out"
                                  style={{ gridTemplateRows: isSelected ? '1fr' : '0fr' }}
                                >
                                  <div className="overflow-hidden">
                                    <div className="px-4 pb-4 pt-1">
                                      {userFieldStats.length === 0 ? (
                                        <p className="text-[12px] text-[var(--color-text-muted)] py-2">통계 항목이 없습니다.</p>
                                      ) : (
                                        <div className="space-y-3">
                                          {userFieldStats.map(stat => (
                                            <div key={stat.fieldId}>
                                              <p className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.6px] mb-1.5 font-mono-num">{stat.label}</p>
                                              <div className="rounded-[10px] border border-[var(--color-border)] overflow-hidden">
                                                {stat.rows.map((row) => {
                                                  const fmtValue = fmtNumber(row.value) || row.value
                                                  return (
                                                    <div
                                                      key={row.value}
                                                      className={`flex items-center gap-2 px-3 py-2 bg-[var(--color-surface)] border-b border-[var(--color-border)]`}
                                                    >
                                                      <span className="text-[12px] font-medium text-[var(--color-text-primary)] flex-1 min-w-0 truncate">{row.name}</span>
                                                      <span className="text-[12px] font-semibold tabular-nums text-[var(--color-text-primary)] shrink-0">{row.count}건({fmtValue}{row.unit})</span>
                                                    </div>
                                                  )
                                                })}
                                                {(() => {
                                                  const totalCount = stat.rows.reduce((acc, r) => acc + r.count, 0)
                                                  const allNumeric = stat.rows.length > 0 && stat.rows.every(r => r.value !== '' && !isNaN(Number(r.value)))
                                                  const valueSum = allNumeric ? stat.rows.reduce((acc, r) => acc + r.count * Number(r.value), 0) : null
                                                  const fmtSum = valueSum !== null ? fmtNumber(valueSum) : null
                                                  const units = stat.rows.map(r => r.unit).filter(Boolean)
                                                  const sumUnit = units.length > 0 && units.every(u => u === units[0]) ? units[0] : ''
                                                  return (
                                                    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-surface-secondary)]">
                                                      <span className="text-[12px] font-semibold text-[var(--color-text-primary)] flex-1">합계</span>
                                                      <span className="text-[12px] font-semibold tabular-nums text-[var(--color-text-primary)] shrink-0">
                                                        {totalCount}건{fmtSum !== null && <span className="font-normal text-[var(--color-text-muted)]">({fmtSum}{sumUnit})</span>}
                                                      </span>
                                                    </div>
                                                  )
                                                })()}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}

                          {/* Total */}
                          <div className="flex items-center gap-3 px-4 py-3 rounded-[14px] bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                            <div className="w-[34px] h-[34px] shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">합계</span>
                            </div>
                            <span className="text-[14px] font-bold font-mono-num text-[var(--color-text-primary)]">
                              {userStats.reduce((acc, m) => acc + m.count, 0)}
                              <span className="text-[11px] text-[var(--color-text-muted)] font-medium ml-0.5">건</span>
                            </span>
                            <span className="w-4 shrink-0" />
                          </div>
                        </div>
                      )
                    )
                  )}
                </section>

                {/* ── Slot stats ── */}
                {slotStats.length > 0 && (
                  <section>
                    <div className="flex items-baseline justify-between mb-3">
                      <h2 className="text-[15px] font-bold tracking-tight text-[var(--color-text-primary)]">슬롯 현황</h2>
                      <span className="text-[12px] text-[var(--color-text-muted)] font-medium font-mono-num">
                        총 {slotStats.reduce((acc, x) => acc + x.count, 0)}건
                      </span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {slotStats.map(s => {
                        const pct = s.max_capacity > 0 ? Math.min(100, Math.round(s.count / s.max_capacity * 100)) : 0
                        return (
                          <div key={s.time_slot} className="grid items-center gap-3" style={{ gridTemplateColumns: '110px 1fr 64px' }}>
                            <span className="text-[12.5px] font-semibold text-[var(--color-text-secondary)] font-mono-num truncate">{s.label}</span>
                            <div className="h-[10px] rounded-full bg-[var(--color-surface-secondary)] border border-[var(--color-border)] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[var(--color-brand-primary)] transition-[width] duration-1000 ease-[cubic-bezier(0.3,0.9,0.3,1)]"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[12px] tabular-nums text-[var(--color-text-muted)] text-right font-mono-num">
                              {s.max_capacity > 0 ? `${s.count} / ${s.max_capacity}` : `${s.count}건`}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )}

                {/* ── Dynamic field stats ── */}
                {dynamicFieldStats.map(stat => (
                  <section key={stat.fieldId}>
                    <div className="flex items-baseline justify-between mb-3">
                      <h2 className="text-[15px] font-bold tracking-tight text-[var(--color-text-primary)]">{stat.label} 현황</h2>
                      <span className="text-[12px] text-[var(--color-text-muted)] font-medium font-mono-num">
                        총 {stat.rows.reduce((acc, r) => acc + r.count, 0)}건
                      </span>
                    </div>
                    <div className={`grid gap-3 ${stat.rows.length <= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} grid-cols-1`}>
                      {stat.rows.map((row, idx) => {
                        const tint = AVATAR_TINTS[idx % AVATAR_TINTS.length]
                        return (
                          <div key={row.value} className="border border-[var(--color-border)] rounded-[14px] bg-[var(--color-surface)] p-4 flex flex-col gap-3">
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-9 h-9 rounded-[10px] text-[15px] font-bold flex items-center justify-center shrink-0"
                                style={{ background: tint.bg, color: tint.fg }}
                              >
                                {row.name.charAt(0)}
                              </span>
                              <span className="text-[14px] font-bold tracking-tight text-[var(--color-text-primary)] truncate">{row.name}</span>
                            </div>
                            <div className="flex items-baseline justify-between">
                              <span className="text-[22px] font-bold tracking-tight font-mono-num text-[var(--color-text-primary)]">
                                {row.count === 0 ? '—' : row.count}
                                {row.count > 0 && <span className="text-[12px] text-[var(--color-text-muted)] font-semibold ml-0.5">건</span>}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-3 flex items-center justify-between px-4 py-3 rounded-[14px] bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                      <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">합계</span>
                      <span className="text-[14px] font-bold font-mono-num text-[var(--color-text-primary)]">
                        {stat.rows.reduce((acc, r) => acc + r.count, 0)}
                        <span className="text-[11px] text-[var(--color-text-muted)] font-medium ml-0.5">건</span>
                      </span>
                    </div>
                  </section>
                ))}

                {/* ── Number field stats ── */}
                {dynamicNumberStats.length > 0 && (
                  <section>
                    <h2 className="text-[15px] font-bold tracking-tight text-[var(--color-text-primary)] mb-3">수치 필드 현황</h2>
                    <div className="grid gap-3 sm:grid-cols-2 grid-cols-1">
                      {dynamicNumberStats.map(stat => (
                        <div key={stat.fieldId} className="border border-[var(--color-border)] rounded-[14px] bg-[var(--color-surface)] p-4 flex flex-col gap-1">
                          <span className="text-[12px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">{stat.label}</span>
                          <div className="flex items-baseline gap-3 mt-1">
                            <div>
                              <span className="text-[22px] font-bold font-mono-num text-[var(--color-text-primary)]">{stat.sum.toLocaleString()}</span>
                              <span className="text-[11px] text-[var(--color-text-muted)] font-semibold ml-1">합계</span>
                            </div>
                            <div className="text-[var(--color-text-muted)]">·</div>
                            <div>
                              <span className="text-[18px] font-bold font-mono-num text-[var(--color-text-secondary)]">{stat.avg.toLocaleString()}</span>
                              <span className="text-[11px] text-[var(--color-text-muted)] font-semibold ml-1">평균</span>
                            </div>
                            <div className="ml-auto text-right">
                              <span className="text-[13px] font-semibold font-mono-num text-[var(--color-text-muted)]">{stat.count}건</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* ── 사용자 정의 통계 위젯 ── */}
                {widgetConfigs.map(widget => (
                  <CustomWidgetCard
                    key={widget.id}
                    widget={widget}
                    assignments={assignments}
                    customFields={effectiveCustomFields}
                    isAdmin={isAdmin}
                    onEdit={() => { setEditingWidget(widget); setShowWidgetModal(true) }}
                    onDelete={() => saveWidgetConfigs(widgetConfigs.filter(w => w.id !== widget.id))}
                  />
                ))}

                {isAdmin && (
                  <button
                    onClick={() => { setEditingWidget(null); setShowWidgetModal(true) }}
                    className="w-full py-3 border-2 border-dashed border-[var(--color-border)] rounded-[16px] text-sm text-[var(--color-text-muted)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] transition-colors"
                  >
                    + 통계 위젯 추가
                  </button>
                )}

                {currentMembership && currentMembership.withdrawal_status === 'none' && (
                  <div className="mt-8 pt-4 border-t border-[var(--color-border)]">
                    <button
                      onClick={handleWithdrawalRequest}
                      className="text-xs text-[var(--color-text-muted)] hover:text-red-500 underline transition-colors"
                    >
                      조직 탈퇴 신청
                    </button>
                  </div>
                )}
                {currentMembership?.withdrawal_status === 'pending' && (
                  <div className="mt-8 pt-4 border-t border-[var(--color-border)]">
                    <p className="text-xs text-amber-600">탈퇴 신청이 처리 중입니다. 관리자 승인을 기다려주세요.</p>
                  </div>
                )}

              </>
            )}
          </div>
        </div>
      </main>

      {/* ── Reject confirm dialog ── */}
      {confirmReject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setConfirmReject(null)}
        >
          <div
            className="bg-[var(--color-surface)] rounded-[22px] border border-[var(--color-border)] p-6 mx-4 max-w-sm w-full"
            style={{ boxShadow: panelShadow }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-2">가입 거절</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-5">해당 멤버의 가입 신청을 거절하시겠습니까?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmReject(null)}
                className="flex-1 py-2 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-xl transition-colors"
              >취소</button>
              <button
                onClick={async () => { await rejectUser(confirmReject); setConfirmReject(null) }}
                className="flex-1 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
              >거절</button>
            </div>
          </div>
        </div>
      )}

      {showWidgetModal && (
        <DashboardWidgetModal
          customFields={effectiveCustomFields}
          existing={editingWidget}
          onSave={handleWidgetSave}
          onClose={() => { setShowWidgetModal(false); setEditingWidget(null) }}
        />
      )}
      <DevFileLabel file="DashboardPage.tsx" />
    </div>
  )
}
