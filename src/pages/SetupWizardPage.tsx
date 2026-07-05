import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAdmin } from '../hooks/useAdmin'
import { useTenantRoles } from '../hooks/useTenantRoles'
import { useTenant } from '../contexts/TenantContext'
import { displayMode } from '../lib/tenantMode'
import { getKoreanHolidaysInYear } from '../utils/koreanHolidays'
import { DevFileLabel } from '../components/DevFileLabel'
import { WizardIcon } from '../components/setup/WizardIcons'
import { isIndustryComplete } from '../components/IndustryPicker'
import { WIZARD_STEPS } from '../components/setup/StepHeader'
import { Step1OrgName } from '../components/setup/steps/Step1OrgName'
import { Step2Mode } from '../components/setup/steps/Step2Mode'
import { Step3Slots } from '../components/setup/steps/Step3Slots'
import { Step4Roles } from '../components/setup/steps/Step4Roles'
import { Step5Rules } from '../components/setup/steps/Step5Rules'
import { Step7CustomFields } from '../components/setup/steps/Step7CustomFields'
import { StepDone } from '../components/setup/steps/StepDone'
import type { Tenant, TenantMode, CustomFieldDef } from '../types'

const TOTAL = WIZARD_STEPS.length // 7

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
    addDateOverride,
  } = useAdmin(orgId)

  const { roles, addRole, deleteRole, updateRole } = useTenantRoles(orgId)

  // Wizard state
  // 새로고침 시에도 진행 단계를 유지 — org id 기준 sessionStorage에 저장/복원
  const [step, setStep] = useState(() => {
    if (!orgId) return 1
    const cached = Number(sessionStorage.getItem(`vs_setup_step_${orgId}`))
    return Number.isInteger(cached) && cached >= 1 ? cached : 1
  })
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
    if (!orgId) return
    sessionStorage.setItem(`vs_setup_step_${orgId}`, String(step))
  }, [orgId, step])

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

  // Step 6(커스텀필드) can be skipped (비회원 모드 제외)
  const isSkippable = (s: number) => s === 6 && !isFreeform

  // ── Persist helpers ────────────────────────────────────────────────────────

  async function saveStep1(): Promise<boolean> {
    if (!name.trim()) { setError('조직명을 입력해주세요'); return false }
    if (!industry) { setError('업종을 선택해주세요'); return false }
    if (!isIndustryComplete(industry)) { setError('세부 업종을 선택해주세요'); return false }
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
    sessionStorage.removeItem('vs_setup_tenant')
    sessionStorage.removeItem(`vs_setup_step_${orgId}`)
    setSaving(false); return true
  }

  // ── Apply schedule rule template ───────────────────────────────────────────

  async function applyRuleTemplate(openDays: number[], includeHolidays?: boolean) {
    const tasks = scheduleRules
      .filter(r => r.is_open !== openDays.includes(r.day_of_week))
      .map(r => toggleScheduleRule(r.id, r.is_open))
    await Promise.all(tasks)

    if (includeHolidays) {
      const thisYear = new Date().getFullYear()
      const holidays = [...getKoreanHolidaysInYear(thisYear), ...getKoreanHolidaysInYear(thisYear + 1)]
      await Promise.all(holidays.map(h => addDateOverride(h.date, true, false, h.name)))
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async function goNext(stepNum: number) {
    let ok = true
    if (stepNum === 1) ok = await saveStep1()
    else if (stepNum === 2) ok = await saveStep2()
    else if (stepNum === 3) ok = await saveStep3()
    else if (stepNum === 6) ok = await saveStep7()
    if (ok) setStep(stepNum + 1)
  }

  function goBack() {
    setError('')
    setStep(s => s - 1)
  }

  function jumpTo(n: number) {
    if (n >= step) return
    setError('')
    setStep(n)
  }

  async function skip() {
    setError('')
    if (step === TOTAL) {
      // 마지막 단계 건너뛰기 — 완료 플래그는 반드시 저장 (미저장 시 다음 접속에 위저드 재진입)
      await updateTenantSettings(orgId, { setup_completed_at: new Date().toISOString() })
      sessionStorage.removeItem('vs_setup_tenant')
      sessionStorage.removeItem(`vs_setup_step_${orgId}`)
      setStep(TOTAL + 1)
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
    (step === 1 && (!name.trim() || !isIndustryComplete(industry))) ||
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
          className="px-4 py-2 rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] text-sm font-semibold"
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

  const isDone = step > TOTAL

  return (
    <div className="wiz-root wiz-stage">
      <div className="wiz-card">
        <div className="wiz-progress"><div className="wiz-progress-fill" style={{ width: `${(Math.min(step, TOTAL) / TOTAL) * 100}%` }} /></div>

        {!isDone && (
          <div className="wiz-top">
            <span className="wiz-step-no">STEP <b>{step}</b> / {TOTAL}</span>
            <div className="wiz-dots">
              {WIZARD_STEPS.map(s => (
                <button key={s.n} className={`wiz-dot${s.n === step ? ' cur' : s.n < step ? ' done' : ''}`}
                  disabled={s.n >= step} onClick={() => jumpTo(s.n)} aria-label={`${s.n}단계로`} />
              ))}
            </div>
          </div>
        )}

        <div className="wiz-scroll">
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
              onAdd={addRole} onDelete={deleteRole} onUpdate={updateRole}
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
            <Step7CustomFields
              fields={customFields} isFreeform={isFreeform} error={error}
              onChange={setCustomFields}
            />
          )}
          {isDone && (
            <StepDone
              orgName={name}
              slotCount={slots.length}
              roleCount={roles.length}
              fieldCount={customFields.length}
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
          )}
        </div>

        {!isDone && (
          <div className="wiz-foot">
            {step > 1 && <button className="btn btn-ghost back" onClick={goBack}><WizardIcon.arrowLeft size={15} /> 이전</button>}
            {isSkippable(step) && <button className="btn btn-ghost" onClick={skip}>건너뛰기</button>}
            <button className="btn btn-primary" disabled={nextDisabled} onClick={() => goNext(step)}>
              {saving ? '저장 중...' : (step === TOTAL ? '완료하기' : '다음')} <WizardIcon.arrowRight size={15} />
            </button>
          </div>
        )}
      </div>
      <DevFileLabel file="SetupWizardPage.tsx" />
    </div>
  )
}
