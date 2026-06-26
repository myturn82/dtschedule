import { useState, useEffect, useMemo, Fragment } from 'react'
import { AutoResizeTextarea } from '../components/shared/AutoResizeTextarea'
import { useTranslation } from 'react-i18next'
import { DevFileLabel } from '../components/DevFileLabel'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAdmin } from '../hooks/useAdmin'
import { useTenant } from '../contexts/TenantContext'
import { useTenantRoles } from '../hooks/useTenantRoles'
import { supabase } from '../lib/supabase'
import { buildSlot, parseSlotLabel, generateTimeSlots, DEFAULT_TIME_SLOTS, SLOT_TEMPLATES } from '../utils/timeSlots'
import { CUSTOM_FIELD_TEMPLATES } from '../utils/customFieldTemplates'
import type { TimeSlot, Tenant, TenantAccessRole, LegendItem, LegendColor, CustomFieldDef, CustomFieldOption, OptionValueType, CustomFieldType } from '../types'
import { OPTION_VALUE_TYPES, getOptionUnit, FIELD_TYPES_WITH_OPTIONS, FIELD_TYPES_WITH_DASHBOARD } from '../types'
import { LEGEND_COLOR_STYLES } from '../components/schedule/Legend'
import { applyThemePreset, THEME_PRESET_LIST, type ThemePresetKey } from '../lib/themePresets'
import { displayMode } from '../lib/tenantMode'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/

const LEGEND_ICON_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '없음' },
  { value: '★', label: '별표' },
  { value: '☆', label: '별표(연하게)' },
  { value: '●', label: '채움 원' },
  { value: '○', label: '빈 원' },
  { value: '■', label: '채움 사각' },
  { value: '□', label: '빈 사각' },
  { value: '◆', label: '채움 다이아' },
  { value: '◇', label: '빈 다이아' },
  { value: '▲', label: '채움 삼각' },
  { value: '△', label: '빈 삼각' },
  { value: '▶', label: '진행' },
  { value: '➤', label: '화살표' },
  { value: '✓', label: '체크' },
  { value: '✕', label: '엑스' },
  { value: '⚠', label: '주의' },
  { value: '‼', label: '긴급' },
  { value: '☑', label: '완료' },
  { value: '✦', label: '포인트' },
  { value: '※', label: '참고' },
  { value: '◎', label: '주목' },
]

function LegendIconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const triggerCls = 'border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-primary)] rounded-lg px-3 py-1.5 text-sm w-20 flex items-center justify-center select-none focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30 focus:border-[var(--color-brand-primary)]'
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} className={triggerCls}>
        {value || <span className="text-[11px] text-[var(--color-text-muted)]">없음</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 w-48 max-h-64 overflow-y-auto bg-[var(--color-surface)] border border-[var(--color-border-strong)] rounded-xl shadow-lg p-1.5 grid grid-cols-5 gap-1">
            {LEGEND_ICON_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                title={opt.label}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`h-8 rounded-lg flex items-center justify-center text-base select-none hover:bg-[var(--color-surface-hover)] ${value === opt.value ? 'bg-[color-mix(in_srgb,var(--color-brand-primary)_12%,transparent)] ring-1 ring-[var(--color-brand-primary)]' : ''}`}
              >
                {opt.value || <span className="text-[10px] text-[var(--color-text-muted)]">{opt.label}</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const FIELD_TYPE_DEFS: { value: CustomFieldType; label: string; badgeCls: string }[] = [
  { value: 'text',          label: '텍스트',   badgeCls: 'bg-slate-100 text-slate-600' },
  { value: 'number',        label: '숫자',     badgeCls: 'bg-blue-100 text-blue-700' },
  { value: 'select',        label: '드롭다운', badgeCls: 'bg-emerald-100 text-emerald-700' },
  { value: 'radio',         label: '라디오',   badgeCls: 'bg-orange-100 text-orange-700' },
  { value: 'checkbox',      label: '체크박스', badgeCls: 'bg-purple-100 text-purple-700' },
  { value: 'checkbox_group',label: '다중선택', badgeCls: 'bg-pink-100 text-pink-700' },
  { value: 'phone',         label: '전화번호', badgeCls: 'bg-teal-100 text-teal-700' },
  { value: 'account_number',label: '계좌번호', badgeCls: 'bg-violet-100 text-violet-700' },
  { value: 'image_upload',  label: '이미지첨부', badgeCls: 'bg-rose-100 text-rose-700' },
]

function CfTypeIcon({ type, size = 12 }: { type: CustomFieldType; size?: number }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (type === 'text') return <svg {...p}><path d="M4 7V5h16v2M9 19h6M12 5v14"/></svg>
  if (type === 'number') return <svg {...p}><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></svg>
  if (type === 'select') return <svg {...p}><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="3.5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="3.5" cy="18" r="1" fill="currentColor" stroke="none"/></svg>
  if (type === 'radio') return <svg {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>
  if (type === 'checkbox') return <svg {...p}><rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 3 3 5-6"/></svg>
  if (type === 'checkbox_group') return <svg {...p}><rect x="2" y="4" width="7" height="7" rx="1.5"/><path d="m3.5 7.5 1.5 1.5 3-3"/><rect x="2" y="13" width="7" height="7" rx="1.5"/><path d="m3.5 16.5 1.5 1.5 3-3"/><path d="M12 7h10M12 17h10"/></svg>
  if (type === 'phone') return <svg {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-1Z"/></svg>
  if (type === 'account_number') return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 10h18"/></svg>
  if (type === 'image_upload') return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
  return null
}

function FieldPreview({ field }: { field: CustomFieldDef }) {
  const cls = 'h-[34px] border border-transparent rounded-lg px-3 text-[13.5px] font-medium bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] w-full'
  return (
    <div className="pointer-events-none mt-3">
      {field.type === 'text' && (
        <input type="text" disabled placeholder={field.placeholder || `${field.label} 입력`} className={cls} />
      )}
      {field.type === 'number' && (
        <input type="number" disabled placeholder={field.placeholder || '0'}
          min={field.min} max={field.max} className={cls} />
      )}
      {field.type === 'select' && (
        <select disabled className={cls}>
          <option>{field.placeholder || `-- ${field.label} 선택 --`}</option>
          {(field.options ?? []).slice(0, 4).map(opt => <option key={opt.value}>{opt.name}</option>)}
        </select>
      )}
      {field.type === 'radio' && (
        <div className="flex gap-4 flex-wrap py-1 min-h-[36px] items-center">
          {(field.options ?? []).length === 0
            ? <span className="text-xs text-[var(--color-text-muted)]">옵션을 추가하세요</span>
            : (field.options ?? []).map(opt => (
              <label key={opt.value} className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] cursor-default">
                <input type="radio" disabled readOnly /> {opt.name}
              </label>
            ))
          }
        </div>
      )}
      {field.type === 'checkbox' && (
        <label className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] py-1 cursor-default min-h-[36px]">
          <input type="checkbox" disabled readOnly /> {field.label}
        </label>
      )}
      {field.type === 'checkbox_group' && (
        <div className="flex gap-4 flex-wrap py-1 min-h-[36px] items-center">
          {(field.options ?? []).length === 0
            ? <span className="text-xs text-[var(--color-text-muted)]">옵션을 추가하세요</span>
            : (field.options ?? []).map(opt => (
              <label key={opt.value} className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] cursor-default">
                <input type="checkbox" disabled readOnly /> {opt.name}
              </label>
            ))
          }
        </div>
      )}
      {field.type === 'phone' && (
        <input type="tel" disabled placeholder={field.placeholder || '010-0000-0000'} className={cls} />
      )}
      {field.type === 'account_number' && (
        <input type="text" disabled placeholder={field.placeholder || '계좌번호 입력 (숫자)'} className={cls} />
      )}
      {field.type === 'image_upload' && (
        <div className="flex items-center gap-2 h-[34px] border border-dashed border-[var(--color-border-strong)] rounded-lg px-3 text-[13px] text-[var(--color-text-muted)]">
          <span className="select-none">📷</span>
          <span>이미지 첨부 (최대 3장, WebP 자동 압축)</span>
        </div>
      )}
    </div>
  )
}

function makeTimeOpt(halfHours: number) {
  const h = Math.floor(halfHours / 2)
  const m = halfHours % 2 === 0 ? '00' : '30'
  return { value: halfHours / 2, label: `${h}:${m}` }
}
const START_OPTIONS = Array.from({ length: 48 }, (_, i) => makeTimeOpt(i))
const END_OPTIONS   = Array.from({ length: 48 }, (_, i) => makeTimeOpt(i + 1))

type Tab = 'members' | 'pending' | 'roles' | 'rules' | 'dates' | 'settings' | 'legend' | 'custom_fields'

const TAB_LABELS: Record<Tab, string> = {
  members: '회원 관리',
  pending: '승인 대기',
  roles: '역할 관리',
  rules: '스케줄 규칙',
  dates: '날짜 설정',
  settings: '조직 설정',
  legend: '범례 관리',
  custom_fields: '커스텀 필드',
}

export function AdminPage() {
  const { t } = useTranslation('common')
  const { t: ta } = useTranslation('admin')
  const tad = ta as (key: string) => string
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initOrgId = searchParams.get('org')

  const { profile, loading: authLoading } = useAuth()
  const { tenant, memberships, tenantRole, updateCurrentTenant } = useTenant()

  // Local org selection — independent from TenantContext (doesn't affect schedule page)
  const [adminTenant, setAdminTenant] = useState<Tenant | null>(null)
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([])
  const [orgLoading, setOrgLoading] = useState(true)

  const adminTenantId = adminTenant?.id ?? ''

  // adminTenant은 TenantContext와 독립적이라 포인트 컬러도 별도로 주입해야 한다 —
  // 이 화면을 벗어나면 전역 tenant 기준 색상으로 되돌린다
  useEffect(() => {
    applyThemePreset(adminTenant?.settings?.theme_preset)
    return () => applyThemePreset(tenant?.settings?.theme_preset)
  }, [adminTenant?.settings?.theme_preset, tenant?.settings?.theme_preset])

  const {
    members, scheduleRules, dateOverrides, loading,
    reloadMembers,
    addMember, removeMember, updateMemberName, updateMemberTenantRole, updateMemberAccess,
    toggleScheduleRule, upsertScheduleRulesForSlots,
    addDateOverride, deleteDateOverride,
    updateTenantSettings, updateTenantName, approveUser,
    approveWithdrawal, rejectWithdrawal,
  } = useAdmin(adminTenantId)
  const { roles, addRole, deleteRole, updateRole, moveRole } = useTenantRoles(adminTenantId)

  const initTab = searchParams.get('tab') as Tab | null
  const [tab, setTab] = useState<Tab>(
    initTab && (Object.keys(TAB_LABELS) as Tab[]).includes(initTab) ? initTab : 'members'
  )
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null)
  const [saving, setSaving] = useState(false)

  // Members tab
  const [showAddMember, setShowAddMember] = useState(false)
  const [addEmail, setAddEmail] = useState('')

  // 회원 선호 설정 (자동배정)
  const [expandedPrefUserId, setExpandedPrefUserId] = useState<string | null>(null)
  const [prefDays, setPrefDays] = useState<number[]>([])
  const [prefLimit, setPrefLimit] = useState<string>('')

  // 회원 성명 수정
  const [editingNameUserId, setEditingNameUserId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [nameSaving, setNameSaving] = useState(false)

  // 직접 등록 (이메일 인증 없이 테스트 계정 생성)
  const [showDirectCreate, setShowDirectCreate] = useState(false)
  const [directForm, setDirectForm] = useState({ email: '', name: '', password: '', roleId: '' })
  const [directSaving, setDirectSaving] = useState(false)

  // Roles tab
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleSplitCell, setNewRoleSplitCell] = useState(false)
  const [newRoleIndicatorBar, setNewRoleIndicatorBar] = useState(false)
  const [newRoleRequiresCustomerInfo, setNewRoleRequiresCustomerInfo] = useState(false)
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)
  const [editRoleName, setEditRoleName] = useState('')

  // Dates tab
  const [dateForm, setDateForm] = useState({ date: '', type: 'holiday' as 'holiday' | 'special', label: '' })

  // Settings tab — derived from adminTenant
  const [slotList, setSlotList] = useState<string[]>([])
  const [slotStart, setSlotStart] = useState(10)
  const [slotEnd, setSlotEnd] = useState(12)
  const [settingsName, setSettingsName] = useState('')
  const [settingsTitle, setSettingsTitle] = useState('')
  const [settingsTheme, setSettingsTheme] = useState('')
  const [settingsPreset, setSettingsPreset] = useState<ThemePresetKey | ''>('')
  const [colorOpen, setColorOpen] = useState(false)

  const [slotLabels, setSlotLabels] = useState<Record<string, string>>({})
  const [roleRatios, setRoleRatios] = useState<Record<string, number>>({})
  const [ratioSaving, setRatioSaving] = useState(false)
  const [legendItems, setLegendItems] = useState<LegendItem[]>([])
  const [newLegendIcon, setNewLegendIcon] = useState('')
  const [newLegendLabel, setNewLegendLabel] = useState('')
  const [newLegendColor, setNewLegendColor] = useState<LegendColor>('blue')
  const [editingLegendId, setEditingLegendId] = useState<string | null>(null)
  const [editLegendIcon, setEditLegendIcon] = useState('')
  const [editLegendLabel, setEditLegendLabel] = useState('')
  const [editLegendColor, setEditLegendColor] = useState<LegendColor>('blue')

  // Custom fields tab
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>([])
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldType, setNewFieldType] = useState<CustomFieldType>('text')
  const [newFieldRequired, setNewFieldRequired] = useState(true)
  const [newFieldOptions, setNewFieldOptions] = useState<CustomFieldOption[]>([])
  const [newFieldShowInDashboard, setNewFieldShowInDashboard] = useState(false)
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('')
  const [newFieldMin, setNewFieldMin] = useState('')
  const [newFieldMax, setNewFieldMax] = useState('')
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [editField, setEditField] = useState<Omit<CustomFieldDef, 'id'>>({ label: '', type: 'text', required: true, options: [], placeholder: '', show_in_dashboard: false, min: undefined, max: undefined })

  // 알림 설정
  const [notifSettings, setNotifSettings] = useState<{
    is_enabled: boolean
    send_time: string
    recipients: { assigned_members: boolean; admins: boolean }
    msg_template: string
  } | null>(null)
  const [notifSaving, setNotifSaving] = useState(false)

  // Sync settings form when adminTenant changes
  useEffect(() => {
    if (!adminTenant) return
    const s = adminTenant.settings
    setSlotList(s.time_slots?.length ? s.time_slots : [])
    setSettingsName(adminTenant.name)
    setSettingsTitle(s.title ?? '')
    setSettingsTheme(s.theme_color ?? '')
    setSettingsPreset((s.theme_preset as ThemePresetKey) ?? '')

    setSlotLabels(s.slot_labels ?? {})
    setRoleRatios(s.role_ratios ?? {})
    setLegendItems(s.legend_items ?? [])
    setCustomFields(s.custom_fields ?? [])
  }, [adminTenant?.id])

  // admin memberships key — stable string, changes only when actual admin orgs change
  const adminMemberKey = memberships.filter(m => m.role === 'admin').map(m => m.tenant_id).sort().join(',')

  // Load available orgs based on user role
  useEffect(() => {
    if (!profile || authLoading) return
    const currentProfile = profile
    async function loadOrgs() {
      let orgs: Tenant[]
      if (currentProfile.is_super_admin) {
        const { data } = await supabase.from('tenants').select('*').order('name')
        orgs = (data ?? []) as Tenant[]
      } else {
        const ctxAdminOrgs = memberships
          .filter(m => m.role === 'admin')
          .map(m => (m as { tenant: Tenant }).tenant)

        if (ctxAdminOrgs.length > 0) {
          orgs = ctxAdminOrgs
        } else {
          // memberships가 아직 로드되지 않은 경우(위저드 직후 등) — DB 직접 조회
          const { data } = await supabase
            .from('tenant_members')
            .select('*, tenant:tenants(*)')
            .eq('user_id', currentProfile.id)
            .eq('role', 'admin')
            .neq('is_approved', false)
          orgs = ((data ?? []) as { tenant: Tenant }[]).map(m => m.tenant).filter(Boolean)
        }
      }
      setAvailableTenants(orgs)
      const init =
        orgs.find(t => t.id === initOrgId) ??
        orgs.find(t => t.id === tenant?.id) ??
        orgs[0] ??
        null
      setAdminTenant(init)
      setOrgLoading(false)
    }
    loadOrgs()
  }, [profile?.id, authLoading, adminMemberKey])

  // 알림 설정 로드
  useEffect(() => {
    if (!adminTenant?.id) return
    supabase
      .from('notification_settings')
      .select('*')
      .eq('tenant_id', adminTenant.id)
      .maybeSingle()
      .then(({ data }) => {
        setNotifSettings(data ? {
          is_enabled: data.is_enabled,
          send_time: data.send_time,
          recipients: data.recipients as { assigned_members: boolean; admins: boolean },
          msg_template: data.msg_template,
        } : {
          is_enabled: false,
          send_time: '18:00',
          recipients: { assigned_members: true, admins: false },
          msg_template: '안녕하세요! 내일 {{date}} {{slot}} 배정이 있습니다. ({{org}})',
        })
      })
  }, [adminTenant?.id])

  const adminTenantMode = displayMode(adminTenant?.settings?.tenant_mode)
  const adminIsFreeform = adminTenantMode === '비회원'

  // timeSlots derived from adminTenant (not from TenantContext)
  const adminTimeSlots = useMemo<TimeSlot[]>(() => {
    const s = adminTenant?.settings
    if (!s) return DEFAULT_TIME_SLOTS
    return s.time_slots?.length
      ? s.time_slots
      : generateTimeSlots(s.open_from, s.open_to, s.slot_interval_minutes)
  }, [adminTenant?.id, adminTenant?.settings])

  if (authLoading || orgLoading) {
    return <div className="min-h-screen flex items-center justify-center text-[var(--color-text-muted)]">로딩 중...</div>
  }

  // Access control: super admin, current tenant admin, or admin of any org
  // tenantRole === 'admin' covers the case where setTenant() was called but memberships haven't reloaded yet
  const canAdmin =
    profile?.is_super_admin ||
    tenantRole === 'admin' ||
    memberships.some(m => m.role === 'admin')

  if (!profile || !canAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <p className="text-[var(--color-text-muted)] mb-4">관리자 권한이 필요합니다.</p>
          <button onClick={() => navigate('/')} className="text-[var(--color-brand-primary)] hover:underline text-sm">← 메인으로 돌아가기</button>
        </div>
      </div>
    )
  }

  function getRule(dayOfWeek: number, slot: TimeSlot) {
    return scheduleRules.find(r => r.day_of_week === dayOfWeek && r.time_slot === slot)
  }

  function msg(text: string, isError = false) { setMessage({ text, isError }) }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const err = await addMember(addEmail.trim())
    setSaving(false)
    if (err) { msg(err, true); return }
    msg(`${addEmail} 회원이 추가됐습니다.`)
    setAddEmail('')
    setShowAddMember(false)
  }

  async function handleSaveMemberName(userId: string) {
    if (!editName.trim()) { msg('이름을 입력해 주세요.', true); return }
    setNameSaving(true)
    const err = await updateMemberName(userId, editName.trim())
    setNameSaving(false)
    if (err) { msg(err, true); return }
    setEditingNameUserId(null)
  }

  async function addLegendItem() {
    if (!newLegendLabel.trim() || !adminTenantId) return
    const newItem: LegendItem = {
      id: Date.now().toString(),
      icon: newLegendIcon.trim(),
      label: newLegendLabel.trim(),
      color: newLegendColor,
    }
    const next = [...legendItems, newItem]
    const err = await updateTenantSettings(adminTenantId, { legend_items: next })
    if (err) { msg(err, true); return }
    setLegendItems(next)
    if (adminTenant) {
      const updated = { ...adminTenant, settings: { ...adminTenant.settings, legend_items: next } }
      setAdminTenant(updated)
      if (adminTenant.id === tenant?.id) updateCurrentTenant(updated)
    }
    setNewLegendIcon('')
    setNewLegendLabel('')
    msg('항목이 추가됐습니다.')
  }

  async function removeLegendItem(id: string) {
    if (!adminTenantId) return
    const next = legendItems.filter(i => i.id !== id)
    const err = await updateTenantSettings(adminTenantId, { legend_items: next })
    if (err) { msg(err, true); return }
    setLegendItems(next)
    if (adminTenant) {
      const updated = { ...adminTenant, settings: { ...adminTenant.settings, legend_items: next } }
      setAdminTenant(updated)
      if (adminTenant.id === tenant?.id) updateCurrentTenant(updated)
    }
  }

  function startEditLegend(item: LegendItem) {
    setEditingLegendId(item.id)
    setEditLegendIcon(item.icon)
    setEditLegendLabel(item.label)
    setEditLegendColor(item.color)
  }

  async function saveLegendEdit() {
    if (!editingLegendId || !editLegendLabel.trim() || !adminTenantId) return
    const next = legendItems.map(i =>
      i.id === editingLegendId
        ? { ...i, icon: editLegendIcon.trim(), label: editLegendLabel.trim(), color: editLegendColor }
        : i
    )
    const err = await updateTenantSettings(adminTenantId, { legend_items: next })
    if (err) { msg(err, true); return }
    setLegendItems(next)
    if (adminTenant) {
      const updated = { ...adminTenant, settings: { ...adminTenant.settings, legend_items: next } }
      setAdminTenant(updated)
      if (adminTenant.id === tenant?.id) updateCurrentTenant(updated)
    }
    setEditingLegendId(null)
    msg('수정됐습니다.')
  }

  // ── 커스텀 필드 CRUD ──────────────────────────────────────────────────────────

  async function addCustomField(e: React.FormEvent) {
    e.preventDefault()
    if (!newFieldLabel.trim() || !adminTenantId) return
    const newField: CustomFieldDef = {
      id: Date.now().toString(),
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: newFieldType !== 'checkbox' && newFieldRequired,
      options: FIELD_TYPES_WITH_OPTIONS.includes(newFieldType) ? newFieldOptions.filter(o => o.name.trim() || o.value.trim()) : undefined,
      placeholder: ['text', 'number', 'select', 'phone', 'account_number'].includes(newFieldType) ? (newFieldPlaceholder.trim() || undefined) : undefined,
      show_in_dashboard: FIELD_TYPES_WITH_DASHBOARD.includes(newFieldType) && newFieldShowInDashboard ? true : undefined,
      min: newFieldType === 'number' && newFieldMin.trim() !== '' ? Number(newFieldMin) : undefined,
      max: newFieldType === 'number' && newFieldMax.trim() !== '' ? Number(newFieldMax) : undefined,
    }
    const next = [...customFields, newField]
    const err = await updateTenantSettings(adminTenantId, { custom_fields: next })
    if (err) { msg(err, true); return }
    setCustomFields(next)
    if (adminTenant) {
      const updated = { ...adminTenant, settings: { ...adminTenant.settings, custom_fields: next } }
      setAdminTenant(updated)
      if (adminTenant.id === tenant?.id) updateCurrentTenant(updated)
    }
    setNewFieldLabel('')
    setNewFieldType('text')
    setNewFieldRequired(true)
    setNewFieldOptions([])
    setNewFieldShowInDashboard(false)
    setNewFieldPlaceholder('')
    setNewFieldMin('')
    setNewFieldMax('')
    msg('필드가 추가됐습니다.')
  }

  async function addFieldFromTemplate(field: Omit<CustomFieldDef, 'id'>) {
    if (customFields.some(f => f.label === field.label) || !adminTenantId) return
    const newField: CustomFieldDef = { ...field, id: Date.now().toString() }
    const next = [...customFields, newField]
    const err = await updateTenantSettings(adminTenantId, { custom_fields: next })
    if (err) { msg(err, true); return }
    setCustomFields(next)
    if (adminTenant) {
      const updated = { ...adminTenant, settings: { ...adminTenant.settings, custom_fields: next } }
      setAdminTenant(updated)
      if (adminTenant.id === tenant?.id) updateCurrentTenant(updated)
    }
    msg(`"${field.label}" 필드가 추가됐습니다.`)
  }

  async function removeCustomField(id: string) {
    if (!adminTenantId) return
    const next = customFields.filter(f => f.id !== id)
    const err = await updateTenantSettings(adminTenantId, { custom_fields: next })
    if (err) { msg(err, true); return }
    setCustomFields(next)
    if (adminTenant) {
      const updated = { ...adminTenant, settings: { ...adminTenant.settings, custom_fields: next } }
      setAdminTenant(updated)
      if (adminTenant.id === tenant?.id) updateCurrentTenant(updated)
    }
  }

  async function saveFieldEdit() {
    if (!editingFieldId || !editField.label.trim() || !adminTenantId) return
    const next = customFields.map(f =>
      f.id === editingFieldId
        ? {
            ...f,
            label: editField.label.trim(),
            type: editField.type,
            required: editField.type !== 'checkbox' && editField.required,
            options: FIELD_TYPES_WITH_OPTIONS.includes(editField.type) ? (editField.options ?? []).filter(o => o.name.trim() || o.value.trim()) : undefined,
            placeholder: ['text', 'number', 'select', 'phone', 'account_number'].includes(editField.type) ? (editField.placeholder?.trim() || undefined) : undefined,
            show_in_dashboard: FIELD_TYPES_WITH_DASHBOARD.includes(editField.type) && editField.show_in_dashboard ? true : undefined,
            min: editField.type === 'number' ? editField.min : undefined,
            max: editField.type === 'number' ? editField.max : undefined,
          }
        : f
    )
    const err = await updateTenantSettings(adminTenantId, { custom_fields: next })
    if (err) { msg(err, true); return }
    setCustomFields(next)
    if (adminTenant) {
      const updated = { ...adminTenant, settings: { ...adminTenant.settings, custom_fields: next } }
      setAdminTenant(updated)
      if (adminTenant.id === tenant?.id) updateCurrentTenant(updated)
    }
    setEditingFieldId(null)
    msg('수정됐습니다.')
  }

  function moveField(id: string, dir: -1 | 1) {
    const idx = customFields.findIndex(f => f.id === id)
    if (idx < 0) return
    const next = [...customFields]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    setCustomFields(next)
    if (adminTenantId) {
      updateTenantSettings(adminTenantId, { custom_fields: next }).then(err => {
        if (err) msg(err, true)
        else if (adminTenant) {
          const updated = { ...adminTenant, settings: { ...adminTenant.settings, custom_fields: next } }
          setAdminTenant(updated)
          if (adminTenant.id === tenant?.id) updateCurrentTenant(updated)
        }
      })
    }
  }

  function moveLegendItem(id: string, dir: -1 | 1) {
    const idx = legendItems.findIndex(i => i.id === id)
    const target = idx + dir
    if (idx < 0 || target < 0 || target >= legendItems.length) return
    const next = [...legendItems]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    setLegendItems(next)
    if (adminTenantId) {
      updateTenantSettings(adminTenantId, { legend_items: next }).then(err => {
        if (err) msg(err, true)
        else if (adminTenant) {
          const updated = { ...adminTenant, settings: { ...adminTenant.settings, legend_items: next } }
          setAdminTenant(updated)
          if (adminTenant.id === tenant?.id) updateCurrentTenant(updated)
        }
      })
    }
  }

  async function handleDirectCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!adminTenantId) return
    setDirectSaving(true)
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: {
        email: directForm.email,
        password: directForm.password,
        name: directForm.name,
        role_id: directForm.roleId || null,
        tenant_id: adminTenantId,
      },
    })
    setDirectSaving(false)
    if (error || data?.error) {
      msg(data?.error ?? error?.message ?? '오류가 발생했습니다.', true)
      return
    }
    await reloadMembers()
    msg(`${directForm.name} (${directForm.email}) 계정이 생성되고 조직에 추가됐습니다.`)
    setDirectForm({ email: '', name: '', password: '', roleId: '' })
    setShowDirectCreate(false)
  }

  async function saveMemberPreference(
    userId: string,
    availableDays: number[] | null,
    monthlyLimit: number | null
  ): Promise<string | null> {
    const { error } = await supabase
      .from('tenant_members')
      .update({ available_days: availableDays, monthly_limit: monthlyLimit })
      .eq('tenant_id', adminTenantId)
      .eq('user_id', userId)
    if (!error) {
      await reloadMembers()
    }
    return error?.message ?? null
  }

  async function handleAddRole(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = newRoleName.trim()
    if (!trimmedName) return
    if (roles.some(r => r.name === trimmedName)) {
      msg('같은 이름의 역할이 이미 존재합니다.', true)
      return
    }
    const err = await addRole(trimmedName, newRoleSplitCell, newRoleRequiresCustomerInfo, newRoleIndicatorBar)
    if (err) { msg(err, true); return }
    setNewRoleName('')
    setNewRoleSplitCell(false)
    setNewRoleIndicatorBar(false)
    setNewRoleRequiresCustomerInfo(false)
  }

  async function handleDateSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!dateForm.date) { msg('날짜를 선택해주세요.', true); return }
    const existingOverride = dateOverrides.find(d => d.date === dateForm.date)
    if (existingOverride) {
      msg(`${dateForm.date}는 이미 ${existingOverride.is_holiday ? '휴관일' : '특별운영일'}로 등록되어 있습니다. 삭제 후 다시 추가해주세요.`, true)
      return
    }
    setSaving(true)
    const isHoliday = dateForm.type === 'holiday'
    const err = await addDateOverride(dateForm.date, !isHoliday, isHoliday, dateForm.label || null)
    setSaving(false)
    if (err) { msg(err, true); return }
    msg('저장되었습니다.')
    setDateForm({ date: '', type: 'holiday', label: '' })
  }

  async function handleAddSlot() {
    if (slotEnd <= slotStart) { msg('종료 시간은 시작 시간보다 커야 합니다.', true); return }
    const slot = buildSlot(slotStart, slotEnd)
    if (slotList.includes(slot)) { msg('이미 등록된 슬롯입니다.', true); return }
    const newList = [...slotList, slot].sort((a, b) => parseFloat(a) - parseFloat(b))
    setSlotList(newList)
    const err = await upsertScheduleRulesForSlots([slot])
    if (err) msg(`슬롯이 추가됐으나 규칙 생성에 실패했습니다: ${err}`, true)
  }

  async function handleRatioSave() {
    const total = Object.values(roleRatios).reduce((s, v) => s + v, 0)
    if (Object.keys(roleRatios).length > 0 && total !== 100) {
      msg('역할 비율의 합계는 100%이어야 합니다.', true)
      return
    }
    setRatioSaving(true)
    const currentSettings = adminTenant?.settings ?? {}
    const merged = { ...currentSettings, role_ratios: roleRatios }
    const { error } = await supabase
      .from('tenants')
      .update({ settings: merged })
      .eq('id', adminTenantId)
    if (!error) msg('역할 비율이 저장됐습니다.')
    else msg(`오류: ${error.message}`, true)
    setRatioSaving(false)
  }

  async function handleSettingsSave(e: React.FormEvent) {
    e.preventDefault()
    if (!adminTenant) return
    if (slotList.length === 0) { msg('슬롯을 하나 이상 등록해야 합니다.', true); return }
    if (settingsTheme && !HEX_COLOR_RE.test(settingsTheme.trim())) {
      msg('테마 색상은 #RRGGBB 형식으로 입력해주세요. (예: #2563eb)', true)
      return
    }
    const currentSlots = adminTenant.settings?.time_slots ?? []
    const removedSlots = currentSlots.filter(s => !slotList.includes(s))
    if (removedSlots.length > 0) {
      const { count } = await supabase.from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', adminTenant.id)
        .in('time_slot', removedSlots)
      if ((count ?? 0) > 0) {
        if (!window.confirm(`삭제될 슬롯(${removedSlots.length}개)에 기존 배정 ${count}건이 있습니다.\n해당 배정은 DB에 남지만 스케줄 화면에서 보이지 않게 됩니다.\n계속하시겠습니까?`)) return
      }
    }
    setSaving(true)
    const hasHalf = slotList.some(s => s.includes('.'))
    const [nameErr, settingsErr, rulesErr] = await Promise.all([
      updateTenantName(adminTenant.id, settingsName.trim()),
      updateTenantSettings(adminTenant.id, {
        title: settingsTitle.trim(),
        theme_color: settingsTheme.trim() || undefined,
        theme_preset: settingsPreset || undefined,
        time_slots: slotList,
        slot_interval_minutes: hasHalf ? 30 : 60,
        slot_labels: slotLabels,
      }),
      upsertScheduleRulesForSlots(slotList),
    ])
    setSaving(false)
    const err = nameErr || settingsErr || rulesErr
    msg(err ?? '저장됐습니다.', !!err)
    if (!err) {
      const updated = {
        ...adminTenant,
        name: settingsName.trim(),
        settings: {
          ...adminTenant.settings,
          title: settingsTitle.trim(),
          time_slots: slotList,
          theme_color: settingsTheme.trim() || undefined,
          theme_preset: settingsPreset || undefined,
          slot_interval_minutes: hasHalf ? 30 : 60,
          slot_labels: slotLabels,
          legend_items: legendItems,
        },
      }
      setAdminTenant(updated)
      if (adminTenant.id === tenant?.id) updateCurrentTenant(updated)
    }
  }

  async function saveNotifSettings() {
    if (!adminTenant?.id || !notifSettings) return
    setNotifSaving(true)
    const { error } = await supabase
      .from('notification_settings')
      .upsert({
        tenant_id: adminTenant.id,
        is_enabled: notifSettings.is_enabled,
        send_time: notifSettings.send_time,
        recipients: notifSettings.recipients,
        msg_template: notifSettings.msg_template,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'tenant_id' })
    setNotifSaving(false)
    if (error) alert(`저장 오류: ${error.message}`)
  }

  const inputCls = 'border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-primary)] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30 focus:border-[var(--color-brand-primary)]'

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-[var(--color-surface)] border-b border-[var(--color-border)]">

        {/* Top bar: brand + user */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/')}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] transition-all"
            >
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 16l-5-6 5-6"/></svg>
            </button>
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl text-white flex items-center justify-center text-[13px] font-bold shrink-0 ${adminTenant?.settings?.theme_color ? '' : 'bg-[var(--color-brand-primary)] shadow-[0_4px_12px_-4px_var(--color-brand-primary)]'}`}
                style={adminTenant?.settings?.theme_color ? { background: adminTenant.settings.theme_color } : undefined}
              >
                {adminTenant?.name?.[0] ?? '관'}
              </div>
              <div className="min-w-0">
                {availableTenants.length > 1 ? (
                  <select
                    value={adminTenant?.id ?? ''}
                    onChange={e => {
                      const t = availableTenants.find(t => t.id === e.target.value)
                      if (t) setAdminTenant(t)
                    }}
                    className="bg-transparent border-0 outline-none text-[15px] font-bold text-[var(--color-text-primary)] cursor-pointer max-w-[180px] leading-tight"
                  >
                    {availableTenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-[15px] font-bold text-[var(--color-text-primary)] truncate leading-tight">{adminTenant?.name ?? '관리자'}</div>
                )}
                <div className="text-[11.5px] text-[var(--color-text-muted)] font-medium leading-tight">{ta('title')}</div>
              </div>
            </div>
          </div>
          <span className="shrink-0 text-sm font-semibold text-[var(--color-text-secondary)]">{profile.name}</span>
        </div>

        {/* Tab strip with edge fades */}
        <div className="relative">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[var(--color-surface)] to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[var(--color-surface)] to-transparent z-10" />
          <nav className="max-w-5xl mx-auto flex gap-0.5 px-4 sm:px-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(Object.keys(TAB_LABELS) as Tab[]).map(t => {
              const count = t === 'members'
                ? members.filter(m => m.is_approved !== false).length
                : t === 'pending'
                ? members.filter(m => m.is_approved === false).length
                : 0
              const isActive = tab === t
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`relative shrink-0 flex items-center gap-1.5 px-3.5 pt-3 pb-3.5 text-[14px] font-semibold transition-colors duration-[120ms] whitespace-nowrap ${
                    isActive
                      ? 'text-[var(--color-text-primary)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                  }`}
                >
                  {tad(`tabs.${t === 'custom_fields' ? 'customFields' : t}`)}
                  {count > 0 && (
                    <span className={`text-[11px] font-bold px-[7px] py-px rounded-full ${
                      isActive
                        ? 'bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)]'
                        : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]'
                    }`}>
                      {count}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute left-2.5 right-2.5 bottom-0 h-[2.5px] rounded-t-full bg-[var(--color-brand-primary)]" />
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm flex justify-between items-center ${
            message.isError ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
          }`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {!adminTenant ? (
          <div className="text-center py-16 text-[var(--color-text-muted)]">관리할 조직을 선택해 주세요.</div>
        ) : loading ? (
          <div className="text-center py-16 text-[var(--color-text-muted)]">로딩 중...</div>
        ) : (
          <>
            {/* ── 회원 관리 ── */}
            {tab === 'members' && (
              <div>
                {/* 페이지 헤더 */}
                <header className="mb-5">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 px-3 py-[5px] rounded-full">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    조직 설정 · 회원 관리
                  </span>
                  <h2 className="mt-3 mb-1.5 text-[clamp(22px,5vw,27px)] font-extrabold tracking-tight text-[var(--color-text-primary)]">회원 관리</h2>
                  <p className="text-[14px] font-medium text-[var(--color-text-muted)] leading-relaxed max-w-[52ch]">
                    조직 회원을 조회하고 역할·권한을 설정하거나 새 회원을 추가합니다.
                  </p>
                  <span className="mt-3.5 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--color-text-secondary)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5" opacity="0.5"/></svg>
                    승인 회원 <b className="text-[var(--color-brand-primary)] font-extrabold">{members.filter(m => m.is_approved).length}</b>명
                    {(() => { const n = members.filter(m => !m.is_approved).length; return n > 0 ? (
                      <button onClick={() => setTab('pending')} className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
                        승인대기 {n}건 →
                      </button>
                    ) : null })()}
                  </span>
                </header>

                {/* 회원 추가 / 직접 등록 버튼 */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => { setShowDirectCreate(v => !v); setShowAddMember(false) }}
                    className="px-3 py-1.5 text-xs font-medium border border-orange-400 text-orange-600 rounded-lg hover:bg-orange-50"
                  >
                    + 직접 등록
                  </button>
                  <button
                    onClick={() => { setShowAddMember(v => !v); setShowDirectCreate(false) }}
                    className="px-3 py-1.5 text-xs font-medium bg-[var(--color-brand-primary)] text-white rounded-lg hover:bg-[var(--color-brand-primary-hover)]"
                  >
                    + 회원 추가
                  </button>
                </div>

                {showDirectCreate && (
                  <div className="mb-4 border-[1.5px] border-dashed border-orange-300 rounded-[18px] bg-orange-50/50 dark:bg-orange-900/10" style={{ padding: '13px' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-9 h-9 rounded-[11px] bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                      </span>
                      <div>
                        <p className="m-0 text-[15px] font-extrabold tracking-tight text-[var(--color-text-primary)]">직접 등록</p>
                        <p className="m-0 mt-0.5 text-[12.5px] font-medium text-[var(--color-text-muted)]">이메일 인증 없이 계정을 생성하고 이 조직에 자동으로 추가합니다</p>
                      </div>
                    </div>
                    <form onSubmit={handleDirectCreate} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">이름 *</label>
                          <input type="text" required value={directForm.name}
                            onChange={e => setDirectForm(p => ({ ...p, name: e.target.value }))}
                            placeholder="홍길동" className={inputCls + ' w-full mt-1'} />
                        </div>
                        <div>
                          <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">이메일 *</label>
                          <input type="email" required value={directForm.email}
                            onChange={e => setDirectForm(p => ({ ...p, email: e.target.value }))}
                            placeholder="test@example.com" className={inputCls + ' w-full mt-1'} />
                        </div>
                        <div>
                          <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">비밀번호 * (6자 이상)</label>
                          <input type="password" required minLength={6} value={directForm.password}
                            onChange={e => setDirectForm(p => ({ ...p, password: e.target.value }))}
                            placeholder="••••••" className={inputCls + ' w-full mt-1'} />
                        </div>
                        <div>
                          <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">역할</label>
                          <select value={directForm.roleId}
                            onChange={e => setDirectForm(p => ({ ...p, roleId: e.target.value }))}
                            className={inputCls + ' w-full mt-1'}>
                            <option value="">미지정</option>
                            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button type="submit" disabled={directSaving}
                          className="px-4 py-1.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 disabled:opacity-50">
                          {directSaving ? '생성 중...' : '계정 생성'}
                        </button>
                        <button type="button" onClick={() => setShowDirectCreate(false)}
                          className="px-4 py-1.5 border border-[var(--color-border-strong)] text-sm rounded-lg text-[var(--color-text-muted)]">
                          취소
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {showAddMember && (
                  <div className="mb-4 border-[1.5px] border-dashed border-[var(--color-border-strong)] rounded-[18px] bg-[var(--color-surface-secondary)]" style={{ padding: '13px' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-9 h-9 rounded-[11px] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] flex items-center justify-center shrink-0">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                      </span>
                      <div>
                        <p className="m-0 text-[15px] font-extrabold tracking-tight text-[var(--color-text-primary)]">회원 추가</p>
                        <p className="m-0 mt-0.5 text-[12.5px] font-medium text-[var(--color-text-muted)]">이미 가입된 계정을 이메일로 조직에 초대합니다</p>
                      </div>
                    </div>
                    <form onSubmit={handleAddMember} className="flex gap-2 items-end flex-wrap">
                      <div className="flex-1 min-w-48">
                        <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">이메일</label>
                        <input type="email" value={addEmail} onChange={e => setAddEmail(e.target.value)}
                          placeholder="member@example.com" required className={inputCls + ' w-full mt-1'} />
                      </div>
                      <button type="submit" disabled={saving}
                        className="px-4 py-1.5 bg-[var(--color-brand-primary)] text-white text-sm rounded-lg hover:bg-[var(--color-brand-primary-hover)] disabled:opacity-50">
                        {saving ? '추가 중...' : '추가'}
                      </button>
                      <button type="button" onClick={() => setShowAddMember(false)}
                        className="px-4 py-1.5 border border-[var(--color-border-strong)] text-sm rounded-lg text-[var(--color-text-muted)]">
                        취소
                      </button>
                    </form>
                  </div>
                )}

                <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
                        <th className="text-center px-2 py-2 sm:px-4 sm:py-3 text-xs font-semibold text-[var(--color-text-muted)]">이름</th>
                        <th className="text-center px-2 py-2 sm:px-4 sm:py-3 text-xs font-semibold text-[var(--color-text-muted)] hidden sm:table-cell">이메일</th>
                        <th className="text-center px-2 py-2 sm:px-4 sm:py-3 text-xs font-semibold text-[var(--color-text-muted)]">역할</th>
                        <th className="text-center px-2 py-2 sm:px-4 sm:py-3 text-xs font-semibold text-[var(--color-text-muted)]">권한</th>
                        <th className="text-center px-2 py-2 sm:px-4 sm:py-3 text-xs font-semibold text-[var(--color-text-muted)]">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {members.filter(m => m.is_approved).map(m => (
                        <Fragment key={m.user_id}>
                          <tr className="hover:bg-[var(--color-surface-hover)]">
                            <td className="px-2 py-2 sm:px-4 sm:py-3 font-medium text-[var(--color-text-primary)] text-center">
                              {editingNameUserId === m.user_id ? (
                                <span className="flex items-center justify-center gap-1">
                                  <input
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveMemberName(m.user_id); if (e.key === 'Escape') setEditingNameUserId(null) }}
                                    className="text-xs px-1.5 py-1 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-primary)] w-20 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30 focus:border-[var(--color-brand-primary)]"
                                    autoFocus
                                  />
                                  <button onClick={() => handleSaveMemberName(m.user_id)} disabled={nameSaving}
                                    className="px-1.5 py-1 text-[10px] bg-[var(--color-brand-primary)] text-white rounded-lg disabled:opacity-40">
                                    {nameSaving ? '...' : '저장'}
                                  </button>
                                  <button onClick={() => setEditingNameUserId(null)}
                                    className="px-1.5 py-1 text-[10px] border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] rounded-lg">취소</button>
                                </span>
                              ) : (
                                <button
                                  onClick={() => { setEditingNameUserId(m.user_id); setEditName(m.profile?.name ?? '') }}
                                  className="hover:text-[var(--color-brand-primary)] transition-colors"
                                  title="성명 수정"
                                >
                                  {m.profile?.name ?? '-'}
                                </button>
                              )}
                              {m.user_id === profile.id && <span className="ml-1.5 text-xs text-[var(--color-text-muted)]">(나)</span>}
                            </td>
                            <td className="px-2 py-2 sm:px-4 sm:py-3 text-[var(--color-text-muted)] hidden sm:table-cell text-xs text-center">{m.profile?.email ?? '-'}</td>
                            <td className="px-2 py-2 sm:px-4 sm:py-3 text-center">
                              <select
                                value={m.role_id ?? ''}
                                onChange={async e => {
                                  const err = await updateMemberTenantRole(m.user_id, e.target.value || null)
                                  if (err) msg(err, true)
                                }}
                                className="text-xs border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)]/30"
                              >
                                <option value="">미지정</option>
                                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                              </select>
                            </td>
                            <td className="px-2 py-2 sm:px-4 sm:py-3 text-center">
                              {m.user_id !== profile.id ? (
                                <select
                                  value={m.role}
                                  onChange={async e => {
                                    const err = await updateMemberAccess(m.user_id, e.target.value as TenantAccessRole)
                                    if (err) msg(err, true)
                                  }}
                                  className="text-xs border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)]/30"
                                >
                                  <option value="member">멤버</option>
                                  <option value="admin">관리자</option>
                                </select>
                              ) : (
                                <span className="text-xs text-[var(--color-text-muted)]">{m.role === 'admin' ? '관리자' : '멤버'}</span>
                              )}
                            </td>
                            <td className="px-2 py-2 sm:px-4 sm:py-3">
                              <div className="flex flex-wrap gap-1 items-center justify-center">
                                {/* 자동배정 설정 버튼 */}
                                <button
                                  onClick={() => {
                                    if (expandedPrefUserId === m.user_id) {
                                      setExpandedPrefUserId(null)
                                      return
                                    }
                                    setExpandedPrefUserId(m.user_id)
                                    setPrefDays(m.available_days ?? [])
                                    setPrefLimit(m.monthly_limit?.toString() ?? '')
                                  }}
                                  className="px-2 py-1 text-[10px] border border-[var(--color-border)] rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]"
                                >
                                  자동배정
                                </button>
                                {m.user_id !== profile.id && (
                                  <button
                                    onClick={async () => {
                                      if (!confirm(`${m.profile?.name} 회원을 삭제할까요?`)) return
                                      const err = await removeMember(m.user_id)
                                      if (err) msg(err, true)
                                    }}
                                    className="px-2 py-1 text-[10px] text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                                  >
                                    삭제
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {/* 인라인 패널 */}
                          {expandedPrefUserId === m.user_id && (
                            <tr>
                              <td colSpan={5} className="px-4 pb-3">
                                <div className="mt-2 p-3 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] space-y-3">
                                  {/* 이메일 */}
                                  <div>
                                    <p className="text-[10px] font-semibold text-[var(--color-text-muted)] mb-1.5">이메일</p>
                                    <input
                                      type="email"
                                      readOnly
                                      value={m.profile?.email ?? ''}
                                      className="w-full border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-xs bg-[var(--color-surface)] text-[var(--color-text-muted)] cursor-default focus:outline-none select-all"
                                    />
                                  </div>
                                  {/* 가능 요일 */}
                                  <div>
                                    <p className="text-[10px] font-semibold text-[var(--color-text-muted)] mb-1.5">가능 요일 (미선택 = 모든 요일)</p>
                                    <div className="flex gap-2">
                                      {['일','월','화','수','목','금','토'].map((label, idx) => (
                                        <label key={idx} className="flex flex-col items-center gap-0.5 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={prefDays.includes(idx)}
                                            onChange={() => setPrefDays(prev =>
                                              prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx].sort((a,b) => a-b)
                                            )}
                                            className="accent-[var(--color-brand-primary)]"
                                          />
                                          <span className="text-[10px] text-[var(--color-text-secondary)]">{label}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                  {/* 월별 횟수 제한 */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">월별 최대 횟수</span>
                                    <input
                                      type="number" min={1} max={99}
                                      value={prefLimit}
                                      onChange={e => setPrefLimit(e.target.value)}
                                      placeholder="제한없음"
                                      className="w-16 border border-[var(--color-border-strong)] rounded-lg px-2 py-1 text-xs text-center bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none"
                                    />
                                    <span className="text-[10px] text-[var(--color-text-muted)]">회 (빈칸=무제한)</span>
                                  </div>
                                  {/* 저장 */}
                                  <button
                                    onClick={async () => {
                                      const days = prefDays.length === 0 ? null : prefDays
                                      const limit = prefLimit ? parseInt(prefLimit, 10) : null
                                      const err = await saveMemberPreference(m.user_id, days, limit)
                                      if (!err) setExpandedPrefUserId(null)
                                    }}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-hover)]"
                                  >
                                    저장
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── 승인 대기 ── */}
            {tab === 'pending' && (
              <div className="max-w-lg">
                {/* 페이지 헤더 */}
                <header className="mb-5">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 px-3 py-[5px] rounded-full">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    조직 설정 · 승인 대기
                  </span>
                  <h2 className="mt-3 mb-1.5 text-[clamp(22px,5vw,27px)] font-extrabold tracking-tight text-[var(--color-text-primary)]">승인 대기</h2>
                  <p className="text-[14px] font-medium text-[var(--color-text-muted)] leading-relaxed max-w-[52ch]">
                    가입 신청을 한 회원을 검토하고 승인 또는 거절합니다.
                  </p>
                  <span className="mt-3.5 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--color-text-secondary)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5" opacity="0.5"/></svg>
                    대기 <b className="text-[var(--color-brand-primary)] font-extrabold">{members.filter(m => !m.is_approved).length}</b>명
                  </span>
                </header>

                {(() => {
                  const pendingMembers = members.filter(m => !m.is_approved)
                  if (pendingMembers.length === 0) {
                    return <p className="text-sm text-[var(--color-text-muted)] px-4 py-6 text-center">승인 대기 중인 회원이 없습니다.</p>
                  }
                  return (
                    <div className="flex flex-col gap-2.5">
                      {pendingMembers.map(m => (
                        <div key={m.user_id} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm hover:border-[var(--color-border-strong)] hover:shadow-md transition-all" style={{ padding: '13px' }}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[15px] font-bold text-[var(--color-text-primary)] truncate">{m.profile?.name ?? '-'}</p>
                              <p className="text-[12.5px] text-[var(--color-text-muted)] mt-0.5 truncate">{m.profile?.email ?? '-'}</p>
                              {m.tenant_role?.name && (
                                <p className="text-[11.5px] text-[var(--color-text-secondary)] mt-0.5">{m.tenant_role.name}</p>
                              )}
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={async () => {
                                  const err = await approveUser(m.user_id)
                                  if (err) msg(err, true)
                                  else msg(`${m.profile?.name ?? '회원'}을(를) 승인했습니다.`)
                                }}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                              >
                                승인
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm(`"${m.profile?.name ?? '회원'}"을(를) 거절하고 조직에서 제외할까요?`)) return
                                  const err = await removeMember(m.user_id)
                                  if (err) msg(err, true)
                                }}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                              >
                                거절
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}

                {/* 탈퇴 신청 */}
                {(() => {
                  const withdrawalPending = members.filter(m => m.withdrawal_status === 'pending')
                  if (!withdrawalPending.length) return null
                  return (
                    <div className="mt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-px flex-1 bg-[var(--color-border)]" />
                        <span className="text-[11px] font-bold text-[var(--color-text-muted)] tracking-[0.4px] uppercase">탈퇴 신청 ({withdrawalPending.length}건)</span>
                        <div className="h-px flex-1 bg-[var(--color-border)]" />
                      </div>
                      <div className="flex flex-col gap-2.5">
                        {withdrawalPending.map(m => (
                          <div key={m.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm hover:border-[var(--color-border-strong)] hover:shadow-md transition-all" style={{ padding: '13px' }}>
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-[15px] font-bold text-[var(--color-text-primary)]">{m.profile?.name}</p>
                                <p className="text-[12.5px] text-[var(--color-text-muted)] mt-0.5">
                                  신청일: {m.withdrawal_requested_at
                                    ? new Date(m.withdrawal_requested_at).toLocaleDateString('ko-KR')
                                    : '-'}
                                </p>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={() => approveWithdrawal(m.user_id)}
                                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                                >
                                  승인
                                </button>
                                <button
                                  onClick={() => rejectWithdrawal(m.user_id)}
                                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                                >
                                  거절
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* ── 역할 관리 ── */}
            {tab === 'roles' && (
              <div className="max-w-lg">
                {/* 페이지 헤더 */}
                <header className="mb-5">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 px-3 py-[5px] rounded-full">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                    조직 설정 · 역할 관리
                  </span>
                  <h2 className="mt-3 mb-1.5 text-[clamp(22px,5vw,27px)] font-extrabold tracking-tight text-[var(--color-text-primary)]">역할 관리</h2>
                  <p className="text-[14px] font-medium text-[var(--color-text-muted)] leading-relaxed max-w-[52ch]">
                    조직의 역할을 정의하고 셀 분리·바 표시·순서를 설정합니다.
                  </p>
                  <span className="mt-3.5 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--color-text-secondary)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5" opacity="0.5"/></svg>
                    역할 <b className="text-[var(--color-brand-primary)] font-extrabold">{roles.length}</b>개
                  </span>
                </header>

                {/* 역할 카드 목록 */}
                <div className="flex flex-col gap-2.5 mb-4">
                  {roles.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">등록된 역할이 없습니다.</p>
                  ) : (
                    [...roles].sort((a, b) => a.display_order - b.display_order).map((r, idx, sortedRoles) => (
                      <div key={r.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm hover:border-[var(--color-border-strong)] hover:shadow-md transition-all" style={{ padding: '13px' }}>
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* 역할명 */}
                          <div className="flex-1 min-w-[120px]">
                            {editingRoleId === r.id ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  value={editRoleName}
                                  onChange={e => setEditRoleName(e.target.value)}
                                  onKeyDown={async e => {
                                    if (e.key === 'Enter') {
                                      if (!editRoleName.trim()) return
                                      const err = await updateRole(r.id, { name: editRoleName.trim() })
                                      if (err) msg(err, true)
                                      else setEditingRoleId(null)
                                    }
                                    if (e.key === 'Escape') setEditingRoleId(null)
                                  }}
                                  className={inputCls + ' w-32 text-sm py-1'}
                                  autoFocus
                                />
                                <button type="button"
                                  onClick={async () => {
                                    if (!editRoleName.trim()) return
                                    const err = await updateRole(r.id, { name: editRoleName.trim() })
                                    if (err) msg(err, true)
                                    else setEditingRoleId(null)
                                  }}
                                  className="px-2 py-1 text-xs bg-[var(--color-brand-primary)] text-white rounded-lg hover:bg-[var(--color-brand-primary-hover)]">
                                  저장
                                </button>
                                <button type="button" onClick={() => setEditingRoleId(null)}
                                  className="px-2 py-1 text-xs border border-[var(--color-border-strong)] rounded-lg hover:bg-[var(--color-surface-hover)]">
                                  취소
                                </button>
                              </div>
                            ) : (
                              <button type="button"
                                onClick={() => { setEditingRoleId(r.id); setEditRoleName(r.name) }}
                                className="text-[15px] font-bold text-[var(--color-text-primary)] hover:text-[var(--color-brand-primary)] text-left transition-colors">
                                {r.name}
                              </button>
                            )}
                          </div>
                          {/* 셀분리 토글 */}
                          <button
                            onClick={async () => {
                              const err = await updateRole(r.id, { split_cell: !r.split_cell })
                              if (err) msg(err, true)
                            }}
                            className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors
                              ${r.split_cell
                                ? 'bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/20'
                                : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]'}`}
                          >
                            {r.split_cell ? '분리' : '미분리'}
                          </button>
                          {/* 바표시 토글 */}
                          <button
                            onClick={async () => {
                              const err = await updateRole(r.id, { indicator_bar: !r.indicator_bar })
                              if (err) msg(err, true)
                            }}
                            title="셀 분리 대신 좌측 컬러 바로 표시"
                            className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors
                              ${r.indicator_bar
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]'}`}
                          >
                            {r.indicator_bar ? '바 표시' : '바 없음'}
                          </button>
                          {/* 순서 */}
                          <div className="flex gap-1 items-center ml-auto shrink-0">
                            <button type="button" onClick={() => moveRole(r.id, -1)} disabled={idx === 0}
                              className="w-7 h-7 flex items-center justify-center text-xs border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-hover)] disabled:opacity-30 text-[var(--color-text-muted)]">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                            </button>
                            <button type="button" onClick={() => moveRole(r.id, 1)} disabled={idx === sortedRoles.length - 1}
                              className="w-7 h-7 flex items-center justify-center text-xs border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-hover)] disabled:opacity-30 text-[var(--color-text-muted)]">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
                            </button>
                            <button
                              onClick={async () => {
                                const { count } = await supabase.from('assignments')
                                  .select('*', { count: 'exact', head: true })
                                  .eq('tenant_id', adminTenantId).eq('role_id', r.id)
                                const warningMsg = (count ?? 0) > 0
                                  ? `"${r.name}" 역할을 삭제할까요?\n\n이 역할로 등록된 배정 ${count}건의 역할 정보가 사라집니다. 배정 데이터는 보존됩니다.`
                                  : `"${r.name}" 역할을 삭제할까요?`
                                if (!confirm(warningMsg)) return
                                const err = await deleteRole(r.id)
                                if (err) msg(err, true)
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* 새 항목 구분선 */}
                <div className="flex items-center gap-3 my-6">
                  <div className="h-px flex-1 bg-[var(--color-border)]" />
                  <span className="text-[11px] font-bold text-[var(--color-text-muted)] tracking-[0.4px] uppercase">새 역할</span>
                  <div className="h-px flex-1 bg-[var(--color-border)]" />
                </div>

                {/* 역할 추가 폼 (점선 카드) */}
                <form onSubmit={handleAddRole}
                  className="border-[1.5px] border-dashed border-[var(--color-border-strong)] rounded-[18px] bg-[var(--color-surface-secondary)]"
                  style={{ padding: '13px' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-9 h-9 rounded-[11px] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] flex items-center justify-center shrink-0">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                    </span>
                    <div>
                      <p className="m-0 text-[15px] font-extrabold tracking-tight text-[var(--color-text-primary)]">역할 추가</p>
                      <p className="m-0 mt-0.5 text-[12.5px] font-medium text-[var(--color-text-muted)]">새로운 역할을 정의합니다</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">역할명</label>
                      <input type="text" value={newRoleName} onChange={e => setNewRoleName(e.target.value)}
                        placeholder="예: 팀장" maxLength={30} className={inputCls + ' w-full mt-1'} required />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={newRoleSplitCell} onChange={e => setNewRoleSplitCell(e.target.checked)}
                        className="rounded border-[var(--color-border-strong)] accent-[var(--color-brand-primary)]" />
                      <span className="text-sm text-[var(--color-text-secondary)]">셀 분리 (역할별 별도 컬럼)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={newRoleIndicatorBar} onChange={e => setNewRoleIndicatorBar(e.target.checked)}
                        className="rounded border-[var(--color-border-strong)] accent-[var(--color-brand-primary)]" />
                      <span className="text-sm text-[var(--color-text-secondary)]">바 표시 (좌측 컬러 바로 표시)</span>
                    </label>
                    <button type="submit" className="px-4 py-1.5 bg-[var(--color-brand-primary)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--color-brand-primary-hover)]">추가</button>
                  </div>
                </form>
              </div>
            )}

            {/* ── 스케줄 규칙 ── */}
            {tab === 'rules' && (
              <div>
                {/* 페이지 헤더 */}
                <header className="mb-5">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 px-3 py-[5px] rounded-full">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01"/></svg>
                    조직 설정 · 스케줄 규칙
                  </span>
                  <h2 className="mt-3 mb-1.5 text-[clamp(22px,5vw,27px)] font-extrabold tracking-tight text-[var(--color-text-primary)]">스케줄 규칙</h2>
                  <p className="text-[14px] font-medium text-[var(--color-text-muted)] leading-relaxed max-w-[52ch]">
                    요일별·시간대별 운영 여부를 설정합니다. 버튼 클릭 시 즉시 저장됩니다.
                  </p>
                </header>

                {/* Missing rules banner */}
                {adminTimeSlots.some(slot => !scheduleRules.some(r => r.time_slot === slot)) && (
                  <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">일부 슬롯에 규칙이 없습니다. 규칙을 생성해 주세요.</span>
                    </div>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={async () => {
                        setSaving(true)
                        const err = await upsertScheduleRulesForSlots(adminTimeSlots)
                        setSaving(false)
                        if (err) msg(err, true)
                        else msg('규칙이 생성됐습니다.')
                      }}
                      className="shrink-0 px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                    >
                      {saving ? '생성 중...' : '전체 규칙 생성'}
                    </button>
                  </div>
                )}

                <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-sm overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)]">시간</th>
                        {DAY_LABELS.map(d => (
                          <th key={d} className="px-3 py-3 text-xs font-semibold text-[var(--color-text-muted)] text-center">{d}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {adminTimeSlots.map(slot => (
                        <tr key={slot}>
                          <td className="px-4 py-2.5 font-medium text-[var(--color-text-secondary)] whitespace-nowrap">{parseSlotLabel(slot)}</td>
                          {DAY_LABELS.map((_, dayIdx) => {
                            const rule = getRule(dayIdx, slot)
                            return (
                              <td key={dayIdx} className="px-3 py-2.5 text-center">
                                {rule ? (
                                  <button onClick={async () => {
                                    const err = await toggleScheduleRule(rule.id, rule.is_open)
                                    if (err) msg(err, true)
                                  }}
                                    className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-colors ${rule.is_open ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]'}`}>
                                    {rule.is_open ? '운영' : '미운영'}
                                  </button>
                                ) : <span className="text-[var(--color-border-strong)]">-</span>}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── 날짜 설정 ── */}
            {tab === 'dates' && (
              <div className="max-w-lg space-y-6">
                {/* 페이지 헤더 */}
                <header className="mb-5">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 px-3 py-[5px] rounded-full">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><circle cx="9" cy="16" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="16" r="1" fill="currentColor" stroke="none"/></svg>
                    조직 설정 · 날짜 설정
                  </span>
                  <h2 className="mt-3 mb-1.5 text-[clamp(22px,5vw,27px)] font-extrabold tracking-tight text-[var(--color-text-primary)]">날짜 설정</h2>
                  <p className="text-[14px] font-medium text-[var(--color-text-muted)] leading-relaxed max-w-[52ch]">
                    휴관일·특별 운영일 등 특정 날짜에 대한 예외 설정을 관리합니다.
                  </p>
                  <span className="mt-3.5 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--color-text-secondary)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5" opacity="0.5"/></svg>
                    설정 <b className="text-[var(--color-brand-primary)] font-extrabold">{dateOverrides.length}</b>건
                  </span>
                </header>

                {/* 날짜 추가 폼 (점선 카드) */}
                <form onSubmit={handleDateSubmit}
                  className="border-[1.5px] border-dashed border-[var(--color-border-strong)] rounded-[18px] bg-[var(--color-surface-secondary)]"
                  style={{ padding: '13px' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-9 h-9 rounded-[11px] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] flex items-center justify-center shrink-0">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                    </span>
                    <div>
                      <p className="m-0 text-[15px] font-extrabold tracking-tight text-[var(--color-text-primary)]">날짜 추가</p>
                      <p className="m-0 mt-0.5 text-[12.5px] font-medium text-[var(--color-text-muted)]">휴관일 또는 특별 운영일을 등록합니다</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div>
                      <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">날짜</label>
                      <input type="date" value={dateForm.date} onChange={e => setDateForm(f => ({ ...f, date: e.target.value }))} required className={inputCls + ' block mt-1'} />
                    </div>
                    <div>
                      <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">유형</label>
                      <select value={dateForm.type} onChange={e => setDateForm(f => ({ ...f, type: e.target.value as 'holiday' | 'special' }))} className={inputCls + ' block mt-1'}>
                        <option value="holiday">휴관일</option>
                        <option value="special">특별 운영일</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">레이블 (선택)</label>
                      <input type="text" value={dateForm.label} onChange={e => setDateForm(f => ({ ...f, label: e.target.value }))} placeholder="예: 추석연휴" maxLength={100} className={inputCls + ' block mt-1 w-36'} />
                    </div>
                    <button type="submit" disabled={saving} className="px-4 py-1.5 bg-[var(--color-brand-primary)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--color-brand-primary-hover)] disabled:opacity-50">
                      {saving ? '저장 중...' : '추가'}
                    </button>
                  </div>
                </form>

                {/* 날짜 목록 */}
                {dateOverrides.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-muted)]">설정된 날짜가 없습니다.</p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {dateOverrides.map(d => (
                      <div key={d.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm hover:border-[var(--color-border-strong)] hover:shadow-md transition-all" style={{ padding: '13px' }}>
                        <div className="flex items-center gap-3">
                          <span className={`shrink-0 inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${d.is_holiday ? 'bg-red-100 text-red-700' : 'bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]'}`}>
                            {d.is_holiday ? '휴관일' : '특별운영'}
                          </span>
                          <span className="text-[15px] font-bold text-[var(--color-text-primary)]">{d.date}</span>
                          {d.label && <span className="text-[13px] text-[var(--color-text-muted)] flex-1 truncate">{d.label}</span>}
                          <button onClick={async () => { const err = await deleteDateOverride(d.id); if (err) msg(err, true) }}
                            className="ml-auto shrink-0 px-2.5 py-1 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── 조직 설정 ── */}
            {tab === 'settings' && (
              <form onSubmit={handleSettingsSave} className="max-w-lg space-y-6">
                {/* 페이지 헤더 */}
                <header className="mb-5">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 px-3 py-[5px] rounded-full">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
                    조직 설정 · 기본 설정
                  </span>
                  <h2 className="mt-3 mb-1.5 text-[clamp(22px,5vw,27px)] font-extrabold tracking-tight text-[var(--color-text-primary)]">조직 설정</h2>
                  <p className="text-[14px] font-medium text-[var(--color-text-muted)] leading-relaxed max-w-[52ch]">
                    조직 이름·타이틀·테마 색상·타임슬롯·역할 비율을 설정합니다.
                  </p>
                </header>

                <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-sm p-5 space-y-4">
                  <p className="text-[12px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">기본 정보</p>
                  <div>
                    <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">조직명</label>
                    <input type="text" value={settingsName} onChange={e => setSettingsName(e.target.value)} maxLength={50} className={inputCls + ' w-full mt-1'} />
                  </div>
                  <div>
                    <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">페이지 타이틀</label>
                    <input type="text" value={settingsTitle} onChange={e => setSettingsTitle(e.target.value)} maxLength={50} className={inputCls + ' w-full mt-1'} />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setColorOpen(!colorOpen)}
                      className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: colorOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
                        <path d="M4 2l4 4-4 4" />
                      </svg>
                      <span>테마 색상 (선택)</span>
                      {settingsPreset
                        ? <span className="text-xs font-medium" style={{ color: THEME_PRESET_LIST.find(p => p.key === settingsPreset)?.preset.light.accent }}>{THEME_PRESET_LIST.find(p => p.key === settingsPreset)?.label}</span>
                        : settingsTheme && <span className="w-4 h-4 rounded-sm border border-[var(--color-border-strong)] inline-block" style={{ background: settingsTheme }} />
                      }
                    </button>
                    {colorOpen && (
                      <div className="mt-2 space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {THEME_PRESET_LIST.map(({ key, label, preset }) => {
                            const on = settingsPreset === key
                            return (
                              <button
                                key={key}
                                type="button"
                                title={label}
                                onClick={() => {
                                  const next = on ? '' : key
                                  setSettingsPreset(next)
                                  setSettingsTheme(next ? preset.light.accent : '')
                                  applyThemePreset(next || null)
                                }}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 transition-transform hover:scale-[1.03] flex-shrink-0"
                                style={{ borderColor: on ? preset.light.accent : 'var(--color-border-strong)', background: on ? preset.light.accentSoft : 'var(--color-surface)' }}
                              >
                                <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: preset.light.accent }} />
                                <span className="text-xs font-medium" style={{ color: on ? preset.light.accentText : 'var(--color-text-secondary)' }}>{label}</span>
                              </button>
                            )
                          })}
                        </div>
                        <div className="flex items-center gap-2">
                          {settingsTheme && <span className="w-6 h-6 rounded-md border border-[var(--color-border-strong)] flex-shrink-0" style={{ background: settingsTheme }} />}
                          <input
                            type="text"
                            placeholder="직접 입력 (#2563eb)"
                            maxLength={7}
                            value={settingsTheme}
                            onChange={e => { setSettingsTheme(e.target.value); setSettingsPreset('') }}
                            className={inputCls + ' text-xs py-1.5 font-mono w-full'}
                          />
                          {(settingsTheme || settingsPreset) && (
                            <button type="button" onClick={() => { setSettingsTheme(''); setSettingsPreset(''); applyThemePreset(null) }} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] flex-shrink-0">
                              초기화
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-sm p-5 space-y-4">
                  <p className="text-[12px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">타임슬롯</p>

                  {/* Templates */}
                  <div>
                    <p className="text-[12px] font-bold text-[var(--color-text-secondary)] mb-2">템플릿 적용</p>
                    <div className="flex gap-2 flex-wrap">
                      {SLOT_TEMPLATES.map(t => (
                        <button key={t.label} type="button"
                          onClick={() => setSlotList(t.slots)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] hover:bg-[var(--color-surface-hover)] transition-colors">
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual add */}
                  <div>
                    <p className="text-[12px] font-bold text-[var(--color-text-secondary)] mb-2">직접 추가</p>
                    <div className="flex items-end gap-2 flex-wrap">
                      <div>
                        <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">시작</label>
                        <select value={slotStart} onChange={e => setSlotStart(Number(e.target.value))} className={inputCls + ' block mt-1'}>
                          {START_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">종료</label>
                        <select value={slotEnd} onChange={e => setSlotEnd(Number(e.target.value))} className={inputCls + ' block mt-1'}>
                          {END_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <button type="button" onClick={handleAddSlot}
                        className="px-3 py-px text-xs font-semibold border border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] rounded-lg hover:bg-[var(--color-surface-hover)]">
                        + 추가
                      </button>
                    </div>
                  </div>

                  {slotList.length === 0 ? (
                    <p className="text-xs text-[var(--color-text-muted)]">등록된 슬롯이 없습니다.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {slotList.map(slot => (
                        <li key={slot} className="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-2 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)]">
                          <span className="text-sm font-semibold text-[var(--color-text-secondary)] whitespace-nowrap shrink-0">{parseSlotLabel(slot)}</span>
                          <input
                            type="text"
                            placeholder="레이블 (예: 점심시간)"
                            value={slotLabels[slot] ?? ''}
                            onChange={e => setSlotLabels(prev => {
                              const next = { ...prev }
                              if (e.target.value) next[slot] = e.target.value
                              else delete next[slot]
                              return next
                            })}
                            className="min-w-0 text-sm border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-primary)] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)]/30 focus:border-[var(--color-brand-primary)]"
                          />
                          <button type="button" onClick={() => {
                            setSlotList(prev => prev.filter(s => s !== slot))
                            setSlotLabels(prev => { const n = { ...prev }; delete n[slot]; return n })
                          }} className="text-xs font-semibold text-red-500 hover:text-red-700 shrink-0">삭제</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {roles.length > 0 && (
                  <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-sm p-5">
                    <p className="text-[12px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                      자동배정 역할 비율 (합계 100%)
                    </p>
                    <div className="space-y-2">
                      {roles.map(role => (
                        <div key={role.id} className="flex items-center gap-3">
                          <span className="text-sm font-medium text-[var(--color-text-secondary)] w-32 shrink-0">{role.name}</span>
                          <input
                            type="number" min={0} max={100}
                            value={roleRatios[role.id] ?? 0}
                            onChange={e => setRoleRatios(prev => ({ ...prev, [role.id]: parseInt(e.target.value, 10) || 0 }))}
                            className="w-16 border border-[var(--color-border-strong)] rounded-lg px-2 py-1 text-sm text-center bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none"
                          />
                          <span className="text-xs text-[var(--color-text-muted)]">%</span>
                        </div>
                      ))}
                      <p className="text-xs text-[var(--color-text-muted)]">
                        합계: {Object.values(roleRatios).reduce((s, v) => s + v, 0)}%
                        {Object.keys(roleRatios).length > 0 && Object.values(roleRatios).reduce((s, v) => s + v, 0) !== 100
                          ? <span className="text-red-500 ml-1">(100%이 아닙니다)</span>
                          : null}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRatioSave}
                      disabled={ratioSaving}
                      className="mt-3 px-4 py-2 text-sm font-semibold rounded-xl bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-hover)] disabled:opacity-50"
                    >
                      {ratioSaving ? '저장 중...' : '비율 저장'}
                    </button>
                  </div>
                )}

                <button type="submit" disabled={saving}
                  className="px-5 py-2 bg-[var(--color-brand-primary)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--color-brand-primary-hover)] disabled:opacity-50">
                  {saving ? '저장 중...' : '저장'}
                </button>
              </form>
            )}

            {/* ── 범례 관리 ── */}
            {tab === 'legend' && (
              <div className="max-w-lg space-y-4">
                {/* 페이지 헤더 */}
                <header className="mb-5">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 px-3 py-[5px] rounded-full">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                    조직 설정 · 범례 관리
                  </span>
                  <h2 className="mt-3 mb-1.5 text-[clamp(22px,5vw,27px)] font-extrabold tracking-tight text-[var(--color-text-primary)]">범례 관리</h2>
                  <p className="text-[14px] font-medium text-[var(--color-text-muted)] leading-relaxed max-w-[52ch]">
                    스케줄 화면에 표시될 범례 항목을 관리합니다. 추가·삭제 즉시 저장됩니다.
                  </p>
                  <span className="mt-3.5 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--color-text-secondary)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5" opacity="0.5"/></svg>
                    범례 <b className="text-[var(--color-brand-primary)] font-extrabold">{legendItems.length}</b>개
                  </span>
                </header>

                {legendItems.length === 0 && (
                  <p className="text-[13px] text-[var(--color-text-muted)]">항목이 없으면 기본 범례가 표시됩니다.</p>
                )}

                {/* 범례 카드 목록 */}
                <div className="flex flex-col gap-2.5">
                  {legendItems.map((item, idx) => {
                    const isEditing = editingLegendId === item.id
                    const s = LEGEND_COLOR_STYLES[isEditing ? editLegendColor : item.color]
                    return (
                      <div key={item.id} className={`bg-[var(--color-surface)] border rounded-2xl shadow-sm hover:shadow-md transition-all ${s.border}`} style={{ padding: '13px' }}>
                        {isEditing ? (
                          <div className="flex gap-2 flex-wrap items-end">
                            <LegendIconPicker value={editLegendIcon} onChange={setEditLegendIcon} />
                            <input
                              type="text"
                              value={editLegendLabel}
                              onChange={e => setEditLegendLabel(e.target.value)}
                              maxLength={50}
                              className={inputCls + ' flex-1 min-w-32'}
                            />
                            <select
                              value={editLegendColor}
                              onChange={e => setEditLegendColor(e.target.value as LegendColor)}
                              className={inputCls}
                            >
                              <option value="amber">주황</option>
                              <option value="pink">분홍</option>
                              <option value="yellow">노랑</option>
                              <option value="blue">파랑</option>
                              <option value="green">초록</option>
                              <option value="purple">보라</option>
                              <option value="red">빨강</option>
                              <option value="slate">회색</option>
                              <option value="indigo">남색</option>
                              <option value="black">검정</option>
                            </select>
                            <button type="button" onClick={saveLegendEdit}
                              disabled={!editLegendLabel.trim()}
                              className="px-3 py-1.5 text-xs font-semibold bg-[var(--color-brand-primary)] text-white rounded-lg hover:bg-[var(--color-brand-primary-hover)] disabled:opacity-40 shrink-0">
                              저장
                            </button>
                            <button type="button" onClick={() => setEditingLegendId(null)}
                              className="px-3 py-1.5 text-xs font-semibold border border-[var(--color-border-strong)] rounded-lg hover:bg-[var(--color-surface-hover)] shrink-0">
                              취소
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <span className={`text-sm font-bold select-none ${s.icon}`}>{item.icon}</span>
                            <span className="text-[13.5px] font-semibold text-[var(--color-text-secondary)] flex-1">{item.label}</span>
                            <div className="flex gap-1 shrink-0">
                              <button type="button" onClick={() => moveLegendItem(item.id, -1)} disabled={idx === 0}
                                className="w-7 h-7 flex items-center justify-center border border-[var(--color-border-strong)] rounded-lg hover:bg-[var(--color-surface-hover)] disabled:opacity-30 text-[var(--color-text-muted)]">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                              </button>
                              <button type="button" onClick={() => moveLegendItem(item.id, 1)} disabled={idx === legendItems.length - 1}
                                className="w-7 h-7 flex items-center justify-center border border-[var(--color-border-strong)] rounded-lg hover:bg-[var(--color-surface-hover)] disabled:opacity-30 text-[var(--color-text-muted)]">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
                              </button>
                            </div>
                            <button type="button" onClick={() => startEditLegend(item)}
                              className="px-2.5 py-1 text-xs font-semibold border border-[var(--color-border-strong)] rounded-lg hover:bg-[var(--color-surface-hover)] shrink-0">
                              수정
                            </button>
                            <button type="button" onClick={() => removeLegendItem(item.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 shrink-0">
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* 새 항목 구분선 */}
                <div className="flex items-center gap-3 my-6">
                  <div className="h-px flex-1 bg-[var(--color-border)]" />
                  <span className="text-[11px] font-bold text-[var(--color-text-muted)] tracking-[0.4px] uppercase">새 항목</span>
                  <div className="h-px flex-1 bg-[var(--color-border)]" />
                </div>

                {/* 새 항목 추가 폼 (점선 카드) */}
                <div className="border-[1.5px] border-dashed border-[var(--color-border-strong)] rounded-[18px] bg-[var(--color-surface-secondary)]" style={{ padding: '13px' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-9 h-9 rounded-[11px] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] flex items-center justify-center shrink-0">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                    </span>
                    <div>
                      <p className="m-0 text-[15px] font-extrabold tracking-tight text-[var(--color-text-primary)]">새 항목 추가</p>
                      <p className="m-0 mt-0.5 text-[12.5px] font-medium text-[var(--color-text-muted)]">아이콘·색상을 선택하고 레이블을 입력하세요</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap items-end">
                    <div>
                      <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">아이콘</label>
                      <div className="mt-1">
                        <LegendIconPicker value={newLegendIcon} onChange={setNewLegendIcon} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-40">
                      <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">레이블</label>
                      <input
                        type="text"
                        value={newLegendLabel}
                        onChange={e => setNewLegendLabel(e.target.value)}
                        placeholder="점심시간 (10~18시)"
                        maxLength={50}
                        className={inputCls + ' block mt-1 w-full'}
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">색상</label>
                      <select
                        value={newLegendColor}
                        onChange={e => setNewLegendColor(e.target.value as LegendColor)}
                        className={inputCls + ' block mt-1'}
                      >
                        <option value="amber">주황</option>
                        <option value="pink">분홍</option>
                        <option value="yellow">노랑</option>
                        <option value="blue">파랑</option>
                        <option value="green">초록</option>
                        <option value="purple">보라</option>
                        <option value="red">빨강</option>
                        <option value="slate">회색</option>
                        <option value="indigo">남색</option>
                        <option value="black">검정</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={addLegendItem}
                      disabled={!newLegendLabel.trim()}
                      className="inline-flex items-center gap-1.5 h-[34px] px-4 bg-[var(--color-brand-primary)] text-white text-sm font-bold rounded-lg hover:bg-[var(--color-brand-primary-hover)] disabled:opacity-40 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                      {t('add')}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* ── 커스텀 필드 관리 ── */}
            {tab === 'custom_fields' && (
              <div className="max-w-[680px]">

                {/* 페이지 헤더 */}
                <header className="mb-5">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 px-3 py-[5px] rounded-full">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
                    {ta('settings.orgName')} · {ta('tabs.customFields')}
                  </span>
                  <h2 className="mt-3 mb-1.5 text-[clamp(22px,5vw,27px)] font-extrabold tracking-tight text-[var(--color-text-primary)]">{ta('customField.title')}</h2>
                  <p className="text-[14px] font-medium text-[var(--color-text-muted)] leading-relaxed max-w-[52ch]">
                    {adminIsFreeform
                      ? ta('customField.title')
                      : ta('customField.title')}
                  </p>
                  <span className="mt-3.5 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--color-text-secondary)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5" opacity="0.5"/></svg>
                    {ta('customField.totalFields', { count: customFields.length })} · {ta('customField.requiredFields', { count: customFields.filter(f => f.required).length })}
                  </span>
                </header>

                {/* 필드 카드 목록 */}
                <div className="flex flex-col gap-2.5">
                  {customFields.map((field, idx) => {
                    const isEd = editingFieldId === field.id
                    const td = FIELD_TYPE_DEFS.find(t => t.value === field.type)
                    return (
                      <div
                        key={field.id}
                        className={`bg-[var(--color-surface)] border rounded-2xl transition-all duration-[140ms] ${isEd ? 'border-[var(--color-brand-primary)] ring-2 ring-[var(--color-brand-primary)]/20 shadow-md cursor-default' : 'border-[var(--color-border)] shadow-sm hover:border-[var(--color-border-strong)] hover:shadow-md cursor-pointer'}`}
                        style={{ padding: '13px' }}
                        onClick={() => {
                          if (!isEd) {
                            setEditingFieldId(field.id)
                            setEditField({ label: field.label, type: field.type, required: field.required, options: field.options ?? [], placeholder: field.placeholder ?? '', show_in_dashboard: field.show_in_dashboard ?? false, min: field.min, max: field.max })
                          }
                        }}
                      >
                        {/* 읽기 상태 */}
                        {!isEd && (
                          <>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 rounded-full text-[11.5px] font-bold px-2.5 py-1 shrink-0 ${td?.badgeCls ?? 'bg-slate-100 text-slate-600'}`}>
                                <CfTypeIcon type={field.type} size={12} />
                                {tad(`customField.types.${field.type}`) || field.type}
                              </span>
                              {idx === 0 && adminIsFreeform && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] font-semibold shrink-0">{t('name')}</span>
                              )}
                              <span className="text-[15px] font-bold text-[var(--color-text-primary)] tracking-tight break-words flex-1 min-w-0">{field.label}</span>
                              {field.required && <span className="shrink-0 text-[11px] font-bold px-2.5 py-[3px] rounded-full text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10">{t('required')}</span>}
                              {field.show_in_dashboard && (
                                <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-[3px] rounded-full text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="5" rx="0.6"/><rect x="12" y="8" width="3" height="9" rx="0.6"/><rect x="17" y="5" width="3" height="12" rx="0.6"/></svg>
                                  {ta('customField.dashboard')}
                                </span>
                              )}
                              <div className="flex items-center gap-0.5 shrink-0 ml-0.5" onClick={e => e.stopPropagation()}>
                                <button type="button" title="위로" disabled={idx === 0} onClick={() => moveField(field.id, -1)}
                                  className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-30 transition-colors">
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                                </button>
                                <button type="button" title="아래로" disabled={idx === customFields.length - 1} onClick={() => moveField(field.id, 1)}
                                  className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-30 transition-colors">
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
                                </button>
                                <span className="w-px h-[18px] bg-[var(--color-border)] mx-1" />
                                <button type="button" title="수정"
                                  onClick={() => { setEditingFieldId(field.id); setEditField({ label: field.label, type: field.type, required: field.required, options: field.options ?? [], placeholder: field.placeholder ?? '', show_in_dashboard: field.show_in_dashboard ?? false, min: field.min, max: field.max }) }}
                                  className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                </button>
                                <button type="button" title="삭제"
                                  onClick={async e => { e.stopPropagation(); if (!confirm(`"${field.label}" 필드를 삭제할까요?`)) return; await removeCustomField(field.id) }}
                                  className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-orange-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors">
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                                </button>
                              </div>
                            </div>
                            <FieldPreview field={field} />
                          </>
                        )}

                        {/* 편집 상태 */}
                        {isEd && (
                          <div className="flex flex-col gap-[10px]" onClick={e => e.stopPropagation()}>
                            <div className="flex flex-col gap-[7px]">
                              <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">필드명</label>
                              <AutoResizeTextarea minH={34} value={editField.label} placeholder="필드명" rows={1}
                                onChange={e => setEditField(f => ({ ...f, label: e.target.value }))}
                                className={inputCls + ' w-full min-h-[34px] resize-none overflow-hidden leading-snug'} />
                            </div>
                            <div className="flex gap-2.5 items-end flex-wrap">
                              <div className="flex flex-col gap-[7px] flex-1 min-w-[120px]">
                                <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">타입</label>
                                <div className="relative">
                                  <select value={editField.type}
                                    onChange={e => setEditField(f => ({ ...f, type: e.target.value as CustomFieldType }))}
                                    className={inputCls + ' w-full pr-8 appearance-none'}>
                                    {FIELD_TYPE_DEFS.map(td => <option key={td.value} value={td.value}>{tad(`customField.types.${td.value}`)}</option>)}
                                  </select>
                                  <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                </div>
                              </div>
                              {editField.type !== 'checkbox' && (
                                <button type="button"
                                  onClick={() => setEditField(f => ({ ...f, required: !f.required }))}
                                  className={`inline-flex items-center gap-2 h-[34px] px-[13px] pl-[10px] border rounded-lg text-[13px] font-semibold whitespace-nowrap shrink-0 transition-all ${editField.required ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]' : 'border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'}`}>
                                  <span className={`w-[17px] h-[17px] rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0 transition-all ${editField.required ? 'bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)]' : 'border-[var(--color-border-strong)]'}`}>
                                    {editField.required && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
                                  </span>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/></svg>
                                  필수
                                </button>
                              )}
                            </div>
                            {FIELD_TYPES_WITH_OPTIONS.includes(editField.type) && (
                              <div className="flex flex-col gap-[7px]">
                                <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">선택지 <span className="font-semibold text-[var(--color-text-muted)] ml-1">유형 · 표시명 · 저장값</span></label>
                                <div className="flex flex-col gap-2">
                                  {(editField.options ?? []).map((opt, oi) => {
                                    const unit = getOptionUnit(opt.value_type)
                                    return (
                                      <div key={oi} className="flex items-center gap-2 p-[7px] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-[10px] flex-wrap sm:flex-nowrap">
                                        <span className="text-[var(--color-text-muted)] shrink-0 opacity-50"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="15" cy="18" r="1.4"/></svg></span>
                                        <div className="relative w-[84px] shrink-0">
                                          <select value={opt.value_type ?? 'none'}
                                            onChange={e => setEditField(f => ({ ...f, options: (f.options ?? []).map((o, i) => i === oi ? { ...o, value_type: e.target.value as OptionValueType } : o) }))}
                                            className="w-full h-[34px] px-[10px] pr-[26px] bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-strong)] rounded-lg text-[12.5px] font-bold outline-none appearance-none cursor-pointer focus:border-[var(--color-brand-primary)]">
                                            {OPTION_VALUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                          </select>
                                          <svg className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                        </div>
                                        <input type="text" value={opt.name} placeholder="표시명"
                                          onChange={e => setEditField(f => ({ ...f, options: (f.options ?? []).map((o, i) => i === oi ? { ...o, name: e.target.value } : o) }))}
                                          className="flex-[1_1_38%] h-[34px] min-w-0 px-3 bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-strong)] rounded-lg text-sm font-medium outline-none focus:border-[var(--color-brand-primary)] placeholder:text-[var(--color-text-muted)]" />
                                        <div className="flex-[1_1_38%] flex items-center gap-1.5 min-w-0">
                                          <input type="text" value={opt.value} placeholder="저장값"
                                            onChange={e => setEditField(f => ({ ...f, options: (f.options ?? []).map((o, i) => i === oi ? { ...o, value: e.target.value } : o) }))}
                                            className="flex-1 min-w-0 h-[34px] px-3 bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-strong)] rounded-lg text-sm font-medium outline-none focus:border-[var(--color-brand-primary)] placeholder:text-[var(--color-text-muted)]" />
                                          {unit && <span className="text-[12.5px] font-bold text-[var(--color-text-muted)] shrink-0">{unit}</span>}
                                        </div>
                                        <button type="button"
                                          onClick={() => setEditField(f => ({ ...f, options: (f.options ?? []).filter((_, i) => i !== oi) }))}
                                          className="w-[28px] h-[28px] shrink-0 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-orange-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors">
                                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                                        </button>
                                      </div>
                                    )
                                  })}
                                  <button type="button"
                                    onClick={() => setEditField(f => ({ ...f, options: [...(f.options ?? []), { name: '', value: '', value_type: 'none' }] }))}
                                    className="flex items-center justify-center gap-1.5 h-[38px] border border-dashed border-[var(--color-border-strong)] rounded-[10px] text-[var(--color-text-muted)] text-[13px] font-bold transition-all hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/5">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                                    옵션 추가
                                  </button>
                                </div>
                              </div>
                            )}
                            {editField.type === 'number' && (
                              <div className="flex gap-2">
                                <div className="flex-1 flex flex-col gap-[7px]">
                                  <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">최솟값</label>
                                  <input type="number" value={editField.min ?? ''} placeholder="없음"
                                    onChange={e => setEditField(f => ({ ...f, min: e.target.value !== '' ? Number(e.target.value) : undefined }))}
                                    className={inputCls + ' w-full'} />
                                </div>
                                <div className="flex-1 flex flex-col gap-[7px]">
                                  <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">최댓값</label>
                                  <input type="number" value={editField.max ?? ''} placeholder="없음"
                                    onChange={e => setEditField(f => ({ ...f, max: e.target.value !== '' ? Number(e.target.value) : undefined }))}
                                    className={inputCls + ' w-full'} />
                                </div>
                              </div>
                            )}
                            {['text', 'number', 'select', 'phone', 'account_number'].includes(editField.type) && (
                              <div className="flex flex-col gap-[7px]">
                                <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">플레이스홀더 <span className="font-semibold text-[var(--color-text-muted)] ml-1">선택</span></label>
                                <input type="text" value={editField.placeholder ?? ''} placeholder="입력 안내 문구"
                                  onChange={e => setEditField(f => ({ ...f, placeholder: e.target.value }))}
                                  className={inputCls + ' w-full'} />
                              </div>
                            )}
                            {FIELD_TYPES_WITH_DASHBOARD.includes(editField.type) && (
                              <button type="button"
                                onClick={() => setEditField(f => ({ ...f, show_in_dashboard: !f.show_in_dashboard }))}
                                className={`self-start inline-flex items-center gap-2 h-[34px] px-[13px] pl-[10px] border rounded-lg text-[13px] font-semibold whitespace-nowrap transition-all ${editField.show_in_dashboard ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]' : 'border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'}`}>
                                <span className={`w-[17px] h-[17px] rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0 transition-all ${editField.show_in_dashboard ? 'bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)]' : 'border-[var(--color-border-strong)]'}`}>
                                  {editField.show_in_dashboard && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
                                </span>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="5" rx="0.6"/><rect x="12" y="8" width="3" height="9" rx="0.6"/><rect x="17" y="5" width="3" height="12" rx="0.6"/></svg>
                                {ta('customField.dashboard')}
                              </button>
                            )}
                            <div className="flex gap-2 pt-1">
                              <button type="button" onClick={saveFieldEdit}
                                className="inline-flex items-center justify-center h-[34px] px-4 bg-[var(--color-brand-primary)] text-white rounded-lg text-[13.5px] font-bold hover:bg-[var(--color-brand-primary-hover)] transition-colors">
                                {t('save')}
                              </button>
                              <button type="button" onClick={() => setEditingFieldId(null)}
                                className="inline-flex items-center justify-center h-[34px] px-4 bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border-strong)] rounded-lg text-[13.5px] font-bold hover:bg-[var(--color-surface-secondary)] transition-colors">
                                {t('cancel')}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* 자주 쓰는 항목 템플릿 */}
                <div className="mt-4">
                  <p className="text-[12px] font-bold text-[var(--color-text-secondary)] mb-2">{ta('customField.frequentItems')}</p>
                  <div className="flex gap-2 flex-wrap">
                    {CUSTOM_FIELD_TEMPLATES.map(tpl => {
                      const added = customFields.some(f => f.label.trim() === tpl.field.label)
                      return (
                        <button key={tpl.label} type="button"
                          onClick={() => addFieldFromTemplate(tpl.field)}
                          disabled={added}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${added ? 'border-[var(--color-border)] text-[var(--color-text-muted)] opacity-50 cursor-not-allowed' : 'border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/5'}`}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                          {added ? `${tpl.label} 추가됨` : tpl.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 새 항목 구분선 */}
                <div className="flex items-center gap-3 mt-6">
                  <div className="h-px flex-1 bg-[var(--color-border)]" />
                  <span className="text-[11px] font-bold text-[var(--color-text-muted)] tracking-[0.4px] uppercase">{ta('customField.addField')}</span>
                  <div className="h-px flex-1 bg-[var(--color-border)]" />
                </div>

                {/* 새 필드 추가 폼 (점선 카드) */}
                <form onSubmit={addCustomField}
                  className="mt-[22px] border-[1.5px] border-dashed border-[var(--color-border-strong)] rounded-[18px] bg-[var(--color-surface-secondary)] flex flex-col gap-[10px]"
                  style={{ padding: '13px' }}>
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-[11px] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] flex items-center justify-center shrink-0">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                    </span>
                    <div>
                      <p className="m-0 text-[15px] font-extrabold tracking-tight text-[var(--color-text-primary)]">{ta('customField.addField')}</p>
                      <p className="m-0 mt-0.5 text-[12.5px] font-medium text-[var(--color-text-muted)]">{ta('customField.preview')}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2.5 items-end">
                    <div className="flex-1 min-w-[180px] flex flex-col gap-[7px]">
                      <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">{ta('customField.fieldName')} <span className="text-[var(--color-brand-primary)]">*</span></label>
                      <AutoResizeTextarea minH={34} required value={newFieldLabel} maxLength={50} rows={1}
                        onChange={e => setNewFieldLabel(e.target.value)}
                        placeholder={ta('customField.fieldName')}
                        className={inputCls + ' w-full min-h-[34px] resize-none overflow-hidden leading-snug'} />
                    </div>
                    <div className="flex-[0_0_132px] flex flex-col gap-[7px]">
                      <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">{ta('customField.fieldType')}</label>
                      <div className="relative">
                        <select value={newFieldType}
                          onChange={e => { setNewFieldType(e.target.value as CustomFieldType); setNewFieldOptions([]); setNewFieldShowInDashboard(false) }}
                          className={inputCls + ' w-full pr-8 appearance-none font-semibold'}>
                          {FIELD_TYPE_DEFS.map(td => <option key={td.value} value={td.value}>{tad(`customField.types.${td.value}`)}</option>)}
                        </select>
                        <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>
                    {newFieldType !== 'checkbox' && (
                      <button type="button"
                        onClick={() => setNewFieldRequired(v => !v)}
                        className={`inline-flex items-center gap-2 h-[34px] px-[13px] pl-[10px] border rounded-lg text-[13px] font-semibold whitespace-nowrap shrink-0 transition-all ${newFieldRequired ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]' : 'border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'}`}>
                        <span className={`w-[17px] h-[17px] rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0 transition-all ${newFieldRequired ? 'bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)]' : 'border-[var(--color-border-strong)]'}`}>
                          {newFieldRequired && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
                        </span>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/></svg>
                        {t('required')}
                      </button>
                    )}
                    <button type="submit" disabled={!newFieldLabel.trim()}
                      className="inline-flex items-center gap-1.5 h-[34px] px-4 bg-[var(--color-brand-primary)] text-white rounded-lg text-[13.5px] font-bold hover:bg-[var(--color-brand-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                      {t('add')}
                    </button>
                  </div>
                  {newFieldType === 'number' && (
                    <div className="flex gap-2 pt-2 border-t border-[var(--color-border)]">
                      <div className="flex-1 flex flex-col gap-[7px]">
                        <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">최솟값 <span className="font-semibold text-[var(--color-text-muted)]">선택</span></label>
                        <input type="number" value={newFieldMin} placeholder="없음" onChange={e => setNewFieldMin(e.target.value)} className={inputCls + ' w-full'} />
                      </div>
                      <div className="flex-1 flex flex-col gap-[7px]">
                        <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">최댓값 <span className="font-semibold text-[var(--color-text-muted)]">선택</span></label>
                        <input type="number" value={newFieldMax} placeholder="없음" onChange={e => setNewFieldMax(e.target.value)} className={inputCls + ' w-full'} />
                      </div>
                    </div>
                  )}
                  {FIELD_TYPES_WITH_OPTIONS.includes(newFieldType) && (
                    <div className="flex flex-col gap-[7px] pt-2 border-t border-[var(--color-border)]">
                      <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">선택지 <span className="font-semibold text-[var(--color-text-muted)] ml-1">유형 · 표시명 · 저장값</span></label>
                      <div className="flex flex-col gap-2">
                        {newFieldOptions.map((opt, oi) => {
                          const unit = getOptionUnit(opt.value_type)
                          return (
                            <div key={oi} className="flex items-center gap-2 p-[7px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[10px] flex-wrap sm:flex-nowrap">
                              <span className="text-[var(--color-text-muted)] shrink-0 opacity-50"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="15" cy="18" r="1.4"/></svg></span>
                              <div className="relative w-[84px] shrink-0">
                                <select value={opt.value_type ?? 'none'}
                                  onChange={e => setNewFieldOptions(prev => prev.map((o, i) => i === oi ? { ...o, value_type: e.target.value as OptionValueType } : o))}
                                  className="w-full h-[34px] px-[10px] pr-[26px] bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-strong)] rounded-lg text-[12.5px] font-bold outline-none appearance-none cursor-pointer focus:border-[var(--color-brand-primary)]">
                                  {OPTION_VALUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                                <svg className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                              </div>
                              <input type="text" value={opt.name} placeholder="표시명"
                                onChange={e => setNewFieldOptions(prev => prev.map((o, i) => i === oi ? { ...o, name: e.target.value } : o))}
                                className="flex-[1_1_38%] h-[34px] min-w-0 px-3 bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-strong)] rounded-lg text-sm font-medium outline-none focus:border-[var(--color-brand-primary)] placeholder:text-[var(--color-text-muted)]" />
                              <div className="flex-[1_1_38%] flex items-center gap-1.5 min-w-0">
                                <input type="text" value={opt.value} placeholder="저장값"
                                  onChange={e => setNewFieldOptions(prev => prev.map((o, i) => i === oi ? { ...o, value: e.target.value } : o))}
                                  className="flex-1 min-w-0 h-[34px] px-3 bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-strong)] rounded-lg text-sm font-medium outline-none focus:border-[var(--color-brand-primary)] placeholder:text-[var(--color-text-muted)]" />
                                {unit && <span className="text-[12.5px] font-bold text-[var(--color-text-muted)] shrink-0">{unit}</span>}
                              </div>
                              <button type="button"
                                onClick={() => setNewFieldOptions(prev => prev.filter((_, i) => i !== oi))}
                                className="w-[28px] h-[28px] shrink-0 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-orange-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                              </button>
                            </div>
                          )
                        })}
                        <button type="button"
                          onClick={() => setNewFieldOptions(prev => [...prev, { name: '', value: '', value_type: 'none' }])}
                          className="flex items-center justify-center gap-1.5 h-[38px] border border-dashed border-[var(--color-border-strong)] rounded-[10px] text-[var(--color-text-muted)] text-[13px] font-bold transition-all hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/5">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                          옵션 추가
                        </button>
                      </div>
                      <button type="button"
                        onClick={() => setNewFieldShowInDashboard(v => !v)}
                        className={`self-start inline-flex items-center gap-2 h-[34px] px-[13px] pl-[10px] border rounded-lg text-[13px] font-semibold whitespace-nowrap transition-all ${newFieldShowInDashboard ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]' : 'border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'}`}>
                        <span className={`w-[17px] h-[17px] rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0 transition-all ${newFieldShowInDashboard ? 'bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)]' : 'border-[var(--color-border-strong)]'}`}>
                          {newFieldShowInDashboard && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
                        </span>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="5" rx="0.6"/><rect x="12" y="8" width="3" height="9" rx="0.6"/><rect x="17" y="5" width="3" height="12" rx="0.6"/></svg>
                        대시보드 통계 포함
                      </button>
                    </div>
                  )}
                  {newFieldType === 'checkbox' && (
                    <div className="pt-2 border-t border-[var(--color-border)]">
                      <button type="button"
                        onClick={() => setNewFieldShowInDashboard(v => !v)}
                        className={`inline-flex items-center gap-2 h-[34px] px-[13px] pl-[10px] border rounded-lg text-[13px] font-semibold whitespace-nowrap transition-all ${newFieldShowInDashboard ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]' : 'border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'}`}>
                        <span className={`w-[17px] h-[17px] rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0 transition-all ${newFieldShowInDashboard ? 'bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)]' : 'border-[var(--color-border-strong)]'}`}>
                          {newFieldShowInDashboard && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
                        </span>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="5" rx="0.6"/><rect x="12" y="8" width="3" height="9" rx="0.6"/><rect x="17" y="5" width="3" height="12" rx="0.6"/></svg>
                        대시보드 통계 포함
                      </button>
                    </div>
                  )}
                  {['text', 'number', 'select', 'phone', 'account_number'].includes(newFieldType) && (
                    <div className="flex flex-col gap-[7px] pt-2 border-t border-[var(--color-border)]">
                      <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">플레이스홀더 <span className="font-semibold text-[var(--color-text-muted)]">선택</span></label>
                      <input type="text" value={newFieldPlaceholder} maxLength={100} placeholder="입력 안내 문구"
                        onChange={e => setNewFieldPlaceholder(e.target.value)}
                        className={inputCls + ' w-full'} />
                    </div>
                  )}
                </form>
              </div>
            )}
          </>
        )}
      </div>
      {/* ── 알림 설정 ── */}
      {notifSettings && (
        <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">D-1 배정 알림</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-[var(--color-text-secondary)]">
                {notifSettings.is_enabled ? '활성' : '비활성'}
              </span>
              <button
                role="switch"
                aria-checked={notifSettings.is_enabled}
                onClick={() => setNotifSettings(s => s ? { ...s, is_enabled: !s.is_enabled } : s)}
                className={`relative w-10 h-6 rounded-full transition-colors ${notifSettings.is_enabled ? 'bg-[var(--color-brand-primary)]' : 'bg-[var(--color-border-strong)]'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${notifSettings.is_enabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 발송 시간 */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">발송 시간</label>
              <select
                value={notifSettings.send_time}
                onChange={e => setNotifSettings(s => s ? { ...s, send_time: e.target.value } : s)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
              >
                {Array.from({ length: 48 }, (_, i) => {
                  const h = String(Math.floor(i / 2)).padStart(2, '0')
                  const m = i % 2 === 0 ? '00' : '30'
                  return `${h}:${m}`
                }).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* 수신 대상 */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">수신 대상</label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifSettings.recipients.assigned_members}
                    onChange={e => setNotifSettings(s => s ? { ...s, recipients: { ...s.recipients, assigned_members: e.target.checked } } : s)}
                    className="w-4 h-4 rounded accent-[var(--color-brand-primary)]"
                  />
                  <span className="text-sm text-[var(--color-text-primary)]">배정된 멤버</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifSettings.recipients.admins}
                    onChange={e => setNotifSettings(s => s ? { ...s, recipients: { ...s.recipients, admins: e.target.checked } } : s)}
                    className="w-4 h-4 rounded accent-[var(--color-brand-primary)]"
                  />
                  <span className="text-sm text-[var(--color-text-primary)]">관리자</span>
                </label>
              </div>
            </div>
          </div>

          {/* 메시지 템플릿 */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">메시지 템플릿</label>
            <textarea
              value={notifSettings.msg_template}
              onChange={e => setNotifSettings(s => s ? { ...s, msg_template: e.target.value } : s)}
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30 resize-none"
            />
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              변수: <code className="bg-[var(--color-surface-secondary)] px-1 rounded">{'{{date}}'}</code> 날짜,{' '}
              <code className="bg-[var(--color-surface-secondary)] px-1 rounded">{'{{slot}}'}</code> 시간대,{' '}
              <code className="bg-[var(--color-surface-secondary)] px-1 rounded">{'{{org}}'}</code> 조직명
            </p>
          </div>

          <button
            onClick={saveNotifSettings}
            disabled={notifSaving}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-colors"
            style={{ background: 'var(--color-brand-primary)' }}
          >
            {notifSaving ? '저장 중...' : '저장'}
          </button>
        </section>
      )}
      <DevFileLabel file="AdminPage.tsx" />
    </div>
  )
}
