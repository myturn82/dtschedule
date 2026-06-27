import { useState, type FormEvent, type ReactNode } from 'react'
import type { CustomFieldDef, CustomFieldType, CustomFieldOption, OptionValueType } from '../../../types'
import { FIELD_TYPES_WITH_OPTIONS, FIELD_TYPES_WITH_DASHBOARD, OPTION_VALUE_TYPES, getOptionUnit } from '../../../types'
import { CUSTOM_FIELD_TEMPLATES } from '../../../utils/customFieldTemplates'
import { StepHeader, WIZARD_STEPS } from '../StepHeader'
import { Field, ErrLine } from '../WizardField'
import { WizardIcon, type WizardIconKey } from '../WizardIcons'

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

const FIELD_TYPE_DEFS: { value: CustomFieldType; label: string; tone: string; icon: WizardIconKey }[] = [
  { value: 'text',           label: '텍스트',   tone: 'slate',  icon: 'text' },
  { value: 'number',         label: '숫자',     tone: 'blue',   icon: 'hash' },
  { value: 'select',         label: '드롭다운', tone: 'green',  icon: 'list' },
  { value: 'checkbox_group', label: '체크박스', tone: 'indigo', icon: 'square' },
  { value: 'checkbox',       label: '동의',     tone: 'purple', icon: 'check2' },
  { value: 'phone',          label: '전화번호', tone: 'teal',   icon: 'phone' },
  { value: 'account_number', label: '계좌번호', tone: 'pink',   icon: 'hash' },
  { value: 'radio',          label: '라디오',   tone: 'amber',  icon: 'dot' },
  { value: 'image_upload',   label: '이미지첨부', tone: 'rose',   icon: 'image' },
]
const PLACEHOLDER_TYPES: CustomFieldType[] = ['text', 'number', 'select', 'phone', 'account_number']
const BLANK_EDIT = (): Omit<CustomFieldDef, 'id'> => ({ label: '', type: 'text', required: true, options: [], placeholder: '', show_in_dashboard: false, min: undefined, max: undefined })

function FieldPreview({ field }: { field: CustomFieldDef }) {
  if (field.type === 'image_upload') {
    return (
      <div className="prev-input" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 16 }}>📷</span>
        <span>이미지 첨부 (최대 3장, WebP 자동 압축)</span>
      </div>
    )
  }
  if (field.type === 'text' || field.type === 'number' || field.type === 'phone' || field.type === 'account_number') {
    return <div className="prev-input">{field.placeholder || `${field.label} 입력`}</div>
  }
  if (field.type === 'select') {
    return <div className="prev-input prev-select"><span>{field.placeholder || `${field.label} 선택`}</span><WizardIcon.chevron size={15} /></div>
  }
  if (field.type === 'radio' || field.type === 'checkbox_group') {
    const dotCls = field.type === 'radio' ? 'prev-radio' : 'prev-check'
    return (
      <div className="prev-opts">
        {(field.options ?? []).length === 0
          ? <span className="prev-empty">옵션을 추가하세요</span>
          : (field.options ?? []).map(opt => <span key={opt.value} className="prev-opt"><span className={dotCls} />{opt.name}</span>)}
      </div>
    )
  }
  return <div className="prev-opts"><span className="prev-opt"><span className="prev-check" />{field.label}</span></div>
}

function TogglePill({ on, onClick, icon, children }: { on: boolean; onClick: () => void; icon: WizardIconKey; children: ReactNode }) {
  const Ic = WizardIcon[icon]
  return (
    <button type="button" className={`tpill${on ? ' on' : ''}`} onClick={onClick} aria-pressed={on}>
      <span className="tpill-box">{on && <WizardIcon.check size={11} sw={3} />}</span>
      <Ic size={13} />{children}
    </button>
  )
}

