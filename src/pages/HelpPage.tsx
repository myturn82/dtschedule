import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTenant } from '../contexts/TenantContext'
import { AppHeader } from '../components/AppHeader'
import { DevFileLabel } from '../components/DevFileLabel'
import { FeedbackModal } from '../components/modals/FeedbackModal'

type Tab = 'member' | 'admin'

interface QuickLink { label: string; to: string }
interface HelpItem { q: string; a: string; links?: QuickLink[] }
interface HelpSection { id: string; title: string; icon: string; items: HelpItem[] }

const MEMBER_SECTIONS: HelpSection[] = [
  {
    id: 'm1', title: '스케줄 보기', icon: '📅',
    items: [
      {
        q: '월간/주간/일간 뷰를 어떻게 전환하나요?',
        a: '스케줄 상단의 "월·주·일" 버튼을 클릭하면 전환됩니다.\n\n각 뷰의 특징\n• 월간 — 한 달 전체를 한눈에 봅니다. 날짜별 배정 요약이 셀에 표시됩니다.\n• 주간 — 한 주를 시간대별 표로 보여줍니다. 시간 단위 배정 확인에 적합합니다.\n• 일간 — 하루를 시간대별로 세밀하게 봅니다. 당일 배정이 많을 때 유용합니다.',
        links: [{ label: '스케줄 화면', to: '/schedule' }],
      },
      {
        q: '시간별/일자별 보기는 어떻게 다른가요?',
        a: '월간 뷰에서 헤더 토글 버튼으로 전환합니다.\n\n• 시간별 — 시간 슬롯을 열, 날짜를 행으로 표시합니다. 어느 시간대에 배정이 집중되는지 파악하기 좋습니다.\n• 일자별 — 날짜마다 배정 목록을 요약 카드로 보여줍니다. 각 날짜의 "+ 등록" 버튼으로 바로 배정을 추가할 수도 있습니다.',
        links: [{ label: '스케줄 화면', to: '/schedule' }],
      },
      {
        q: '다른 달·주로 이동하려면?',
        a: '헤더의 ‹ › 화살표로 이전/다음으로 이동합니다.\n타이틀(연월 텍스트)을 클릭하면 날짜 선택 팝업이 열려 연·월·일을 스크롤로 골라 원하는 날짜로 바로 이동할 수 있습니다.\n\n예시) 3개월 뒤 스케줄을 보려면 타이틀 클릭 → 월 스크롤 → 확인.',
        links: [{ label: '스케줄 화면', to: '/schedule' }],
      },
      {
        q: '주간 뷰에 뜨는 "2주차" 같은 표시는 뭔가요?',
        a: '해당 주가 그 달의 몇 번째 주인지를 나타냅니다.\n\n계산 기준: 한 주에 해당 월의 날짜가 4일 이상 포함되어야 그 달의 N주차로 계산됩니다.\n\n예시) 9월 1일(월)이 포함된 주에 9월 날짜가 5일이면 → "9월 1주차"로 표시됩니다.',
        links: [{ label: '스케줄 화면', to: '/schedule' }],
      },
      {
        q: '특정 사람의 배정만 보고 싶어요',
        a: '스케줄 상단 검색창에 이름을 입력하면 해당 배정이 노란색으로 강조 표시됩니다.\n\n• 월간·주간·일간 뷰 모두 동일하게 강조됩니다.\n• 검색창을 비우면 전체 배정으로 돌아옵니다.\n\n예시) "김철수"를 입력하면 김철수가 배정된 셀만 노란 테두리로 강조됩니다.',
        links: [{ label: '스케줄 화면', to: '/schedule' }],
      },
    ],
  },
  {
    id: 'm2', title: '배정 확인', icon: '👤',
    items: [
      {
        q: '배정 셀을 클릭하면 무엇이 보이나요?',
        a: '해당 날짜·시간대의 상세 팝업이 열립니다.\n\n팝업에서 확인할 수 있는 정보\n• 담당자 이름과 역할\n• 관리자가 남긴 메모\n• 추가 입력항목 (조직에서 설정한 커스텀 필드)\n• 배정 시각 및 잠금 여부',
        links: [{ label: '스케줄 화면', to: '/schedule' }],
      },
      {
        q: '셀 색상이 의미하는 것은?',
        a: '역할(role)마다 관리자가 지정한 고유 색상으로 표시됩니다.\n\n• 색상 의미는 스케줄 화면 하단 범례(Legend)에서 확인할 수 있습니다.\n• 여러 역할이 같은 셀에 배정된 경우 각 이름 옆에 역할 색상 점이 함께 표시됩니다.\n\n예시) 파란색 = 강사, 초록색 = 보조 강사로 설정된 경우 셀 색상으로 역할을 바로 구분할 수 있습니다.',
        links: [{ label: '스케줄 화면', to: '/schedule' }],
      },
      {
        q: '잠금 아이콘은 무슨 의미인가요?',
        a: '관리자가 해당 날짜 또는 특정 배정을 잠금 처리한 상태입니다.\n\n잠긴 날짜/배정은 멤버가 수정하거나 삭제할 수 없습니다. 변경이 필요하면 관리자에게 문의하세요.',
      },
      {
        q: '셀에 표시된 [n/전체]는 무슨 의미인가요?',
        a: '결제권(레슨권)이 연결된 배정에서 해당 세션의 회차를 나타냅니다.\n\n형식: [사용 회차 / 총 회차]\n\n예시\n• [1/8] → 8회권의 첫 번째 세션\n• [5/8] → 8회권의 다섯 번째 세션\n• [8/8] → 8회권의 마지막 세션\n\n이 표시를 통해 수업이 얼마나 진행되었는지 달력에서 한눈에 파악할 수 있습니다.',
        links: [{ label: '스케줄 화면', to: '/schedule' }],
      },
    ],
  },
  {
    id: 'm3', title: '내 계정', icon: '⚙️',
    items: [
      {
        q: '이름이나 계정을 변경하려면?',
        a: '우측 상단 아바타(사람 아이콘)를 클릭한 뒤 "계정 연동" 메뉴에서 소셜 계정 연결 및 프로필을 관리합니다.',
      },
      {
        q: '다른 조직에 가입하려면?',
        a: '아바타 → "다른 조직 가입"을 선택한 뒤 초대 코드를 입력합니다.\n관리자 승인 후 이용 가능합니다.\n\n초대 코드는 해당 조직의 관리자에게 받으세요.',
      },
      {
        q: '조직을 변경하려면?',
        a: '아바타 → "조직 변경"을 클릭하면 가입된 조직 목록이 표시됩니다. 이동할 조직을 선택하면 됩니다.',
      },
    ],
  },
]

