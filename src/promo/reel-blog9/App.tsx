import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DarkModeProvider } from '../../contexts/DarkModeContext'
import { TenantProvider } from '../../contexts/TenantContext'
import { ORGS, APPLICANTS } from './mockData'

const IS_RECORD = new URLSearchParams(location.search).has('record')

type Phase = 'intro' | 'login' | 'wizard' | 'pending' | 'outro'
const PHASES: { key: Phase; ms: number }[] = [
  { key: 'intro',   ms: 2000 },
  { key: 'login',   ms: 3000 },
  { key: 'wizard',  ms: 3200 },
  { key: 'pending', ms: 3500 },
  { key: 'outro',   ms: 2500 },
]
const TOTAL = PHASES.reduce((s, p) => s + p.ms, 0)

const CAPTION: Partial<Record<Phase, { kicker: string; headline: string; sub: string }>> = {
  intro:   { kicker: 'Social Login', headline: '카카오 버튼\n하나로 가입', sub: '이메일·비밀번호 없이 카카오 버튼 하나로 — 진입 장벽을 낮춥니다' },
  login:   { kicker: 'OAuth 2.0', headline: '로그인과\n가입은 다르다', sub: '가입은 조직 선택 위자드가 먼저 — 건너뛰면 소속 없이 대기 상태' },
  wizard:  { kicker: 'localStorage', headline: '조직 선택 후\nOAuth 이동', sub: '브라우저 이탈 전 선택한 조직을 localStorage에 저장 — 돌아와서 이어 붙입니다' },
  pending: { kicker: '승인대기', headline: '관리자 승인\n후 입장', sub: '가입은 즉시, 접근은 승인 후 — 승인 순간 대기 화면이 달력으로 자동 전환됩니다' },
}
const BADGE: Partial<Record<Phase, string>> = {
  login:   '🟡 카카오 로그인',
  wizard:  '🏢 조직 선택',
  pending: '⏳ 승인 대기',
}

function usePhaseLoop() {
  const [idx, setIdx] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    timer.current = setTimeout(() => setIdx(i => (i + 1) % PHASES.length), PHASES[idx].ms)
    return () => clearTimeout(timer.current)
  }, [idx])
  return { phase: PHASES[idx].key }
}

const slideVariants = { enter: { x: '100%', opacity: 0 }, center: { x: '0%', opacity: 1 }, exit: { x: '-100%', opacity: 0 } }
const slideTransition = { x: { type: 'spring' as const, stiffness: 280, damping: 30 }, opacity: { duration: 0.12 } }

function LoginPanel() {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-tabs">
          <div className="auth-tab">로그인</div>
          <div className="auth-tab active">회원가입</div>
        </div>
        <div className="auth-body">
          <input className="auth-input" placeholder="이름" readOnly />
          <input className="auth-input" placeholder="이메일" readOnly />
          <input className="auth-input" placeholder="비밀번호" type="password" readOnly />
          <button className="auth-btn">이메일로 가입</button>
          <div className="auth-divider">또는</div>
          <motion.button className="kakao-btn active"
            animate={{ scale: [1, 1.03, 1] }} transition={{ repeat: Infinity, duration: 1.8 }}
          >
            <span className="select-none">💬</span> 카카오로 가입하기
          </motion.button>
        </div>
      </div>
    </div>
  )
}

