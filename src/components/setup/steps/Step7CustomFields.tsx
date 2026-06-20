import { useState } from 'react'
import type { CustomFieldDef, CustomFieldType } from '../../../types'

interface Props {
  fields: CustomFieldDef[]
  isFreeform: boolean
  saving: boolean
  error: string
  onChange: (fields: CustomFieldDef[]) => void
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

const FIELD_TYPES: { value: CustomFieldType; label: string }[] = [
  { value: 'text',    label: '텍스트' },
  { value: 'phone',   label: '전화번호' },
  { value: 'number',  label: '숫자' },
  { value: 'select',  label: '드롭다운' },
  { value: 'checkbox', label: '체크박스' },
]

export function Step7CustomFields({ fields, isFreeform, saving, error, onChange, onNext, onBack, onSkip }: Props) {
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
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">
          커스텀 필드 설정
          {isFreeform
            ? <span className="ml-2 text-sm font-normal text-orange-500">필수</span>
            : <span className="ml-2 text-sm font-normal text-[var(--color-text-muted)]">(선택)</span>
          }
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          {isFreeform
            ? '비회원 모드: 첫 번째 필드가 이름 필드로 사용됩니다.'
            : '배정 등록 시 추가로 입력받을 정보를 정의합니다.'}
        </p>
      </div>

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

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button onClick={onBack} className="flex-1 py-3 rounded-xl text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors">← 이전</button>
        {!isFreeform && (
          <button onClick={onSkip} className="flex-1 py-3 rounded-xl text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] transition-colors">건너뛰기</button>
        )}
        <button onClick={onNext} disabled={(isFreeform && fields.length === 0) || saving}
          className="flex-[2] py-3 rounded-xl font-semibold text-sm bg-[var(--color-brand-primary)] text-white disabled:opacity-40 hover:brightness-95 transition-all">
          {saving ? '저장 중...' : '완료 →'}
        </button>
      </div>
    </div>
  )
}
