import { WizardIcon, type WizardIconKey } from './WizardIcons'

export interface WizardStepMeta {
  n: number
  icon: WizardIconKey
  tone: string
  title: string
  desc: string
}

export const WIZARD_STEPS: WizardStepMeta[] = [
  { n: 1, icon: 'building', tone: 'indigo', title: '조직을 소개해주세요', desc: '달력 화면 상단과 공유 링크에 표시됩니다.' },
  { n: 2, icon: 'layers',   tone: 'blue',   title: '어떻게 운영할 예정인가요?', desc: '내 서비스에 맞는 방식을 선택하세요. 나중에 변경할 수 있습니다.' },
  { n: 3, icon: 'clock',    tone: 'teal',   title: '운영 시간 단위를 정해주세요', desc: '달력 한 칸이 얼마의 시간을 나타낼지 설정합니다.' },
  { n: 4, icon: 'users',    tone: 'amber',  title: '역할이 필요한가요?', desc: "'팀장·봉사자'처럼 역할을 구분하면 달력에서 역할별로 칸이 나뉩니다." },
  { n: 5, icon: 'calendar', tone: 'purple', title: '운영 요일을 설정하세요', desc: '운영하는 요일을 선택해주세요. 날짜별 개별 설정도 가능합니다.' },
  { n: 6, icon: 'list',     tone: 'green',  title: '입력 항목을 설정하세요', desc: '배정 등록 시 이름·연락처 외에 더 받을 정보를 설정합니다. 건너뛰어도 됩니다.' },
]

export const LESSON_STEP_META: WizardStepMeta = {
  n: 6,
  icon: 'sparkles',
  tone: 'amber',
  title: '레슨 종류를 등록해주세요',
  desc: '회원에게 판매할 레슨권 종류를 미리 등록하면 결제 기록 시 바로 선택할 수 있어요.',
}

export function StepHeader({ step }: { step: WizardStepMeta }) {
  const Ic = WizardIcon[step.icon]
  return (
    <div className="step-head">
      <span className={`step-badge tone-${step.tone}`}><Ic size={26} sw={1.7} /></span>
      <h2 className="step-title">{step.title}</h2>
      <p className="step-desc">{step.desc}</p>
    </div>
  )
}
