import { useState } from 'react'
import type { CustomFieldDef, CustomFieldType, CustomFieldOption, OptionValueType } from '../../../types'
import { FIELD_TYPES_WITH_OPTIONS, FIELD_TYPES_WITH_DASHBOARD, OPTION_VALUE_TYPES, getOptionUnit } from '../../../types'
import { CUSTOM_FIELD_TEMPLATES } from '../../../utils/customFieldTemplates'

const OPT_PLACEHOLDER: Record<string, { name: string; value: string }> = {
  none:     { name: '예: 일반, 특별, 기타',    value: '예: normal, special' },
  amount:   { name: '예: 기본, 청소년, 경로',  value: '예: 10000, 5000, 3000' },
  quantity: { name: '예: 소, 중, 대',          value: '예: 1, 5, 10' },
  people:   { name: '예: 1인, 2인, 단체',      value: '예: 1, 2, 10' },
}

interface Props {
  fields: CustomFieldDef[]
  isFreeform: boolean
  error: string
  onChange: (fields: CustomFieldDef[]) => void
}

const FIELD_TYPE_DEFS: { value: CustomFieldType; label: string; badgeCls: string }[] = [
  { value: 'text',          label: '텍스트',   badgeCls: 'bg-slate-100 text-slate-600' },
  { value: 'number',        label: '숫자',     badgeCls: 'bg-blue-100 text-blue-700' },
  { value: 'select',        label: '드롭다운', badgeCls: 'bg-purple-100 text-purple-700' },
  { value: 'checkbox_group',label: '체크박스', badgeCls: 'bg-green-100 text-green-700' },
  { value: 'checkbox',      label: '동의',     badgeCls: 'bg-orange-100 text-orange-700' },
  { value: 'phone',         label: '전화번호', badgeCls: 'bg-pink-100 text-pink-700' },
  { value: 'account_number',label: '계좌번호', badgeCls: 'bg-yellow-100 text-yellow-700' },
  { value: 'radio',         label: '라디오',   badgeCls: 'bg-cyan-100 text-cyan-700' },
]

