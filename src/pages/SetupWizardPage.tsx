import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAdmin } from '../hooks/useAdmin'
import { useTenantRoles } from '../hooks/useTenantRoles'
import { useTenant } from '../contexts/TenantContext'
import { displayMode } from '../lib/tenantMode'
import { DevFileLabel } from '../components/DevFileLabel'
import { WizardProgress } from '../components/setup/WizardProgress'
import { Step1OrgName } from '../components/setup/steps/Step1OrgName'
import { Step2Mode } from '../components/setup/steps/Step2Mode'
import { Step3Slots } from '../components/setup/steps/Step3Slots'
import { Step4Roles } from '../components/setup/steps/Step4Roles'
import { Step5Rules } from '../components/setup/steps/Step5Rules'
import { Step6Legend } from '../components/setup/steps/Step6Legend'
import { Step7CustomFields } from '../components/setup/steps/Step7CustomFields'
import { StepDone } from '../components/setup/steps/StepDone'
import type { Tenant, TenantMode, LegendItem, CustomFieldDef } from '../types'

const STEP_DEFS: { label: string; required: true | false | 'conditional' }[] = [
  { label: '조직명', required: true },
  { label: '모드',   required: true },
  { label: '슬롯',   required: true },
  { label: '역할',   required: true },
  { label: '규칙',   required: true },
  { label: '범례',   required: false },
  { label: '필드',   required: 'conditional' },
]

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const MODE_LABEL: Record<string, string> = {
  '회원공유': '회원 공유',
  '회원개별': '회원 개별',
  '비회원': '비회원(예약)',
}

