import { useState } from 'react'
import { SLOT_TEMPLATES, buildSlot, rangeSlotLabel } from '../../../utils/timeSlots'

interface Props {
  slots: string[]
  error: string
  onChange: (slots: string[]) => void
}

const TIME_OPTIONS = Array.from({ length: (24 - 6) * 2 + 1 }, (_, i) => {
  const val = 6 + i * 0.5
  const h = Math.floor(val)
  const m = val % 1 === 0.5 ? '30' : '00'
  return { value: val, label: `${h}:${m}` }
})

export function Step3Slots({ slots, error, onChange }: Props) {
  const [startVal, setStartVal] = useState(9)
  const [endVal, setEndVal] = useState(10)
  const [showCustom, setShowCustom] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)

  function applyTemplate(idx: number) {
    setSelectedTemplate(idx)
    onChange(SLOT_TEMPLATES[idx].slots)
  }

  function addSlot() {
    if (endVal <= startVal) return
    const slot = buildSlot(startVal, endVal)
    if (!slots.includes(slot)) onChange([...slots, slot])
  }

  function removeSlot(s: string) {
    onChange(slots.filter(x => x !== s))
    setSelectedTemplate(null)
  }

  return (
    <div className="space-y-6">
      {/* Icon + header */}
      <div className="text-center space-y-2 pt-2">
        <div className="text-4xl select-none">🕐</div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">운영 시간 단위를 정해주세요</h2>
        <p className="text-[var(--color-text-muted)] text-sm leading-relaxed max-w-sm mx-auto">달력 한 칸이 얼마의 시간을 나타낼지 설정합니다.</p>
      </div>

      {/* Example callout */}
      <div className="rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] px-4 py-3">
        <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-1">💡 예시</p>
        <p className="text-sm text-[var(--color-text-secondary)]">1시간 단위: 09:00~10:00, 10:00~11:00</p>
        <p className="text-sm text-[var(--color-text-secondary)]">2시간 단위: 09:00~11:00, 11:00~13:00</p>
      </div>

      {/* Templates */}
      <div>
        <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">빠른 선택</p>
        <div className="grid grid-cols-2 gap-2">
          {SLOT_TEMPLATES.map((t, i) => (
            <button
              key={t.label}
              onClick={() => applyTemplate(i)}
              className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                selectedTemplate === i
                  ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/8 text-[var(--color-brand-primary)] font-semibold'
                  : 'border-[var(--color-border)] hover:border-[var(--color-brand-primary)]/40 text-[var(--color-text-secondary)]'
              }`}
            >
              <div className="font-medium text-[13px] leading-tight">{t.label}</div>
              <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{t.slots.length}개 슬롯</div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected slots preview */}
      {slots.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
            선택된 슬롯 ({slots.length}개)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {slots.map(s => (
              <span key={s} className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]">
                {rangeSlotLabel(s)}
                <button onClick={() => removeSlot(s)} className="text-[var(--color-text-muted)] hover:text-red-500 leading-none ml-0.5 select-none">✕</button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Custom add */}
      <button onClick={() => setShowCustom(v => !v)} className="text-sm text-[var(--color-brand-primary)] hover:underline">
        {showCustom ? '▲ 직접 입력 닫기' : '▼ 직접 시간 추가'}
      </button>
      {showCustom && (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
          <select value={startVal} onChange={e => setStartVal(Number(e.target.value))}
            className="flex-1 px-2 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)]">
            {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <span className="text-[var(--color-text-muted)] text-sm shrink-0">~</span>
          <select value={endVal} onChange={e => setEndVal(Number(e.target.value))}
            className="flex-1 px-2 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)]">
            {TIME_OPTIONS.filter(o => o.value > startVal).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={addSlot} disabled={endVal <= startVal}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-[var(--color-brand-primary)] text-white text-sm font-medium hover:brightness-95 disabled:opacity-40">
            추가
          </button>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  )
}
