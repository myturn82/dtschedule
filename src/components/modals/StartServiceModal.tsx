import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DevFileLabel } from '../DevFileLabel'
import { supabase } from '../../lib/supabase'
import { isValidPhone, formatPhone } from '../../lib/phone'

interface Props {
  userId: string
  onClose: () => void
  onSuccess?: () => void
}

function nameToSlug(name: string): string {
  const base = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-+|-+$/g, '')
  return `${base || 'org'}-${Math.random().toString(36).slice(2, 7)}`
}

const DEFAULT_SLOTS = ['09-10', '10-11', '11-12', '12-13', '13-14', '14-15', '15-16', '16-17', '17-18']

export function StartServiceModal({ userId, onClose }: Props) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!name.trim()) { setError('서비스 계정 이름을 입력해주세요.'); return }
    if (!isValidPhone(phone)) { setError('올바른 전화번호를 입력해 주세요. (예: 010-1234-5678)'); return }
    setError(null)
    setCreating(true)

    // 1. 기존 고객 확인 또는 신규 생성
    const { data: existingCustomer } = await supabase
      .from('customers').select('id').eq('owner_user_id', userId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()

    let customerId: string
    if (existingCustomer?.id) {
      customerId = existingCustomer.id
    } else {
      const { error: customerErr } = await supabase
        .from('customers')
        .insert({ name: name.trim(), phone: phone.trim(), owner_user_id: userId, plan: 'basic', is_active: true })
      if (customerErr) { setError(`오류: ${customerErr.message}`); setCreating(false); return }
      const { data: newCustomer } = await supabase
        .from('customers').select('id').eq('owner_user_id', userId)
        .order('created_at', { ascending: false }).limit(1).single()
      if (!newCustomer) { setError('오류: 고객 정보를 불러오지 못했습니다.'); setCreating(false); return }
      customerId = newCustomer.id
    }

    // 2. 조직 생성 — ID 미리 생성 후 INSERT만 수행 (SELECT 없이, RLS 우회)
    const orgName = name.trim()
    const tenantSettings = {
      title: orgName, time_slots: DEFAULT_SLOTS,
      open_from: '09:00', open_to: '22:00', slot_interval_minutes: 60,
      timezone: 'Asia/Seoul', locale: 'ko-KR', tenant_mode: '회원공유',
    }
    let tenantId: string | null = null
    let tenantSlug = ''
    for (let attempt = 0; attempt < 3; attempt++) {
      tenantId = crypto.randomUUID()
      tenantSlug = nameToSlug(orgName)
      const { error: tenantErr } = await supabase.from('tenants').insert({
        id: tenantId, slug: tenantSlug, name: orgName,
        customer_id: customerId, is_active: true, settings: tenantSettings,
      })
      if (!tenantErr) break
      if (tenantErr.code !== '23505') { setError(`오류: ${tenantErr.message}`); setCreating(false); return }
      tenantId = null
    }
    if (!tenantId) { setError('오류: 조직 생성에 실패했습니다. 다시 시도해 주세요.'); setCreating(false); return }

    // 3. admin 멤버 등록 (고객 소유자 정책으로 허용)
    await supabase.from('tenant_members').insert({
      tenant_id: tenantId, user_id: userId, role: 'admin', is_approved: true,
    })

    // 4. 스케줄 규칙 생성
    await supabase.from('schedule_rules').insert(
      [0, 1, 2, 3, 4, 5, 6].flatMap(day =>
        DEFAULT_SLOTS.map(slot => ({ tenant_id: tenantId!, day_of_week: day, time_slot: slot, is_open: true }))
      )
    )

    // 5. sessionStorage에 저장 후 이동 (DB SELECT 불필요)
    sessionStorage.setItem('vs_setup_tenant', JSON.stringify({
      id: tenantId, slug: tenantSlug, name: orgName,
      customer_id: customerId, is_active: true, settings: tenantSettings,
    }))
    onClose()
    navigate('/setup?org=' + tenantId)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--color-text)]">내 서비스 시작하기</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 5l10 10M15 5L5 15"/>
            </svg>
          </button>
        </div>

        <p className="text-xs text-[var(--color-text-muted)] -mt-2">
          나만의 조직을 직접 만들고 관리합니다 <span className="font-semibold text-[var(--color-brand-primary)]">BASIC 무료</span>
        </p>

        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
            서비스 계정 이름 <span className="text-red-500">*</span>
          </label>
          <input
            id="start-service-name"
            name="organization"
            autoComplete="organization"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="예: 홍길동 미용실"
            className="w-full border border-[var(--color-border-strong)] rounded-xl px-3 py-2 text-sm bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
            전화번호 <span className="text-red-500">*</span>
          </label>
          <input
            id="start-service-phone"
            name="tel"
            autoComplete="tel"
            value={phone}
            onChange={e => setPhone(formatPhone(e.target.value))}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="010-1234-5678"
            maxLength={13}
            className="w-full border border-[var(--color-border-strong)] rounded-xl px-3 py-2 text-sm bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] focus:outline-none"
          />
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={creating || !name.trim()}
            className="flex-1 py-2 text-sm font-semibold rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] hover:bg-[var(--color-brand-primary-hover)] disabled:opacity-50 transition-colors"
          >
            {creating ? '설정 중...' : '시작하기'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm font-medium rounded-xl border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            취소
          </button>
        </div>
      </div>
      <DevFileLabel file="StartServiceModal.tsx" />
    </div>
  )
}
