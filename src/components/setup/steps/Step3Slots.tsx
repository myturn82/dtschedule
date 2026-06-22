import { useState } from 'react'
import { SLOT_TEMPLATES, buildSlot, rangeSlotLabel } from '../../../utils/timeSlots'
import { StepHeader, WIZARD_STEPS } from '../StepHeader'
import { Field, ErrLine } from '../WizardField'
import { WizardIcon } from '../WizardIcons'

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
    <div className="step-body">
      <StepHeader step={WIZARD_STEPS[2]} />

      <div className="callout">
        <span className="callout-ic tone-teal"><WizardIcon.bulb size={15} /></span>
        <div>
          <p className="callout-row">1시간 단위 — 09:00~10:00, 10:00~11:00</p>
          <p className="callout-row">2시간 단위 — 09:00~11:00, 11:00~13:00</p>
        </div>
      </div>

      <Field label="빠른 선택">
        <div className="tpl-grid">
          {SLOT_TEMPLATES.map((t, i) => (
            <button key={t.label} className={`tpl-card${selectedTemplate === i ? ' on' : ''}`} onClick={() => applyTemplate(i)}>
              <span className="tpl-label">{t.label}</span>
              <span className="tpl-sub">{t.slots.length}개 슬롯</span>
            </button>
          ))}
        </div>
      </Field>

      {slots.length > 0 && (
        <Field label={`선택된 슬롯 ${slots.length}개`}>
          <div className="chip-wrap">
            {slots.map(s => (
              <span key={s} className="slot-chip">
                {rangeSlotLabel(s)}
                <button onClick={() => removeSlot(s)} aria-label="삭제"><WizardIcon.x size={11} sw={2.2} /></button>
              </span>
            ))}
          </div>
        </Field>
      )}

      <button className="link-btn" onClick={() => setShowCustom(v => !v)}>
        <WizardIcon.chevron size={14} style={{ transform: showCustom ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
        직접 시간 추가
      </button>
      {showCustom && (
        <div className="custom-add">
          <div className="sel-wrap">
            <select className="sel" value={startVal} onChange={e => setStartVal(Number(e.target.value))}>
              {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <WizardIcon.chevron size={14} className="sel-chev" />
          </div>
          <span className="tilde">~</span>
          <div className="sel-wrap">
            <select className="sel" value={endVal} onChange={e => setEndVal(Number(e.target.value))}>
              {TIME_OPTIONS.filter(o => o.value > startVal).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <WizardIcon.chevron size={14} className="sel-chev" />
          </div>
          <button className="btn btn-primary" disabled={endVal <= startVal} onClick={addSlot}>추가</button>
        </div>
      )}

      <ErrLine error={error} />
    </div>
  )
}