export function SetupWizardPage() {
  const [params] = useSearchParams()
  const orgId = params.get('org') ?? ''
  const navigate = useNavigate()
  const { setTenant } = useTenant()

  const [tenant, setLocalTenant] = useState<Tenant | null>(null)
  const [loadingTenant, setLoadingTenant] = useState(true)

  // Load tenant by orgId
  useEffect(() => {
    if (!orgId) { navigate('/customer-admin'); return }
    supabase.from('tenants').select('*').eq('id', orgId).single().then(({ data }) => {
      if (data) setLocalTenant(data as Tenant)
      else navigate('/customer-admin')
      setLoadingTenant(false)
    })
  }, [orgId, navigate])

  const {
    scheduleRules,
    updateTenantSettings,
    updateTenantName,
    upsertScheduleRulesForSlots,
    toggleScheduleRule,
  } = useAdmin(orgId)

  const { roles, addRole, deleteRole } = useTenantRoles(orgId)

  // Wizard state
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Step drafts — pre-filled from tenant once loaded
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [mode, setMode] = useState<TenantMode>('회원공유')
  const [slots, setSlots] = useState<string[]>([])
  const [legendItems, setLegendItems] = useState<LegendItem[]>([])
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>([])

  useEffect(() => {
    if (!tenant) return
    setName(tenant.name ?? '')
    setTitle(tenant.settings?.title ?? tenant.name ?? '')
    setMode(displayMode(tenant.settings?.tenant_mode))
    setSlots(tenant.settings?.time_slots ?? [])
    setLegendItems(tenant.settings?.legend_items ?? [])
    setCustomFields(tenant.settings?.custom_fields ?? [])
  }, [tenant])

  const isFreeform = mode === '비회원'

  // ── Persist helpers ────────────────────────────────────────────────────────

  async function saveStep1(): Promise<boolean> {
    if (!name.trim()) { setError('조직명을 입력해주세요'); return false }
    setSaving(true); setError('')
    const nameErr = await updateTenantName(orgId, name.trim())
    const settingsErr = await updateTenantSettings(orgId, { title: title.trim() || name.trim() })
    if (nameErr || settingsErr) { setError(nameErr ?? settingsErr ?? '저장 실패'); setSaving(false); return false }
    setSaving(false); return true
  }

  async function saveStep2(): Promise<boolean> {
    setSaving(true); setError('')
    const err = await updateTenantSettings(orgId, { tenant_mode: mode })
    if (err) { setError(err); setSaving(false); return false }
    setSaving(false); return true
  }

  async function saveStep3(): Promise<boolean> {
    if (slots.length === 0) { setError('슬롯을 하나 이상 선택해주세요'); return false }
    setSaving(true); setError('')
    const hasHalf = slots.some(s => s.includes('.'))
    const err = await updateTenantSettings(orgId, {
      time_slots: slots,
      slot_interval_minutes: hasHalf ? 30 : 60,
    })
    if (err) { setError(err); setSaving(false); return false }
    await upsertScheduleRulesForSlots(slots)
    setSaving(false); return true
  }

  async function saveStep6(): Promise<boolean> {
    setSaving(true); setError('')
    const err = await updateTenantSettings(orgId, { legend_items: legendItems })
    if (err) { setError(err); setSaving(false); return false }
    setSaving(false); return true
  }

  async function saveStep7(): Promise<boolean> {
    if (isFreeform && customFields.length === 0) {
      setError('비회원 모드에서는 필드를 하나 이상 추가해주세요')
      return false
    }
    setSaving(true); setError('')
    const err = await updateTenantSettings(orgId, {
      custom_fields: customFields,
      setup_completed_at: new Date().toISOString(),
    })
    if (err) { setError(err); setSaving(false); return false }
    setSaving(false); return true
  }

  // ── Apply schedule rule template ───────────────────────────────────────────

  async function applyRuleTemplate(openDays: number[]) {
    const tasks = scheduleRules
      .filter(r => r.is_open !== openDays.includes(r.day_of_week))
      .map(r => toggleScheduleRule(r.id, r.is_open))
    await Promise.all(tasks)
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async function goNext(stepNum: number) {
    let ok = true
    if (stepNum === 1) ok = await saveStep1()
    else if (stepNum === 2) ok = await saveStep2()
    else if (stepNum === 3) ok = await saveStep3()
    else if (stepNum === 6) ok = await saveStep6()
    else if (stepNum === 7) {
      ok = await saveStep7()
      if (ok) { setStep(8); return }
    }
    if (ok) setStep(stepNum + 1)
  }

  // ── Summary data for done screen ─────────────────────────────────────────

  const openDaysSummary = useMemo(() => {
    const openDays = [0, 1, 2, 3, 4, 5, 6].filter(d =>
      scheduleRules.some(r => r.day_of_week === d && r.is_open)
    )
    if (openDays.length === 0) return '없음'
    if (openDays.length === 7) return '매일'
    return openDays.map(d => DAY_LABELS[d]).join('·')
  }, [scheduleRules])

  const shareUrl = `${window.location.origin}/share?tid=${orgId}&year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`

  // ── Render ────────────────────────────────────────────────────────────────

  if (loadingTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--color-text-muted)]">
        로딩 중...
      </div>
    )
  }

  if (step === 8) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <StepDone
            orgName={name}
            slotCount={slots.length}
            roleCount={roles.length}
            modeName={MODE_LABEL[mode] ?? mode}
            openDays={openDaysSummary}
            shareUrl={shareUrl}
            onGoSchedule={() => {
              if (tenant) setTenant(tenant, 'admin')
              navigate('/schedule')
            }}
            onGoMembers={() => navigate(`/admin?org=${orgId}&tab=members`)}
            onGoAdmin={() => navigate(`/admin?org=${orgId}`)}
          />
        </div>
        <DevFileLabel file="SetupWizardPage.tsx" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-4 sm:py-8">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <p className="text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wide mb-0.5">간편 설정 마법사</p>
          <h1 className="text-base font-bold text-[var(--color-text-primary)]">{name || '조직 설정'}</h1>
        </div>

        <WizardProgress step={step} steps={STEP_DEFS} isFreeform={isFreeform} />

        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-sm p-5 sm:p-6">
          {step === 1 && (
            <Step1OrgName
              name={name} title={title} saving={saving} error={error}
              onChange={(n, t) => { setName(n); setTitle(t) }}
              onNext={() => goNext(1)}
            />
          )}
          {step === 2 && (
            <Step2Mode
              mode={mode} saving={saving} error={error}
              onChange={setMode}
              onNext={() => goNext(2)} onBack={() => { setError(''); setStep(1) }}
            />
          )}
          {step === 3 && (
            <Step3Slots
              slots={slots} saving={saving} error={error}
              onChange={setSlots}
              onNext={() => goNext(3)} onBack={() => { setError(''); setStep(2) }}
            />
          )}
          {step === 4 && (
            <Step4Roles
              roles={roles} saving={saving} error={error}
              onAdd={addRole} onDelete={deleteRole}
              onNext={() => { setError(''); setStep(5) }}
              onBack={() => { setError(''); setStep(3) }}
            />
          )}
          {step === 5 && (
            <Step5Rules
              rules={scheduleRules} timeSlots={slots} saving={saving} error={error}
              onToggleRule={toggleScheduleRule}
              onApplyTemplate={applyRuleTemplate}
              onNext={() => { setError(''); setStep(6) }}
              onBack={() => { setError(''); setStep(4) }}
            />
          )}
          {step === 6 && (
            <Step6Legend
              legendItems={legendItems} saving={saving} error={error}
              onChange={setLegendItems}
              onNext={() => goNext(6)}
              onBack={() => { setError(''); setStep(5) }}
              onSkip={() => { setError(''); setStep(7) }}
            />
          )}
          {step === 7 && (
            <Step7CustomFields
              fields={customFields} isFreeform={isFreeform} saving={saving} error={error}
              onChange={setCustomFields}
              onNext={() => goNext(7)}
              onBack={() => { setError(''); setStep(6) }}
              onSkip={() => { setError(''); setStep(8) }}
            />
          )}
        </div>

        <p className="text-center text-xs text-[var(--color-text-muted)] mt-4">
          각 단계는 자동 저장됩니다 ·{' '}
          <button onClick={() => navigate(`/admin?org=${orgId}`)} className="underline hover:text-[var(--color-text-secondary)]">
            관리자 페이지
          </button>
          에서 수정 가능
        </p>
      </div>
      <DevFileLabel file="SetupWizardPage.tsx" />
    </div>
  )
}
