import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PACKAGES, SENT_LIST } from './mockData'

const IS_RECORD = new URLSearchParams(location.search).has('record')

type Phase = 'intro' | 'pain' | 'package' | 'notify' | 'outro'
const PHASES: { key: Phase; ms: number }[] = [
  { key: 'intro',   ms: 2200 },
  { key: 'pain',    ms: 2800 },
  { key: 'package', ms: 3200 },
  { key: 'notify',  ms: 3000 },
  { key: 'outro',   ms: 2500 },
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

const CAPTION: Partial<Record<Phase, { kicker: string; headline: string; sub: string }>> = {
  intro: {
    kicker: 'LESSON:ON',
    headline: '강사가\n가르치는 데만\n집중하도록',
    sub: '수강권·알림·스케줄 관리를 자동으로',
  },
  pain: {
    kicker: '현실',
    headline: '지금도\n이렇게?',
    sub: '레슨 강사가 수업 외에 쏟는 시간, 생각보다 훨씬 많습니다',
  },
  package: {
    kicker: '수강권 자동 관리',
    headline: '차감 현황\n한눈에',
    sub: '출석 시 자동 차감 · 만료 임박 회원 자동 강조',
  },
  notify: {
    kicker: 'D-1 자동 알림',
    headline: '노쇼 없는\n수업 운영',
    sub: '수업 하루 전 자동 발송 · 읽음 여부까지 추적',
  },
}

const cardV = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  show:   { opacity: 1, y: 0,  scale: 1 },
  exit:   { opacity: 0, y: -18, scale: 0.96 },
}
const cardT = { type: 'spring' as const, stiffness: 220, damping: 26 }
const rowV = {
  hidden: { opacity: 0, x: -12 },
  show: (i: number) => ({ opacity: 1, x: 0, transition: { delay: i * 0.12 + 0.15 } }),
}
const captionItemV = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0 },
}

