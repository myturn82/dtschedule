import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BEFORE_ENTRIES, PACKAGES } from './mockData'

const IS_RECORD = new URLSearchParams(location.search).has('record')

type Phase = 'intro' | 'before' | 'after' | 'deduct' | 'outro'
const PHASES: { key: Phase; ms: number }[] = [
  { key: 'intro',  ms: 2200 },
  { key: 'before', ms: 2800 },
  { key: 'after',  ms: 3800 },
  { key: 'deduct', ms: 3200 },
  { key: 'outro',  ms: 2500 },
]
export const TOTAL = PHASES.reduce((s, p) => s + p.ms, 0)

function usePhaseLoop() {
  const [idx, setIdx] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    timer.current = setTimeout(() => setIdx(i => (i + 1) % PHASES.length), PHASES[idx].ms)
    return () => clearTimeout(timer.current)
  }, [idx])
  return { phase: PHASES[idx].key }
}

// 'after' 페이즈 내 캘린더 클릭 시퀀스: idle→hover→dropdown→filled
function useCalStep(active: boolean) {
  const [step, setStep] = useState(0)
  const t = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    if (!active) { setStep(0); clearTimeout(t.current); return }
    setStep(0)
    const SEQ = [700, 700, 1300]
    let i = 0
    function next() {
      t.current = setTimeout(() => { setStep(s => s + 1); i++; if (i < SEQ.length) next() }, SEQ[i])
    }
    next()
    return () => clearTimeout(t.current)
  }, [active])
  return step
}

const DAYS  = ['일', '월', '화', '수', '목']
const DATES = [16, 17, 18, 19, 20]
const TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00']
const WEEK_DATA: string[][][] = [
  [[], [], [], [], ['조은수']],
  [['조은수', '윤소이'], [], ['이하나', '김민지'], [], []],
  [['이하나'], [], [], [], ['윤소이']],
  [['박진희'], [], [], [], []],
  [[], [], [], [], []],
]

const CAPTION = {
  intro:  { kicker: 'LESSON:ON', headline: '수기 관리의\n번거로움을\n해소하십시오', sub: 'Lesson On이 대신합니다' },
  before: { kicker: '지금 이렇게 관리하시나요?', headline: '노트에\n적고,\n또 잊고', sub: '차감 누락과 노쇼를 부르는 수기 장부' },
  after:  { kicker: '01 — 클릭 한 번', headline: '딸깍,\n스케줄\n등록 끝', sub: '셀을 클릭하면 즉시 배정 완료' },
  deduct: { kicker: '02 — 잔여 횟수 자동 차감', headline: '수업 끝나면\n자동으로\n차감', sub: '만료 임박 회원도 자동 강조' },
}

const cardV = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  show:   { opacity: 1, y: 0,  scale: 1 },
  exit:   { opacity: 0, y: -16, scale: 0.97 },
}
const cardT = { type: 'spring' as const, stiffness: 220, damping: 26 }
const rowV  = {
  hidden: { opacity: 0, x: -12 },
  show: (i: number) => ({ opacity: 1, x: 0, transition: { delay: i * 0.13 + 0.15 } }),
}
const captionItemV = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }

