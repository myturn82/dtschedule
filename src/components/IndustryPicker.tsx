import { useState, useEffect } from 'react'
import { INDUSTRY_CATEGORIES } from '../data/industryCategories'

interface Props {
  value: string
  onChange: (v: string) => void
  inputCls?: string
}

function parseValue(value: string): { topLabel: string; midLabel: string; custom: string } {
  if (!value) return { topLabel: '', midLabel: '', custom: '' }
  const parts = value.split(' / ')
  const topLabel = parts[0] ?? ''
  const midLabel = parts[1] ?? ''
  const topCat = INDUSTRY_CATEGORIES.find(c => c.label === topLabel)
  if (!topCat) return { topLabel: '', midLabel: '', custom: value }
  if (topCat.value === 'etc') return { topLabel, midLabel: '', custom: midLabel }
  const midCat = topCat.children.find(c => c.label === midLabel)
  if (midLabel && !midCat) return { topLabel, midLabel: 'other', custom: midLabel }
  if (midLabel === '기타') return { topLabel, midLabel: 'other', custom: '' }
  return { topLabel, midLabel: midCat?.value ?? '', custom: '' }
}

export function IndustryPicker({ value, onChange, inputCls }: Props) {
  const cls = inputCls ?? 'w-full px-3 py-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30 focus:border-[var(--color-brand-primary)]'
  const labelCls = 'block text-xs text-[var(--color-text-secondary)] mb-1'

  const parsed = parseValue(value)
  const [selTop, setSelTop] = useState(parsed.topLabel)
  const [selMid, setSelMid] = useState(parsed.midLabel)
  const [custom, setCustom]  = useState(parsed.custom)

  useEffect(() => {
    const p = parseValue(value)
    setSelTop(p.topLabel)
    setSelMid(p.midLabel)
    setCustom(p.custom)
  }, [value])

  const topCat = INDUSTRY_CATEGORIES.find(c => c.label === selTop)
  const hasChildren = topCat && topCat.children.length > 0
  const isEtcTop = topCat?.value === 'etc'
  const isEtcMid = selMid === 'other'
  const showCustom = isEtcTop || isEtcMid

  function emit(top: string, mid: string, cur: string) {
    const topC = INDUSTRY_CATEGORIES.find(c => c.label === top)
    if (!top) { onChange(''); return }
    if (!topC) { onChange(top); return }
    if (topC.value === 'etc') {
      onChange(cur ? `기타 / ${cur}` : '기타')
      return
    }
    if (!mid) { onChange(top); return }
    if (mid === 'other') {
      onChange(cur ? `기타 / ${cur}` : `${top} / 기타`)
      return
    }
    const midC = topC.children.find(c => c.value === mid)
    onChange(midC ? `${top} / ${midC.label}` : top)
  }

  function handleTopChange(label: string) {
    setSelTop(label)
    setSelMid('')
    setCustom('')
    emit(label, '', '')
  }

  function handleMidChange(midVal: string) {
    setSelMid(midVal)
    setCustom('')
    emit(selTop, midVal, '')
  }

  function handleCustomChange(text: string) {
    setCustom(text)
    emit(selTop, selMid, text)
  }

  return (
    <div className="space-y-2">
      <div>
        <label className={labelCls}>업종 (선택)</label>
        <select
          value={selTop}
          onChange={e => handleTopChange(e.target.value)}
          className={cls}
        >
          <option value="">업종을 선택하세요</option>
          {INDUSTRY_CATEGORIES.map(c => (
            <option key={c.value} value={c.label}>{c.label}</option>
          ))}
        </select>
      </div>

      {selTop && hasChildren && (
        <div>
          <label className={labelCls}>세부 업종</label>
          <select
            value={selMid}
            onChange={e => handleMidChange(e.target.value)}
            className={cls}
          >
            <option value="">세부 업종 선택 (선택)</option>
            {topCat!.children.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      )}

      {selTop && showCustom && (
        <div>
          <label className={labelCls}>직접 입력</label>
          <input
            type="text"
            value={custom}
            onChange={e => handleCustomChange(e.target.value)}
            placeholder="업종을 직접 입력하세요"
            className={cls}
          />
        </div>
      )}
    </div>
  )
}
