import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WeekGrid } from '../../components/schedule/WeekGrid'
import { DarkModeProvider } from '../../contexts/DarkModeContext'
import { TenantProvider } from '../../contexts/TenantContext'
import type { TimeSlot } from '../../types'
import { ALL_ASSIGNMENTS, SCHEDULE_RULES, SLOT_SETTINGS, WEEK_DAYS } from './mockData'

const noop = () => {}
const IS_RECORD = new URLSearchParams(location.search).has('record')

const SLOTS: TimeSlot[] = ['09-10','10-11','11-12','13-14','14-15','15-16','16-17','17-18']

type Phase = 'intro' | 'empty' | 'filling' | 'full' | 'outro'
const PHASES: { key: Phase; ms: number }[] = [
  { key: 'intro',   ms: 2000 },
  { key: 'empty',   ms: 2500 },
  { key: 'filling', ms: 4200 },
  { key: 'full',    ms: 2500 },
  { key: 'outro',   ms: 2500 },
]
const TOTAL = PHASES.reduce((s, p) => s + p.ms, 0)

const CAPTION: Partial<Record<Phase, { kicker: string; headline: string; sub: string }>> = {
  intro: {
    kicker:   'Auto Assign',
    headline: '빈 슬롯을\n알아서 채워요',
    sub:      '공정한 라운드로빈으로 배정 횟수를 자동 균등 분배합니다',
  },
  empty: {
    kicker:   '배정 전',
    headline: '빈 달력\n그대로 출발',
    sub:      '자동배정 실행 전 상태 — 모든 슬롯이 비어 있습니다',
  },
  filling: {
    kicker:   '자동배정 실행 중',
    headline: '누적 횟수 적은\n순서대로',
    sub:      '가능 요일·월 상한을 확인하고 한 명씩 공평하게 채워갑니다',
  },
  full: {
    kicker:   '배정 완료',
    headline: '미리보기 후\n한 번에 확정',
    sub:      '계산은 한 번만 — 확인하고 적용하면 DB에 저장됩니다',
  },
}

const BADGE: Partial<Record<Phase, string>> = {
  filling: '⚙️ 라운드로빈',
  full:    '✅ 배정 완료',
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

const calVariants = {
  enter:  { x: '100%',  opacity: 0 },
  center: { x: '0%',    opacity: 1 },
  exit:   { x: '-100%', opacity: 0 },
}
const calTransition = {
  x:       { type: 'spring' as const, stiffness: 280, damping: 30 },
  opacity: { duration: 0.12 },
}

export default function App() {
  const { phase } = usePhaseLoop()
  const isHero  = phase !== 'intro' && phase !== 'outro'
  const caption = CAPTION[phase]
  const badge   = BADGE[phase]

  const [fillCount, setFillCount] = useState(0)

  useEffect(() => {
    if (phase === 'filling') {
      setFillCount(0)
      const total    = ALL_ASSIGNMENTS.length
      const interval = Math.floor(3800 / total)
      let count = 0
      const id = setInterval(() => {
        count++
        setFillCount(count)
        if (count >= total) clearInterval(id)
      }, interval)
      return () => clearInterval(id)
    }
    if (phase === 'full')  { setFillCount(ALL_ASSIGNMENTS.length); return }
    if (phase === 'empty') { setFillCount(0); return }
  }, [phase])

  const visibleAssignments =
    phase === 'empty'   ? [] :
    phase === 'filling' ? ALL_ASSIGNMENTS.slice(0, fillCount) :
    phase === 'full'    ? ALL_ASSIGNMENTS : []

  const showCounter = phase === 'filling' || phase === 'full'
  const isDone      = phase === 'full'

  // intro/outro는 empty 달력을 배경으로 보여줌
  const calKey = (phase === 'empty' || phase === 'filling' || phase === 'full') ? 'cal' : phase

  return (
    <div className={`stage${IS_RECORD ? ' record' : ''}`}>
      <div className="reel">
        <motion.div
          className="boardbg"
          animate={{
            scale: isHero ? 1 : 1.05,
            filter: isHero
              ? 'blur(0px) brightness(1) saturate(1)'
              : 'blur(4px) brightness(0.5) saturate(0.85)',
          }}
          transition={{ type: 'spring', stiffness: 120, damping: 24 }}
        >
          <div className="boardwindow">
            <div className="calslide-wrap">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={calKey}
                  variants={calVariants}
                  initial="enter" animate="center" exit="exit"
                  transition={calTransition}
                  className="calslide"
                >
                  <WeekGrid
                    weekDays={WEEK_DAYS}
                    timeSlots={SLOTS}
                    assignments={visibleAssignments}
                    slotSettings={SLOT_SETTINGS}
                    scheduleRules={SCHEDULE_RULES}
                    dateOverrides={[]}
                    splitRoles={[]}
                    indicatorBarRoles={[]}
                    isSplitMode={false}
                    highlightName={null}
                    profile={null}
                    canAdd={false}
                    onCellClick={noop}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {showCounter && (
            <motion.div
              key={isDone ? 'ctr-done' : 'ctr'}
              className={`fill-counter${isDone ? ' done' : ''}`}
              initial={{ opacity: 0, scale: 0.82, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            >
              {isDone ? `✓ ${ALL_ASSIGNMENTS.length}명 배정 완료` : `배정 중… ${fillCount}명`}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="scrim" />
        <div className="scrimtop" />

        <div className="brandmark">
          Dynamic <span className="brandmark-team">Team</span> Schedule
        </div>

        <div className="content">
          <AnimatePresence mode="wait">
            {phase !== 'outro' && (
              <motion.div key={phase} className="captionblock"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } } }}
                initial="hidden" animate="show"
                exit={{ opacity: 0, y: 10, transition: { duration: 0.25 } }}
              >
                {badge && (
                  <motion.div className="override-badge"
                    variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 18 } } }}
                  >{badge}</motion.div>
                )}
                <motion.p className="kicker" variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                  {caption?.kicker}
                </motion.p>
                <motion.h1 className="headline"
                  variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } } }}
                >
                  {caption?.headline.split('\n').map((l, i) => <span key={i}>{l}{i === 0 && <br />}</span>)}
                </motion.h1>
                <motion.p className="sub" variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                  {caption?.sub}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {phase === 'outro' && (
              <motion.div className="outrowrap"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 180, damping: 20 }}
              >
                <div className="wordmark">Dynamic<br />Team <em>Schedule</em></div>
                <p className="tagline">공평한 자동배정, 한 클릭으로</p>
                <motion.div className="cta"
                  initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.2 }}
                >지금 시작하기 →</motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {!IS_RECORD && (
        <p className="hint">
          <b>이 프레임(9:16)만 화면 녹화</b>하면 됩니다. 루프 {(TOTAL / 1000).toFixed(0)}초.{' '}
          <b>고화질 녹화:</b> URL 끝에 <code>?record</code> 추가 후 Chrome DevTools → 기기 에뮬레이션 → 1080×1920 설정.
        </p>
      )}
    </div>
  )
}

export function AppRoot() {
  return (
    <DarkModeProvider>
      <TenantProvider>
        <App />
      </TenantProvider>
    </DarkModeProvider>
  )
}