export default function App() {
  const { phase } = usePhaseLoop()
  const isHero = phase === 'intro' || phase === 'outro'
  const caption = CAPTION[phase]

  return (
    <div className={`stage${IS_RECORD ? ' record' : ''}`}>
      <div className="reel">

        {/* ── 배경 floating cards ── */}
        <motion.div
          className="boardbg"
          animate={{
            scale: isHero ? 1 : 1.04,
            filter: isHero
              ? 'blur(0px) brightness(1) saturate(1)'
              : 'blur(4px) brightness(0.38) saturate(0.65)',
          }}
          transition={{ type: 'spring', stiffness: 120, damping: 24 }}
        >
          <div className="bg-grid" />
          <div className="bg-glow" />
          <div className="bg-cards">

            {/* card 1: 수강권 현황 */}
            <div className="bg-hcard float1">
              <div className="bg-label">☐ 수강권 현황</div>
              <div className="bg-val">12 <span>/ 20회</span></div>
              <div className="bg-bar"><div className="bg-bar-fill" style={{ width: '60%' }} /></div>
              <div className="bg-sub">만료 D-12</div>
            </div>

            {/* card 2: D-1 알림 */}
            <div className="bg-hcard float2">
              <div className="bg-label">◎ D-1 알림</div>
              <div className="bg-msg">내일 수업 안내</div>
              <div className="bg-body">김민지님, 내일 오전 10시 필라테스 수업이 있습니다.</div>
              <div className="bg-ok">✓ 발송 완료 · 3명</div>
            </div>

            {/* card 3: 회원 현황 */}
            <div className="bg-hcard float3">
              <div className="bg-label">○ 회원 현황</div>
              <div className="bg-val">8 <span>명</span></div>
              <div className="bg-trend">↑ 이번 달 +3명</div>
              <div className="bg-sub">출석률 82%</div>
            </div>

            {/* card 4: 이번 주 */}
            <div className="bg-hcard float4">
              <div className="bg-label">☐ 이번 주</div>
              <div className="bg-week">
                {['월', '화', '수', '목', '금'].map((d, i) => (
                  <div key={d} className="bg-day">
                    <div className="bg-dn">{d}</div>
                    <div className={`bg-slot ${[1, 3].includes(i) ? 'on' : 'off'}`}>
                      {[1, 3].includes(i) ? '●' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </motion.div>

        {/* ── 오버레이 카드 ── */}
        <AnimatePresence mode="wait">

          {/* PAIN */}
          {phase === 'pain' && (
            <motion.div key="pain" className="card-overlay"
              variants={cardV} initial="hidden" animate="show" exit="exit" transition={cardT}
            >
              <div className="card-hdr">
                <span className="card-ico">⚠</span>
                <span className="card-ttl">지금의 현실</span>
              </div>
              {[
                { icon: '≡', title: '수기 수강권 관리', desc: '노트·엑셀에 직접 횟수 표시 — 차감 누락가 잦습니다' },
                { icon: '☎', title: '직접 연락해서 알림', desc: '하루 전 카톡을 한 명씩 보내다 깜빡하면 노쇼' },
                { icon: '☐', title: '반복 예약 관리 복잡', desc: '공휴일·특별 운영일이 끼면 매번 머리가 아픕니다' },
              ].map((item, i) => (
                <motion.div key={item.title} className="pain-row" custom={i} variants={rowV} initial="hidden" animate="show">
                  <div className="pain-ico">{item.icon}</div>
                  <div>
                    <div className="pain-ttl">{item.title} <span className="pain-x">✕</span></div>
                    <div className="pain-desc">{item.desc}</div>
                  </div>
                </motion.div>
              ))}
              <motion.div
                className="pain-bridge"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
              >
                LESSON:ON이 이 모든 걸 자동으로 →
              </motion.div>
            </motion.div>
          )}

          {/* PACKAGE */}
          {phase === 'package' && (
            <motion.div key="package" className="card-overlay"
              variants={cardV} initial="hidden" animate="show" exit="exit" transition={cardT}
            >
              <div className="card-hdr">
                <span className="card-ico">📋</span>
                <span className="card-ttl">수강권 현황</span>
              </div>
              {PACKAGES.map((pkg, i) => (
                <motion.div key={pkg.name} className="pkg-row" custom={i} variants={rowV} initial="hidden" animate="show">
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
                      transition={{ delay: i * 0.12 + 0.3, duration: 0.6, ease: 'easeOut' }}
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

          {/* NOTIFY */}
          {phase === 'notify' && (
            <motion.div key="notify" className="card-overlay"
              variants={cardV} initial="hidden" animate="show" exit="exit" transition={cardT}
            >
              <div className="card-hdr">
                <span className="card-ico">📱</span>
                <span className="card-ttl">D-1 알림 발송</span>
              </div>
              <div className="phone-wrap">
                <div className="phone-top">
                  <span>9:41 AM</span><span>● LESSON:ON</span>
                </div>
                <motion.div
                  className="notif-card"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
                >
                  <div className="notif-ico">📅</div>
                  <div>
                    <div className="notif-app">LESSON:ON</div>
                    <div className="notif-ttl">내일 수업 안내 🔔</div>
                    <div className="notif-body">김민지님, 내일(8/11) 오전 10:00 필라테스 수업이 있습니다!</div>
                  </div>
                </motion.div>
              </div>
              <div className="sent-wrap">
                <div className="sent-hdr">
                  <span>발송 내역 — 오늘 3명</span>
                  <span className="sent-action">직접 발송</span>
                </div>
                {SENT_LIST.map((row, i) => (
                  <motion.div key={row.name} className="sent-row" custom={i} variants={rowV} initial="hidden" animate="show">
                    <div className="sent-av" style={{ background: row.gradient }}>{row.initial}</div>
                    <div className="sent-name">{row.name}</div>
                    <div className="sent-time">{row.time}</div>
                    <span className={row.read ? 'b-read' : 'b-unread'}>{row.read ? '읽음' : '미확인'}</span>
                  </motion.div>
                ))}
              </div>
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
                <p className="tagline">레슨권 관리도, 스케줄도 하나의 앱에서</p>
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
