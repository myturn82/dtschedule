import { useState } from 'react'
import { formatPhone } from '../../lib/phone'
import { DevFileLabel } from '../DevFileLabel'

export interface ExpiringPackageRecipient {
  id: string
  name: string
  phone: string
  packageName: string
  expiresAt: string
  remaining: number
  daysLeft: number
}

interface Props {
  tenantId: string
  recipients: ExpiringPackageRecipient[]
  onClose: () => void
}

interface Row extends ExpiringPackageRecipient {
  selected: boolean
}

const DEFAULT_MESSAGE = '안녕하세요, 보유하신 레슨권의 만료가 얼마 남지 않았습니다. 만료 전에 잔여 횟수를 모두 사용해 주세요.'

function storageKey(tenantId: string): string {
  return `dtschedule:expiring-package-sms-message:${tenantId}`
}

export function ExpiringPackageSmsModal({ tenantId, recipients, onClose }: Props) {
  const [rows, setRows] = useState<Row[]>(() =>
    recipients.map(r => ({ ...r, phone: r.phone ? formatPhone(r.phone) : '', selected: true }))
  )
  const [message, setMessage] = useState(() => {
    try {
      return localStorage.getItem(storageKey(tenantId)) || DEFAULT_MESSAGE
    } catch {
      return DEFAULT_MESSAGE
    }
  })

  const selectedRows = rows.filter(r => r.selected)
  const validRows = selectedRows.filter(r => r.phone.trim())
  const allSelected = rows.length > 0 && rows.every(r => r.selected)

  function handleSend() {
    if (!message.trim() || validRows.length === 0) return
    try { localStorage.setItem(storageKey(tenantId), message) } catch { /* 저장 실패는 발송을 막지 않음 */ }
    const numbers = [...new Set(validRows.map(r => r.phone.replace(/-/g, '')))]
    window.location.href = `sms:${numbers.join(',')}?body=${encodeURIComponent(message)}`
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col pointer-events-auto">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] shrink-0">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">만료 임박 레슨권 문자 발송</h2>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] transition-colors">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>
            </button>
          </div>

          {/* Recipient list */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <p className="text-[11px] text-[var(--color-text-muted)] bg-[var(--color-surface-secondary)] rounded-lg px-2.5 py-1.5 mb-2.5">
              📋 선택한 기간 내 만료가 도래하지만 레슨권을 다 사용하지 않은 회원 대상입니다.
            </p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                수신자 <span className="text-[var(--color-brand-primary)]">{selectedRows.length}</span>/{rows.length}명
              </span>
              <button
                onClick={() => setRows(rs => rs.map(r => ({ ...r, selected: !allSelected })))}
                className="text-xs text-[var(--color-brand-primary)] hover:underline"
              >
                {allSelected ? '전체 해제' : '전체 선택'}
              </button>
            </div>

            <div className="space-y-1">
              {rows.map(r => (
                <div key={r.id} className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-colors ${r.selected ? 'bg-[var(--color-surface-secondary)]' : ''}`}>
                  <input
                    type="checkbox"
                    checked={r.selected}
                    onChange={() => setRows(rs => rs.map(x => x.id === r.id ? { ...x, selected: !x.selected } : x))}
                    className="w-4 h-4 shrink-0 accent-[var(--color-brand-primary)]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--color-text-primary)] truncate">{r.name}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)] truncate">
                      {r.packageName} · {r.daysLeft === 0 ? 'D-day' : `D-${r.daysLeft}`} ({r.expiresAt} 만료) · {r.remaining}회 남음
                    </div>
                  </div>
                  <input
                    type="tel"
                    value={r.phone}
                    onChange={e => setRows(rs => rs.map(x => x.id === r.id ? { ...x, phone: formatPhone(e.target.value) } : x))}
                    placeholder="번호 입력"
                    className="w-36 shrink-0 text-sm px-2 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-primary)]"
                  />
                </div>
              ))}
              {rows.length === 0 && (
                <p className="text-sm text-[var(--color-text-muted)] text-center py-6">대상 회원이 없습니다</p>
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
              disabled={validRows.length === 0 || !message.trim()}
              className="w-full py-2.5 text-sm font-semibold rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] hover:bg-[var(--color-brand-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              📱 문자 발송 ({validRows.length}명)
            </button>
            {selectedRows.length > validRows.length && (
              <p className="text-xs text-center text-[var(--color-text-muted)]">
                전화번호 없는 {selectedRows.length - validRows.length}명은 제외됩니다
              </p>
            )}
          </div>

          <DevFileLabel file="ExpiringPackageSmsModal.tsx" />
        </div>
      </div>
    </>
  )
}
