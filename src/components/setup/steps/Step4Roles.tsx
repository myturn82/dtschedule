import { useState } from 'react'
import { RolePreviewCalendar } from '../RolePreviewCalendar'
import { StepHeader, WIZARD_STEPS } from '../StepHeader'
import { Field, ErrLine } from '../WizardField'
import { WizardIcon } from '../WizardIcons'
import type { TenantRole } from '../../../types'

interface Props {
  roles: TenantRole[]
  error: string
  onAdd: (name: string, splitCell: boolean, requiresCustomerInfo: boolean, indicatorBar: boolean) => Promise<string | null>
  onDelete: (id: string) => Promise<string | null>
  onUpdate: (id: string, fields: Partial<Pick<TenantRole, 'name' | 'split_cell' | 'indicator_bar'>>) => Promise<string | null>
  onDraftChange: (hasDraft: boolean) => void
}

type DisplayMode = 'none' | 'split' | 'bar'

const DISPLAY_OPTIONS: { value: DisplayMode; label: string; desc: string }[] = [
  { value: 'none',  label: '표시 없음', desc: '역할로만 분류, 칸 구분 없음' },
  { value: 'split', label: '칸 분리',   desc: '역할별로 달력에 칸이 나뉩니다' },
  { value: 'bar',   label: '바 표시',   desc: '셀 좌측에 색상 바가 나타납니다' },
]

function roleToDisplayMode(role: TenantRole): DisplayMode {
  if (role.split_cell) return 'split'
  if (role.indicator_bar) return 'bar'
  return 'none'
}

export function Step4Roles({ roles, error, onAdd, onDelete, onUpdate, onDraftChange }: Props) {
  const [name, setName] = useState('')
  const [displayMode, setDisplayMode] = useState<DisplayMode>('none')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  function handleNameChange(value: string) {
    setName(value)
    onDraftChange(!!value.trim())
  }

  function clearDraftName() {
    setName('')
    setAddError('')
    onDraftChange(false)
  }

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editMode, setEditMode] = useState<DisplayMode>('none')
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')

  async function handleAdd() {
    if (!name.trim()) return
    setAdding(true)
    setAddError('')
    const err = await onAdd(name.trim(), displayMode === 'split', false, displayMode === 'bar')
    if (err) setAddError(err)
    else { setName(''); setDisplayMode('none'); onDraftChange(false) }
    setAdding(false)
  }

  function startEdit(role: TenantRole) {
    setEditingId(role.id)
    setEditName(role.name)
    setEditMode(roleToDisplayMode(role))
    setEditError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditError('')
  }

  async function handleSave(id: string) {
    if (!editName.trim()) return
    setSaving(true)
    setEditError('')
    const err = await onUpdate(id, {
      name: editName.trim(),
      split_cell: editMode === 'split',
      indicator_bar: editMode === 'bar',
    })
    if (err) setEditError(err)
    else setEditingId(null)
    setSaving(false)
  }

  return (
    <div className="step-body">
      <StepHeader step={WIZARD_STEPS[3]} />

      <Field label="미리보기">
        <RolePreviewCalendar roles={roles} previewMode={displayMode} previewName={name.trim()} />
      </Field>

      {roles.length > 0 && (
        <div className="row-list">
          {roles.map(role => (
            <div key={role.id}>
              {editingId === role.id ? (
                <div className="addbox" style={{ marginBottom: 0 }}>
                  <input
                    className="ipt"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSave(role.id)}
                    autoFocus
                  />
                  <div>
                    <p className="mini-label">달력 표시 방식</p>
                    <div className="seg3">
                      {DISPLAY_OPTIONS.map(opt => (
                        <button key={opt.value} className={`seg3-b${editMode === opt.value ? ' on' : ''}`} onClick={() => setEditMode(opt.value)}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <p className="mini-hint">{DISPLAY_OPTIONS.find(o => o.value === editMode)?.desc}</p>
                  </div>
                  {editError && <p className="err-line"><WizardIcon.warn size={14} /> {editError}</p>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} disabled={!editName.trim() || saving} onClick={() => handleSave(role.id)}>
                      {saving ? '저장 중...' : '저장'}
                    </button>
                    <button className="btn btn-ghost" onClick={cancelEdit}>취소</button>
                  </div>
                </div>
              ) : (
                <div className="role-row">
                  <span className="role-name">{role.name}</span>
                  {role.split_cell && <span className="chip chip-meta tone-blue">칸분리</span>}
                  {role.indicator_bar && <span className="chip chip-meta tone-amber">바표시</span>}
                  <button className="iconbtn" onClick={() => startEdit(role)} aria-label="수정"><WizardIcon.pencil size={15} /></button>
                  <button className="iconbtn danger" onClick={() => onDelete(role.id)} aria-label="삭제"><WizardIcon.x size={15} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="addbox">
        <p className="addbox-title">역할 추가</p>
        <div className="ipt-wrap">
          <input className="ipt" value={name} placeholder="예: 팀장, 강사, 봉사자"
            onChange={e => handleNameChange(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          {name.trim() && (
            <button type="button" className="iconbtn ipt-clear" onClick={clearDraftName} aria-label="입력 지우기">
              <WizardIcon.x size={14} />
            </button>
          )}
        </div>
        <div>
          <p className="mini-label">달력 표시 방식</p>
          <div className="seg3">
            {DISPLAY_OPTIONS.map(opt => (
              <button key={opt.value} className={`seg3-b${displayMode === opt.value ? ' on' : ''}`} onClick={() => setDisplayMode(opt.value)}>
                {opt.label}
              </button>
            ))}
          </div>
          <p className="mini-hint">{DISPLAY_OPTIONS.find(o => o.value === displayMode)?.desc}</p>
        </div>
        {addError && <p className="err-line"><WizardIcon.warn size={14} /> {addError}</p>}
        <button className="btn btn-primary" disabled={!name.trim() || adding} onClick={handleAdd}>
          <WizardIcon.plus size={15} sw={2} /> {adding ? '추가 중...' : '역할 추가'}
        </button>
      </div>

      <p className="center-note"><WizardIcon.bulb size={14} /> 역할이 없어도 괜찮아요 — 시간대별 배정만 필요하다면 바로 다음으로 넘어가세요.</p>

      <ErrLine error={error} />
    </div>
  )
}
