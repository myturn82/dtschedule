import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WeekGrid } from '../../components/schedule/WeekGrid'
import { DarkModeProvider } from '../../contexts/DarkModeContext'
import { TenantProvider } from '../../contexts/TenantContext'
import type { TimeSlot } from '../../types'
import { ASSIGNMENTS, SCHEDULE_RULES, SLOT_SETTINGS, WEEK_DAYS } from './mockData'

const noop = () => {}
const IS_RECORD = new URLSearchParams(location.search).has('record')
const SLOTS: TimeSlot[] = ['09-10','10-11','11-12','13-14','14-15','15-16','16-17','17-18']

type Phase = 'intro' | 'light' | 'dark' | 'outro'
const PHASES: { key: Phase; ms: number }[] = [
  { key: 'intro', ms: 2000 },
  { key: 'light', ms: 3000 },
  { key: 'dark',  ms: 3500 },
  { key: 'outro', ms: 2500 },
]
const TOTAL = PHASES.reduce((s, p) => s + p.ms, 0)

const CAPTION: Partial<Record<Phase, { kicker: string; headline: string; sub: string }>> = {
  intro: { kicker: 'Dark Mode', headline: '새벽에 보는\n달력', sub: '어두운 차안, 눈부신 흰 화면 — 다크모드는 선택이 아닌 필수였습니다' },
  light: { kicker: 'CSS 변수 · 라이트', headline: '변수 하나로\n전체가 바뀐다', sub: 'var(--color-bg)를 참조하는 모든 컴포넌트가 한꺼번에 전환됩니다' },
  dark:  { kicker: 'CSS 변수 · 다크', headline: '.dark 클래스\n하나만 토글', sub: '컴포넌트마다 dark: 조건을 붙이지 않아도 — 구조가 알아서 맞춥니다' },
}
const BADGE: Partial<Record<Phase, string>> = {
  light: '☀️ Light Mode',
  dark:  '🌙 Dark Mode',
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

const calVariants = { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } }
const calTransition = { duration: 0.6 }

export default function App() {
  const { phase } = usePhaseLoop()
  const isHero  = phase !== 'intro' && phase !== 'outro'
  const isDark  = phase === 'dark'
  const caption = CAPTION[phase]
  const badge   = BADGE[phase]

  // 다크모드 CSS 클래스 토글
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    return () => { document.documentElement.classList.remove('dark') }
  }, [isDark])

  return (
    <div className={`stage${IS_RECORD ? ' record' : ''}`}>
      <div className="reel">
        <motion.div className="boardbg"
          animate={{ scale: isHero ? 1 : 1.05, filter: isHero ? 'blur(0px) brightness(1) saturate(1)' : 'blur(4px) brightness(0.5) saturate(0.85)' }}
          transition={{ type: 'spring', stiffness: 120, damping: 24 }}
        >
          <div className="boardwindow">
            <div className="calslide-wrap">
              <AnimatePresence mode="popLayout">
                <motion.div key={phase} variants={calVariants} initial="enter" animate="center" exit="exit" transition={calTransition} className="calslide">
                  <WeekGrid weekDays={WEEK_DAYS} timeSlots={SLOTS} assignments={ASSIGNMENTS}
                    slotSettings={SLOT_SETTINGS} scheduleRules={SCHEDULE_RULES} dateOverrides={[]}
                    splitRoles={[]} indicatorBarRoles={[]} isSplitMode={false}
                    highlightName={null} profile={null} canAdd={false} onCellClick={noop} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* 모드 토글 표시 */}
        <AnimatePresence>
          {(phase === 'light' || phase === 'dark') && (
            <motion.div className="mode-toggle-bar" key="toggle"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <span className={`mode-label ${isDark ? '' : 'light'}`}>☀️</span>
              <div className="toggle-pill">
                <div className={`toggle-thumb ${isDark ? 'dark' : 'light'}`} />
              </div>
              <span className={`mode-label ${isDark ? 'dark' : ''}`}>🌙</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CSS 변수 힌트 */}
        <AnimatePresence>
          {(phase === 'light' || phase === 'dark') && (
            <motion.div className="css-hint" key="hint"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="css-var">--color-surface</span>:{' '}
              {isDark
                ? <span className="css-val-dark">#13161e</span>
                : <span className="css-val-light">#FFFFFF</span>}
              <br />
              <span className="css-var">--color-text-primary</span>:{' '}
              {isDark
                ? <span className="css-val-dark">#f1f5f9</span>
                : <span className="css-val-light">#14171C</span>}
            </motion.div>
          )}
        </AnimatePresence>

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
                <p className="tagline">낮에도 밤에도, 눈이 편한 달력</p>
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