const ADMIN_SECTIONS: HelpSection[] = [
  {
    id: 'a1', title: '배정 추가·수정', icon: '✏️',
    items: [
      {
        q: '배정을 추가하려면?',
        a: '빈 셀을 클릭하면 배정 추가 팝업이 열립니다.\n\n입력 항목\n• 담당자 — 배정할 멤버 선택\n• 메모 — 관리자 전달 사항\n• 추가 입력항목 — 조직에서 설정한 커스텀 필드\n• 결제권 연결 — 레슨권이 있는 경우 선택 가능\n\n입력 후 "저장"을 클릭하면 즉시 반영됩니다.',
        links: [{ label: '스케줄 화면', to: '/schedule' }],
      },
      {
        q: '반복 배정을 등록하려면?',
        a: '기능 메뉴(≡) → "반복 배정"을 선택합니다.\n\n설정 순서\n1. 반복할 요일을 선택합니다 (복수 선택 가능)\n2. 시작일과 종료일을 지정합니다\n3. 배정할 담당자와 시간 슬롯을 입력합니다\n4. "일괄 등록"을 클릭합니다\n\n예시) 매주 화·목 오전 10시에 홍길동을 반복 배정하려면, 요일에서 화·목을 선택하고 담당자와 슬롯을 지정하면 됩니다.',
        links: [{ label: '스케줄 화면', to: '/schedule' }],
      },
      {
        q: '자동 배정을 사용하려면?',
        a: '기능 메뉴(≡) → "자동 배정"을 선택합니다.\n\n동작 방식\n• 역할별 조건(최대 배정 수, 제외 날짜 등)에 맞게 배정 안을 자동 생성합니다.\n• 생성된 안을 미리보기에서 확인한 뒤 "적용"을 눌러 확정합니다.\n• 적용 전 자동으로 스냅샷이 저장되므로, 결과가 마음에 들지 않으면 되돌릴 수 있습니다.',
        links: [{ label: '스케줄 화면', to: '/schedule' }],
      },
      {
        q: '여러 셀을 한 번에 복사·붙여넣기 하려면?',
        a: '기능 메뉴(≡) → "엑셀 모드"를 켜면 범위 선택이 가능해집니다.\n\n사용 방법\n1. 엑셀 모드 활성화\n2. 복사할 셀 범위를 드래그로 선택\n3. Ctrl+C → 붙여넣을 위치의 첫 셀 클릭 → Ctrl+V\n\n예시) 이번 주 배정을 그대로 다음 주에 복사하려면, 이번 주 전체를 선택 → Ctrl+C → 다음 주 같은 요일 첫 셀 클릭 → Ctrl+V.',
        links: [{ label: '스케줄 화면', to: '/schedule' }],
      },
      {
        q: '메모를 달력 셀에 바로 표시하려면?',
        a: '배정 저장·수정 화면에서 "달력에 메모 표시" 체크박스를 체크합니다.\n\n• 체크 시 — 월간·일간 뷰 셀에 메모가 직접 표시됩니다.\n• 미체크 시 — 셀 클릭 후 상세 팝업에서만 확인 가능합니다.\n\n예시) "준비물: 수영복"처럼 당일 바로 확인해야 할 정보는 달력에 표시해 두면 편리합니다.\n\n주의: 기존에 저장된 메모는 기본적으로 미표출 상태입니다. 달력에 표시하려면 해당 배정을 수정해 체크하세요.',
        links: [{ label: '스케줄 화면', to: '/schedule' }],
      },
      {
        q: '과거 날짜의 출석을 일괄 등록하려면? (소급 입력)',
        a: '기능 메뉴(≡) → "소급 출석 입력"을 선택합니다.\n레슨권 관리 탭의 결제 기록에서 "소급 입력" 버튼으로도 바로 진입할 수 있습니다.\n\n입력 순서\n1. 회원을 선택합니다\n2. 결제권을 선택합니다 (없으면 비워 둬도 됩니다)\n3. "+ 행 추가"로 날짜·시간 슬롯을 여러 줄 입력합니다\n4. 하단 요약에서 등록 건수와 결제권 잔여 회차 변화를 확인합니다\n5. "일괄 저장"을 클릭합니다\n\n주의 사항\n• 달력에서 운영일(설정된 운영 요일·시간)만 선택할 수 있습니다.\n• 결제권 선택 시 결제일 이전 날짜는 선택할 수 없습니다.\n• 이미 등록된 슬롯은 자동으로 건너뜁니다 (중복 등록 방지).\n• 저장 완료 후 잘못 등록된 항목은 목록의 X 버튼으로 즉시 삭제할 수 있습니다.',
        links: [
          { label: '스케줄 화면', to: '/schedule' },
          { label: '레슨권 관리', to: '/admin' },
        ],
      },
    ],
  },
  {
    id: 'a2', title: '스케줄 제어', icon: '🔒',
    items: [
      {
        q: '특정 날짜를 잠금 처리하려면?',
        a: '기능 메뉴(≡) → "선택 날짜 잠금"을 사용합니다.\n\n• 잠금된 날짜는 멤버가 배정을 추가·수정·삭제할 수 없습니다.\n• 관리자는 잠금 상태에서도 배정을 변경할 수 있습니다.\n\n예시) 행사일·공휴일처럼 배정 변경을 막아야 하는 날짜에 사용합니다.',
        links: [{ label: '스케줄 화면', to: '/schedule' }],
      },
      {
        q: '배정을 초기화하려면?',
        a: '기능 메뉴(≡) → "선택 날짜 초기화"를 선택합니다.\n\n• 선택한 날짜 범위의 배정을 전부 삭제합니다.\n• 삭제 후 복구가 불가능합니다. 실행 전 반드시 확인하세요.\n\n팁: 특정 배정 하나만 지우려면 셀 클릭 → 개별 삭제가 더 안전합니다.',
        links: [{ label: '스케줄 화면', to: '/schedule' }],
      },
      {
        q: '스냅샷(복원 지점)은 무엇인가요?',
        a: '자동 배정 적용 전 상태를 자동으로 저장해 두는 기능입니다.\n\n• 자동 배정을 적용하면 직전 상태가 스냅샷으로 저장됩니다.\n• 결과가 마음에 들지 않으면 기능 메뉴(≡) → "스냅샷 복원"에서 되돌릴 수 있습니다.',
        links: [{ label: '스케줄 화면', to: '/schedule' }],
      },
    ],
  },
  {
    id: 'a3', title: '내보내기', icon: '📤',
    items: [
      {
        q: '스케줄을 파일로 내보내려면?',
        a: '기능 메뉴(≡) → "내보내기"에서 원하는 형식을 선택합니다.\n\n지원 형식\n• Excel (.xlsx) — 셀 단위로 편집 가능\n• CSV — 다른 시스템에 데이터를 이전할 때\n• Word (.docx) — 문서 형태로 공유할 때\n• PDF — 출력·이메일 전송 시\n\n예시) 월별 스케줄을 팀에 공유할 때는 PDF, 자체 분석이 필요하면 Excel을 추천합니다.',
        links: [{ label: '스케줄 화면', to: '/schedule' }],
      },
      {
        q: '특정 달의 데이터만 내보낼 수 있나요?',
        a: '현재 화면에 표시된 달의 데이터가 내보내집니다.\n\n원하는 달로 먼저 이동한 뒤 내보내기를 실행하세요.\n\n예시) 8월 스케줄만 내보내려면 헤더 화살표로 8월로 이동 → 기능 메뉴 → 내보내기.',
        links: [{ label: '스케줄 화면', to: '/schedule' }],
      },
    ],
  },
  {
    id: 'a4', title: '관리자 콘솔', icon: '🛠️',
    items: [
      {
        q: '관리자 콘솔에 어떻게 접근하나요?',
        a: '메뉴(≡) → "관리자콘솔"을 클릭하거나, 주소창에 /admin을 직접 입력합니다.',
        links: [{ label: '관리자콘솔 바로가기', to: '/admin' }],
      },
      {
        q: '운영 시간·슬롯 간격을 변경하려면?',
        a: '관리자콘솔 → "날짜·요일·시간" 탭에서 설정합니다.\n\n설정 항목\n• 운영 시작/종료 시간\n• 슬롯 단위 (30분·1시간 등)\n• 운영 요일 (월~일 중 선택)\n\n예시) 오전 9시~오후 6시를 1시간 단위로 운영하려면, 시작 09:00 / 종료 18:00 / 단위 60분으로 설정합니다.',
        links: [{ label: '관리자콘솔 바로가기', to: '/admin' }],
      },
      {
        q: '멤버를 초대하려면?',
        a: '관리자콘솔 → "멤버" 탭에서 초대 코드를 확인합니다.\n\n초대 과정\n1. "멤버" 탭에서 초대 코드를 복사합니다\n2. 초대할 사람에게 코드를 공유합니다\n3. 상대방이 앱에서 코드를 입력해 가입 요청을 보냅니다\n4. "멤버" 탭의 가입 요청 목록에서 승인 또는 거절합니다',
        links: [{ label: '관리자콘솔 바로가기', to: '/admin' }],
      },
      {
        q: '역할(Role)을 추가·수정하려면?',
        a: '관리자콘솔 → "역할" 탭에서 관리합니다.\n\n설정 항목\n• 역할 이름 (예: 강사, 보조, 매니저)\n• 역할 색상 — 달력 셀에 표시되는 색상\n• 역할별 슬롯 최대 배정 인원\n\n설정된 역할은 배정 시 자동으로 적용됩니다.',
        links: [{ label: '관리자콘솔 바로가기', to: '/admin' }],
      },
      {
        q: '입력항목을 추가하려면?',
        a: '관리자콘솔 → "입력항목" 탭에서 추가합니다.\n\n지원 타입\n• 텍스트 — 자유 입력\n• 숫자 — 수치 입력\n• 드롭다운 — 목록 중 선택\n• 체크박스 — 예/아니오\n\n예시) "준비물 지참 여부" 체크박스를 추가하면, 배정 팝업에서 매번 체크할 수 있습니다.',
        links: [{ label: '관리자콘솔 바로가기', to: '/admin' }],
      },
      {
        q: '범례(Legend)를 설정하려면?',
        a: '관리자콘솔 → "범례" 탭에서 색상 의미를 텍스트로 등록합니다.\n등록된 범례는 스케줄 화면 하단에 표시됩니다.\n\n예시) "파란색 = 1:1 레슨", "초록색 = 그룹 수업"처럼 색상 기준을 안내할 수 있습니다.',
        links: [{ label: '관리자콘솔 바로가기', to: '/admin' }],
      },
    ],
  },
  {
    id: 'a5', title: '대시보드 (통계)', icon: '📊',
    items: [
      {
        q: '대시보드에 어떻게 접근하나요?',
        a: '상단 "대시보드" 메뉴를 클릭하거나 /dashboard 주소로 이동합니다.\n비즈니스 플랜 이상에서 사용 가능합니다.',
        links: [{ label: '대시보드 바로가기', to: '/dashboard' }],
      },
      {
        q: '어떤 통계를 볼 수 있나요?',
        a: '멤버별·역할별 통계와 기간 비교 위젯을 구성할 수 있습니다.\n\n주요 통계\n• 멤버별 배정 횟수\n• 역할별 배정 분포\n• 기간별 비교 (이번 달 vs 지난 달)\n• 레슨권 소진 현황 (레슨:ON 전용)',
        links: [{ label: '대시보드 바로가기', to: '/dashboard' }],
      },
    ],
  },
  {
    id: 'a6', title: '레슨권 관리', icon: '🎫',
    items: [
      {
        q: '레슨권(결제권) 관리는 어디서 하나요?',
        a: '관리자콘솔 → "레슨권" 탭에서 레슨 종류 설정과 결제 기록을 관리합니다.\n스케줄 화면의 기능 메뉴(≡) → "소급 출석 입력"으로도 연결됩니다.',
        links: [{ label: '관리자콘솔 바로가기', to: '/admin' }],
      },
      {
        q: '레슨 종류를 추가하려면?',
        a: '"레슨 종류 설정" 영역에서 이름·총 회차·유효기간(주 단위)을 입력하고 추가합니다.\n\n• 빠른 예시 버튼(예: "1:1 레슨 10회")으로 자주 쓰는 종류를 자동 입력할 수 있습니다.\n• 추가 후 순서 변경·수정·활성/비활성 전환이 가능합니다.\n\n예시) 이름: "그룹 레슨 20회" / 총 회차: 20 / 유효기간: 12주',
        links: [{ label: '관리자콘솔 바로가기', to: '/admin' }],
      },
      {
        q: '결제 기록을 추가하려면?',
        a: '"+ 결제 기록 추가" 버튼을 클릭합니다.\n\n입력 항목\n• 회원 선택\n• 레슨 종류 선택 → 회차·유효기간 자동 입력\n• 결제일 입력 → 만료일 자동 계산\n• 비고 (선택)\n• 소급 사용 횟수 (선택)\n\n소급 사용 횟수란?\n시스템 도입 전 이미 수업이 진행된 경우, 기존 이용 횟수를 입력하면 달력의 회차 표시가 실제 진행 순서와 맞게 시작됩니다.\n\n예시) 8회권을 이미 2회 이용하고 등록 → 소급 사용 횟수: 2\n→ 다음 수업부터 달력에 [3/8]로 표시됩니다.',
        links: [{ label: '관리자콘솔 바로가기', to: '/admin' }],
      },
      {
        q: '달력 셀에 표시된 [n/전체]는 무엇인가요?',
        a: '결제권이 연결된 배정에 [사용 회차 / 총 회차]가 표시됩니다.\n\n예시\n• [1/8] → 8회권 첫 번째 세션\n• [5/8] → 8회권 다섯 번째 세션\n• [8/8] → 8회권 마지막 세션\n\n각 셀의 숫자는 해당 결제권 내 날짜 순서를 기준으로 계산됩니다. 월간·주간·일간 뷰 모두 동일하게 표시됩니다.',
        links: [{ label: '스케줄 화면', to: '/schedule' }],
      },
      {
        q: '만료 임박 회원에게 알림 문자를 보내려면?',
        a: '"레슨권" 탭 상단 만료 임박 배너에서 기준 기간을 선택합니다.\n\n순서\n1. 기준 기간 선택 (1주일 전 / 2주일 전 / 직접 입력)\n2. 해당 기간 내 만료 예정 회원 수 확인\n3. "문자 발송" 클릭 → 대상자 목록과 메시지 확인\n4. 발송\n\n대상 조건: 선택한 기간 내 만료 예정이면서 잔여 회차가 남아 있는 회원\n예시) "7일 이내 만료, 미사용 세션 있음" 회원에게 이용 독려 문자를 일괄 발송합니다.',
        links: [{ label: '관리자콘솔 바로가기', to: '/admin' }],
      },
      {
        q: '결제 기록을 삭제하려면?',
        a: '결제 기록 목록에서 해당 항목의 삭제 버튼을 클릭합니다.\n\n삭제 시 선택 사항\n• 연결된 출석 기록(소급 입력 포함)만 삭제\n• 결제 기록 전체 삭제\n\n주의: 삭제 후 복구가 불가능합니다. 신중하게 진행하세요.',
        links: [{ label: '관리자콘솔 바로가기', to: '/admin' }],
      },
      {
        q: '결제권 현황(잔여 회차, 상태)을 확인하려면?',
        a: '결제 기록 목록에서 각 항목의 상태 뱃지와 사용 횟수를 확인합니다.\n\n상태 종류\n• 진행중 — 유효기간 내, 잔여 회차 있음\n• 만료임박 — 7일 이내 만료 예정\n• 만료 — 유효기간 초과\n• 사용완료 — 모든 회차 소진\n\n"그룹 보기" 전환 시 회원별로 묶어서 보유 레슨권 전체 현황을 한눈에 확인할 수 있습니다.',
        links: [{ label: '관리자콘솔 바로가기', to: '/admin' }],
      },
    ],
  },
]

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-700/50 text-[var(--color-text-primary)] rounded-sm px-0.5 not-italic">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  )
}