function OptRow({ opt, onChange, onRemove }: { opt: CustomFieldOption; onChange: (o: CustomFieldOption) => void; onRemove: () => void }) {
  const unit = getOptionUnit(opt.value_type)
  return (
    <div className="optrow">
      <span className="optrow-grip"><WizardIcon.grip size={15} /></span>
      <div className="sel-wrap optrow-vt">
        <select className="sel" value={opt.value_type ?? 'none'} onChange={e => onChange({ ...opt, value_type: e.target.value as OptionValueType })}>
          {OPTION_VALUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <WizardIcon.chevron size={14} className="sel-chev" />
      </div>
      <input className="ipt optrow-name" value={opt.name} placeholder={OPT_PLACEHOLDER[opt.value_type ?? 'none']?.name ?? '표시명'}
        onChange={e => onChange({ ...opt, name: e.target.value })} />
      <div className="optrow-val">
        <input className="ipt" value={opt.value} placeholder={OPT_PLACEHOLDER[opt.value_type ?? 'none']?.value ?? '저장값'}
          onChange={e => onChange({ ...opt, value: e.target.value })} />
        {unit && <span className="optrow-unit">{unit}</span>}
      </div>
      <button className="iconbtn danger" onClick={onRemove} aria-label="옵션 삭제"><WizardIcon.x size={15} /></button>
    </div>
  )
}

function OptionsEditor({ options, onUpdate }: { options: CustomFieldOption[]; onUpdate: (opts: CustomFieldOption[]) => void }) {
  return (
    <div className="optlist">
      {options.map((opt, i) => (
        <OptRow key={i} opt={opt}
          onChange={no => onUpdate(options.map((o, j) => j === i ? no : o))}
          onRemove={() => onUpdate(options.filter((_, j) => j !== i))} />
      ))}
      <button type="button" className="addopt" onClick={() => onUpdate([...options, { name: '', value: '', value_type: 'none' }])}>
        <WizardIcon.plus size={15} sw={2} /> 옵션 추가
      </button>
    </div>
  )
}

function FieldEditor({ f, set }: { f: Omit<CustomFieldDef, 'id'>; set: (f: Omit<CustomFieldDef, 'id'>) => void }) {
  const hasOpt = FIELD_TYPES_WITH_OPTIONS.includes(f.type)
  const hasPh = PLACEHOLDER_TYPES.includes(f.type)
  const hasDash = FIELD_TYPES_WITH_DASHBOARD.includes(f.type)
  return (
    <>
      <Field label="필드명">
        <input className="ipt" value={f.label} placeholder="필드명" onChange={e => set({ ...f, label: e.target.value })} />
      </Field>
      <div className="erow-split">
        <div className="ecol">
          <Field label="타입">
            <div className="sel-wrap">
              <select className="sel" value={f.type} onChange={e => set({ ...f, type: e.target.value as CustomFieldType })}>
                {FIELD_TYPE_DEFS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <WizardIcon.chevron size={15} className="sel-chev" />
            </div>
          </Field>
        </div>
        {f.type !== 'checkbox' && (
          <div className="ecol-shrink">
            <label className="wlabel">&nbsp;</label>
            <TogglePill on={f.required} onClick={() => set({ ...f, required: !f.required })} icon="star">필수</TogglePill>
          </div>
        )}
      </div>
      {hasOpt && (
        <Field label="선택지" hint="유형 · 표시명 · 저장값">
          <OptionsEditor options={f.options ?? []} onUpdate={opts => set({ ...f, options: opts })} />
        </Field>
      )}
      {f.type === 'number' && (
        <div className="erow-split">
          <div className="ecol">
            <Field label="최솟값">
              <input type="number" className="ipt" value={f.min ?? ''} placeholder="없음"
                onChange={e => set({ ...f, min: e.target.value !== '' ? Number(e.target.value) : undefined })} />
            </Field>
          </div>
          <div className="ecol">
            <Field label="최댓값">
              <input type="number" className="ipt" value={f.max ?? ''} placeholder="없음"
                onChange={e => set({ ...f, max: e.target.value !== '' ? Number(e.target.value) : undefined })} />
            </Field>
          </div>
        </div>
      )}
      {hasPh && (
        <Field label="플레이스홀더" hint="선택">
          <input className="ipt" value={f.placeholder ?? ''} placeholder="입력 안내 문구" onChange={e => set({ ...f, placeholder: e.target.value })} />
        </Field>
      )}
      {hasDash && <TogglePill on={f.show_in_dashboard ?? false} onClick={() => set({ ...f, show_in_dashboard: !f.show_in_dashboard })} icon="chart">대시보드 통계 포함</TogglePill>}
    </>
  )
}

function FieldCard({ field, draft, idx, total, editing, onEdit, onChange, onSave, onCancel, onMove, onDelete }: {
  field: CustomFieldDef
  draft: Omit<CustomFieldDef, 'id'>
  idx: number
  total: number
  editing: boolean
  onEdit: () => void
  onChange: (f: Omit<CustomFieldDef, 'id'>) => void
  onSave: () => void
  onCancel: () => void
  onMove: (dir: -1 | 1) => void
  onDelete: () => void
}) {
  if (editing) {
    return (
      <div className="fcard editing">
        <div className="fcard-edit">
          <FieldEditor f={draft} set={onChange} />
          <div className="fcard-foot">
            <button className="btn btn-primary" onClick={onSave}>저장</button>
            <button className="btn btn-ghost" onClick={onCancel}>취소</button>
          </div>
        </div>
      </div>
    )
  }
  const td = FIELD_TYPE_DEFS.find(t => t.value === field.type)
  const TIc = WizardIcon[td?.icon ?? 'text']
  return (
    <div className="fcard" onClick={onEdit}>
      <div className="fcard-head">
        <span className={`chip chip-type tone-${td?.tone ?? 'slate'}`}><TIc size={12} sw={2} />{td?.label ?? field.type}</span>
        <span className="fcard-label">{field.label}</span>
        {field.required && <span className="chip chip-meta req">필수</span>}
        <span className="fcard-spacer" />
        <div className="fcard-acts" onClick={e => e.stopPropagation()}>
          <button className="iconbtn" disabled={idx === 0} onClick={() => onMove(-1)} aria-label="위로"><WizardIcon.up size={15} /></button>
          <button className="iconbtn" disabled={idx === total - 1} onClick={() => onMove(1)} aria-label="아래로"><WizardIcon.down size={15} /></button>
          <span className="acts-div" />
          <button className="iconbtn" onClick={onEdit} aria-label="수정"><WizardIcon.pencil size={15} /></button>
          <button className="iconbtn danger" onClick={onDelete} aria-label="삭제"><WizardIcon.trash size={15} /></button>
        </div>
      </div>
      <FieldPreview field={field} />
    </div>
  )
}

export function Step7CustomFields({ fields, isFreeform, error, onChange }: Props) {
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
            placeholder: PLACEHOLDER_TYPES.includes(editField.type) ? (editField.placeholder?.trim() || undefined) : undefined,
            show_in_dashboard: FIELD_TYPES_WITH_DASHBOARD.includes(editField.type) && editField.show_in_dashboard ? true : undefined,
            min: editField.type === 'number' ? editField.min : undefined,
            max: editField.type === 'number' ? editField.max : undefined,
          }
        : f
    )
    onChange(next)
    setEditingId(null)
  }

  function removeField(id: string, label: string) {
    if (!confirm(`"${label}" 필드를 삭제할까요?`)) return
    onChange(fields.filter(f => f.id !== id))
    if (editingId === id) setEditingId(null)
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

  function addTemplate(field: Omit<CustomFieldDef, 'id'>) {
    if (fields.some(f => f.label === field.label)) return
    onChange([...fields, { ...field, id: crypto.randomUUID() }])
  }

  function addField(e: FormEvent) {
    e.preventDefault()
    if (!newLabel.trim()) return
    const newField: CustomFieldDef = {
      id: crypto.randomUUID(),
      label: newLabel.trim(),
      type: newType,
      required: newType !== 'checkbox' && newRequired,
      options: FIELD_TYPES_WITH_OPTIONS.includes(newType) ? newOptions.filter(o => o.name.trim() || o.value.trim()) : undefined,
      placeholder: PLACEHOLDER_TYPES.includes(newType) ? (newPlaceholder.trim() || undefined) : undefined,
      show_in_dashboard: FIELD_TYPES_WITH_DASHBOARD.includes(newType) && newDash ? true : undefined,
      min: newType === 'number' && newMin !== '' ? Number(newMin) : undefined,
      max: newType === 'number' && newMax !== '' ? Number(newMax) : undefined,
    }
    onChange([...fields, newField])
    setNewLabel(''); setNewType('text'); setNewRequired(true)
    setNewOptions([]); setNewPlaceholder(''); setNewMin(''); setNewMax(''); setNewDash(false)
  }

  const newHasOpt = FIELD_TYPES_WITH_OPTIONS.includes(newType)
  const newHasPh = PLACEHOLDER_TYPES.includes(newType)
  const newHasDash = FIELD_TYPES_WITH_DASHBOARD.includes(newType)

  return (
    <div className="step-body">
      <StepHeader step={WIZARD_STEPS[5]} />
      <p className="step-desc" style={{ marginTop: -8 }}>
        {isFreeform ? '첫 번째 필드가 이름으로 사용됩니다. 연락처도 추가해두면 편리합니다.' : '배정 등록 시 이름·연락처 외에 더 받을 정보를 설정합니다. 건너뛰어도 됩니다.'}
      </p>

      <Field label="자주 쓰는 항목">
        <div className="chip-wrap">
          {CUSTOM_FIELD_TEMPLATES.map(tpl => {
            const added = fields.some(f => f.label.trim() === tpl.field.label)
            return (
              <button key={tpl.label} type="button" className="tpl-chip" disabled={added} onClick={() => addTemplate(tpl.field)}>
                <WizardIcon.plus size={13} sw={2.2} />{added ? `${tpl.label} 추가됨` : tpl.label}
              </button>
            )
          })}
        </div>
      </Field>

      {fields.length > 0 && (
        <div className="flist">
          {fields.map((field, idx) => (
            <FieldCard key={field.id} field={field} draft={editField}
              idx={idx} total={fields.length} editing={editingId === field.id}
              onEdit={() => startEdit(field)} onChange={setEditField} onSave={saveEdit} onCancel={() => setEditingId(null)}
              onMove={dir => moveField(field.id, dir)} onDelete={() => removeField(field.id, field.label)} />
          ))}
        </div>
      )}

      {fields.length > 0 && <div className="new-sep"><span>새 항목</span></div>}

      <form className="newcard" onSubmit={addField}>
        <div className="newcard-head">
          <span className="newcard-badge"><WizardIcon.plus size={15} sw={2.2} /></span>
          <div>
            <p className="newcard-title">새 필드 추가</p>
            <p className="newcard-sub">등록 팝업에 표시될 입력 항목을 만듭니다</p>
          </div>
        </div>
        <div className="newcard-main">
          <div className="ecol newcard-name">
            <label className="wlabel">필드명 <span className="wreq">*</span></label>
            <input className="ipt" value={newLabel} maxLength={50} placeholder="예: 성명, 회비, 동의 여부" onChange={e => setNewLabel(e.target.value)} />
          </div>
          <div className="ecol newcard-type">
            <label className="wlabel">타입</label>
            <div className="sel-wrap">
              <select className="sel" value={newType} onChange={e => { setNewType(e.target.value as CustomFieldType); setNewOptions([]); setNewDash(false) }}>
                {FIELD_TYPE_DEFS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <WizardIcon.chevron size={15} className="sel-chev" />
            </div>
          </div>
          {newType !== 'checkbox' && (
            <div className="ecol-shrink">
              <label className="wlabel">&nbsp;</label>
              <TogglePill on={newRequired} onClick={() => setNewRequired(v => !v)} icon="star">필수</TogglePill>
            </div>
          )}
          <button type="submit"
            disabled={!newLabel.trim() || (newHasOpt && (newOptions.length === 0 || newOptions.some(o => !o.name.trim())))}
            className="btn btn-primary">
            <WizardIcon.plus size={16} sw={2.2} /> 추가
          </button>
        </div>
        {newType === 'number' && (
          <div className="erow-split" style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div className="ecol">
              <Field label="최솟값" hint="선택"><input type="number" className="ipt" value={newMin} placeholder="없음" onChange={e => setNewMin(e.target.value)} /></Field>
            </div>
            <div className="ecol">
              <Field label="최댓값" hint="선택"><input type="number" className="ipt" value={newMax} placeholder="없음" onChange={e => setNewMax(e.target.value)} /></Field>
            </div>
          </div>
        )}
        {newHasOpt && (
          <div className="newcard-extra">
            <label className="wlabel">선택지 <span className="whint">유형 · 표시명 · 저장값</span></label>
            <OptionsEditor options={newOptions} onUpdate={setNewOptions} />
            {newOptions.length === 0 && <p className="err-line">선택지를 하나 이상 추가해야 합니다 *</p>}
            {newOptions.length > 0 && newOptions.some(o => !o.name.trim()) && <p className="err-line">표시명을 모두 입력해주세요</p>}
            {newHasDash && <TogglePill on={newDash} onClick={() => setNewDash(v => !v)} icon="chart">대시보드 통계 포함</TogglePill>}
          </div>
        )}
        {newType === 'checkbox' && newHasDash && (
          <div className="newcard-extra">
            <TogglePill on={newDash} onClick={() => setNewDash(v => !v)} icon="chart">대시보드 통계 포함</TogglePill>
          </div>
        )}
        {newHasPh && (
          <div className="newcard-extra">
            <Field label="플레이스홀더" hint="선택"><input className="ipt" value={newPlaceholder} maxLength={100} placeholder="입력 안내 문구" onChange={e => setNewPlaceholder(e.target.value)} /></Field>
          </div>
        )}
      </form>

      <ErrLine error={error} />
    </div>
  )
}
