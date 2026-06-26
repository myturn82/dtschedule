import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTenant } from '../contexts/TenantContext'
import { AppHeader } from '../components/AppHeader'
import { DevFileLabel } from '../components/DevFileLabel'

type Tab = 'member' | 'admin'

interface HelpItem { q: string; a: string }
interface HelpSection { id: string; title: string; icon: string; items: HelpItem[] }

const MEMBER_SECTIONS: HelpSection[] = [
  {
    id: 'm1', title: '스케줄 보기', icon: '📅',
    items: [
      { q: '월간/주간/일간 뷰를 어떻게 전환하나요?', a: '스케줄 상단 "월·주·일" 버튼을 클릭하면 전환됩니다. 모바일에서는 상단 탭을 탭하세요.' },
      { q: '다른 달로 이동하려면?', a: '헤더의 ‹ › 화살표로 이전/다음 달로 이동합니다. 연월 텍스트를 클릭하면 현재 달로 돌아옵니다.' },
      { q: '특정 사람의 배정만 보고 싶어요', a: '상단 검색창에 이름을 입력하면 해당 배정이 강조 표시됩니다. 빈 칸으로 두면 전체를 다시 봅니다.' },
    ],
  },
  {
    id: 'm2', title: '배정 확인', icon: '👤',
    items: [
      { q: '배정 셀을 클릭하면 무엇이 보이나요?', a: '해당 날짜·시간대의 담당자, 메모, 커스텀 필드 등 상세 정보가 팝업으로 표시됩니다.' },
      { q: '셀 색상이 의미하는 것은?', a: '역할(role)마다 지정된 색상으로 표시됩니다. 화면 하단 범례(Legend)에서 색상 의미를 확인할 수 있습니다.' },
      { q: '잠금 아이콘은 무슨 의미인가요?', a: '관리자가 해당 날짜를 잠금 처리한 상태입니다. 잠긴 날짜는 멤버가 배정을 변경할 수 없습니다.' },
    ],
  },
  {
    id: 'm3', title: '내 계정', icon: '⚙️',
    items: [
      { q: '이름이나 계정을 변경하려면?', a: '우측 상단 아바타(사람 아이콘) → "계정 연동" 메뉴에서 소셜 계정 연결 및 프로필을 관리합니다.' },
      { q: '다른 조직에 가입하려면?', a: '아바타 → "다른 조직 가입"을 선택한 뒤 초대 코드를 입력합니다. 관리자 승인 후 이용 가능합니다.' },
      { q: '조직을 변경하려면?', a: '아바타 → "조직 변경"을 클릭하면 가입된 조직 목록에서 선택할 수 있습니다.' },
    ],
  },
]

