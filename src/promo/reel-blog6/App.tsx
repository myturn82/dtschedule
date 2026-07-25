import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DarkModeProvider } from '../../contexts/DarkModeContext'
import { TenantProvider } from '../../contexts/TenantContext'
import { MOCK_IMAGES, ORIG_KB, COMP_KB } from './mockData'

const IS_RECORD = new URLSearchParams(location.search).has('record')

type Phase = 'intro' | 'upload' | 'compress' | 'gallery' | 'outro'
const PHASES: { key: Phase; ms: number }[] = [
  { key: 'intro',    ms: 2000 },
  { key: 'upload',   ms: 2800 },
  { key: 'compress', ms: 3200 },
  { key: 'gallery',  ms: 3500 },
  { key: 'outro',    ms: 2500 },
]
const TOTAL = PHASES.reduce((s, p) => s + p.ms, 0)

const CAPTION: Partial<Record<Phase, { kicker: string; headline: string; sub: string }>> = {
  intro: {
    kicker:   'Image Upload',
    headline: '사진 한 장의\n무게',
    sub:      '스마트폰 원본 그대로 올리면 안 됩니다 — 이유가 있습니다',
  },
  upload: {
    kicker:   '원본 선택',
    headline: '4.2 MB짜리\n스마트폰 사진',
    sub:      '한 달 1,200장이면 6 GB — 서버 비용과 로딩 속도가 직결됩니다',
  },
  compress: {
    kicker:   '브라우저 압축',
    headline: '업로드 전\n브라우저에서 끝',
    sub:      'Canvas API 한 번으로 리사이즈·WebP 변환·압축이 동시에',
  },
  gallery: {
    kicker:   '라이트박스',
    headline: '셀 클릭하면\n전체화면으로',
    sub:      '최대 3장, 좌우 화살표로 여러 장 넘겨보기',
  },
}

const BADGE: Partial<Record<Phase, string>> = {
  upload:   '📷 image/jpeg',
  compress: '⚡ image/webp',
  gallery:  '🖼️ lightbox',
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

function fmtKB(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`
}

function UploadPanel() {
  return (
    <div className="img-wrap">
      <motion.div className="file-card"
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.1 }}
      >
        <span className="file-card-icon select-none">📷</span>
        <div className="file-card-info">
          <div className="file-card-name">photo_2026.jpg</div>
          <div className="file-card-size">{fmtKB(ORIG_KB)} · JPEG · 4032×3024</div>
        </div>
        <div className="file-card-badge">선택됨</div>
      </motion.div>
    </div>
  )
}

function CompressPanel() {
  const [displayKB, setDisplayKB] = useState(ORIG_KB)

  useEffect(() => {
    setDisplayKB(ORIG_KB)
    const duration  = 2500
    const startTime = Date.now()
    const id = setInterval(() => {
      const t      = Math.min((Date.now() - startTime) / duration, 1)
      const eased  = 1 - Math.pow(1 - t, 3)
      const cur    = Math.round(ORIG_KB + (COMP_KB - ORIG_KB) * eased)
      setDisplayKB(cur)
      if (t >= 1) clearInterval(id)
    }, 30)
    return () => { clearInterval(id); setDisplayKB(ORIG_KB) }
  }, [])

  const progress = Math.max(0, Math.min(1, (ORIG_KB - displayKB) / (ORIG_KB - COMP_KB)))
  const isDone   = displayKB <= COMP_KB + 10

  return (
    <div className="img-wrap">
      <div className="compress-card">
        <div className="compress-row">
          <span className="compress-label">용량</span>
          <div className="compress-bar-wrap">
            <div className="compress-bar" style={{ width: `${Math.round((1 - progress * 0.93) * 100)}%` }} />
          </div>
          <span className={`compress-val${isDone ? ' done' : ''}`}>{fmtKB(displayKB)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2cqw' }}>
          <div className="webp-badge">
            ⚡ WebP{isDone ? ' 완료' : ' 변환 중…'}
          </div>
          <AnimatePresence>
            {isDone && (
              <motion.span className="ratio-text"
                initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                원본의 <span>{Math.round(COMP_KB / ORIG_KB * 100)}%</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {isDone && (
          <motion.div className="file-card"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            <span className="file-card-icon select-none">✅</span>
            <div className="file-card-info">
              <div className="file-card-name">photo_2026.webp</div>
              <div className="file-card-size">{fmtKB(COMP_KB)} · WebP · 1024×768</div>
            </div>
            <div className="file-card-badge">압축 완료</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function GalleryPanel() {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setActive(i => (i + 1) % MOCK_IMAGES.length), 1100)
    return () => clearInterval(id)
  }, [])

  const img = MOCK_IMAGES[active]
  return (
    <div className="img-wrap">
      <div className="gallery-wrap">
        <div className="gallery-thumbs">
          {MOCK_IMAGES.map((m, i) => (
            <div key={m.id} className={`gallery-thumb${i === active ? ' active' : ''}`}
              style={{ background: m.bg }}
            >
              <span className="select-none">{m.emoji}</span>
            </div>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={active} className="lightbox" style={{ background: img.bg }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <span className="select-none" style={{ fontSize: '14cqw' }}>{img.emoji}</span>
            <div className="lightbox-counter">{active + 1} / {MOCK_IMAGES.length}</div>
            <div className="lightbox-nav">
              {MOCK_IMAGES.map((_, i) => (
                <div key={i} className={`lightbox-dot${i === active ? ' active' : ''}`} />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

const slideVariants = {
  enter:  { x: '100%',  opacity: 0 },
  center: { x: '0%',    opacity: 1 },
  exit:   { x: '-100%', opacity: 0 },
}
const slideTransition = {
  x:       { type: 'spring' as const, stiffness: 280, damping: 30 },
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
              {phase === 'upload' && (
                <motion.div key="upload" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTransition}
                  style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <UploadPanel />
                </motion.div>
              )}
              {phase === 'compress' && (
                <motion.div key="compress" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTransition}
                  style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CompressPanel />
                </motion.div>
              )}
              {phase === 'gallery' && (
                <motion.div key="gallery" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTransition}
                  style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <GalleryPanel />
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
                <p className="tagline">배정에 사진을, 코드 없이</p>
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