function QuickLinkButton({ link, onNavigate }: { link: QuickLink; onNavigate: (to: string) => void }) {
  return (
    <button
      onClick={() => onNavigate(link.to)}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/20 transition-colors"
    >
      {link.label}
      <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8h10M9 4l4 4-4 4"/>
      </svg>
    </button>
  )
}

function AccordionSection({
  section, search, onNavigate,
}: {
  section: HelpSection
  search: string
  onNavigate: (to: string) => void
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const isSearching = search.trim().length > 0

  return (
    <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
        <span className="text-base select-none leading-none">{section.icon}</span>
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">{section.title}</span>
        <span className="ml-auto text-xs text-[var(--color-text-muted)]">{section.items.length}개 항목</span>
      </div>
      <div className="divide-y divide-[var(--color-border)]">
        {section.items.map((item, idx) => {
          const isOpen = isSearching || openIdx === idx
          return (
            <div key={idx}>
              <button
                onClick={() => { if (!isSearching) setOpenIdx(openIdx === idx ? null : idx) }}
                className="w-full text-left px-4 py-3.5 flex items-start justify-between gap-3 hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                <span className="text-sm font-medium text-[var(--color-text-primary)] leading-snug">
                  <Highlight text={item.q} query={search} />
                </span>
                {!isSearching && (
                  <svg
                    viewBox="0 0 20 20" width="16" height="16" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    className={`shrink-0 mt-0.5 text-[var(--color-text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  >
                    <path d="M5 8l5 5 5-5"/>
                  </svg>
                )}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-0.5">
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
                    <Highlight text={item.a} query={search} />
                  </p>
                  {item.links && item.links.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {item.links.map(link => (
                        <QuickLinkButton key={link.to + link.label} link={link} onNavigate={onNavigate} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
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
  const [search, setSearch] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)

  const allSections = tab === 'member' ? MEMBER_SECTIONS : ADMIN_SECTIONS

  const filteredSections = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allSections
    return allSections
      .map(section => ({
        ...section,
        items: section.items.filter(
          item =>
            item.q.toLowerCase().includes(q) ||
            item.a.toLowerCase().includes(q)
        ),
      }))
      .filter(s => s.items.length > 0)
  }, [allSections, search])

  const totalMatches = filteredSections.reduce((n, s) => n + s.items.length, 0)
  const isSearching = search.trim().length > 0

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
        <div className="flex gap-1 p-1 bg-[var(--color-surface-secondary)] rounded-2xl mb-4 border border-[var(--color-border)]">
          {([['member', '멤버 가이드', '👤'], ['admin', '관리자 가이드', '🛠️']] as const).map(([value, label, icon]) => (
            <button
              key={value}
              onClick={() => { setTab(value); setSearch('') }}
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

        {/* 검색 */}
        <div className="relative mb-5">
          <svg
            viewBox="0 0 20 20" width="15" height="15" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
          >
            <circle cx="8.5" cy="8.5" r="5.5"/>
            <path d="M15 15l-3-3"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="질문 검색..."
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30 focus:border-[var(--color-brand-primary)] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
              aria-label="검색어 지우기"
            >
              <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M3 3l10 10M13 3L3 13"/>
              </svg>
            </button>
          )}
        </div>

        {/* 검색 결과 메타 */}
        {isSearching && (
          <p className="text-xs text-[var(--color-text-muted)] mb-3">
            {totalMatches > 0
              ? <><strong className="text-[var(--color-text-primary)]">{totalMatches}개</strong> 항목이 검색되었습니다.</>
              : '검색 결과가 없습니다. 다른 키워드로 검색해 보세요.'
            }
          </p>
        )}

        {/* 섹션 목록 */}
        <div className="space-y-3">
          {filteredSections.map(section => (
            <AccordionSection
              key={section.id}
              section={section}
              search={search}
              onNavigate={navigate}
            />
          ))}
        </div>

        {/* 하단 안내 */}
        <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-4 py-4 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            더 궁금한 점이 있으신가요?
          </p>
          {profile && (
            <button
              onClick={() => setShowFeedback(true)}
              className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-[var(--color-brand-primary)] hover:underline"
            >
              <span className="text-base leading-none select-none">💬</span>
              피드백 보내기
            </button>
          )}
        </div>
      </div>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}

      <DevFileLabel file="HelpPage.tsx" />
    </div>
  )
}
