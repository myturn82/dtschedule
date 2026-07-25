import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DarkModeProvider } from '../../contexts/DarkModeContext'
import { TenantProvider } from '../../contexts/TenantContext'
import { NOTIFICATIONS, SEND_HISTORY, MSG_TEMPLATE } from './mockData'

const IS_RECORD = new URLSearchParams(location.search).has('record')

type Phase = 'intro' | 'bell' | 'panel' | 'send' | 'outro'
const PHASES: { key: Phase; ms: number }[] = [
  { key: 'intro', ms: 2000 },
  { key: 'bell',  ms: 2800 },
  { key: 'panel', ms: 3500 },
  { key: 'send',  ms: 3500 },
  { key: 'outro', ms: 2500 },
]
const TOTAL = PHASES.reduce((s, p) => s + p.ms, 0)

const CAPTION: Partial<Record<Phase, { kicker: string; headline: string; sub: string }>> = {
  intro: { kicker: 'D-1 알림', headline: '"내일 배정\n깜빡했어요"', sub: '아무리 좋은 달력도, 알려주지 않으면 잊혀집니다' },
  bell:  { kicker: '인앱 알림', headline: '종 아이콘에\n쌓이는 알림', sub: '배정 하루 전, 이름·시간·조직이 담긴 알림을 자동으로 보냅니다' },
  panel: { kicker: '알림 패널', headline: '읽음/안읽음\n발송내역 추적', sub: '누가 언제 읽었는지 — 발송내역에서 수신자별 읽음 여부를 확인합니다' },
  send:  { kicker: '지금 발송', headline: '자동보다\n확실한 수동', sub: 'GitHub Actions cron 지연 문제로 자동발송을 끄고 수동 버튼만 남겼습니다' },
}
const BADGE: Partial<Record<Phase, string>> = {
  bell:  '🔔 D-1 알림',
  panel: '📋 발송내역',
  send:  '⚠️ 자동발송 중단',
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

function BellPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="app-header-mock">
        <span className="app-header-title">DT Schedule</span>
        <div className="bell-wrap">
          <span className="bell-icon select-none">🔔</span>
          <motion.div className="bell-badge"
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 0.3 }}
          >{NOTIFICATIONS.length}</motion.div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '4cqw', padding: '6cqw' }}>
        <div style={{ fontSize: '16cqw', lineHeight: 1 }} className="select-none">📅</div>
        <div style={{ fontSize: '3.5cqw', fontWeight: 800, color: '#eef0f8', textAlign: 'center' }}>내일 배정 알림</div>
        <div style={{ fontSize: '2.8cqw', color: '#8b8fa8', textAlign: 'center', lineHeight: 1.5 }}>
          안녕하세요 이준혁님!<br />내일 10:00 배정이 있습니다
        </div>
        <motion.div style={{ background: '#8b5cf6', color: '#fff', borderRadius: '999px', padding: '1.5cqw 4cqw', fontSize: '2.8cqw', fontWeight: 700 }}
          animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 2 }}
        >
          확인하기
        </motion.div>
      </div>
    </div>
  )
}

function NotifPanel() {
  return (
    <div className="notif-panel">
      <div className="notif-header">
        <span className="notif-header-title">알림 ({NOTIFICATIONS.filter(n => !n.read).length})</span>
        <span className="notif-clear">모두 읽음</span>
      </div>
      <div className="notif-list">
        {NOTIFICATIONS.map((n, i) => (
          <motion.div key={n.id} className={`notif-item${n.read ? ' read' : ''}`}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12 }}
          >
            <div className={`notif-unread-dot${n.read ? ' hidden' : ''}`} />
            <div className="notif-content">
              <div className="notif-title-row">📅 D-1 배정 알림</div>
              <div className="notif-body">안녕하세요 {n.name}님! 내일 {n.slot} 배정이 있습니다</div>
              <div className="notif-time">{n.time}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function SendPanel() {
  return (
    <div className="send-panel">
      <div className="send-section">
        <div className="send-status-banner">
          <span className="select-none">⚠️</span>
          자동 정시 발송은 현재 잠시 중단된 상태입니다
        </div>
      </div>
      <div className="send-section">
        <div className="send-section-title">메시지 템플릿</div>
        <div className="template-box">
          {MSG_TEMPLATE.split('\n').map((line, i) => (
            <div key={i}>{line.replace(/\{\{(\w+)\}\}/g, (_, v) => `{{${v}}}`)
              .split(/(\{\{[^}]+\}\})/).map((part, j) =>
                part.startsWith('{{') ? <span key={j} className="template-var">{part}</span> : part
              )}</div>
          ))}
        </div>
      </div>
      <div className="send-section">
        <motion.div className="send-now-btn"
          animate={{ scale: [1, 1.03, 1] }} transition={{ repeat: Infinity, duration: 2 }}
        >
          지금 발송 →
        </motion.div>
      </div>
      <div className="send-section">
        <div className="send-section-title">발송내역</div>
        {SEND_HISTORY.map((h, i) => (
          <motion.div key={h.id} className="history-item"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
          >
            <div className="history-avatar">{h.name[0]}</div>
            <div className="history-info">
              <div className="history-name">{h.name}</div>
              <div className="history-msg">{h.msg}</div>
            </div>
            <div className="history-meta">
              <div className="history-time">{h.time}</div>
              <div className={`history-read ${h.read ? 'yes' : 'no'}`}>{h.read ? '읽음' : '안읽음'}</div>
            </div>
          </motion.div>
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
              {phase === 'bell' && (
                <motion.div key="bell" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTransition} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <BellPanel />
                </motion.div>
              )}
              {phase === 'panel' && (
                <motion.div key="panel" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTransition} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <NotifPanel />
                </motion.div>
              )}
              {phase === 'send' && (
                <motion.div key="send" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTransition} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <SendPanel />
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
                <p className="tagline">배정 하루 전, 자동으로 알려드립니다</p>
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
