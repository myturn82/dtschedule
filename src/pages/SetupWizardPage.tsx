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
import { Step7CustomFields as Step6CustomFields } from '../components/setup/steps/Step7CustomFields'
import { StepDone } from '../components/setup/steps/StepDone'
import type { Tenant, TenantMode, CustomFieldDef } from '../types'

const STEP_DEFS: { label: string }[] = [
  { label: '조직명' },
  { label: '모드' },
  { label: '슬롯' },
  { label: '역할' },
  { label: '규칙' },
  { label: '필드' },
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
  const { setTenant, reloadMemberships } = useTenant()

  const [tenant, setLocalTenant] = useState<Tenant | null>(null)
  const [loadingTenant, setLoadingTenant] = useState(true)

  // 신규 가입 완료 — 깜빡임 방지 플래그 해제
  useEffect(() => { sessionStorage.removeItem('vs_setup_creating') }, [])

  // Load tenant by orgId — sessionStorage 우선(생성 직후 RLS 경쟁 방지), 없으면 DB 조회
  // sessionStorage는 즉시 삭제하지 않음 — 라우팅 브랜치 변경 시 재마운트 대비
  useEffect(() => {
    if (!orgId) { setLoadingTenant(false); return }
    const cached = sessionStorage.getItem('vs_setup_tenant')
    if (cached) {
      try {
        const t = JSON.parse(cached)
        if (t?.id === orgId) {
          setLocalTenant(t as Tenant)
          setLoadingTenant(false)
          return
        }
      } catch { /* invalid JSON */ }
      sessionStorage.removeItem('vs_setup_tenant')
    }
    supabase.from('tenants').select('*').eq('id', orgId).maybeSingle().then(({ data }) => {
      if (data) setLocalTenant(data as Tenant)
      setLoadingTenant(false)
    })
  }, [orgId])

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
  const [industry, setIndustry] = useState('')
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>([])

  useEffect(() => {
    if (!tenant) return
    setName(tenant.name ?? '')
    setTitle(tenant.settings?.title ?? tenant.name ?? '')
    setMode(displayMode(tenant.settings?.tenant_mode))
    setSlots(tenant.settings?.time_slots ?? [])
    setIndustry(tenant.business_type ?? '')
    setCustomFields(tenant.settings?.custom_fields ?? [])
  }, [tenant])

  const isFreeform = mode === '비회원'

  // Steps 6 and 7 (non-freeform) can be skipped
  const isSkippable = (s: number) => s === 6 && !isFreeform

  // ── Persist helpers ────────────────────────────────────────────────────────

  async function saveStep1(): Promise<boolean> {
    if (!name.trim()) { setError('조직명을 입력해주세요'); return false }
    if (!industry) { setError('업종을 선택해주세요'); return false }
    setSaving(true); setError('')
    const nameErr = await updateTenantName(orgId, name.trim())
    const settingsErr = await updateTenantSettings(orgId, { title: title.trim() || name.trim() })
    const { error: bizErr } = await supabase.from('tenants').update({ business_type: industry }).eq('id', orgId)
    if (nameErr || settingsErr || bizErr) { setError(nameErr ?? settingsErr ?? bizErr?.message ?? '저장 실패'); setSaving(false); return false }
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
    sessionStorage.removeItem('vs_setup_tenant')
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
    else if (stepNum === 6) {
      ok = await saveStep6()
      if (ok) { setStep(7); return }
    }
    if (ok) setStep(stepNum + 1)
  }

  function goBack() {
    setError('')
    setStep(s => s - 1)
  }

  async function skip() {
    setError('')
    if (step === 6) {
      // 마지막 단계 건너뛰기 — 완료 플래그는 반드시 저장 (미저장 시 다음 접속에 위저드 재진입)
      await updateTenantSettings(orgId, { setup_completed_at: new Date().toISOString() })
      sessionStorage.removeItem('vs_setup_tenant')
      setStep(7)
    } else {
      setStep(s => s + 1)
    }
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

  // ── Footer button disabled logic ─────────────────────────────────────────

  const nextDisabled =
    saving ||
    (step === 1 && (!name.trim() || !industry)) ||
    (step === 3 && slots.length === 0) ||
    (step === 6 && isFreeform && customFields.length === 0)

  // ── Render ────────────────────────────────────────────────────────────────

  if (loadingTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--color-text-muted)]">
        로딩 중...
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-sm text-[var(--color-text-secondary)]">조직 정보를 불러올 수 없습니다.</p>
        <button
          onClick={() => { window.location.href = '/setup?org=' + orgId }}
          className="px-4 py-2 rounded-xl bg-[var(--color-brand-primary)] text-white text-sm font-semibold"
        >
          다시 시도
        </button>
        <button
          onClick={() => { window.location.href = '/customer-admin' }}
          className="text-sm text-[var(--color-text-muted)] underline"
        >
          관리 페이지로
        </button>
      </div>
    )
  }

  if (step === 7) {
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
            onGoSchedule={async () => {
              await reloadMemberships()
              if (tenant) setTenant(tenant, 'admin')
              navigate('/schedule')
            }}
            onGoMembers={async () => {
              await reloadMemberships()
              if (tenant) setTenant(tenant, 'admin')
              navigate(`/admin?org=${orgId}&tab=members`)
            }}
            onGoAdmin={async () => {
              await reloadMemberships()
              if (tenant) setTenant(tenant, 'admin')
              navigate(`/admin?org=${orgId}`)
            }}
          />
        </div>
        <DevFileLabel file="SetupWizardPage.tsx" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 bg-[var(--color-bg)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto w-full">
          {step > 1 ? (
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <span>←</span> <span>이전</span>
            </button>
          ) : (
            <div className="w-16" />
          )}
          <div className="flex-1 text-center">
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">{step}</span>
            <span className="text-sm text-[var(--color-text-muted)]">/{STEP_DEFS.length}단계</span>
            <span className="ml-2 text-xs text-[var(--color-text-muted)]">— {STEP_DEFS[step - 1].label}</span>
          </div>
          {isSkippable(step) ? (
            <button
              onClick={skip}
              className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors w-16 text-right"
            >
              건너뛰기
            </button>
          ) : (
            <div className="w-16" />
          )}
        </div>
        <WizardProgress step={step} total={STEP_DEFS.length} />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-8 pb-4">
          {step === 1 && (
            <Step1OrgName
              name={name} title={title} industry={industry} error={error}
              onChange={(n, t, ind) => { setName(n); setTitle(t); setIndustry(ind) }}
            />
          )}
          {step === 2 && (
            <Step2Mode
              mode={mode} error={error} industry={industry}
              onChange={setMode}
            />
          )}
          {step === 3 && (
            <Step3Slots
              slots={slots} error={error}
              onChange={setSlots}
            />
          )}
          {step === 4 && (
            <Step4Roles
              roles={roles} error={error}
              onAdd={addRole} onDelete={deleteRole}
            />
          )}
          {step === 5 && (
            <Step5Rules
              rules={scheduleRules} timeSlots={slots} error={error}
              onToggleRule={toggleScheduleRule}
              onApplyTemplate={applyRuleTemplate}
            />
          )}
          {step === 6 && (
            <Step6CustomFields
              fields={customFields} isFreeform={isFreeform} error={error}
              onChange={setCustomFields}
            />
          )}
        </div>
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 bg-[var(--color-bg)]/95 backdrop-blur-sm border-t border-[var(--color-border)] p-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => goNext(step)}
            disabled={nextDisabled}
            className="w-full py-3.5 rounded-2xl font-bold text-sm bg-[var(--color-brand-primary)] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-95 active:scale-[0.99] transition-all"
          >
            {saving ? '저장 중...' : (step === 6 ? '설정 완료' : '다음 단계 →')}
          </button>
        </div>
      </div>

      <DevFileLabel file="SetupWizardPage.tsx" />
    </div>
  )
}
