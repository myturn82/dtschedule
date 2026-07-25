import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WeekGrid } from '../../components/schedule/WeekGrid'
import { DarkModeProvider } from '../../contexts/DarkModeContext'
import { TenantProvider } from '../../contexts/TenantContext'
import type { TenantRole } from '../../types'
import {
  YEAR, MONTH,
  SCENARIO_NOROLE, SCENARIO_INDICATOR, SCENARIO_SPLIT,
  HIGHLIGHT_INDICATOR_DAY, HIGHLIGHT_SPLIT_DAY,
} from './mockData'

const noop = () => {}

// 4일 뷰 — 하이라이트 대상이 두 번째 열에 오도록 설정
const WEEK_DAYS_NOROLE    = [7, 8, 9, 10].map(d => new Date(2026, 6, d))  // 화·수·목·금
const WEEK_DAYS_INDICATOR = [6, 7, 8, 9].map(d => new Date(2026, 6, d))   // 월·화·수·목, 하이라이트=화(7)
const WEEK_DAYS_SPLIT     = [7, 8, 9, 10].map(d => new Date(2026, 6, d))  // 화·수·목·금, 하이라이트=수(8)

type Phase = 'intro' | 'norole' | 'indicator' | 'split' | 'outro'
const PHASES: { key: Phase; ms: number }[] = [
  { key: 'intro',     ms: 2200 },
  { key: 'norole',    ms: 2800 },
  { key: 'indicator', ms: 3800 },
  { key: 'split',     ms: 3800 },
  { key: 'outro',     ms: 2500 },
]
const TOTAL = PHASES.reduce((s, p) => s + p.ms, 0)

type Scenario = typeof SCENARIO_NOROLE
const SCENARIO_BY_PHASE: Partial<Record<Phase, Scenario>> = {
  norole:    SCENARIO_NOROLE,
  indicator: SCENARIO_INDICATOR,
  split:     SCENARIO_SPLIT,
}

type HLKind = 'indicator' | 'split'
const HIGHLIGHT_BY_PHASE: Partial<Record<Phase, { day: number; kind: HLKind; label: string }>> = {
  indicator: { day: HIGHLIGHT_INDICATOR_DAY, kind: 'indicator', label: '팀장' },
  split:     { day: HIGHLIGHT_SPLIT_DAY,     kind: 'split',     label: '커트팀 / 펌팀' },
}

const CAPTION: Partial<Record<Phase, { kicker: string; headline: string; sub: string }>> = {
  intro: {
    kicker: 'Role-based Assignment',
    headline: '한 칸 안에\n두 사람',
    sub: '조직 구조에 맞게 역할을 정의하면 달력이 알아서 바뀝니다',
  },
  norole: {
    kicker: '역할 0개 (기본)',
    headline: '역할 없으면\n이름만 나열',
    sub: '역할이 불필요한 조직은 그냥 이름만 — 선택적 기능입니다',
  },
  indicator: {
    kicker: 'indicator_bar',
    headline: '팀장은\n상단 색 줄로',
    sub: '셀을 나누지 않고 얇은 색 줄로 구분 — 나머지 공간은 봉사자 차지',
  },
  split: {
    kicker: 'split_cell',
    headline: '커트팀 · 펌팀\n역할별로',
    sub: '같은 시간대에 역할마다 독립적으로 — 예약이 섞이지 않습니다',
  },
}

const BADGE: Partial<Record<Phase, string>> = {
  indicator: '🟡 indicator_bar',
  split:     '🟩 split_cell',
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

type HLPos = { x: number; y: number; w: number; h: number; kind: HLKind; label: string }

function usePhaseLoop() {
  const [idx, setIdx] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    timer.current = setTimeout(() => setIdx(i => (i + 1) % PHASES.length), PHASES[idx].ms)
    return () => clearTimeout(timer.current)
  }, [idx])
  return { phase: PHASES[idx].key }
}

// WeekGrid(CSS grid 기반) 헤더 버튼에서 날짜로 열 전체 rect 반환
// maxRows: 하이라이트 높이를 제한할 슬롯 행 수 (undefined = 마지막 행까지)
function findWeekGridDayRect(calEl: HTMLElement, reelEl: HTMLElement, day: number, maxRows?: number): DOMRect | null {
  const rr = reelEl.getBoundingClientRect()

  const buttons = Array.from(calEl.querySelectorAll('button'))
  const dayBtn = buttons.find(btn =>
    Array.from(btn.querySelectorAll('div')).some(
      div => div.textContent?.trim() === String(day) && div.childElementCount === 0
    )
  )
  if (!dayBtn) return null

  const btnR = dayBtn.getBoundingClientRect()

  // headerRow → innerContainer → 시간슬롯 rows
  const headerRow = dayBtn.parentElement         // .grid (sticky header)
  const innerContainer = headerRow?.parentElement // minWidth div
  const kids = innerContainer ? Array.from(innerContainer.children) : []
  // kids[0] = sticky 헤더, kids[1..] = 시간슬롯 행
  const slotRows = kids.slice(1)
  const targetRow = maxRows !== undefined
    ? slotRows[Math.min(maxRows - 1, slotRows.length - 1)]
    : slotRows[slotRows.length - 1]
  const bottomY = targetRow
    ? targetRow.getBoundingClientRect().bottom - rr.top
    : calEl.getBoundingClientRect().bottom - rr.top

  return new DOMRect(
    btnR.left - rr.left,
    btnR.top  - rr.top,
    btnR.width,
    bottomY - (btnR.top - rr.top),
  )
}

