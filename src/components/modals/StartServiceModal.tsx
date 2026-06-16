import { useState } from 'react'
import { DevFileLabel } from '../DevFileLabel'
import { supabase } from '../../lib/supabase'
import { isValidPhone, formatPhone } from '../../lib/phone'

interface Props {
  userId: string
  onClose: () => void
  onSuccess: () => void
}

export function StartServiceModal({ userId, onClose, onSuccess }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!name.trim()) { setError('서비스 계정 이름을 입력해주세요.'); return }
    if (!isValidPhone(phone)) { setError('올바른 전화번호를 입력해 주세요. (예: 010-1234-5678)'); return }
    setError(null)
    setCreating(true)
    const { error: insertErr } = await supabase
      .from('customers')
      .insert({ name: name.trim(), phone: phone.trim(), owner_user_id: userId, plan: 'basic' })
    setCreating(false)
    if (insertErr) { setError(`오류: ${insertErr.message}`); return }
    onSuccess()
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
            className="flex-1 py-2 text-sm font-semibold rounded-xl bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-hover)] disabled:opacity-50 transition-colors"
          >
            {creating ? '생성 중...' : '시작하기'}
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