const ADMIN_SECTIONS: HelpSection[] = [
  {
    id: 'a1', title: '배정 추가·수정', icon: '✏️',
    items: [
      { q: '배정을 추가하려면?', a: '빈 셀을 클릭하면 배정 추가 팝업이 열립니다. 담당자·메모 등을 입력한 뒤 저장하세요.' },
      { q: '반복 배정을 등록하려면?', a: '기능 메뉴(≡) → "반복 배정"을 선택하세요. 요일·기간을 지정해 일괄 등록됩니다.' },
      { q: '자동 배정을 사용하려면?', a: '기능 메뉴(≡) → "자동 배정"을 선택하세요. 역할별 조건에 맞게 배정 안을 생성합니다. 미리보기 확인 후 적용합니다.' },
      { q: '여러 셀을 한 번에 복사·붙여넣기 하려면?', a: '"엑셀 모드"를 켜면 셀을 범위 선택하여 Ctrl+C / Ctrl+V로 복사·붙여넣기가 가능합니다. 기능 메뉴(≡)에서 활성화하세요.' },
    ],
  },
  {
    id: 'a2', title: '스케줄 제어', icon: '🔒',
    items: [
      { q: '특정 날짜를 잠금 처리하려면?', a: '기능 메뉴(≡) → "선택 날짜 잠금"을 사용합니다. 잠금된 날짜는 멤버가 수정할 수 없습니다.' },
      { q: '배정을 초기화하려면?', a: '기능 메뉴(≡) → "선택 날짜 초기화"로 특정 날짜의 배정을 전부 삭제합니다. 복구가 불가능하니 주의하세요.' },
      { q: '스냅샷(복원 지점)은 무엇인가요?', a: '자동 배정 적용 전 상태를 자동 저장합니다. 적용 후 결과가 마음에 들지 않으면 스냅샷으로 되돌릴 수 있습니다.' },
    ],
  },
  {
    id: 'a3', title: '내보내기', icon: '📤',
    items: [
      { q: '스케줄을 파일로 내보내려면?', a: '기능 메뉴(≡) → "내보내기"에서 Excel(.xlsx)·CSV·Word(.docx)·PDF 형식으로 다운로드할 수 있습니다.' },
      { q: '특정 달의 데이터만 내보낼 수 있나요?', a: '현재 화면에 표시된 달의 데이터가 내보내집니다. 원하는 달로 이동한 뒤 내보내기를 실행하세요.' },
    ],
  },
  {
    id: 'a4', title: '관리자 콘솔', icon: '🛠️',
    items: [
      { q: '관리자 콘솔에 어떻게 접근하나요?', a: '좌측 상단 메뉴(≡) → "관리자콘솔"을 클릭합니다. 또는 주소창에 /admin을 직접 입력하세요.' },
      { q: '운영 시간·슬롯 간격을 변경하려면?', a: '관리자콘솔 → "시간 슬롯" 탭에서 운영 시작/종료 시간과 슬롯 단위(30분·1시간 등)를 설정합니다.' },
      { q: '멤버를 초대하려면?', a: '관리자콘솔 → "멤버" 탭에서 초대 코드를 확인해 공유하세요. 신청자가 가입 요청하면 여기서 승인·거절합니다.' },
      { q: '역할(Role)을 추가·수정하려면?', a: '관리자콘솔 → "역할" 탭에서 역할 이름과 색상을 설정합니다. 설정된 역할은 배정 시 자동 적용됩니다.' },
      { q: '커스텀 필드를 추가하려면?', a: '관리자콘솔 → "커스텀 필드" 탭에서 텍스트·숫자·드롭다운 등 원하는 타입의 필드를 추가합니다.' },
      { q: '범례(Legend)를 설정하려면?', a: '관리자콘솔 → "범례" 탭에서 색상 의미를 텍스트로 등록합니다. 스케줄 화면 하단에 표시됩니다.' },
    ],
  },
  {
    id: 'a5', title: '대시보드 (통계)', icon: '📊',
    items: [
      { q: '대시보드에 어떻게 접근하나요?', a: '비즈니스 플랜 이상에서 사용 가능합니다. 상단 "대시보드" 메뉴 또는 /dashboard 주소로 이동하세요.' },
      { q: '어떤 통계를 볼 수 있나요?', a: '멤버별 배정 횟수, 역할별 통계, 기간 비교 등 맞춤형 위젯을 구성할 수 있습니다.' },
    ],
  },
]

function AccordionSection({ section }: { section: HelpSection }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  return (
    <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
        <span className="text-base select-none leading-none">{section.icon}</span>
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">{section.title}</span>
      </div>
      <div className="divide-y divide-[var(--color-border)]">
        {section.items.map((item, idx) => (
          <div key={idx}>
            <button
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              className="w-full text-left px-4 py-3.5 flex items-start justify-between gap-3 hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <span className="text-sm font-medium text-[var(--color-text-primary)] leading-snug">{item.q}</span>
              <svg
                viewBox="0 0 20 20" width="16" height="16" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                className={`shrink-0 mt-0.5 text-[var(--color-text-muted)] transition-transform duration-200 ${openIdx === idx ? 'rotate-180' : ''}`}
              >
                <path d="M5 8l5 5 5-5"/>
              </svg>
            </button>
            {openIdx === idx && (
              <div className="px-4 pb-4 pt-0.5">
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">{item.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function HelpPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { tenantRole } = useTenant()

  const isAdmin = profile?.is_super_admin || tenantRole === 'admin'
  const [tab, setTab] = useState<Tab>(isAdmin ? 'admin' : 'member')

  const sections = tab === 'member' ? MEMBER_SECTIONS : ADMIN_SECTIONS

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <AppHeader />

      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors shrink-0"
            aria-label="뒤로"
          >
            <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5l-5 5 5 5"/>
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">도움말 센터</h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">자주 묻는 질문과 사용 가이드</p>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 p-1 bg-[var(--color-surface-secondary)] rounded-2xl mb-6 border border-[var(--color-border)]">
          {([['member', '멤버 가이드', '👤'], ['admin', '관리자 가이드', '🛠️']] as const).map(([value, label, icon]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all select-none ${
                tab === value
                  ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm border border-[var(--color-border)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              <span className="text-base leading-none">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* 섹션 목록 */}
        <div className="space-y-3">
          {sections.map(section => (
            <AccordionSection key={section.id} section={section} />
          ))}
        </div>

        {/* 하단 안내 */}
        <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-4 py-4 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            더 궁금한 점이 있으신가요?
          </p>
          {import.meta.env.VITE_FEEDBACK_URL && (
            <a
              href={import.meta.env.VITE_FEEDBACK_URL as string}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-[var(--color-brand-primary)] hover:underline"
            >
              <span className="text-base leading-none select-none">💬</span>
              피드백 보내기
            </a>
          )}
        </div>
      </div>

      <DevFileLabel file="HelpPage.tsx" />
    </div>
  )
}