// ScheduleGrid(table 기반) tbody의 주차 날짜 td로 열 전체 rect 반환
function findScheduleGridDayRect(calEl: HTMLElement, reelEl: HTMLElement, day: number): DOMRect | null {
  const rr  = reelEl.getBoundingClientRect()
  const calR = calEl.getBoundingClientRect()

  const dayTd = Array.from(calEl.querySelectorAll('tbody td')).find(td => {
    const first = td.childNodes[0]
    if (!first) return false
    const text = first.nodeType === Node.TEXT_NODE
      ? first.textContent?.trim()
      : (first as Element).textContent?.trim()
    return text === String(day)
  })

  if (!dayTd) return null
  const tdR = dayTd.getBoundingClientRect()
  return new DOMRect(tdR.left - rr.left, tdR.top - rr.top, tdR.width, calR.bottom - tdR.top)
}

export default function App() {
  const { phase } = usePhaseLoop()
  const isHero   = phase !== 'intro' && phase !== 'outro'
  const scenario: Scenario = SCENARIO_BY_PHASE[phase] ?? SCENARIO_NOROLE
  const caption = CAPTION[phase]
  const badge   = BADGE[phase]

  const WEEK_DAYS_BY_PHASE: Partial<Record<Phase, Date[]>> = {
    norole:    WEEK_DAYS_NOROLE,
    indicator: WEEK_DAYS_INDICATOR,
    split:     WEEK_DAYS_SPLIT,
  }
  const weekDays = WEEK_DAYS_BY_PHASE[phase] ?? WEEK_DAYS_NOROLE

  const reelRef = useRef<HTMLDivElement>(null)
  const calRef  = useRef<HTMLDivElement>(null)
  const [hlPos, setHlPos] = useState<HLPos | null>(null)

  useEffect(() => {
    const hlTarget = HIGHLIGHT_BY_PHASE[phase]
    if (!hlTarget) { setHlPos(null); return }
    const timer = setTimeout(() => {
      const calEl  = calRef.current
      const reelEl = reelRef.current
      if (!calEl || !reelEl) return
      const maxRows = hlTarget.kind === 'indicator' ? 1 : 4
      const rect = findWeekGridDayRect(calEl, reelEl, hlTarget.day, maxRows)
      if (rect) setHlPos({ x: rect.x, y: rect.y, w: rect.width, h: rect.height, kind: hlTarget.kind, label: hlTarget.label })
    }, 650)
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
            <div className="calslide-wrap" ref={calRef}>
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={phase}
                  variants={calVariants}
                  initial="enter" animate="center" exit="exit"
                  transition={calTransition}
                  className="calslide"
                >
                  <WeekGrid
                    weekDays={weekDays}
                    timeSlots={scenario.timeSlots}
                    assignments={scenario.assignments}
                    slotSettings={scenario.slotSettings}
                    scheduleRules={scenario.scheduleRules}
                    dateOverrides={[]}
                    splitRoles={scenario.splitRoles as TenantRole[]}
                    indicatorBarRoles={scenario.indicatorBarRoles as TenantRole[]}
                    isSplitMode={scenario.isSplitMode}
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
          {hlPos && (
            <>
              <motion.div
                key={`${phase}-hl`}
                className={`hl-spotlight ${hlPos.kind}`}
                style={{ left: hlPos.x, top: hlPos.y, width: hlPos.w, height: hlPos.h, transformOrigin: 'top center' }}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1.04 }}
                exit={{ opacity: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              />
              <motion.div
                key={`${phase}-lbl`}
                className={`hl-label ${hlPos.kind}`}
                style={{ left: hlPos.x + hlPos.w / 2, top: `calc(${hlPos.y}px - 4cqw)` }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.12, type: 'spring', stiffness: 300, damping: 24 }}
              >
                {hlPos.label}
              </motion.div>
            </>
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
              <motion.div
                key={phase}
                className="captionblock"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } } }}
                initial="hidden" animate="show"
                exit={{ opacity: 0, y: 10, transition: { duration: 0.25 } }}
              >
                {badge && (
                  <motion.div
                    className="override-badge"
                    variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 18 } } }}
                  >
                    {badge}
                  </motion.div>
                )}
                <motion.p className="kicker" variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                  {caption?.kicker}
                </motion.p>
                <motion.h1 className="headline" variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } } }}>
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
                <p className="tagline">역할별 배정을 달력 한 칸에</p>
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
