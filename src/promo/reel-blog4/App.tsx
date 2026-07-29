import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DarkModeProvider } from '../../contexts/DarkModeContext'
import { TenantProvider } from '../../contexts/TenantContext'
import { Step2Mode } from '../../components/setup/steps/Step2Mode'
import { Step7CustomFields } from '../../components/setup/steps/Step7CustomFields'
import { WizardIcon, type WizardIconKey } from '../../components/setup/WizardIcons'
import { DEMO_FIELDS, PROMO_FIELD_DEFS } from './mockData'

const IS_RECORD = new URLSearchParams(location.search).has('record')

type Phase = 'intro' | 'mode' | 'fields' | 'sync' | 'outro'
const PHASES: { key: Phase; ms: number }[] = [
  { key: 'intro',  ms: 2000 },
  { key: 'mode',   ms: 3200 },
  { key: 'fields', ms: 3800 },
  { key: 'sync',   ms: 3000 },
  { key: 'outro',  ms: 2500 },
]
const TOTAL = PHASES.reduce((s, p) => s + p.ms, 0)

const CAPTION: Partial<Record<Phase, { kicker: string; headline: string; sub: string }>> = {
  intro: {
    kicker:   'Setup Wizard',
    headline: '5분 만에\n조직 완성',
    sub:      '질문 7개로 달력이 알아서 세팅됩니다',
  },
  mode: {
    kicker:   'Step 2 / 7',
    headline: '운영 방식을\n먼저 고르세요',
    sub:      '회원 공유·개별·비회원 — 우리 조직 구조에 맞게',
  },
  fields: {
    kicker:   'Step 7 / 7',
    headline: '커스텀 필드로\n맞춤 정보 수집',
    sub:      '텍스트부터 이미지 첨부까지 8가지 타입 — 코드 없이',
  },
  sync: {
    kicker:   '동기화 설계',
    headline: '같은 타입\n두 곳에 동시에',
    sub:      '위자드와 관리자콘솔이 동일한 8가지 타입을 공유합니다',
  },
}

const BADGE: Partial<Record<Phase, string>> = {
  mode:   '🧩 setup_wizard',
  fields: '📋 custom_fields',
  sync:   '🔗 type_sync',
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

function SyncPhase() {
  const [hiIdx, setHiIdx] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setHiIdx(i => (i + 1) % PROMO_FIELD_DEFS.length), 440)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="sync-split" style={{ position: 'relative' }}>
      {(['left', 'right'] as const).map(side => (
        <div key={side} className={`sync-panel ${side}`}>
          <div className="sync-panel-label">
            <div className="sync-panel-dot" />
            {side === 'left' ? '셋업 위자드' : '관리자콘솔'}
          </div>
          <div className="sync-field-grid">
            {PROMO_FIELD_DEFS.map((ft, i) => {
              const Ic = WizardIcon[ft.icon as WizardIconKey]
              return (
                <div key={ft.id} className={`sync-field-item${i === hiIdx ? ' hi' : ''}`}>
                  <span className="sfi-icon"><Ic size={14} /></span>
                  {ft.label}
                </div>
              )
            })}
          </div>
        </div>
      ))}
      <motion.div
        className="sync-equal-badge"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ repeat: Infinity, duration: 1.4 }}
      >
        동일한 8종
      </motion.div>
    </div>
  )
}

const slideVariants = {
  enter: { x: '100%', opacity: 0 },
  center: { x: '0%', opacity: 1 },
  exit: { x: '-100%', opacity: 0 },
}
const slideTransition = {
  x: { type: 'spring' as const, stiffness: 280, damping: 30 },
  opacity: { duration: 0.12 },
}

export default function App() {
  const { phase } = usePhaseLoop()
  const isHero  = phase !== 'intro' && phase !== 'outro'
  const caption = CAPTION[phase]
  const badge   = BADGE[phase]

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
            <AnimatePresence mode="popLayout">
              {phase === 'mode' && (
                <motion.div key="mode" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTransition}
                  style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                  <Step2Mode mode="회원개별" error="" industry="" onChange={noop} />
                </motion.div>
              )}
              {phase === 'fields' && (
                <motion.div key="fields" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTransition}
                  style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                  <Step7CustomFields fields={DEMO_FIELDS} isFreeform={false} error="" onChange={noop} />
                </motion.div>
              )}
              {phase === 'sync' && (
                <motion.div key="sync" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTransition}
                  style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <SyncPhase />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

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
                <p className="tagline">조직 맞춤 필드를 코드 없이</p>
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
