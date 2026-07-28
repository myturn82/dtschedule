import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WeekGrid } from '../../components/schedule/WeekGrid'
import { DarkModeProvider } from '../../contexts/DarkModeContext'
import { TenantProvider } from '../../contexts/TenantContext'
import type { TimeSlot } from '../../types'
import { ALL_ASSIGNMENTS, MOCK_PROPOSALS, SCHEDULE_RULES, SLOT_SETTINGS, WEEK_DAYS } from './mockData'

const noop = () => {}
const IS_RECORD = new URLSearchParams(location.search).has('record')
const SLOTS: TimeSlot[] = ['09-10','10-11','11-12','13-14','14-15','15-16','16-17','17-18']

type Phase = 'intro' | 'admin-ratio' | 'admin-member' | 'schedule-run' | 'preview' | 'filling' | 'full' | 'outro'

const PHASES: { key: Phase; ms: number }[] = [
  { key: 'intro',        ms: 1800 },
  { key: 'admin-ratio',  ms: 3000 },
  { key: 'admin-member', ms: 3200 },
  { key: 'schedule-run', ms: 2200 },
  { key: 'preview',      ms: 3500 },
  { key: 'filling',      ms: 4200 },
  { key: 'full',         ms: 2500 },
  { key: 'outro',        ms: 2200 },
]
const TOTAL = PHASES.reduce((s, p) => s + p.ms, 0)

const CAPTIONS: Partial<Record<Phase, { kicker: string; headline: string; sub: string }>> = {
  intro: {
    kicker:   '전체 워크플로우',
    headline: '설정부터\n확정까지',
    sub:      '자동배정의 전체 흐름을 한눈에 확인합니다',
  },
  'admin-ratio': {
    kicker:   '1단계 · 관리자 설정',
    headline: '역할 비율\n한 번만 입력',
    sub:      '봉사자 60%, 플러스 40% — 저장하면 매월 재사용',
  },
  'admin-member': {
    kicker:   '2단계 · 관리자 설정',
    headline: '가능 요일·횟수\n개인별 지정',
    sub:      '특정 요일만 가능하거나 월 상한이 있는 회원 설정',
  },
  'schedule-run': {
    kicker:   '3단계 · 실행',
    headline: '버튼 하나로\n계산 시작',
    sub:      '스케줄 화면 메뉴에서 자동배정을 실행합니다',
  },
  preview: {
    kicker:   '4단계 · 검토',
    headline: '미리보기로\n확인 후 확정',
    sub:      '배정 목록 검토 — 원하지 않는 항목은 체크 해제 가능',
  },
  filling: {
    kicker:   '배정 적용 중',
    headline: '설정대로\n공평하게 채움',
    sub:      '라운드로빈 · 가능 요일 · 월 상한을 모두 반영합니다',
  },
  full: {
    kicker:   '배정 완료',
    headline: '미리보기 후\n한 번에 확정',
    sub:      '계산은 한 번만 — 확인하고 적용하면 DB에 저장됩니다',
  },
}