function CfTypeIcon({ type, size = 12 }: { type: CustomFieldType; size?: number }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (type === 'text') return <svg {...p}><path d="M4 7V5h16v2M9 19h6M12 5v14"/></svg>
  if (type === 'number') return <svg {...p}><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></svg>
  if (type === 'select') return <svg {...p}><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="3.5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="3.5" cy="18" r="1" fill="currentColor" stroke="none"/></svg>
  if (type === 'radio') return <svg {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>
  if (type === 'checkbox') return <svg {...p}><rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 3 3 5-6"/></svg>
  if (type === 'checkbox_group') return <svg {...p}><rect x="2" y="4" width="7" height="7" rx="1.5"/><path d="m3.5 7.5 1.5 1.5 3-3"/><rect x="2" y="13" width="7" height="7" rx="1.5"/><path d="m3.5 16.5 1.5 1.5 3-3"/><path d="M12 7h10M12 17h10"/></svg>
  if (type === 'phone') return <svg {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-1Z"/></svg>
  if (type === 'account_number') return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 10h18"/></svg>
  return null
}

function FieldPreview({ field }: { field: CustomFieldDef }) {
  const cls = 'h-[34px] border border-transparent rounded-lg px-3 text-[13.5px] font-medium bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] w-full'
  return (
    <div className="pointer-events-none mt-3">
      {field.type === 'text' && <input type="text" disabled placeholder={field.placeholder || `${field.label} 입력`} className={cls} />}
      {field.type === 'number' && <input type="number" disabled placeholder={field.placeholder || '0'} min={field.min} max={field.max} className={cls} />}
      {field.type === 'select' && (
        <select disabled className={cls}>
          <option>{field.placeholder || `-- ${field.label} 선택 --`}</option>
          {(field.options ?? []).slice(0, 4).map(opt => <option key={opt.value}>{opt.name}</option>)}
        </select>
      )}
      {field.type === 'radio' && (
        <div className="flex gap-4 flex-wrap py-1 min-h-[36px] items-center">
          {(field.options ?? []).length === 0
            ? <span className="text-xs text-[var(--color-text-muted)]">옵션을 추가하세요</span>
            : (field.options ?? []).map(opt => <label key={opt.value} className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] cursor-default"><input type="radio" disabled readOnly /> {opt.name}</label>)}
        </div>
      )}
      {field.type === 'checkbox' && (
        <label className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] py-1 cursor-default min-h-[36px]">
          <input type="checkbox" disabled readOnly /> {field.label}
        </label>
      )}
      {field.type === 'checkbox_group' && (
        <div className="flex gap-4 flex-wrap py-1 min-h-[36px] items-center">
          {(field.options ?? []).length === 0
            ? <span className="text-xs text-[var(--color-text-muted)]">옵션을 추가하세요</span>
            : (field.options ?? []).map(opt => <label key={opt.value} className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] cursor-default"><input type="checkbox" disabled readOnly /> {opt.name}</label>)}
        </div>
      )}
      {field.type === 'phone' && <input type="tel" disabled placeholder={field.placeholder || '010-0000-0000'} className={cls} />}
      {field.type === 'account_number' && <input type="text" disabled placeholder={field.placeholder || '계좌번호 입력 (숫자)'} className={cls} />}
    </div>
  )
}

const BLANK_EDIT = (): Omit<CustomFieldDef, 'id'> => ({ label: '', type: 'text', required: true, options: [], placeholder: '', show_in_dashboard: false, min: undefined, max: undefined })

function RequiredBtn({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className={`inline-flex items-center gap-2 h-[34px] px-[13px] pl-[10px] border rounded-lg text-[13px] font-semibold whitespace-nowrap shrink-0 transition-all ${active ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]' : 'border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'}`}>
      <span className={`w-[17px] h-[17px] rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0 transition-all ${active ? 'bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)]' : 'border-[var(--color-border-strong)]'}`}>
        {active && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
      </span>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/></svg>
      필수
    </button>
  )
}

function DashBtn({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className={`self-start inline-flex items-center gap-2 h-[34px] px-[13px] pl-[10px] border rounded-lg text-[13px] font-semibold whitespace-nowrap transition-all ${active ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]' : 'border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'}`}>
      <span className={`w-[17px] h-[17px] rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0 transition-all ${active ? 'bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)]' : 'border-[var(--color-border-strong)]'}`}>
        {active && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
      </span>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="5" rx="0.6"/><rect x="12" y="8" width="3" height="9" rx="0.6"/><rect x="17" y="5" width="3" height="12" rx="0.6"/></svg>
      대시보드 통계 포함
    </button>
  )
}

function OptionsEditor({ options, onUpdate }: { options: CustomFieldOption[]; onUpdate: (opts: CustomFieldOption[]) => void }) {
  return (
      <div className="flex flex-col gap-[7px]">
        <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">선택지 <span className="font-semibold text-[var(--color-text-muted)] ml-1">유형 · 표시명 · 저장값</span></label>
        <div className="flex flex-col gap-2">
          {options.map((opt, oi) => {
            const unit = getOptionUnit(opt.value_type)
            return (
              <div key={oi} className="flex items-center gap-2 p-[7px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[10px] flex-wrap sm:flex-nowrap">
                <span className="text-[var(--color-text-muted)] shrink-0 opacity-50">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="15" cy="18" r="1.4"/></svg>
                </span>
                <div className="relative w-[84px] shrink-0">
                  <select value={opt.value_type ?? 'none'}
                    onChange={e => onUpdate(options.map((o, i) => i === oi ? { ...o, value_type: e.target.value as OptionValueType } : o))}
                    className="w-full h-[34px] px-[10px] pr-[26px] bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-strong)] rounded-lg text-[12.5px] font-bold outline-none appearance-none cursor-pointer focus:border-[var(--color-brand-primary)]">
                    {OPTION_VALUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <svg className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
                <input type="text" value={opt.name}
                  placeholder={OPT_PLACEHOLDER[opt.value_type ?? 'none']?.name ?? '표시명'}
                  onChange={e => onUpdate(options.map((o, i) => i === oi ? { ...o, name: e.target.value } : o))}
                  className="flex-[1_1_38%] h-[34px] min-w-0 px-3 bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-strong)] rounded-lg text-sm font-medium outline-none focus:border-[var(--color-brand-primary)] placeholder:text-[var(--color-text-muted)]" />
                <div className="flex-[1_1_38%] flex items-center gap-1.5 min-w-0">
                  <input type="text" value={opt.value}
                    placeholder={OPT_PLACEHOLDER[opt.value_type ?? 'none']?.value ?? '저장값'}
                    onChange={e => onUpdate(options.map((o, i) => i === oi ? { ...o, value: e.target.value } : o))}
                    className="flex-1 min-w-0 h-[34px] px-3 bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-strong)] rounded-lg text-sm font-medium outline-none focus:border-[var(--color-brand-primary)] placeholder:text-[var(--color-text-muted)]" />
                  {unit && <span className="text-[12.5px] font-bold text-[var(--color-text-muted)] shrink-0">{unit}</span>}
                </div>
                <button type="button" onClick={() => onUpdate(options.filter((_, i) => i !== oi))}
                  className="w-[28px] h-[28px] shrink-0 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-orange-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>
            )
          })}
          <button type="button" onClick={() => onUpdate([...options, { name: '', value: '', value_type: 'none' }])}
            className="flex items-center justify-center gap-1.5 h-[38px] border border-dashed border-[var(--color-border-strong)] rounded-[10px] text-[var(--color-text-muted)] text-[13px] font-bold transition-all hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            옵션 추가
          </button>
        </div>
      </div>
    )
}

export function Step7CustomFields({ fields, isFreeform, error, onChange }: Props) {
  const inputCls = 'h-[34px] border border-[var(--color-border-strong)] rounded-lg px-3 text-[13.5px] font-medium bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-brand-primary)] w-full'

  const [newLabel, setNewLabel]             = useState('')
  const [newType, setNewType]               = useState<CustomFieldType>('text')
  const [newRequired, setNewRequired]       = useState(true)
  const [newOptions, setNewOptions]         = useState<CustomFieldOption[]>([])
  const [newPlaceholder, setNewPlaceholder] = useState('')
  const [newMin, setNewMin]                 = useState('')
  const [newMax, setNewMax]                 = useState('')
  const [newDash, setNewDash]               = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editField, setEditField] = useState<Omit<CustomFieldDef, 'id'>>(BLANK_EDIT())

  function startEdit(field: CustomFieldDef) {
    setEditingId(field.id)
    setEditField({ label: field.label, type: field.type, required: field.required, options: field.options ?? [], placeholder: field.placeholder ?? '', show_in_dashboard: field.show_in_dashboard ?? false, min: field.min, max: field.max })
  }

  function saveEdit() {
    if (!editingId || !editField.label.trim()) return
    const next = fields.map(f =>
      f.id === editingId
        ? {
            ...f,
            label: editField.label.trim(),
            type: editField.type,
            required: editField.type !== 'checkbox' && editField.required,
            options: FIELD_TYPES_WITH_OPTIONS.includes(editField.type) ? (editField.options ?? []).filter(o => o.name.trim() || o.value.trim()) : undefined,
            placeholder: ['text', 'number', 'select', 'phone', 'account_number'].includes(editField.type) ? (editField.placeholder?.trim() || undefined) : undefined,
            show_in_dashboard: FIELD_TYPES_WITH_DASHBOARD.includes(editField.type) && editField.show_in_dashboard ? true : undefined,
            min: editField.type === 'number' ? editField.min : undefined,
            max: editField.type === 'number' ? editField.max : undefined,
          }
        : f
    )
    onChange(next)
    setEditingId(null)
  }

  function removeField(id: string) {
    onChange(fields.filter(f => f.id !== id))
  }

  function moveField(id: string, dir: -1 | 1) {
    const idx = fields.findIndex(f => f.id === id)
    if (idx < 0) return
    const next = [...fields]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onChange(next)
  }

  function addField(e: React.FormEvent) {
    e.preventDefault()
    if (!newLabel.trim()) return
    const newField: CustomFieldDef = {
      id: crypto.randomUUID(),
      label: newLabel.trim(),
      type: newType,
      required: newType !== 'checkbox' && newRequired,
      options: FIELD_TYPES_WITH_OPTIONS.includes(newType) ? newOptions.filter(o => o.name.trim() || o.value.trim()) : undefined,
      placeholder: ['text', 'number', 'select', 'phone', 'account_number'].includes(newType) ? (newPlaceholder.trim() || undefined) : undefined,
      show_in_dashboard: FIELD_TYPES_WITH_DASHBOARD.includes(newType) && newDash ? true : undefined,
      min: newType === 'number' && newMin !== '' ? Number(newMin) : undefined,
      max: newType === 'number' && newMax !== '' ? Number(newMax) : undefined,
    }
    onChange([...fields, newField])
    setNewLabel(''); setNewType('text'); setNewRequired(true)
    setNewOptions([]); setNewPlaceholder(''); setNewMin(''); setNewMax(''); setNewDash(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* 자주 쓰는 항목 */}
      <div>
        <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">자주 쓰는 항목</p>
        <div className="flex flex-wrap gap-2">
          {CUSTOM_FIELD_TEMPLATES.map(tpl => {
            const alreadyAdded = fields.some(f => f.label.trim() === tpl.field.label)
            return (
              <button
                key={tpl.label}
                type="button"
                disabled={alreadyAdded}
                onClick={() => onChange([...fields, { id: crypto.randomUUID(), ...tpl.field }])}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-border)] text-[13px] font-semibold text-[var(--color-text-secondary)] hover:border-[var(--color-brand-primary)]/50 hover:text-[var(--color-brand-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                {alreadyAdded ? `${tpl.label} 추가됨` : tpl.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 필드 카드 목록 */}
      {fields.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {fields.map((field, idx) => {
            const isEd = editingId === field.id
            const td = FIELD_TYPE_DEFS.find(t => t.value === field.type)
            return (
              <div key={field.id}
                className={`bg-[var(--color-surface)] border rounded-2xl transition-all duration-[140ms] ${isEd ? 'border-[var(--color-brand-primary)] ring-2 ring-[var(--color-brand-primary)]/20 shadow-md cursor-default' : 'border-[var(--color-border)] shadow-sm hover:border-[var(--color-border-strong)] hover:shadow-md cursor-pointer'}`}
                style={{ padding: '13px' }}
                onClick={() => { if (!isEd) startEdit(field) }}>

                {/* 읽기 상태 */}
                {!isEd && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full text-[11.5px] font-bold px-2.5 py-1 shrink-0 ${td?.badgeCls ?? 'bg-slate-100 text-slate-600'}`}>
                        <CfTypeIcon type={field.type} size={12} />
                        {td?.label ?? field.type}
                      </span>
                      {idx === 0 && isFreeform && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] font-semibold shrink-0">이름</span>
                      )}
                      <span className="text-[15px] font-bold text-[var(--color-text-primary)] tracking-tight truncate flex-1 min-w-0">{field.label}</span>
                      {field.required && <span className="shrink-0 text-[11px] font-bold px-2.5 py-[3px] rounded-full text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10">필수</span>}
                      {field.show_in_dashboard && (
                        <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-[3px] rounded-full text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="5" rx="0.6"/><rect x="12" y="8" width="3" height="9" rx="0.6"/><rect x="17" y="5" width="3" height="12" rx="0.6"/></svg>
                          대시보드
                        </span>
                      )}
                      <div className="flex items-center gap-0.5 shrink-0 ml-0.5" onClick={e => e.stopPropagation()}>
                        <button type="button" disabled={idx === 0} onClick={() => moveField(field.id, -1)}
                          className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-30 transition-colors">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                        </button>
                        <button type="button" disabled={idx === fields.length - 1} onClick={() => moveField(field.id, 1)}
                          className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-30 transition-colors">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
                        </button>
                        <span className="w-px h-[18px] bg-[var(--color-border)] mx-1" />
                        <button type="button" onClick={() => startEdit(field)}
                          className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        </button>
                        <button type="button"
                          onClick={e => { e.stopPropagation(); if (!confirm(`"${field.label}" 필드를 삭제할까요?`)) return; removeField(field.id) }}
                          className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-orange-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                        </button>
                      </div>
                    </div>
                    <FieldPreview field={field} />
                  </>
                )}

                {/* 편집 상태 */}
                {isEd && (
                  <div className="flex flex-col gap-[10px]" onClick={e => e.stopPropagation()}>
                    <div className="flex flex-col gap-[7px]">
                      <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">필드명</label>
                      <input type="text" value={editField.label} placeholder="필드명"
                        onChange={e => setEditField(f => ({ ...f, label: e.target.value }))}
                        className={inputCls} />
                    </div>
                    <div className="flex gap-2.5 items-end flex-wrap">
                      <div className="flex flex-col gap-[7px] flex-1 min-w-[120px]">
                        <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">타입</label>
                        <div className="relative">
                          <select value={editField.type}
                            onChange={e => setEditField(f => ({ ...f, type: e.target.value as CustomFieldType }))}
                            className={inputCls + ' pr-8 appearance-none'}>
                            {FIELD_TYPE_DEFS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                      </div>
                      {editField.type !== 'checkbox' && (
                        <RequiredBtn active={editField.required} onToggle={() => setEditField(f => ({ ...f, required: !f.required }))} />
                      )}
                    </div>
                    {FIELD_TYPES_WITH_OPTIONS.includes(editField.type) && (
                      <OptionsEditor
                        options={editField.options ?? []}
                        onUpdate={opts => setEditField(f => ({ ...f, options: opts }))}
                      />
                    )}
                    {editField.type === 'number' && (
                      <div className="flex gap-2">
                        <div className="flex-1 flex flex-col gap-[7px]">
                          <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">최솟값</label>
                          <input type="number" value={editField.min ?? ''} placeholder="없음"
                            onChange={e => setEditField(f => ({ ...f, min: e.target.value !== '' ? Number(e.target.value) : undefined }))}
                            className={inputCls} />
                        </div>
                        <div className="flex-1 flex flex-col gap-[7px]">
                          <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">최댓값</label>
                          <input type="number" value={editField.max ?? ''} placeholder="없음"
                            onChange={e => setEditField(f => ({ ...f, max: e.target.value !== '' ? Number(e.target.value) : undefined }))}
                            className={inputCls} />
                        </div>
                      </div>
                    )}
                    {['text', 'number', 'select', 'phone', 'account_number'].includes(editField.type) && (
                      <div className="flex flex-col gap-[7px]">
                        <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">플레이스홀더 <span className="font-semibold text-[var(--color-text-muted)] ml-1">선택</span></label>
                        <input type="text" value={editField.placeholder ?? ''} placeholder="입력 안내 문구"
                          onChange={e => setEditField(f => ({ ...f, placeholder: e.target.value }))}
                          className={inputCls} />
                      </div>
                    )}
                    {FIELD_TYPES_WITH_DASHBOARD.includes(editField.type) && (
                      <DashBtn active={editField.show_in_dashboard ?? false} onToggle={() => setEditField(f => ({ ...f, show_in_dashboard: !f.show_in_dashboard }))} />
                    )}
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={saveEdit}
                        className="inline-flex items-center justify-center h-[34px] px-4 bg-[var(--color-brand-primary)] text-white rounded-lg text-[13.5px] font-bold hover:brightness-95 transition-colors">
                        저장
                      </button>
                      <button type="button" onClick={() => setEditingId(null)}
                        className="inline-flex items-center justify-center h-[34px] px-4 bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border-strong)] rounded-lg text-[13.5px] font-bold hover:bg-[var(--color-surface-secondary)] transition-colors">
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 새 항목 구분선 */}
      {fields.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--color-border)]" />
          <span className="text-[11px] font-bold text-[var(--color-text-muted)] tracking-[0.4px] uppercase">새 항목</span>
          <div className="h-px flex-1 bg-[var(--color-border)]" />
        </div>
      )}

      {/* 새 필드 추가 폼 */}
      <form onSubmit={addField}
        className="border-[1.5px] border-dashed border-[var(--color-border-strong)] rounded-[18px] bg-[var(--color-surface-secondary)] flex flex-col gap-[10px]"
        style={{ padding: '13px' }}>
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-[11px] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] flex items-center justify-center shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          </span>
          <div>
            <p className="m-0 text-[15px] font-extrabold tracking-tight text-[var(--color-text-primary)]">새 필드 추가</p>
            <p className="m-0 mt-0.5 text-[12.5px] font-medium text-[var(--color-text-muted)]">등록 팝업에 표시될 입력 항목을 만듭니다</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5 items-end">
          <div className="flex-1 min-w-[180px] flex flex-col gap-[7px]">
            <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">필드명 <span className="text-[var(--color-brand-primary)]">*</span></label>
            <input type="text" required value={newLabel} maxLength={50}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="예: 성명, 회비, 동의 여부"
              className={inputCls} />
          </div>
          <div className="flex-[0_0_132px] flex flex-col gap-[7px]">
            <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">타입</label>
            <div className="relative">
              <select value={newType}
                onChange={e => { setNewType(e.target.value as CustomFieldType); setNewOptions([]); setNewDash(false) }}
                className={inputCls + ' pr-8 appearance-none font-semibold'}>
                {FIELD_TYPE_DEFS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
          {newType !== 'checkbox' && (
            <RequiredBtn active={newRequired} onToggle={() => setNewRequired(v => !v)} />
          )}
          <button type="submit"
            disabled={!newLabel.trim() || (FIELD_TYPES_WITH_OPTIONS.includes(newType) && (newOptions.length === 0 || newOptions.some(o => !o.name.trim())))}
            className="inline-flex items-center gap-1.5 h-[34px] px-4 bg-[var(--color-brand-primary)] text-white rounded-lg text-[13.5px] font-bold hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            추가
          </button>
        </div>
        {newType === 'number' && (
          <div className="flex gap-2 pt-2 border-t border-[var(--color-border)]">
            <div className="flex-1 flex flex-col gap-[7px]">
              <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">최솟값 <span className="font-semibold text-[var(--color-text-muted)]">선택</span></label>
              <input type="number" value={newMin} placeholder="없음" onChange={e => setNewMin(e.target.value)} className={inputCls} />
            </div>
            <div className="flex-1 flex flex-col gap-[7px]">
              <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">최댓값 <span className="font-semibold text-[var(--color-text-muted)]">선택</span></label>
              <input type="number" value={newMax} placeholder="없음" onChange={e => setNewMax(e.target.value)} className={inputCls} />
            </div>
          </div>
        )}
        {FIELD_TYPES_WITH_OPTIONS.includes(newType) && (
          <div className="flex flex-col gap-[7px] pt-2 border-t border-[var(--color-border)]">
            <OptionsEditor options={newOptions} onUpdate={setNewOptions} />
            {newOptions.length === 0 && (
              <p className="text-[11.5px] text-amber-500 font-medium">선택지를 하나 이상 추가해야 합니다 <span className="text-red-500">*</span></p>
            )}
            {newOptions.length > 0 && newOptions.some(o => !o.name.trim()) && (
              <p className="text-[11.5px] text-amber-500 font-medium">표시명을 모두 입력해주세요</p>
            )}
            <DashBtn active={newDash} onToggle={() => setNewDash(v => !v)} />
          </div>
        )}
        {newType === 'checkbox' && (
          <div className="pt-2 border-t border-[var(--color-border)]">
            <DashBtn active={newDash} onToggle={() => setNewDash(v => !v)} />
          </div>
        )}
        {['text', 'number', 'select', 'phone', 'account_number'].includes(newType) && (
          <div className="flex flex-col gap-[7px] pt-2 border-t border-[var(--color-border)]">
            <label className="text-[12px] font-bold text-[var(--color-text-secondary)]">플레이스홀더 <span className="font-semibold text-[var(--color-text-muted)]">선택</span></label>
            <input type="text" value={newPlaceholder} maxLength={100} placeholder="입력 안내 문구"
              onChange={e => setNewPlaceholder(e.target.value)}
              className={inputCls} />
          </div>
        )}
      </form>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  )
}
