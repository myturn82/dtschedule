import { useNavigate } from 'react-router-dom'
import { DevFileLabel } from '../components/DevFileLabel'
import { ScheduleBackground } from '../components/auth/ScheduleBackground'

const pointStyle = { color: '#E05A3A', fontWeight: 700 }

export function LandingPage() {
  const navigate = useNavigate()

  const topNavSlot = (
    <button className="lmp-nav-btn" onClick={() => navigate('/auth?tab=login')}>
      로그인
    </button>
  )

  return (
    <ScheduleBackground topNavSlot={topNavSlot}>
      <style>{`
        .lmp-card {
          position:relative; z-index:5; width:100%; max-width:420px;
          background:#fff; border:1px solid rgba(20,23,28,0.07); border-radius:18px;
          padding:28px 28px 26px; margin:auto;
          box-shadow:0 1px 0 rgba(20,23,28,0.03),0 22px 60px -28px rgba(20,23,28,0.22),0 4px 14px -8px rgba(20,23,28,0.10);
        }
      `}</style>
      <div className="lmp-card">
        {/* Brand */}
        <div style={{ marginBottom: 18 }}>
          <img src="/logo-colon-time.png" alt="Dynamic Team Schedule" style={{ height: 30, width: 'auto', display: 'block' }} />
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 28, lineHeight: 1.22, letterSpacing: '-0.8px', fontWeight: 700,
          color: '#14171C', margin: '0 0 12px',
        }}>
          엑셀과 문서로 매번 지우고 다시 쓰던 번거로움 끝,<br />
          팀 스케줄의 모든 과정을 데이터화하다
        </h1>

        {/* Subtext */}
        <p style={{
          fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: '0 0 28px',
        }}>
          <span style={pointStyle}>역할별 자동 배정</span>과 <span style={pointStyle}>반복 등록</span>으로 짜여진 스케줄은 <span style={pointStyle}>실시간</span>으로 공유되며, <span style={pointStyle}>전체 고정 및 초기화</span>로 유연하게 제어됩니다.<br />
          필요한 데이터를 추출하는 <span style={pointStyle}>문서 다운로드</span>와 <span style={pointStyle}>맞춤형 통계 위젯</span>으로 우리 팀의 오늘을 스마트하게 관리하세요.
        </p>

        {/* CTA buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => navigate('/consent')}
            style={{
              width: '100%', height: 46, background: '#14171C', color: '#fff',
              border: 0, borderRadius: 12, fontFamily: 'inherit', fontSize: 14,
              fontWeight: 600, letterSpacing: '-0.2px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 1px 0 rgba(20,23,28,0.06), 0 8px 20px -8px rgba(20,23,28,0.30)',
            }}
          >
            무료로 시작하기
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10h12M11 5l5 5-5 5"/>
            </svg>
          </button>
          <button
            onClick={() => navigate('/auth?tab=login')}
            style={{
              width: '100%', height: 42, background: '#fff', color: '#14171C',
              border: '1px solid rgba(20,23,28,0.12)', borderRadius: 12,
              fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
              marginTop: 0,
            }}
          >
            로그인
          </button>
        </div>
      </div>
      <DevFileLabel file="LandingPage.tsx" />
    </ScheduleBackground>
  )
}
