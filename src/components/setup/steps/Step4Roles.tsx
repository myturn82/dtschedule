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
}

type DisplayMode = 'none' | 'split' | 'bar'

const DISPLAY_OPTIONS: { value: DisplayMode; label: string; desc: string }[] = [
  { value: 'none',  label: '표시 없음', desc: '역할로만 분류, 칸 구분 없음' },
  { value: 'split', label: '칸 분리',   desc: '역할별로 달력에 칸이 나뉩니다' },
  { value: 'bar',   label: '바 표시',   desc: '셀 좌측에 색상 바가 나타납니다' },
]

export function Step4Roles({ roles, error, onAdd, onDelete }: Props) {
  const [name, setName] = useState('')
  const [displayMode, setDisplayMode] = useState<DisplayMode>('none')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  async function handleAdd() {
    if (!name.trim()) return
    setAdding(true)
    setAddError('')
    const err = await onAdd(name.trim(), displayMode === 'split', false, displayMode === 'bar')
    if (err) setAddError(err)
    else { setName(''); setDisplayMode('none') }
    setAdding(false)
  }

  return (
    <div className="step-body">
      <StepHeader step={WIZARD_STEPS[3]} />

      <Field label="미리보기">
        <RolePreviewCalendar roles={roles} />
      </Field>

      {roles.length > 0 && (
        <div className="row-list">
          {roles.map(role => (
            <div key={role.id} className="role-row">
              <span className="role-name">{role.name}</span>
              {role.split_cell && <span className="chip chip-meta tone-blue">칸분리</span>}
              {role.indicator_bar && <span className="chip chip-meta tone-amber">바표시</span>}
              <button className="iconbtn danger" onClick={() => onDelete(role.id)} aria-label="삭제"><WizardIcon.x size={15} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="addbox">
        <p className="addbox-title">역할 추가</p>
        <input className="ipt" value={name} placeholder="예: 팀장, 강사, 봉사자"
          onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
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
        <button className="btn btn-dashed" disabled={!name.trim() || adding} onClick={handleAdd}>
          <WizardIcon.plus size={15} sw={2} /> {adding ? '추가 중...' : '역할 추가'}
        </button>
      </div>

      <p className="center-note"><WizardIcon.bulb size={14} /> 역할이 없어도 괜찮아요 — 시간대별 배정만 필요하다면 바로 다음으로 넘어가세요.</p>

      <ErrLine error={error} />
    </div>
  )
}
