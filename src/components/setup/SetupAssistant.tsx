import { useState } from 'react'
import { WizardIcon } from './WizardIcons'
import { ErrLine } from './WizardField'
import { useAiParse } from '../../hooks/useAiParse'
import { parseSetupText, type SetupProposal } from '../../lib/aiParse'
import type { CustomFieldDef } from '../../types'

interface Props {
  industry: string
  onApplyRoles: (roles: { name: string; splitCell: boolean; indicatorBar: boolean }[]) => void
  onApplyCustomFields: (fields: CustomFieldDef[]) => void
  onApplySchedule: (closedWeekdays: number[], capacityHint?: number) => void
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export function SetupAssistant({ industry, onApplyRoles, onApplyCustomFields, onApplySchedule }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [proposal, setProposal] = useState<SetupProposal | null>(null)
  const [applied, setApplied] = useState(false)
  const { run, loading, error } = useAiParse(parseSetupText)

  async function handleParse() {
    if (!text.trim()) return
    setProposal(null); setApplied(false)
    const result = await run(text, { industry: industry || undefined })
    if (result) setProposal(result)
  }

  function handleApply() {
    if (!proposal) return
    onApplyRoles(
      proposal.roles
        .filter(r => r.name.trim())
        .map(r => ({ name: r.name.trim(), splitCell: r.display_mode === 'split', indicatorBar: r.display_mode === 'bar' }))
    )
    onApplyCustomFields(
      proposal.custom_fields
        .filter(f => f.label.trim())
        .map(f => ({
          id: crypto.randomUUID(),
          label: f.label.trim(),
          type: f.type,
          required: f.required ?? false,
          options: f.options?.map(o => ({ name: o.name, value: o.value, value_type: o.value_type })),
        }))
    )
    onApplySchedule(proposal.closed_weekdays ?? [], proposal.slot_capacity_hint)
    setApplied(true)
  }

  if (!open) {
    return (
      <button type="button" className="ai-entry" onClick={() => setOpen(true)}>
        <span className="rec-spark"><WizardIcon.sparkles size={16} /></span>
        <span className="ai-entry-text">
          <span className="addbox-title">AI로 빠르게 시작하기</span>
          <span className="ai-entry-desc">운영 방식을 설명하면 역할·커스텀필드·휴무일을 자동으로 채워드려요</span>
        </span>
      </button>
    )
  }

  return (
    <div className="addbox">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p className="addbox-title">AI로 빠르게 시작하기</p>
        <button type="button" className="link-btn" onClick={() => setOpen(false)}>닫기 <WizardIcon.x size={12} /></button>
      </div>
      <div className="wfield">
        <label className="wlabel">운영 방식을 자유롭게 설명해주세요</label>
        <textarea
          className="wtextarea"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="예: 역할은 팀장, 강사, 봉사자가 있고 평일 9시~18시 운영, 일요일은 휴무예요. 커스텀필드로 연락처와 특이사항이 필요해요."
          rows={4}
        />
      </div>
      {error && <ErrLine error={error} />}
      <button type="button" className="btn btn-primary" disabled={!text.trim() || loading} onClick={handleParse}>
        {loading ? 'AI가 분석 중...' : proposal ? <>내용 수정했어요 · 다시 분석하기 <WizardIcon.arrowRight size={15} /></> : <>분석하기 <WizardIcon.arrowRight size={15} /></>}
      </button>
      {proposal && !applied && (
        <div className="rec-banner">
          <div className="rec-top">
            <span className="rec-spark"><WizardIcon.sparkles size={16} /></span>
            <p className="rec-title">이렇게 찾았어요</p>
          </div>
          <ul className="ai-summary">
            {proposal.roles.length > 0 && (
              <li>역할 {proposal.roles.length}개: {proposal.roles.map(r => r.name).join(', ')}</li>
            )}
            {proposal.custom_fields.length > 0 && (
              <li>커스텀필드 {proposal.custom_fields.length}개: {proposal.custom_fields.map(f => f.label).join(', ')}</li>
            )}
            {(proposal.closed_weekdays?.length ?? 0) > 0 && (
              <li>휴무 요일: {proposal.closed_weekdays.map(d => DAY_LABELS[d]).join('·')}</li>
            )}
            {proposal.slot_capacity_hint != null && <li>시간대별 정원: {proposal.slot_capacity_hint}명</li>}
            {proposal.roles.length === 0 && proposal.custom_fields.length === 0 &&
              (proposal.closed_weekdays?.length ?? 0) === 0 && proposal.slot_capacity_hint == null && (
                <li>설명에서 구체적인 내용을 찾지 못했어요. 조금 더 자세히 적어주시겠어요?</li>
            )}
          </ul>
          <p className="rec-reason">적용 후에도 각 단계에서 자유롭게 수정할 수 있어요. 휴무 요일·정원은 3단계(슬롯) 저장 후 반영됩니다.</p>
          <button type="button" className="btn btn-primary rec-apply" onClick={handleApply}>
            적용하기 <WizardIcon.arrowRight size={15} />
          </button>
        </div>
      )}
      {applied && (
        <div className="info-note">
          <WizardIcon.check2 size={15} /> 적용했어요. 아래에서 확인하고 필요하면 수정해주세요.
        </div>
      )}
    </div>
  )
}
