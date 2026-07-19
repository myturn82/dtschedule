import { useState, useMemo } from 'react'
import type { Assignment, CustomFieldDef, Profile } from '../../types'
import { formatPhone } from '../../lib/phone'
import { DevFileLabel } from '../DevFileLabel'

interface SmsModalProps {
  assignments: Assignment[]
  customFields?: CustomFieldDef[]
  profiles?: Profile[]
  adminUserIds?: Set<string>
  onClose: () => void
}

interface Recipient {
  key: string
  name: string
  phone: string
  selected: boolean
}

export function SmsModal({ assignments, customFields, profiles, adminUserIds, onClose }: SmsModalProps) {
  const phoneFieldIds = useMemo(
    () => (customFields ?? []).filter(f => f.type === 'phone').map(f => f.id),
    [customFields]
  )

  const profilePhoneMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of profiles ?? []) {
      if (p.phone) map.set(p.id, p.phone)
    }
    return map
  }, [profiles])

  const initialRecipients = useMemo<Recipient[]>(() => {
    const seen = new Map<string, Recipient>()
    for (const a of assignments) {
      if (a.account_deleted) continue
      if (a.user_id && adminUserIds?.has(a.user_id)) continue
      const key = a.user_id ?? a.member_name
      // phone 우선순위: customer_phone → phone 타입 커스텀 필드 → profile.phone → 빈 문자열 (하이픈 포맷 적용)
      const cfPhone = phoneFieldIds.map(id => a.extra_data?.[id]).find(v => v?.trim()) ?? ''
      const profilePhone = a.user_id ? (profilePhoneMap.get(a.user_id) ?? '') : ''
      const rawPhone = a.customer_phone ?? (cfPhone || profilePhone)
      const phone = rawPhone ? formatPhone(rawPhone) : ''
      if (!seen.has(key)) {
        seen.set(key, { key, name: a.member_name, phone, selected: true })
      } else if (!seen.get(key)!.phone && phone) {
        seen.set(key, { ...seen.get(key)!, phone })
      }
    }
    return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  }, [assignments, phoneFieldIds, profilePhoneMap])

  const [recipients, setRecipients] = useState<Recipient[]>(initialRecipients)
  const [message, setMessage] = useState('')

  const selected = recipients.filter(r => r.selected)
  const validPhones = selected.filter(r => r.phone.trim())
  const allSelected = recipients.length > 0 && recipients.every(r => r.selected)

  const handleSend = () => {
    if (!message.trim() || validPhones.length === 0) return
    const numbers = validPhones.map(r => r.phone.replace(/-/g, ''))
    window.location.href = `sms:${numbers.join(',')}?body=${encodeURIComponent(message)}`
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl w-full max-w-sm max-h-[85vh] flex flex-col pointer-events-auto">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] shrink-0">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">문자 발송</h2>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] transition-colors">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>
            </button>
          </div>

          {/* Recipient list */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                수신자 <span className="text-[var(--color-brand-primary)]">{selected.length}</span>/{recipients.length}명
              </span>
              <button
                onClick={() => setRecipients(rs => rs.map(r => ({ ...r, selected: !allSelected })))}
                className="text-xs text-[var(--color-brand-primary)] hover:underline"
              >
                {allSelected ? '전체 해제' : '전체 선택'}
              </button>
            </div>

            <div className="space-y-1">
              {recipients.map(r => (
                <div key={r.key} className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-colors ${r.selected ? 'bg-[var(--color-surface-secondary)]' : ''}`}>
                  <input
                    type="checkbox"
                    checked={r.selected}
                    onChange={() => setRecipients(rs => rs.map(x => x.key === r.key ? { ...x, selected: !x.selected } : x))}
                    className="w-4 h-4 shrink-0 accent-[var(--color-brand-primary)]"
                  />
                  <span className="text-sm font-medium text-[var(--color-text-primary)] w-16 truncate shrink-0">{r.name}</span>
                  <input
                    type="tel"
                    value={r.phone}
                    onChange={e => setRecipients(rs => rs.map(x => x.key === r.key ? { ...x, phone: formatPhone(e.target.value) } : x))}
                    placeholder="번호 입력"
                    className="flex-1 text-sm px-2 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-primary)] min-w-0"
                  />
                </div>
              ))}
              {recipients.length === 0 && (
                <p className="text-sm text-[var(--color-text-muted)] text-center py-6">배정자가 없습니다</p>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="px-4 pb-3 shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-secondary)]">메시지</label>
              <span className="text-xs text-[var(--color-text-muted)]">{message.length}자</span>
            </div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="보낼 메시지를 입력하세요"
              rows={4}
              className="w-full text-sm px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-primary)] resize-none"
            />
          </div>

          {/* Footer */}
          <div className="px-4 pb-4 shrink-0 space-y-1.5">
            <button
              onClick={handleSend}
              disabled={validPhones.length === 0 || !message.trim()}
              className="w-full py-2.5 text-sm font-semibold rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] hover:bg-[var(--color-brand-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              📱 문자 발송 ({validPhones.length}명)
            </button>
            {selected.length > validPhones.length && (
              <p className="text-xs text-center text-[var(--color-text-muted)]">
                전화번호 없는 {selected.length - validPhones.length}명은 제외됩니다
              </p>
            )}
          </div>

          <DevFileLabel file="SmsModal.tsx" />
        </div>
      </div>
    </>
  )
}
