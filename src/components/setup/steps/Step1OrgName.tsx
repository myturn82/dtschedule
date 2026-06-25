import { IndustryPicker } from '../../IndustryPicker'
import { StepHeader, WIZARD_STEPS } from '../StepHeader'
import { Field, ErrLine } from '../WizardField'

interface Props {
  name: string
  title: string
  industry: string
  error: string
  onChange: (name: string, title: string, industry: string) => void
}

export function Step1OrgName({ name, title, industry, error, onChange }: Props) {
  return (
    <div className="step-body">
      <StepHeader step={WIZARD_STEPS[0]} />

      <Field label="업종" req>
        <IndustryPicker
          value={industry}
          onChange={v => onChange(name, title, v)}
          inputCls="sel"
          hideLabel
          requireDetail
          autoFocus
        />
      </Field>

      <Field label="조직명" req>
        <input className="ipt" value={name} maxLength={50} placeholder="예: 행복 자원봉사 센터"
          onChange={e => onChange(e.target.value, title, industry)} />
      </Field>

      <Field label="페이지 제목" hint="선택 · 기본값은 조직명">
        <input className="ipt" value={title} maxLength={50} placeholder={name || '달력 상단에 표시될 제목'}
          onChange={e => onChange(name, e.target.value, industry)} />
      </Field>

      <ErrLine error={error} />
    </div>
  )
}
