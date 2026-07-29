import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PACKAGE_TYPES, PACKAGES, EXPIRY_RECIPIENTS } from './mockData'

const IS_RECORD = new URLSearchParams(location.search).has('record')

type Phase = 'intro' | 'types' | 'records' | 'expiry' | 'outro'
const PHASES: { key: Phase; ms: number }[] = [
  { key: 'intro',   ms: 2000 },
  { key: 'types',   ms: 3000 },
  { key: 'records', ms: 3200 },
  { key: 'expiry',  ms: 3000 },
  { key: 'outro',   ms: 2500 },
]
const TOTAL = PHASES.reduce((s, p) => s + p.ms, 0)

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
    kicker: 'Lesson Package',
    headline: '레슨권을\n앱에서 관리',
    sub: '횟수·유효기간 설정부터 결제 기록·만료 알림까지 한 곳에서',
  },
  types: {
    kicker: '레슨 종류 설정',
    headline: '회차·유효기간\n자유롭게 설정',
    sub: '4회, 8회, 12회권 등 원하는 조합으로 정의 — 결제 시 선택만 하면 됩니다',
  },
  records: {
    kicker: '결제 기록',
    headline: '소진 현황을\n한눈에',
    sub: '회원별 레슨 진행률을 프로그레스바로 — 만료 임박 회원은 자동 강조',
  },
  expiry: {
    kicker: '만료 임박 알림',
    headline: '놓치는 회원\n없이',
    sub: '소진을 독려하는 문자를 원클릭으로 발송 — D-6, D-8처럼 긴박감 전달',
  },
}

const STATUS_LABEL = { active: '진행중', warn: '만료임박', done: '소진완료' } as const
const BAR_CLS = { active: 'bar-brand', warn: 'bar-warn', done: 'bar-muted' } as const

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show:   { opacity: 1, y: 0,  scale: 1    },
  exit:   { opacity: 0, y: -16, scale: 0.97 },
}
const cardTransition = { type: 'spring' as const, stiffness: 220, damping: 26 }
const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  show:   (i: number) => ({ opacity: 1, x: 0, transition: { delay: i * 0.1 + 0.15 } }),
}