export default function App() {
  const { phase } = usePhaseLoop()
  const isHero  = phase === 'intro' || phase === 'outro'
  const caption = CAPTION[phase as keyof typeof CAPTION]
  const calStep = useCalStep(phase === 'after')

  return (
    <div className={`stage${IS_RECORD ? ' record' : ''}`}>
      <div className="reel">

        {/* ── 배경 floating 카드 ── */}
        <motion.div
          className="boardbg"
          animate={{
            scale: isHero ? 1 : 1.04,
            filter: isHero
              ? 'blur(0px) brightness(1) saturate(1)'
              : 'blur(4px) brightness(0.35) saturate(0.6)',
          }}
          transition={{ type: 'spring', stiffness: 120, damping: 24 }}
        >
          <div className="bg-grid" />
          <div className="bg-glow" />
          <div className="bg-cards">
            <div className="bg-hcard float1">
              <div className="bg-label">☐ 수강권 현황</div>
              <div className="bg-val">8 <span>/ 10회</span></div>
              <div className="bg-bar"><div className="bg-bar-fill" style={{ width: '80%' }} /></div>
              <div className="bg-sub">만료 D-4</div>
            </div>
            <div className="bg-hcard float2">
              <div className="bg-label">◎ D-1 알림</div>
              <div className="bg-msg">내일 수업 안내</div>
              <div className="bg-body">김민지님, 내일 오전 10시 수업이 있습니다.</div>
              <div className="bg-ok">✓ 발송 완료 · 3명</div>
            </div>
            <div className="bg-hcard float3">
              <div className="bg-label">○ 이번 주 배정</div>
              <div className="bg-week">
                {['월','화','수','목','금'].map((d, i) => (
                  <div key={d} className="bg-day">
                    <div className="bg-dn">{d}</div>
                    <div className={`bg-slot ${[0,2,3].includes(i) ? 'on' : 'off'}`}>{[0,2,3].includes(i) ? '●' : ''}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-hcard float4">
              <div className="bg-label">☐ 회원 현황</div>
              <div className="bg-val">6 <span>명</span></div>
              <div className="bg-trend">↑ 이번 달 +2명</div>
              <div className="bg-sub">출석률 87%</div>
            </div>
          </div>
        </motion.div>

        {/* ── 카드 오버레이 ── */}
        <AnimatePresence mode="wait">

          {/* BEFORE — 수기 장부 */}
          {phase === 'before' && (
            <motion.div key="before" className="card-overlay"
              variants={cardV} initial="hidden" animate="show" exit="exit" transition={cardT}
            >
              <div className="card-hdr">
                <span className="card-ico">📝</span>
                <span className="card-ttl">8월 수업 일정.txt</span>
              </div>
              {BEFORE_ENTRIES.map((entry, i) => (
                <motion.div key={entry.date} className={`before-row ${entry.type}`}
                  custom={i} variants={rowV} initial="hidden" animate="show"
                >
                  <div className="before-date">{entry.date}</div>
                  {entry.lines.map((line, j) => (
                    <div key={j} className={`before-line ${j === entry.lines.length - 1 && entry.type !== 'normal' ? 'warn-line' : ''}`}>
                      {line}
                    </div>
                  ))}
                </motion.div>
              ))}
              <motion.div className="before-bridge"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
              >
                LESSON:ON으로 바꾸면? →
              </motion.div>
            </motion.div>
          )}

          {/* AFTER — 주간 캘린더 + 클릭 애니메이션 */}
          {phase === 'after' && (
            <motion.div key="after" className="card-overlay cal-overlay"
              variants={cardV} initial="hidden" animate="show" exit="exit" transition={cardT}
            >
              <div className="card-hdr">
                <span className="cal-month">2026년 8월</span>
                <span className="cal-badge">주간·시간별</span>
              </div>
              <div className="cal-grid">
                {/* 요일 헤더 */}
                <div />
                {DAYS.map((d, i) => (
                  <div key={d} className="cal-day-hdr">
                    <div className={`cal-dow ${i === 0 ? 'sun' : ''}`}>{d}</div>
                    <div className={`cal-date ${i === 0 ? 'sun' : ''}`}>{DATES[i]}</div>
                  </div>
                ))}
                {/* 시간×요일 셀 */}
                {TIMES.map((time, ti) => (
                  <>
                    <div key={`t${ti}`} className="cal-time">{time}</div>
                    {DAYS.map((_, di) => {
                      const isTarget = ti === 4 && di === 4
                      const isHover  = isTarget && calStep === 1
                      const isOpen   = isTarget && calStep === 2
                      const isFilled = isTarget && calStep === 3
                      const members  = WEEK_DATA[ti]?.[di] ?? []
                      return (
                        <div key={`c${ti}-${di}`} className="cal-cell-wrap">
                          <div className={`cal-cell ${members.length ? 'has-m' : ''} ${isHover || isOpen ? 'hover' : ''}`}>
                            {members.slice(0, 2).map(m => (
                              <div key={m} className="cal-tag">{m}</div>
                            ))}
                            {isFilled && (
                              <motion.div className="cal-tag new-tag"
                                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                              >
                                이하나
                              </motion.div>
                            )}
                            {(isHover || isOpen) && !isFilled && (
                              <div className="cal-plus">+</div>
                            )}
                          </div>
                          {isOpen && (
                            <motion.div className="cal-dropdown"
                              initial={{ opacity: 0, y: 5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                            >
                              <div className="cal-drop-hdr">8/20 13:00 배정</div>
                              {['이하나', '조은수', '박진희'].map((name, ni) => (
                                <div key={name} className={`cal-drop-item ${ni === 0 ? 'selected' : ''}`}>
                                  <div className={`cal-drop-dot ${ni === 0 ? 'on' : ''}`} />
                                  {name}
                                  {ni === 0 && <span className="cal-drop-enter">↵</span>}
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      )
                    })}
                  </>
                ))}
              </div>
            </motion.div>
          )}

          {/* DEDUCT — 수강권 자동 차감 */}
          {phase === 'deduct' && (
            <motion.div key="deduct" className="card-overlay"
              variants={cardV} initial="hidden" animate="show" exit="exit" transition={cardT}
            >
              <div className="card-hdr">
                <span className="card-ico">📋</span>
                <span className="card-ttl">수강권 현황</span>
              </div>
              {PACKAGES.map((pkg, i) => (
                <motion.div key={pkg.name} className="pkg-row"
                  custom={i} variants={rowV} initial="hidden" animate="show"
                >
                  <div className="pkg-top">
                    <div>
                      <div className="pkg-name">{pkg.name}</div>
                      <div className="pkg-member">{pkg.member}</div>
                    </div>
                    <span className={`pkg-badge ${pkg.badgeCls}`}>{pkg.badge}</span>
                  </div>
                  <div className="pkg-bar-bg">
                    <motion.div
                      className="pkg-bar-fill"
                      style={{ background: pkg.color }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${Math.round(pkg.used / pkg.total * 100)}%` }}
                      transition={{ delay: i * 0.13 + 0.3, duration: 0.65, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="pkg-meta">
                    <span>잔여 <strong style={{ color: pkg.color }}>{pkg.total - pkg.used}회</strong></span>
                    <span>총 {pkg.total}회</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

        </AnimatePresence>

        {/* ── 스크림 ── */}
        <div className="scrim" />
        <div className="scrimtop" />

        {/* ── 브랜드마크 ── */}
        <div className="brandmark">Dynamic <span className="brandmark-team">Team</span> Schedule</div>

        {/* ── 캡션 ── */}
        <div className="content">
          <AnimatePresence mode="wait">
            {phase !== 'outro' && caption && (
              <motion.div key={phase} className="captionblock"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } } }}
                initial="hidden" animate="show"
                exit={{ opacity: 0, y: 10, transition: { duration: 0.22 } }}
              >
                <motion.p className="kicker" variants={captionItemV}>{caption.kicker}</motion.p>
                <motion.h1 className="headline"
                  variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } } }}
                >
                  {caption.headline.split('\n').map((l, i, arr) => (
                    <span key={i}>{l}{i < arr.length - 1 && <br />}</span>
                  ))}
                </motion.h1>
                <motion.p className="sub" variants={captionItemV}>{caption.sub}</motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {phase === 'outro' && (
              <motion.div className="outrowrap"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 180, damping: 20 }}
              >
                <div className="wordmark">LESSON<em>:ON</em></div>
                <p className="tagline">수기 관리의 번거로움을 해소하십시오</p>
                <motion.div className="cta"
                  initial={{ scale: 0.72, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.2 }}
                >
                  지금 무료로 시작하기 →
                </motion.div>
                <p className="cta-note">신용카드 불필요 · 10명까지 영구 무료</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {!IS_RECORD && (
        <p className="hint">
          <b>이 프레임(9:16)만 화면 녹화</b>하면 됩니다. 루프 {(TOTAL / 1000).toFixed(1)}초.{' '}
          <b>고화질:</b> URL 끝에 <code>?record</code> 추가 → DevTools → 기기 에뮬레이션 → 1080×1920.
        </p>
      )}
    </div>
  )
}
