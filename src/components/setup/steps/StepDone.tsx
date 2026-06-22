import { WizardIcon } from '../WizardIcons'

interface Props {
  orgName: string
  slotCount: number
  roleCount: number
  fieldCount: number
  modeName: string
  openDays: string
  shareUrl: string
  onGoSchedule: () => void
  onGoMembers: () => void
  onGoAdmin: () => void
}

export function StepDone({ orgName, slotCount, roleCount, fieldCount, modeName, openDays, shareUrl, onGoSchedule, onGoMembers, onGoAdmin }: Props) {
  function copyShareUrl() {
    navigator.clipboard.writeText(shareUrl).then(() => alert('공유 링크가 복사됐습니다.\n' + shareUrl))
  }

  const summary = [
    { label: '운영 모드', value: modeName },
    { label: '시간 슬롯', value: `${slotCount}개` },
    { label: '역할', value: roleCount > 0 ? `${roleCount}개` : '없음' },
    { label: '운영 요일', value: openDays || '미설정' },
    { label: '커스텀 필드', value: `${fieldCount}개` },
  ]

  return (
    <div className="step-body">
      <div className="step-head">
        <span className="step-badge tone-accent done-badge"><WizardIcon.party size={28} sw={1.7} /></span>
        <h2 className="step-title">설정 완료!</h2>
        <p className="step-desc"><b>{orgName || '내 조직'}</b> 조직이 준비됐어요.</p>
      </div>

      <div className="summary-card">
        {summary.map(row => (
          <div key={row.label} className="summary-row">
            <span>{row.label}</span>
            <b>{row.value}</b>
          </div>
        ))}
      </div>

      <div className="done-cta">
        <button className="btn btn-primary wide" onClick={onGoSchedule}><WizardIcon.calendar size={16} /> 스케줄 보러가기</button>
        <button className="btn btn-outline wide" onClick={onGoMembers}><WizardIcon.user size={16} /> 회원 초대하기</button>
        <button className="btn btn-ghost wide" onClick={copyShareUrl}><WizardIcon.link size={16} /> 공유 링크 복사</button>
        <button className="link-btn center" onClick={onGoAdmin}>전체 관리자 설정 열기 <WizardIcon.arrowRight size={14} /></button>
      </div>
    </div>
  )
}