function WizardPanel() {
  const [selectedId, setSelectedId] = useState(ORGS[0].id)
  useEffect(() => {
    const timer = setInterval(() => setSelectedId(id => id === ORGS[0].id ? ORGS[1].id : ORGS[0].id), 1200)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className="org-wrap">
      <div className="org-title">가입할 조직을 선택해주세요</div>
      <div className="org-cards">
        {ORGS.map(org => (
          <div key={org.id} className={`org-card${org.id === selectedId ? ' selected' : ''}`}>
            <span className="org-card-icon select-none">{org.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="org-card-name">{org.name}</div>
              <div className="org-card-count">회원 {org.members}명</div>
            </div>
            <div className="org-card-check">✓</div>
          </div>
        ))}
      </div>
      <button className="kakao-submit-btn">
        <span className="select-none">💬</span> 카카오로 가입 신청하기
      </button>
    </div>
  )
}

function PendingPanel() {
  return (
    <div className="pending-wrap">
      <div className="pending-icon select-none">⏳</div>
      <div className="pending-org">{ORGS[0].icon} {ORGS[0].name}</div>
      <div className="pending-msg">가입 신청이 완료되었습니다<br />관리자 승인을 기다리는 중입니다</div>
      <div className="pending-status">
        <div className="pending-dot" />
        승인 대기
      </div>
      <div style={{ width: '100%', borderTop: '1.5px solid #f3f4f6', paddingTop: '3cqw' }}>
        <div style={{ fontSize: '2.4cqw', color: '#6b7280', marginBottom: '1.5cqw' }}>승인대기 (관리자 화면)</div>
        {APPLICANTS.map(a => (
          <div key={a.id} className="applicant-card">
            <div className="applicant-avatar">{a.name[0]}</div>
            <div className="applicant-info">
              <div className="applicant-name">{a.name}</div>
              <div className="applicant-via">{a.via} · {a.time}</div>
            </div>
            <div className="applicant-btns">
              <div className="btn-approve">승인</div>
              <div className="btn-reject">거절</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const { phase } = usePhaseLoop()
  const isHero  = phase !== 'intro' && phase !== 'outro'
  const caption = CAPTION[phase]
  const badge   = BADGE[phase]

  return (
    <div className={`stage${IS_RECORD ? ' record' : ''}`}>
      <div className="reel">
        <motion.div className="boardbg"
          animate={{ scale: isHero ? 1 : 1.05, filter: isHero ? 'blur(0px) brightness(1) saturate(1)' : 'blur(4px) brightness(0.5) saturate(0.85)' }}
          transition={{ type: 'spring', stiffness: 120, damping: 24 }}
        >
          <div className="boardwindow">
            <AnimatePresence mode="popLayout">
              {phase === 'login' && (
                <motion.div key="login" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTransition} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <LoginPanel />
                </motion.div>
              )}
              {phase === 'wizard' && (
                <motion.div key="wizard" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTransition} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <WizardPanel />
                </motion.div>
              )}
              {phase === 'pending' && (
                <motion.div key="pending" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTransition} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <PendingPanel />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="scrim" /><div className="scrimtop" />
        <div className="brandmark">Dynamic <span className="brandmark-team">Team</span> Schedule</div>

        <div className="content">
          <AnimatePresence mode="wait">
            {phase !== 'outro' && (
              <motion.div key={phase} className="captionblock"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } } }}
                initial="hidden" animate="show" exit={{ opacity: 0, y: 10, transition: { duration: 0.25 } }}
              >
                {badge && <motion.div className="override-badge" variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 18 } } }}>{badge}</motion.div>}
                <motion.p className="kicker" variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>{caption?.kicker}</motion.p>
                <motion.h1 className="headline" variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } } }}>
                  {caption?.headline.split('\n').map((l, i) => <span key={i}>{l}{i === 0 && <br />}</span>)}
                </motion.h1>
                <motion.p className="sub" variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>{caption?.sub}</motion.p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {phase === 'outro' && (
              <motion.div className="outrowrap" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 180, damping: 20 }}>
                <div className="wordmark">Dynamic<br />Team <em>Schedule</em></div>
                <p className="tagline">카카오 버튼 하나로, 3초 만에</p>
                <motion.div className="cta" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.2 }}>지금 시작하기 →</motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {!IS_RECORD && <p className="hint"><b>이 프레임(9:16)만 화면 녹화</b>하면 됩니다. 루프 {(TOTAL/1000).toFixed(0)}초. <b>고화질 녹화:</b> URL 끝에 <code>?record</code> 추가 후 Chrome DevTools → 기기 에뮬레이션 → 1080×1920 설정.</p>}
    </div>
  )
}

export function AppRoot() {
  return <DarkModeProvider><TenantProvider><App /></TenantProvider></DarkModeProvider>
}
