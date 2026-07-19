import { useState } from 'react'
import type { LegendItem, LegendColor } from '../../../types'
import { BrandLegendIcon, isBrandLegendIcon } from '../../../lib/legendIcons'
import { StepHeader, WIZARD_STEPS } from '../StepHeader'
import { Field, ErrLine } from '../WizardField'
import { WizardIcon } from '../WizardIcons'

interface Props {
  legendItems: LegendItem[]
  error: string
  onChange: (items: LegendItem[]) => void
}

const COLORS: { key: LegendColor; label: string; hex: string }[] = [
  { key: 'amber',  label: '주황', hex: '#F59E0B' },
  { key: 'blue',   label: '파랑', hex: '#3B82F6' },
  { key: 'green',  label: '초록', hex: '#22C55E' },
  { key: 'red',    label: '빨강', hex: '#EF4444' },
  { key: 'purple', label: '보라', hex: '#A855F7' },
  { key: 'pink',   label: '핑크', hex: '#EC4899' },
  { key: 'indigo', label: '남색', hex: '#6366F1' },
  { key: 'slate',  label: '회색', hex: '#94A3B8' },
  { key: 'yellow', label: '노랑', hex: '#EAB308' },
  { key: 'black',  label: '검정', hex: '#3F3F46' },
]
const hexOf = (c: LegendColor) => COLORS.find(x => x.key === c)?.hex
const SUGGESTED: Omit<LegendItem, 'id'>[] = [
  { icon: '★', label: '특별 근무', color: 'amber' },
  { icon: '⚠', label: '주의 필요', color: 'red' },
  { icon: '✓', label: '완료',     color: 'green' },
]

export function Step6Legend({ legendItems, error, onChange }: Props) {
  const [label, setLabel] = useState('')
  const [icon, setIcon] = useState('★')
  const [color, setColor] = useState<LegendColor>('amber')
  const [url, setUrl] = useState('')

  function addItem() {
    if (!label.trim()) return
    onChange([...legendItems, { id: crypto.randomUUID(), icon, label: label.trim(), color, url: url.trim() || undefined }])
    setLabel('')
    setUrl('')
  }

  function addSuggested(s: Omit<LegendItem, 'id'>) {
    if (legendItems.some(i => i.label === s.label)) return
    onChange([...legendItems, { ...s, id: crypto.randomUUID() }])
  }

  return (
    <div className="step-body">
      <StepHeader step={WIZARD_STEPS[5]} />

      <div className="callout">
        <span className="callout-ic tone-pink"><WizardIcon.bulb size={15} /></span>
        <div><p className="callout-row">★ 특별 근무일 → 주황 · ✓ 완료 → 초록 · ⚠ 주의 → 빨강</p></div>
      </div>

      <Field label="추천 항목">
        <div className="chip-wrap">
          {SUGGESTED.map(s => (
            <button key={s.label} className="suggest-chip" onClick={() => addSuggested(s)}>
              <span className="sg-dot" style={{ background: hexOf(s.color) }} />
              <span className="sg-icon">{s.icon}</span>{s.label}
              <WizardIcon.plus size={12} sw={2.4} />
            </button>
          ))}
        </div>
      </Field>

      {legendItems.length > 0 && (
        <div className="row-list">
          {legendItems.map(item => (
            <div key={item.id} className="role-row">
              <span className="legend-icon">
                {isBrandLegendIcon(item.icon) ? <BrandLegendIcon value={item.icon} size={16} /> : item.icon}
              </span>
              <span className="role-name">{item.label}</span>
              <span className="legend-dot" style={{ background: hexOf(item.color) }} />
              <button className="iconbtn danger" onClick={() => onChange(legendItems.filter(i => i.id !== item.id))} aria-label="삭제">
                <WizardIcon.x size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="addbox">
        <p className="addbox-title">범례 추가</p>
        <div className="legend-add">
          <input className="ipt legend-iconinput" value={icon} maxLength={2} placeholder="★" onChange={e => setIcon(e.target.value)} />
          <input className="ipt" value={label} placeholder="범례 이름" onChange={e => setLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem()} />
        </div>
        <input className="ipt" type="url" value={url} placeholder="링크 URL (선택) — https://blog.naver.com/..." onChange={e => setUrl(e.target.value)} style={{ marginTop: '6px', width: '100%' }} />
        <div className="swatch-row">
          {COLORS.map(c => (
            <button key={c.key} className={`swatch${color === c.key ? ' on' : ''}`} style={{ background: c.hex }} title={c.label}
              onClick={() => setColor(c.key)} aria-label={c.label} />
          ))}
        </div>
        <button className="btn btn-dashed" disabled={!label.trim()} onClick={addItem}>
          <WizardIcon.plus size={15} sw={2} /> 추가
        </button>
      </div>

      <ErrLine error={error} />
    </div>
  )
}
