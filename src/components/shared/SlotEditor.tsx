import { useState } from 'react'
import { buildSlot, parseSlotLabel, SLOT_TEMPLATES } from '../../utils/timeSlots'

function makeTimeOption(halfHours: number) {
  const h = Math.floor(halfHours / 2)
  const m = halfHours % 2 === 0 ? '00' : '30'
  return { value: halfHours / 2, label: `${h}:${m}` }
}

const START_OPTIONS = Array.from({ length: 48 }, (_, i) => makeTimeOption(i))
const END_OPTIONS   = Array.from({ length: 48 }, (_, i) => makeTimeOption(i + 1))

const selectCls = 'px-2 py-1.5 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30 focus:border-[var(--color-brand-primary)]'

interface SlotEditorProps {
  slots: string[]
  onChange: (slots: string[]) => void
}

export function SlotEditor({ slots, onChange }: SlotEditorProps) {
  const [start, setStart] = useState(9)
  const [end, setEnd]     = useState(10)
  const [msg, setMsg]     = useState('')

  function applyTemplate(templateSlots: string[]) {
    setMsg('')
    onChange(templateSlots)
  }

  function handleAdd() {
    if (end <= start) { setMsg('종료 시간은 시작 시간보다 커야 합니다.'); return }
    const slot = buildSlot(start, end)
    if (slots.includes(slot)) { setMsg('이미 등록된 슬롯입니다.'); return }
    setMsg('')
    onChange([...slots, slot].sort((a, b) => parseFloat(a) - parseFloat(b)))
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs text-[var(--color-text-secondary)] font-medium mb-2">템플릿 적용</p>
        <div className="flex gap-2 flex-wrap">
          {SLOT_TEMPLATES.map(t => (
            <button
              key={t.label}
              type="button"
              onClick={() => applyTemplate(t.slots)}
              className="px-3 py-1.5 text-xs rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-[var(--color-text-secondary)] font-medium mb-2">직접 추가</p>
        <div className="flex items-end gap-2 flex-wrap">
          <div>
            <label className="block text-xs text-[var(--color-text-secondary)] mb-1">시작</label>
            <select value={start} onChange={e => setStart(Number(e.target.value))} className={selectCls}>
              {START_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--color-text-secondary)] mb-1">종료</label>
            <select value={end} onChange={e => setEnd(Number(e.target.value))} className={selectCls}>
              {END_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="px-3 py-1.5 text-sm border border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] rounded-xl hover:bg-[var(--color-surface-hover)]"
          >
            + 추가
          </button>
        </div>
        {msg && <p className="text-xs text-red-500 mt-1">{msg}</p>}
      </div>

      {slots.length === 0 ? (
        <p className="text-xs text-[var(--color-text-secondary)]">슬롯 없음 — 템플릿을 적용하거나 직접 추가하세요.</p>
      ) : (
        <ul className="space-y-1">
          {slots.map(slot => (
            <li key={slot} className="flex items-center justify-between px-3 py-1.5 bg-[var(--color-surface-secondary)] rounded-xl">
              <span className="text-sm text-[var(--color-text-primary)]">{parseSlotLabel(slot)}</span>
              <button
                type="button"
                onClick={() => onChange(slots.filter(s => s !== slot))}
                className="text-xs text-red-500 hover:text-red-700 ml-3"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
