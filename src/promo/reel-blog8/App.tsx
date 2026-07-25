import { useState } from 'react'
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WeekGrid } from '../../components/schedule/WeekGrid'
import { DarkModeProvider } from '../../contexts/DarkModeContext'
import { TenantProvider } from '../../contexts/TenantContext'
import type { TimeSlot } from '../../types'
import { BASE_ASSIGNMENTS, PASTE_ASSIGNMENTS, SCHEDULE_RULES, SLOT_SETTINGS, WEEK_DAYS, SELECTION_RANGE, COPY_RANGE, EXPORT_FORMATS } from './mockData'

const noop = () => {}
const IS_RECORD = new URLSearchParams(location.search).has('record')
const SLOTS: TimeSlot[] = ['09-10','10-11','11-12','13-14','14-15','15-16','16-17','17-18']

type Phase = 'intro' | 'select' | 'paste' | 'export' | 'outro'
const PHASES: { key: Phase; ms: number }[] = [
  { key: 'intro',  ms: 2000 },
  { key: 'select', ms: 3000 },
  { key: 'paste',  ms: 3000 },
  { key: 'export', ms: 3500 },
  { key: 'outro',  ms: 2500 },
]
const TOTAL = PHASES.reduce((s, p) => s + p.ms, 0)

const CAPTION: Partial<Record<Phase, { kicker: string; headline: string; sub: string }>> = {
  intro:  { kicker: 'Excel Mode', headline: '엑셀처럼\n드래그·복사', sub: '한 주를 통째로 복사해 다음 주에 붙여넣기 — 반복 패턴에 최적' },
  select: { kicker: 'Ctrl+C', headline: '범위 선택\n그대로 복사', sub: '드래그로 셀 범위를 잡고 Ctrl+C — 역할별 소속 규칙도 함께 검사합니다' },
  paste:  { kicker: 'Ctrl+V', headline: '다음 주에\n그대로 붙여넣기', sub: '붙여넣기 위치만 클릭하면 선택했던 범위 크기 그대로 복제됩니다' },
  export: { kicker: '4종 내보내기', headline: 'XLSX·CSV\nDOCX·PDF', sub: '게시판에 붙일 PDF, 재가공할 엑셀 — 용도에 맞게 바로 내려받습니다' },
}
const BADGE: Partial<Record<Phase, string>> = {
  select: '📋 엑셀모드 ON',
  paste:  '📋 붙여넣기 완료',
  export: '📤 내보내기',
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

function ExportPanel() {
  const [activeId, setActiveId] = useState('')
  useEffect(() => {
    const ids = EXPORT_FORMATS.map(f => f.id)
    let i = 0
    const timer = setInterval(() => { i = (i + 1) % ids.length; setActiveId(ids[i]) }, 750)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className="export-wrap">
      <div className="export-title">내보내기</div>
      <div className="export-subtitle">이번 달 스케줄을 원하는 포맷으로</div>
      <div className="export-grid">
        {EXPORT_FORMATS.map(f => (
          <div key={f.id} className={`export-btn${f.id === activeId ? ' active' : ''}`}>
            <span className="export-btn-icon select-none">{f.icon}</span>
            <span className="export-btn-label">{f.label}</span>
            <span className="export-btn-desc">{f.desc}</span>
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

  const assignments = phase === 'paste' ? PASTE_ASSIGNMENTS : BASE_ASSIGNMENTS
  const selRange    = (phase === 'select' || phase === 'paste') ? SELECTION_RANGE : null
  const copyRange   = phase === 'paste' ? COPY_RANGE : null

  return (
    <div className={`stage${IS_RECORD ? ' record' : ''}`}>
      <div className="reel">
        <motion.div className="boardbg"
          animate={{ scale: isHero ? 1 : 1.05, filter: isHero ? 'blur(0px) brightness(1) saturate(1)' : 'blur(4px) brightness(0.5) saturate(0.85)' }}
          transition={{ type: 'spring', stiffness: 120, damping: 24 }}
        >
          <div className="boardwindow">
            <AnimatePresence mode="popLayout">
              {phase !== 'export' ? (
                <motion.div key="cal" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTransition}
                  style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  <div className="calslide-wrap">
                    <div className="calslide">
                      <WeekGrid weekDays={WEEK_DAYS} timeSlots={SLOTS} assignments={assignments}
                        slotSettings={SLOT_SETTINGS} scheduleRules={SCHEDULE_RULES} dateOverrides={[]}
                        splitRoles={[]} indicatorBarRoles={[]} isSplitMode={false}
                        highlightName={null} profile={null} canAdd={false} onCellClick={noop}
                        selectionRange={selRange} copyRange={copyRange} />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="export" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTransition}
                  style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  <ExportPanel />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <AnimatePresence>
          {(phase === 'select' || phase === 'paste') && (
            <motion.div className="excel-badge" key="excel"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            >
              📋 엑셀모드
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
                <p className="tagline">스프레드시트 감성, 달력 위에서</p>
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
