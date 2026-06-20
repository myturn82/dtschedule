import { useState } from 'react'
import type { CustomFieldDef, CustomFieldType } from '../../../types'

interface Props {
  fields: CustomFieldDef[]
  isFreeform: boolean
  error: string
  onChange: (fields: CustomFieldDef[]) => void
}

const FIELD_TYPES: { value: CustomFieldType; label: string }[] = [
  { value: 'text',    label: '텍스트' },
  { value: 'phone',   label: '전화번호' },
  { value: 'number',  label: '숫자' },
  { value: 'select',  label: '드롭다운' },
  { value: 'checkbox', label: '체크박스' },
]

export function Step7CustomFields({ fields, isFreeform, error, onChange }: Props) {
  const [label, setLabel] = useState('')
  const [type, setType] = useState<CustomFieldType>('text')
  const [required, setRequired] = useState(false)

  function addField() {
    if (!label.trim()) return
    onChange([...fields, { id: crypto.randomUUID(), label: label.trim(), type, required }])
    setLabel('')
    setType('text')
    setRequired(false)
  }

  function quickAdd(preLabel: string, preType: CustomFieldType, preRequired: boolean) {
    if (fields.some(f => f.label === preLabel)) return
    onChange([...fields, { id: crypto.randomUUID(), label: preLabel, type: preType, required: preRequired }])
  }

  return (
    <div className="space-y-6">
      {/* Icon + header */}
      <div className="text-center space-y-2 pt-2">
        <div className="text-4xl select-none">📝</div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
          {isFreeform ? '방문자 정보를 설정해주세요' : '추가 정보를 수집할까요?'}
        </h2>
        <p className="text-[var(--color-text-muted)] text-sm leading-relaxed max-w-sm mx-auto">
          {isFreeform
            ? '첫 번째 필드가 이름으로 사용됩니다. 연락처도 추가해두면 편리합니다.'
            : '배정 등록 시 이름·연락처 외에 더 받을 정보를 설정합니다. 건너뛰어도 됩니다.'}
        </p>
      </div>

      {/* Example callout (non-freeform only) */}
      {!isFreeform && (
        <div className="rounded-2xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] px-4 py-3">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-1">💡 예시</p>
          <p className="text-sm text-[var(--color-text-secondary)]">부서명, 신청 확인번호, 메모</p>
        </div>
      )}

      {/* Quick-add suggestions */}
      {fields.length < 3 && (
        <div className="flex gap-2 flex-wrap">
          {[
            { label: '이름', type: 'text' as CustomFieldType, required: true },
            { label: '연락처', type: 'phone' as CustomFieldType, required: false },
            { label: '부서', type: 'text' as CustomFieldType, required: false },
          ].map(s => (
            <button key={s.label} onClick={() => quickAdd(s.label, s.type, s.required)}
              disabled={fields.some(f => f.label === s.label)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <span>+ {s.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Current fields */}
      {fields.length > 0 && (
        <div className="space-y-1.5">
          {fields.map((f, i) => (
            <div key={f.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
              <span className="text-xs text-[var(--color-text-muted)] w-4 text-center">{i + 1}</span>
              <span className="flex-1 text-sm font-medium text-[var(--color-text-primary)]">{f.label}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)]">{f.type}</span>
              {f.required && <span className="text-[10px] text-red-500 font-medium">필수</span>}
              <button onClick={() => onChange(fields.filter(x => x.id !== f.id))}
                className="text-[var(--color-text-muted)] hover:text-red-500 text-sm select-none">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      <div className="space-y-3 p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="필드 이름 (예: 신청번호, 메모)"
          onKeyDown={e => e.key === 'Enter' && addField()}
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30 focus:border-[var(--color-brand-primary)]" />
        <div className="flex gap-1.5 flex-wrap">
          {FIELD_TYPES.map(t => (
            <button key={t.value} onClick={() => setType(t.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                type === t.value
                  ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/8 text-[var(--color-brand-primary)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-brand-primary)]/40'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={required} onChange={e => setRequired(e.target.checked)}
            className="w-4 h-4 rounded accent-[var(--color-brand-primary)]" />
          <span className="text-sm text-[var(--color-text-secondary)]">필수 입력</span>
        </label>
        <button onClick={addField} disabled={!label.trim()}
          className="w-full py-2 rounded-xl text-sm font-semibold border-2 border-dashed border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/5 disabled:opacity-40 transition-colors">
          + 필드 추가
        </button>
      </div>

      {/* Error */}
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  )
}
