import { useState } from 'react'
import type { LegendItem, LegendColor } from '../../../types'

interface Props {
  legendItems: LegendItem[]
  error: string
  onChange: (items: LegendItem[]) => void
}

const COLORS: LegendColor[] = ['amber', 'blue', 'green', 'red', 'purple', 'pink', 'indigo', 'slate', 'yellow', 'black']
const COLOR_LABEL: Record<LegendColor, string> = {
  amber: '주황', blue: '파랑', green: '초록', red: '빨강', purple: '보라',
  pink: '핑크', indigo: '남색', slate: '회색', yellow: '노랑', black: '검정',
}
const COLOR_DOT: Record<LegendColor, string> = {
  amber: 'bg-amber-400', blue: 'bg-blue-500', green: 'bg-green-500', red: 'bg-red-500',
  purple: 'bg-purple-500', pink: 'bg-pink-400', indigo: 'bg-indigo-500', slate: 'bg-slate-400',
  yellow: 'bg-yellow-400', black: 'bg-zinc-800',
}
const SUGGESTED: Omit<LegendItem, 'id'>[] = [
  { icon: '★', label: '특별 근무', color: 'amber' },
  { icon: '⚠', label: '주의 필요', color: 'red' },
  { icon: '✓', label: '완료',     color: 'green' },
]

export function Step6Legend({ legendItems, error, onChange }: Props) {
  const [label, setLabel] = useState('')
  const [icon, setIcon] = useState('★')
  const [color, setColor] = useState<LegendColor>('amber')

  function addItem() {
    if (!label.trim()) return
    onChange([...legendItems, { id: crypto.randomUUID(), icon, label: label.trim(), color }])
    setLabel('')
  }

  function addSuggested(s: Omit<LegendItem, 'id'>) {
    if (legendItems.some(i => i.label === s.label)) return
    onChange([...legendItems, { ...s, id: crypto.randomUUID() }])
  }

  return (
    <div className="space-y-6">
      {/* Icon + header */}
      <div className="text-center space-y-2 pt-2">
        <div className="text-4xl select-none">🎨</div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">색상 범례를 추가할까요?</h2>
        <p className="text-[var(--color-text-muted)] text-sm leading-relaxed max-w-sm mx-auto">특별한 날이나 상태를 색상으로 구분할 수 있어요. 건너뛰어도 됩니다.</p>
      </div>

      {/* Example callout */}
      <div className="rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] px-4 py-3">
        <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-1">💡 예시</p>
        <p className="text-sm text-[var(--color-text-secondary)]">★ 특별 근무일 → 주황, ✓ 완료 → 초록, ⚠ 주의 필요 → 빨강</p>
      </div>

      {/* Suggestions */}
      <div>
        <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">추천 항목</p>
        <div className="flex gap-2 flex-wrap">
          {SUGGESTED.map(s => (
            <button key={s.label} onClick={() => addSuggested(s)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors select-none">
              <span>{s.icon}</span><span>{s.label}</span><span className="text-[10px] text-[var(--color-brand-primary)]">+</span>
            </button>
          ))}
        </div>
      </div>

      {/* Current items */}
      {legendItems.length > 0 && (
        <div className="space-y-1.5">
          {legendItems.map(item => (
            <div key={item.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
              <span className="text-base select-none">{item.icon}</span>
              <span className="flex-1 text-sm text-[var(--color-text-primary)]">{item.label}</span>
              <span className={`w-3 h-3 rounded-full shrink-0 ${COLOR_DOT[item.color]}`} />
              <button onClick={() => onChange(legendItems.filter(i => i.id !== item.id))}
                className="text-[var(--color-text-muted)] hover:text-red-500 text-sm select-none">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      <div className="space-y-3 p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
        <div className="flex gap-2">
          <input value={icon} onChange={e => setIcon(e.target.value)} maxLength={2}
            className="w-12 text-center px-2 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-lg text-[var(--color-text-primary)]" placeholder="★" />
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="범례 이름"
            onKeyDown={e => e.key === 'Enter' && addItem()}
            className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30 focus:border-[var(--color-brand-primary)]" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} title={COLOR_LABEL[c]}
              className={`w-6 h-6 rounded-full transition-all ${COLOR_DOT[c]} ${color === c ? 'ring-2 ring-offset-1 ring-[var(--color-brand-primary)]' : 'opacity-60 hover:opacity-100'}`} />
          ))}
        </div>
        <button onClick={addItem} disabled={!label.trim()}
          className="w-full py-2 rounded-xl text-sm font-semibold border-2 border-dashed border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/5 disabled:opacity-40 transition-colors">
          + 추가
        </button>
      </div>

      {/* Error */}
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  )
}