export default function App() {
  const { phase } = usePhaseLoop()
  const isHero = phase !== 'intro' && phase !== 'outro'
  const caption = CAPTION[phase]

  return (
    <div className={`stage${IS_RECORD ? ' record' : ''}`}>
      <div className="reel">

        {/* ── 배경 (그리드 패턴) ── */}
        <motion.div
          className="boardbg"
          animate={{
            scale: isHero ? 1 : 1.04,
            filter: isHero
              ? 'blur(0px) brightness(1) saturate(1)'
              : 'blur(5px) brightness(0.4) saturate(0.7)',
          }}
          transition={{ type: 'spring', stiffness: 120, damping: 24 }}
        >
          <div className="bg-grid" />
          <div className="bg-rows">
            {PACKAGES.map((p, i) => (
              <div key={p.id} className="bg-row" style={{ animationDelay: `${i * 0.4}s` }}>
                <span className="bg-row-name">{p.name}</span>
                <span className="bg-row-pkg">{p.pkg}</span>
                <span className="bg-row-count">{p.used}/{p.total}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── 카드 오버레이 ── */}
        <AnimatePresence mode="wait">

          {phase === 'types' && (
            <motion.div key="types" className="card-overlay"
              variants={cardVariants} initial="hidden" animate="show" exit="exit" transition={cardTransition}
            >
              <div className="card-header">
                <span className="card-icon">📋</span>
                <span className="card-title">레슨 종류 설정</span>
              </div>
              <div className="card-thead">
                <span>종류명</span><span className="tc">횟수</span><span className="tc">유효기간</span><span className="tc">상태</span>
              </div>
              {PACKAGE_TYPES.map((t, i) => (
                <motion.div key={t.id} className="card-row" custom={i} variants={rowVariants} initial="hidden" animate="show">
                  <span className="fw-semi">{t.name}</span>
                  <span className="tc text-sec">{t.session_count}회</span>
                  <span className="tc text-muted">{t.validity_weeks ? `${t.validity_weeks}주` : '무제한'}</span>
                  <span className="tc"><span className="badge badge-green">활성</span></span>
                </motion.div>
              ))}
            </motion.div>
          )}

          {phase === 'records' && (
            <motion.div key="records" className="card-overlay"
              variants={cardVariants} initial="hidden" animate="show" exit="exit" transition={cardTransition}
            >
              <div className="card-header">
                <span className="card-icon">📊</span>
                <span className="card-title">결제 기록</span>
              </div>
              <div className="card-thead records-thead">
                <span>회원</span><span>레슨권</span><span className="tc">소진 현황</span><span className="tc">상태</span>
              </div>
              {PACKAGES.map((p, i) => {
                const pct = Math.round(p.used / p.total * 100)
                return (
                  <motion.div key={p.id} className="card-row records-row" custom={i} variants={rowVariants} initial="hidden" animate="show">
                    <span className="fw-semi">{p.name}</span>
                    <span className="text-muted text-xs-cq">{p.pkg}</span>
                    <div className="prog-wrap">
                      <span className="prog-label">{p.used}/{p.total}</span>
                      <div className="prog-bg">
                        <motion.div
                          className={`prog-fill ${BAR_CLS[p.status]}`}
                          initial={{ width: '0%' }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: i * 0.1 + 0.35, duration: 0.55, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                    <span className="tc">
                      <span className={`badge badge-${p.status}`}>{STATUS_LABEL[p.status]}</span>
                    </span>
                  </motion.div>
                )
              })}
            </motion.div>
          )}

          {phase === 'expiry' && (
            <motion.div key="expiry" className="card-overlay expiry-overlay"
              variants={cardVariants} initial="hidden" animate="show" exit="exit" transition={cardTransition}
            >
              {/* 만료 임박 배너 */}
              <div className="expiry-banner">
                <div className="expiry-top">
                  <div className="expiry-text">
                    <p className="expiry-title">⏰ 만료 임박 미소진 회원 <strong>2명</strong></p>
                    <p className="expiry-sub">소진을 독려하는 문자를 지금 바로 보내세요</p>
                  </div>
                  <motion.div
                    className="sms-btn"
                    animate={{
                      scale: [1, 1.07, 1],
                      boxShadow: [
                        '0 0 0px rgba(245,158,11,0)',
                        '0 0 20px rgba(245,158,11,0.6)',
                        '0 0 0px rgba(245,158,11,0)',
                      ],
                    }}
                    transition={{ repeat: Infinity, duration: 1.7, ease: 'easeInOut' }}
                  >
                    📱 문자 발송
                  </motion.div>
                </div>
                <div className="threshold-row">
                  <span className="threshold-label">만료 도래 기준</span>
                  <button className="threshold-btn active">1주일 전</button>
                  <button className="threshold-btn">2주일 전</button>
                  <button className="threshold-btn">직접입력</button>
                </div>
              </div>

              {/* 대상 회원 목록 */}
              {EXPIRY_RECIPIENTS.map((r, i) => (
                <motion.div key={r.name} className="expiry-item"
                  custom={i} variants={rowVariants} initial="hidden" animate="show"
                >
                  <div className="expiry-item-info">
                    <p className="expiry-name">{r.name}</p>
                    <p className="expiry-meta">{r.pkg} · 잔여 {r.remaining}회 · {r.expires} 만료</p>
                  </div>
                  <motion.span
                    className="d-badge"
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.3 }}
                  >
                    D-{r.daysLeft}
                  </motion.span>
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
                exit={{ opacity: 0, y: 10, transition: { duration: 0.25 } }}
              >
                <motion.p className="kicker"
                  variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                  {caption.kicker}
                </motion.p>
                <motion.h1 className="headline"
                  variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } } }}>
                  {caption.headline.split('\n').map((l, i) => <span key={i}>{l}{i === 0 && <br />}</span>)}
                </motion.h1>
                <motion.p className="sub"
                  variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
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
                <p className="tagline">레슨권 관리도, 스케줄도 하나의 앱에서</p>
                <motion.div className="cta"
                  initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
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
