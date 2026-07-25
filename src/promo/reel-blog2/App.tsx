import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScheduleHeader } from '../../components/schedule/ScheduleHeader'
import { MonthScheduleByDay } from '../../components/schedule/MonthScheduleByDay'
import { DarkModeProvider } from '../../contexts/DarkModeContext'
import { TenantProvider } from '../../contexts/TenantContext'
import type { DateOverride } from '../../types'
import { YEAR, MONTH, PILATES_SCENARIO, OVERRIDE_HOLIDAY, OVERRIDE_SPECIAL } from './mockData'
const noop = () => {}

type Phase = 'intro' | 'rules' | 'holiday' | 'special' | 'outro'
const PHASES: { key: Phase; ms: number }[] = [
  { key: 'intro',   ms: 2200 },
  { key: 'rules',   ms: 3000 },
  { key: 'holiday', ms: 3500 },
  { key: 'special', ms: 3500 },
  { key: 'outro',   ms: 2500 },
]
const TOTAL = PHASES.reduce((s, p) => s + p.ms, 0)

const OVERRIDES_BY_PHASE: Partial<Record<Phase, DateOverride[]>> = {
  rules:   [],
  holiday: [OVERRIDE_HOLIDAY],
  special: [OVERRIDE_HOLIDAY, OVERRIDE_SPECIAL],
}

const HIGHLIGHT_DAY: Partial<Record<Phase, { day: number; kind: 'holiday' | 'special' }>> = {
  holiday: { day: 15, kind: 'holiday' },
  special: { day: 14, kind: 'special' },
}

const CAPTION: Partial<Record<Phase, { kicker: string; headline: string; sub: string }>> = {
  intro: {
    kicker: 'Multi-tenant Rules',
    headline: '월·수·금만\n운영합니다',
    sub: '반복 규칙 하나로 1년치 캘린더가 자동으로 채워집니다',
  },
  rules: {
    kicker: 'schedule_rules',
    headline: '운영일엔 밝게\n쉬는 날엔 줄무늬',
    sub: '요일·시간대별 운영 여부가 달력에 그대로 반영됩니다',
  },
  holiday: {
    kicker: 'date_overrides',
    headline: '이번 주 수요일은\n쉬어요',
    sub: '날짜 예외 하나만 — 규칙은 건드리지 않아도 됩니다',
  },
  special: {
    kicker: 'date_overrides',
    headline: '화요일인데\n오늘만 열어요',
    sub: '미운영일도 특별 운영일로 지정하면 배정이 가능해집니다',
  },
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

const IS_RECORD = new URLSearchParams(location.search).has('record')

type HLPos = { x: number; y: number; w: number; h: number; kind: 'holiday' | 'special' }

function usePhaseLoop() {
  const [idx, setIdx] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    timer.current = setTimeout(() => setIdx(i => (i + 1) % PHASES.length), PHASES[idx].ms)
    return () => clearTimeout(timer.current)
  }, [idx])
  return { phase: PHASES[idx].key, idx }
}

export default function App() {
  const { phase } = usePhaseLoop()
  const isHero = phase === 'rules' || phase === 'holiday' || phase === 'special'
  const dateOverrides: DateOverride[] = OVERRIDES_BY_PHASE[phase] ?? []
  const caption = CAPTION[phase]

  const reelRef  = useRef<HTMLDivElement>(null)
  const calRef   = useRef<HTMLDivElement>(null)
  const [hlPos, setHlPos] = useState<HLPos | null>(null)

  // 슬라이드 애니메이션(≈500ms) 후 DOM에서 해당 날짜 td를 찾아 하이라이트 좌표 계산
  useEffect(() => {
    const hlTarget = HIGHLIGHT_DAY[phase]
    if (!hlTarget) { setHlPos(null); return }

    const timer = setTimeout(() => {
      const calEl  = calRef.current
      const reelEl = reelRef.current
      if (!calEl || !reelEl) return

      let targetTd: HTMLTableCellElement | null = null
      for (const td of Array.from(calEl.querySelectorAll('td'))) {
        const dayDiv = td.querySelector('div')
        if (!dayDiv) continue
        const dayNum = parseInt(dayDiv.childNodes[0]?.textContent?.trim() ?? '', 10)
        if (dayNum === hlTarget.day) { targetTd = td as HTMLTableCellElement; break }
      }
      if (!targetTd) return

      const tr = targetTd.getBoundingClientRect()
      const rr = reelEl.getBoundingClientRect()
      setHlPos({ x: tr.left - rr.left, y: tr.top - rr.top, w: tr.width, h: tr.height, kind: hlTarget.kind })
    }, 600) // 슬라이드 완료 후

    return () => { clearTimeout(timer); setHlPos(null) }
  }, [phase])

  return (
    <div className={`stage${IS_RECORD ? ' record' : ''}`}>
      <div className="reel" ref={reelRef}>
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
            <ScheduleHeader
              year={YEAR} month={MONTH} viewType="month"
              onPrev={noop} onNext={noop} displayMode="day" onDisplayModeChange={noop}
            />
            <div className="calslide-wrap" ref={calRef}>
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={phase}
                  variants={calVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={calTransition}
                  className="calslide"
                >
                  <MonthScheduleByDay
                    year={YEAR} month={MONTH}
                    timeSlots={PILATES_SCENARIO.timeSlots}
                    assignments={PILATES_SCENARIO.assignments}
                    slotSettings={PILATES_SCENARIO.slotSettings}
                    scheduleRules={PILATES_SCENARIO.scheduleRules}
                    dateOverrides={dateOverrides}
                    onCellClick={noop}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* 날짜 하이라이트 링 — .reel 기준 절대 좌표 */}
        <AnimatePresence>
          {hlPos && (
            <motion.div
              key={`${phase}-hl`}
              className={`day-highlight ${hlPos.kind}`}
              style={{ left: hlPos.x, top: hlPos.y, width: hlPos.w, height: hlPos.h }}
              initial={{ opacity: 0, scale: 1.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            />
          )}
        </AnimatePresence>

        <div className="scrim" />
        <div className="scrimtop" />

        <div className="brandmark">Dynamic <span className="brandmark-team">Team</span> Schedule</div>

        <div className="content">
          <AnimatePresence mode="wait">
            {phase !== 'outro' && (
              <motion.div
                key={phase}
                className="captionblock"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } } }}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: 10, transition: { duration: 0.25 } }}
              >
                {(phase === 'holiday' || phase === 'special') && (
                  <motion.div
                    className="override-badge"
                    variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 18 } } }}
                  >
                    {phase === 'holiday' ? '🔴 휴관일 지정' : '🟢 특별 운영일'}
                  </motion.div>
                )}
                <motion.p className="kicker" variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                  {caption?.kicker}
                </motion.p>
                <motion.h1 className="headline" variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } } }}>
                  {caption?.headline.split('\n').map((l, i) => (
                    <span key={i}>{l}{i === 0 && <br />}</span>
                  ))}
                </motion.h1>
                <motion.p className="sub" variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                  {caption?.sub}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {phase === 'outro' && (
              <motion.div
                className="outrowrap"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 180, damping: 20 }}
              >
                <div className="wordmark">Dynamic<br />Team <em>Schedule</em></div>
                <p className="tagline">규칙과 예외를 한 곳에서</p>
                <motion.div
                  className="cta"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.2 }}
                >
                  지금 시작하기 →
                </motion.div>
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