const BADGE: Partial<Record<Phase, string>> = {
  'admin-ratio':  '⚙️ 관리자 설정',
  'admin-member': '⚙️ 관리자 설정',
  'schedule-run': '🖱️ 실행',
  preview:        '👁️ 미리보기',
  filling:        '⚙️ 라운드로빈',
  full:           '✅ 배정 완료',
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

// ── Mock Admin Panels ─────────────────────────────────────────────────
const DAY_LABELS = ['일','월','화','수','목','금','토']

function AdminRatioPanel() {
  return (
    <div className="ap-wrap">
      <div className="ap-header">
        <span className="ap-badge">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8 19 13M17.8 6.2 19 5M12.2 6.2 11 5M12.2 11.8 11 13"/><path d="M3 21l9-9"/><path d="M12.2 6.2 3 15l3 3 9.2-9.2"/></svg>
          조직 설정 · 자동배정
        </span>
        <p className="ap-title">자동배정</p>
        <p className="ap-desc">역할 비율과 회원별 가능 요일·횟수를 설정합니다.</p>
      </div>
      <div className="ap-card">
        <p className="ap-card-label">역할 비율 (합계 100%)</p>
        <div className="ap-ratio-rows">
          {([['봉사자', '60'], ['플러스', '40']] as [string, string][]).map(([name, val]) => (
            <div key={name} className="ap-ratio-row">
              <span className="ap-role-name">{name}</span>
              <input className="ap-input" value={val} readOnly />
              <span className="ap-pct">%</span>
            </div>
          ))}
        </div>
        <p className="ap-sum">합계: <strong>100%</strong></p>
        <button className="ap-save-btn">비율 저장</button>
      </div>
    </div>
  )
}

function AdminMemberPanel() {
  return (
    <div className="ap-wrap">
      <div className="ap-header">
        <span className="ap-badge">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8 19 13M17.8 6.2 19 5M12.2 6.2 11 5M12.2 11.8 11 13"/><path d="M3 21l9-9"/><path d="M12.2 6.2 3 15l3 3 9.2-9.2"/></svg>
          조직 설정 · 자동배정
        </span>
        <p className="ap-title">자동배정</p>
      </div>
      <div className="ap-card ap-card-sm">
        <p className="ap-card-label">회원별 설정</p>
        <p className="ap-card-hint">가능 요일 미선택 시 모든 요일로 처리됩니다.</p>
        {/* 이준혁 — 펼쳐진 상태 */}
        <div className="ap-member-row ap-expanded">
          <div className="ap-member-hd">
            <span className="ap-member-name">이준혁</span>
            <div className="ap-member-meta">
              <span>월·수·금</span>
              <span>월4회</span>
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(90deg)' }}><path d="M4 2l4 4-4 4"/></svg>
            </div>
          </div>
          <div className="ap-member-bd">
            <p className="ap-field-label">가능 요일</p>
            <div className="ap-days">
              {DAY_LABELS.map((label, i) => {
                const checked = [1, 3, 5].includes(i) // 월·수·금
                return (
                  <label key={i} className="ap-day">
                    <input type="checkbox" defaultChecked={checked} readOnly />
                    <span>{label}</span>
                  </label>
                )
              })}
            </div>
            <div className="ap-limit-row">
              <span className="ap-field-label">월별 최대</span>
              <input className="ap-input" value="4" readOnly />
              <span className="ap-pct">회</span>
            </div>
            <button className="ap-save-btn-sm">저장</button>
          </div>
        </div>
        {/* 나머지 회원 — 접힌 상태 */}
        {['박서연', '최지민', '한아름'].map(name => (
          <div key={name} className="ap-member-row">
            <div className="ap-member-hd">
              <span className="ap-member-name">{name}</span>
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2l4 4-4 4"/></svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScheduleRunOverlay() {
  return (
    <div className="sr-menu">
      <div className="sr-item">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        인원 설정
      </div>
      <div className="sr-item sr-hi">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8 19 13M17.8 6.2 19 5M12.2 6.2 11 5M12.2 11.8 11 13"/><path d="M3 21l9-9"/><path d="M12.2 6.2 3 15l3 3 9.2-9.2"/></svg>
        자동배정
      </div>
      <div className="sr-item">엑셀 내보내기</div>
    </div>
  )
}

function PreviewModal() {
  return (
    <div className="pm-modal">
      <div className="pm-header">
        <div>
          <p className="pm-title">자동배정 미리보기</p>
          <p className="pm-subtitle">총 <span className="pm-count">{ALL_ASSIGNMENTS.length}</span>건 배정 예정</p>
        </div>
        <button className="pm-close">×</button>
      </div>
      <div className="pm-settings">
        <p className="pm-settings-label">적용된 설정</p>
        <div className="pm-tags">
          <span className="pm-tag">봉사자 60%</span>
          <span className="pm-tag">플러스 40%</span>
          <span className="pm-tag-gray">이준혁 월·수·금 월4회</span>
        </div>
      </div>
      <div className="pm-table-wrap">
        <table className="pm-table">
          <thead>
            <tr>
              <th><input type="checkbox" defaultChecked readOnly /></th>
              <th>날짜</th>
              <th>시간대</th>
              <th>역할</th>
              <th>배정 회원</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_PROPOSALS.map(p => (
              <tr key={p.id}>
                <td><input type="checkbox" defaultChecked readOnly /></td>
                <td>{p.dayLabel}</td>
                <td className="pm-mono">{p.timeSlot}</td>
                <td className="pm-muted">{p.roleName}</td>
                <td className="pm-name">{p.userName}</td>
              </tr>
            ))}
            <tr className="pm-more-row">
              <td colSpan={5}>… 외 {ALL_ASSIGNMENTS.length - MOCK_PROPOSALS.length}건</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="pm-footer">
        <button className="pm-confirm">{ALL_ASSIGNMENTS.length}건 저장</button>
        <button className="pm-cancel">취소</button>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────
export default function App() {
  const { phase } = usePhaseLoop()

  const boardBlurred = ['intro', 'outro', 'admin-ratio', 'admin-member', 'preview'].includes(phase)
  const caption = CAPTIONS[phase]
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
    if (phase === 'full') { setFillCount(ALL_ASSIGNMENTS.length); return }
    setFillCount(0)
  }, [phase])

  const visibleAssignments =
    phase === 'filling' ? ALL_ASSIGNMENTS.slice(0, fillCount) :
    phase === 'full'    ? ALL_ASSIGNMENTS : []

  const showCounter = phase === 'filling' || phase === 'full'
  const isDone      = phase === 'full'

  const calKey = (phase === 'filling' || phase === 'full') ? 'cal' : phase

  return (
    <div className={`stage${IS_RECORD ? ' record' : ''}`}>
      <div className="reel">
        {/* ── 배경 WeekGrid ── */}
        <motion.div
          className="boardbg"
          animate={{
            scale: boardBlurred ? 1.05 : 1,
            filter: boardBlurred
              ? 'blur(4px) brightness(0.45) saturate(0.8)'
              : 'blur(0px) brightness(1) saturate(1)',
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

        {/* ── 관리자 설정 패널 ── */}
        <AnimatePresence>
          {(phase === 'admin-ratio' || phase === 'admin-member') && (
            <motion.div
              key={phase}
              className="ap-overlay"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            >
              {phase === 'admin-ratio' ? <AdminRatioPanel /> : <AdminMemberPanel />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 자동배정 메뉴 드롭다운 ── */}
        <AnimatePresence>
          {phase === 'schedule-run' && (
            <motion.div
              className="sr-overlay"
              initial={{ opacity: 0, y: -10, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            >
              <ScheduleRunOverlay />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 미리보기 모달 ── */}
        <AnimatePresence>
          {phase === 'preview' && (
            <motion.div
              className="pm-overlay"
              initial={{ opacity: 0, scale: 0.92, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            >
              <PreviewModal />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 배정 카운터 ── */}
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
            {phase !== 'outro' && caption && (
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
                  {caption.kicker}
                </motion.p>
                <motion.h1 className="headline"
                  variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } } }}
                >
                  {caption.headline.split('\n').map((l, i) => <span key={i}>{l}{i === 0 && <br />}</span>)}
                </motion.h1>
                <motion.p className="sub" variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                  {caption.sub}
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
