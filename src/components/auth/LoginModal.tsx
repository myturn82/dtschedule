import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

interface Props {
  onClose: () => void
  onSignIn: (email: string, password: string) => Promise<string | null>
  onSignUp: (email: string, password: string, name: string, role: 'volunteer' | '50plus' | 'team_leader' | 'admin', tenantId?: string, tenantRoleId?: string) => Promise<string | null>
  onGoogle: () => Promise<string | null>
  onKakao: () => Promise<string | null>
  hideCancelButton?: boolean
}

type Mode = 'login' | 'signup'
interface TenantRole { id: string; name: string; display_order: number }
interface Tenant { id: string; name: string }

const DEFAULT_ROLES = [
  { value: 'volunteer' as const, label: '자원봉사자' },
  { value: '50plus' as const, label: '50플러스' },
  { value: 'team_leader' as const, label: '팀장' },
]

const GRAIN_URL = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.15 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`

const DAY_LABELS = ['MON','TUE','WED','THU','FRI','SAT','SUN']
const TIME_TICKS = ['10','11','12','13','14','15','16','17','18','19','20']

// paper theme tokens
const P = {
  heroBg:     'oklch(0.94 0.012 80)',
  heroLine:   'rgba(20,23,28,0.06)',
  heroLineStr:'rgba(20,23,28,0.10)',
  heroStroke: 'rgba(20,23,28,0.10)',
  heroFg:     'oklch(0.18 0.02 60)',
  heroFgSoft: 'oklch(0.40 0.02 60)',
  heroFgMute: 'oklch(0.55 0.02 60)',
  glowA:      'oklch(0.55 0.18 30)',
  glowB:      'oklch(0.50 0.16 60)',
  pillBg:     'rgba(20,23,28,0.04)',
  pillBorder: 'rgba(20,23,28,0.10)',
  sat:        'oklch(0.45 0.13 230)',
  sun:        'oklch(0.50 0.16 25)',
  accent:     'oklch(0.66 0.16 28)',
}

export function LoginModal({ onClose, onSignIn, onSignUp, onGoogle, onKakao, hideCancelButton }: Props) {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState(() => localStorage.getItem('lastLoginEmail') ?? '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [showPw, setShowPw] = useState(false)

  const [tenants, setTenants] = useState<Tenant[]>([])
  const [tenantId, setTenantId] = useState('')
  const [tenantRoles, setTenantRoles] = useState<TenantRole[] | null>(null)
  const [tenantRoleId, setTenantRoleId] = useState<string | null>(null)
  const [role, setRole] = useState<'volunteer' | '50plus' | 'team_leader' | 'admin' | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const tabLoginRef = useRef<HTMLButtonElement>(null)
  const tabSignupRef = useRef<HTMLButtonElement>(null)
  const [pillStyle, setPillStyle] = useState({ width: 0, left: 0 })

  useEffect(() => {
    supabase.from('tenants').select('id, name').order('name').then(({ data }) => {
      setTenants(data ?? [])
    })
  }, [])

  useEffect(() => {
    if (!tenantId) { setTenantRoles(null); setTenantRoleId(null); setRole(null); return }
    setTenantRoles(null); setTenantRoleId(null); setRole(null)
    supabase.from('tenant_roles').select('id, name, display_order').eq('tenant_id', tenantId).order('display_order')
      .then(({ data }) => setTenantRoles(data ?? []))
  }, [tenantId])

  function updatePill(tab: Mode) {
    const ref = tab === 'login' ? tabLoginRef.current : tabSignupRef.current
    const wrap = ref?.parentElement
    if (!ref || !wrap) return
    const r = ref.getBoundingClientRect()
    const pr = wrap.getBoundingClientRect()
    setPillStyle({ width: r.width, left: r.left - pr.left - 4 })
  }
  useEffect(() => { updatePill(mode) }, [mode])
  useEffect(() => {
    const fn = () => updatePill(mode)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [mode])

  function switchMode(m: Mode) { setMode(m); setError(null); setSuccess(null) }

  const hasCustomRoles = tenantRoles !== null && tenantRoles.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true)
    if (mode === 'login') {
      if (!email.trim() || !password) { setError('이메일과 비밀번호를 입력해주세요.'); setLoading(false); return }
      const err = await onSignIn(email, password)
      setLoading(false)
      if (err) setError(err)
      else { localStorage.setItem('lastLoginEmail', email); onClose() }
    } else {
      if (!tenantId) { setError('가입할 조직을 선택해주세요.'); setLoading(false); return }
      if (hasCustomRoles && !tenantRoleId) { setError('활동 유형을 선택해주세요.'); setLoading(false); return }
      if (!hasCustomRoles && !role) { setError('활동 유형을 선택해주세요.'); setLoading(false); return }
      if (!name.trim()) { setError('이름을 입력해주세요.'); setLoading(false); return }
      if (password !== confirmPassword) { setError('비밀번호가 일치하지 않습니다.'); setLoading(false); return }
      if (password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); setLoading(false); return }
      const effectiveRole: 'volunteer' | '50plus' | 'team_leader' | 'admin' =
        hasCustomRoles ? 'volunteer' : (role as 'volunteer' | '50plus' | 'team_leader' | 'admin')
      const err = await onSignUp(email, password, name, effectiveRole, tenantId, tenantRoleId ?? undefined)
      setLoading(false)
      if (err) setError(err)
      else setSuccess(effectiveRole === 'admin'
        ? '가입이 완료됐습니다. 슈퍼어드민이 승인하면 로그인하실 수 있습니다.'
        : '가입이 완료됐습니다. 조직 관리자가 승인하면 로그인하실 수 있습니다.')
    }
  }

  async function handleGoogle() { setLoading(true); setError(null); const err = await onGoogle(); setLoading(false); if (err) setError(err) }
  async function handleKakao() { setLoading(true); setError(null); const err = await onKakao(); setLoading(false); if (err) setError(err) }

  const inputSt: React.CSSProperties = {
    width: '100%', height: 48, padding: '0 14px 0 44px',
    background: '#fff', border: '1px solid rgba(20,23,28,0.09)',
    borderRadius: 12, fontSize: 14, color: '#14171C', outline: 'none',
    fontFamily: 'inherit', transition: 'border-color .12s, box-shadow .12s',
  }

  return (
    <div className="lm-root" style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <style>{`
        .lm-root { font-family: "Pretendard Variable", Pretendard, system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        .lm-layout { display: grid; grid-template-columns: 1.15fr 1fr; min-height: 100dvh; }
        .lm-hero { position: relative; overflow: hidden; isolation: isolate; padding: 40px 56px 40px 76px; display: flex; flex-direction: column; background: oklch(0.94 0.012 80); color: oklch(0.18 0.02 60); }
        /* graph paper grid */
        .lm-grid { position: absolute; inset: 0; z-index: -3; pointer-events: none;
          background-image: linear-gradient(to right, rgba(20,23,28,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(20,23,28,0.06) 1px, transparent 1px);
          background-size: 56px 56px; background-position: -1px -1px; }
        /* weekday strip */
        .lm-days { position: absolute; top: 0; left: 0; right: 0; height: 28px; z-index: -1; pointer-events: none; display: grid; grid-template-columns: repeat(7,1fr); border-bottom: 1px solid rgba(20,23,28,0.10); }
        .lm-day { display: flex; align-items: center; justify-content: center; font-family: "JetBrains Mono", monospace; font-size: 9px; font-weight: 600; letter-spacing: 0.8px; color: oklch(0.55 0.02 60); border-right: 1px solid rgba(20,23,28,0.10); }
        .lm-day:last-child { border-right: 0; }
        .lm-day.sat { color: oklch(0.45 0.13 230); }
        .lm-day.sun { color: oklch(0.50 0.16 25); }
        .lm-day.today { background: oklch(0.66 0.16 28); color: white; }
        /* time ticks */
        .lm-ticks { position: absolute; left: 0; top: 28px; bottom: 0; width: 48px; z-index: -1; pointer-events: none; display: flex; flex-direction: column; border-right: 1px solid rgba(20,23,28,0.10); }
        .lm-tick { flex: 1; display: flex; align-items: center; justify-content: center; font-family: "JetBrains Mono", monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.3px; color: oklch(0.55 0.02 60); border-bottom: 1px dashed rgba(20,23,28,0.06); }
        .lm-tick:last-child { border-bottom: 0; }
        /* big outline digit */
        .lm-digit { position: absolute; bottom: -120px; right: -60px; font-size: 380px; line-height: 0.85; font-weight: 800; letter-spacing: -10px; color: transparent; -webkit-text-stroke: 2px rgba(20,23,28,0.10); user-select: none; z-index: -2; font-feature-settings: "tnum"; pointer-events: none; font-family: "JetBrains Mono", monospace; }
        .lm-digit-lbl { display: block; font-family: "Pretendard Variable", Pretendard, sans-serif; font-size: 28px; color: oklch(0.55 0.02 60); letter-spacing: 4px; font-weight: 600; -webkit-text-stroke: 0; margin-top: 12px; margin-left: 20px; }
        /* NOW line */
        .lm-now { position: absolute; left: 48px; right: 0; height: 1px; background: oklch(0.66 0.16 28); z-index: -1; pointer-events: none; animation: lmNowMove 16s ease-in-out infinite alternate; box-shadow: 0 0 0 0.5px oklch(0.66 0.16 28); }
        .lm-now::before { content: ""; position: absolute; left: -4px; top: 50%; transform: translateY(-50%); width: 7px; height: 7px; background: oklch(0.66 0.16 28); border-radius: 50%; box-shadow: 0 0 0 3px oklch(0.94 0.012 80); }
        .lm-now::after { content: "NOW"; position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: oklch(0.94 0.012 80); padding: 1px 6px; font-family: "JetBrains Mono", monospace; font-size: 8.5px; font-weight: 700; letter-spacing: 1.2px; color: oklch(0.66 0.16 28); border-radius: 3px; border: 1px solid oklch(0.66 0.16 28); }
        @keyframes lmNowMove { 0% { top: 45%; } 100% { top: 58%; } }
        @keyframes lmPulse { 0%,100% { box-shadow: 0 0 0 4px oklch(0.75 0.18 145 / 0.25); } 50% { box-shadow: 0 0 0 8px oklch(0.75 0.18 145 / 0); } }
        /* grain */
        .lm-grain { position: absolute; inset: 0; pointer-events: none; z-index: -1; opacity: 0.25; mix-blend-mode: multiply; background-image: ${GRAIN_URL}; }
        /* form side */
        .lm-form { background: #F4F1EA; display: flex; flex-direction: column; padding: 32px 40px; position: relative; overflow: hidden; overflow-y: auto; }
        .lm-form::before { content: ""; position: absolute; top: -150px; right: -150px; width: 360px; height: 360px; border-radius: 50%; background: oklch(0.88 0.10 28); filter: blur(80px); opacity: 0.4; pointer-events: none; }
        /* responsive */
        @media (max-width: 1100px) {
          .lm-hero { padding: 36px 40px 36px 64px; }
          .lm-digit { font-size: 300px; bottom: -90px; right: -40px; }
          .lm-digit-lbl { font-size: 22px; margin-top: 8px; }
          .lm-form { padding: 28px 32px; }
        }
        /* Tablet: stacked layout */
        @media (max-width: 1099px) and (min-width: 541px) {
          .lm-layout { grid-template-columns: 1fr; }
          .lm-hero { padding: 32px 40px 32px 72px; min-height: 320px; }
          .lm-heroMain { margin-top: 32px; }
          .lm-miniSched { display: none; }
          .lm-digit { font-size: 280px; bottom: -90px; right: -40px; }
          .lm-digit-lbl { font-size: 22px; margin-top: 8px; }
          .lm-form { padding: 32px 40px 48px; }
          .lm-formCard { max-width: 480px; margin: 16px auto; }
          .lm-formH1 { font-size: 30px; }
        }
        /* Mobile: unified paper surface */
        @media (max-width: 540px) {
          .lm-layout { grid-template-columns: 1fr; background: oklch(0.94 0.012 80); }
          .lm-hero { padding: 12px 16px 0; background: transparent; overflow: visible; min-height: auto; }
          .lm-heroMain { display: none; }
          .lm-ticks { display: none; }
          .lm-now { display: none; }
          .lm-days { position: relative; top: auto; left: auto; right: auto; height: 26px; border-bottom: 0; margin-top: 10px; background: #fff; border: 1px solid rgba(20,23,28,0.10); border-radius: 8px; overflow: hidden; }
          .lm-day { font-size: 9px; letter-spacing: 0.5px; border-right-color: rgba(20,23,28,0.10); }
          .lm-digit { position: fixed; bottom: -40px; right: -20px; font-size: 200px; letter-spacing: -8px; -webkit-text-stroke-width: 1.5px; z-index: 0; pointer-events: none; }
          .lm-digit-lbl { display: none; }
          .lm-form { padding: 14px 16px 24px; background: transparent; position: relative; z-index: 1; }
          .lm-form::before { display: none; }
          .lm-formCard { display: flex; flex-direction: column; margin: 0 auto; max-width: 480px; }
          .lm-formHello { order: 1; font-size: 10.5px; margin: 4px 0; letter-spacing: 0.8px; color: oklch(0.66 0.16 28) !important; font-weight: 600; }
          .lm-formH1 { order: 2; font-size: 22px; margin: 0 0 14px; letter-spacing: -0.6px; }
          .lm-formLede { display: none; }
          .lm-tabs { order: 3; margin-bottom: 14px; }
          .lm-loginForm { order: 4; }
          .lm-divider { order: 5; margin: 14px 0 12px; font-size: 11.5px; }
          .lm-socials { order: 6; gap: 8px; margin-bottom: 0; }
          .lm-socialBtn { height: 44px; font-size: 13.5px; }
          .lm-formFooter { display: none; }
        }
        @media (max-width: 380px) {
          .lm-hero { padding: 10px 14px 0; }
          .lm-form { padding: 12px 14px 22px; }
          .lm-formH1 { font-size: 20px; }
          .lm-digit { font-size: 160px; }
        }
      `}</style>

      <div className="lm-layout">

        {/* ══════════ LEFT HERO — paper theme ══════════ */}
        <section className="lm-hero">
          {/* Layer 1: graph paper grid */}
          <div className="lm-grid" />
          {/* Layer 2: weekday strip */}
          <div className="lm-days">
            {DAY_LABELS.map((d, i) => {
              const todayDow = new Date().getDay() // 0=sun,1=mon…
              const isToday = (i + 1) % 7 === todayDow
              return (
                <div key={d} className={`lm-day${i === 5 ? ' sat' : i === 6 ? ' sun' : ''}${isToday ? ' today' : ''}`}>{d}</div>
              )
            })}
          </div>
          {/* Layer 3: time ticks */}
          <div className="lm-ticks">
            {TIME_TICKS.map(t => (
              <div key={t} className="lm-tick">{t}</div>
            ))}
          </div>
          {/* Layer 4: big outlined digit */}
          <div className="lm-digit">
            05<span style={{ fontSize: '0.30em', letterSpacing: 0, marginLeft: -10, WebkitTextStroke: '1.5px rgba(20,23,28,0.08)' }}>月</span>
            <span className="lm-digit-lbl">2026</span>
          </div>
          {/* Layer 5: NOW indicator */}
          <div className="lm-now" />
          {/* Grain */}
          <div className="lm-grain" />

          {/* Brand mark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="36" height="36" style={{ flexShrink: 0, borderRadius: 10, overflow: 'hidden' }}>
              <rect width="512" height="512" rx="112" fill="#FBF9F4"/>
              <rect x="64"     y="142.8" width="55.67" height="68.8" rx="16" fill="oklch(0.85 0.10 70)"/>
              <rect x="129.67" y="142.8" width="55.67" height="68.8" rx="16" fill="oklch(0.66 0.16 28)"/>
              <rect x="326.67" y="142.8" width="55.67" height="68.8" rx="16" fill="oklch(0.78 0.09 230)"/>
              <rect x="392.33" y="142.8" width="55.67" height="68.8" rx="16" fill="oklch(0.75 0.10 160)"/>
              <rect x="64"     y="221.6" width="55.67" height="68.8" rx="16" fill="oklch(0.72 0.10 290)"/>
              <rect x="129.67" y="221.6" width="55.67" height="68.8" rx="16" fill="oklch(0.85 0.10 70)"/>
              <rect x="326.67" y="221.6" width="55.67" height="68.8" rx="16" fill="oklch(0.66 0.16 28)"/>
              <rect x="392.33" y="221.6" width="55.67" height="68.8" rx="16" fill="oklch(0.78 0.09 230)"/>
              <rect x="64"     y="300.4" width="55.67" height="68.8" rx="16" fill="oklch(0.75 0.10 160)"/>
              <rect x="129.67" y="300.4" width="55.67" height="68.8" rx="16" fill="oklch(0.72 0.10 290)"/>
              <rect x="326.67" y="300.4" width="55.67" height="68.8" rx="16" fill="oklch(0.85 0.10 70)"/>
              <rect x="392.33" y="300.4" width="55.67" height="68.8" rx="16" fill="oklch(0.66 0.16 28)"/>
              <rect x="64"     y="379.2" width="55.67" height="68.8" rx="16" fill="oklch(0.78 0.09 230)"/>
              <rect x="129.67" y="379.2" width="55.67" height="68.8" rx="16" fill="oklch(0.75 0.10 160)"/>
              <rect x="326.67" y="379.2" width="55.67" height="68.8" rx="16" fill="oklch(0.72 0.10 290)"/>
              <rect x="392.33" y="379.2" width="55.67" height="68.8" rx="16" fill="oklch(0.85 0.10 70)"/>
            </svg>
            <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.2, color: P.heroFg, whiteSpace: 'nowrap' }}>스케줄러</span>
            <span style={{ marginLeft: 8, fontSize: 10, fontFamily: '"JetBrains Mono", monospace', padding: '3px 8px', borderRadius: 999, background: P.pillBg, border: `1px solid ${P.pillBorder}`, color: P.heroFgSoft, letterSpacing: 0.4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>workspace</span>
          </div>

          {/* Hero main content */}
          <div className="lm-heroMain" style={{ marginTop: 'auto', marginBottom: 0, position: 'relative', zIndex: 1 }}>
            {/* Eyebrow */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: P.heroFgSoft, marginBottom: 16, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: 500, whiteSpace: 'nowrap' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'oklch(0.75 0.18 145)', boxShadow: '0 0 0 4px oklch(0.75 0.18 145 / 0.25)', display: 'inline-block', animation: 'lmPulse 1.6s ease-in-out infinite' }} />
              지금도 팀들이 스케줄을 짜고 있어요
            </div>

            {/* Title */}
            <h1 style={{ fontSize: 46, lineHeight: 1.08, letterSpacing: -1.6, fontWeight: 700, margin: '0 0 20px', color: P.heroFg }}>
              오늘의 일정을<br />
              <span style={{ background: `linear-gradient(120deg, ${P.glowA}, ${P.glowB})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>한 화면에서</span>.
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.55, color: P.heroFgSoft, maxWidth: 420, margin: '0 0 32px' }}>
              아침부터 저녁까지, 우리 팀의 운영 일정을 한눈에. 멤버를 손쉽게 배정하고 변경하세요.
            </p>

            {/* Mini scheduler */}
            <div style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(20,23,28,0.08)', borderRadius: 18, padding: '14px 14px 12px', maxWidth: 500, boxShadow: '0 20px 60px -20px rgba(20,23,28,0.20)', color: '#14171C' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.4 }}>05월</span>
                  <span style={{ fontSize: 11, color: '#8A8F99', fontFamily: '"JetBrains Mono", monospace' }}>2026 · 1–2주</span>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px 3px 7px', background: 'oklch(0.96 0.04 145)', borderRadius: 999, fontSize: 10.5, fontWeight: 600, color: 'oklch(0.40 0.13 145)', border: '1px solid oklch(0.85 0.08 145)', whiteSpace: 'nowrap' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'oklch(0.65 0.17 145)', display: 'inline-block' }} />
                  실시간 배정
                </span>
              </div>
              {/* Mini grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '36px repeat(7, 1fr)', border: '1px solid rgba(20,23,28,0.08)', borderRadius: 10, overflow: 'hidden', fontSize: 9, background: '#fff' }}>
                {['', '월', '화', '수', '목', '금', '토', '일'].map((d, i) => (
                  <div key={i} style={{ padding: '5px 4px', background: '#FBF9F4', borderBottom: '1px solid rgba(20,23,28,0.08)', textAlign: 'center', fontFamily: '"JetBrains Mono", monospace', fontSize: 8.5, color: i === 6 ? 'oklch(0.55 0.13 240)' : i === 7 ? 'oklch(0.55 0.16 25)' : '#8A8F99', fontWeight: 600, letterSpacing: 0.4 }}>{d}</div>
                ))}
                {([
                  [null,null,null,null,'1','2','3'],
                  ['4','5','6','7','8','9','10'],
                ] as (string|null)[][]).map((week, wi) => (
                  [['10-12','sun'], ['13-14','sun'], ['14-16','plus'], ['16-18','sun']].map(([slot, tint], ri) => (
                    <>
                      <div key={`${wi}l${ri}`} style={{ padding: '4px 3px', background: '#fff', borderBottom: '1px solid rgba(20,23,28,0.08)', borderRight: '1px solid rgba(20,23,28,0.08)', fontFamily: '"JetBrains Mono", monospace', fontSize: 7.5, color: '#6B7280', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{slot}</div>
                      {week.map((d, di) => {
                        const isSun = di === 6
                        const names = [['서연','성미'],['지훈','정훈'],[null,'혜원'],['우진',null],[null,null],[null,null],[null,null]]
                        const [v, a] = d ? names[(di + ri + wi) % names.length] : [null, null]
                        const tintMap: Record<string, {bg:string;c:string}> = {
                          sun:  {bg:'oklch(0.93 0.06 70)', c:'oklch(0.40 0.12 60)'},
                          plus: {bg:'oklch(0.93 0.05 20)', c:'oklch(0.42 0.12 20)'},
                        }
                        const t = tintMap[tint] ?? tintMap.sun
                        return (
                          <div key={`${wi}${ri}${di}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid rgba(20,23,28,0.08)', borderRight: di === 6 ? 'none' : '1px solid rgba(20,23,28,0.08)', minHeight: 18, background: isSun || !d ? 'repeating-linear-gradient(135deg,oklch(0.98 0.02 25) 0 4px,oklch(0.94 0.03 25) 4px 8px)' : undefined }}>
                            {d && !isSun && [v,a].map((nm, ni) => (
                              <div key={ni} style={{ padding: 1.5, borderRight: ni===0 ? '1px dashed rgba(20,23,28,0.08)' : 'none', display: 'flex' }}>
                                {nm && <div style={{ flex:1, borderRadius:3, fontSize:7.5, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', background: t.bg, color: t.c, overflow:'hidden', whiteSpace:'nowrap', padding:'1px 2px' }}>{nm}</div>}
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </>
                  ))
                ))}
              </div>
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(20,23,28,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10.5, color: '#6B7280' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['oklch(0.93 0.06 70)','오전'],['oklch(0.93 0.05 20)','50플러스'],['oklch(0.93 0.05 160)','주말']].map(([bg,lbl]) => (
                    <span key={lbl} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, color:'#353A44', fontWeight:500, whiteSpace:'nowrap' }}>
                      <span style={{ width:7, height:7, borderRadius:2, background:bg, display:'inline-block' }} />{lbl}
                    </span>
                  ))}
                </div>
                <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:10 }}>68 / 82 배정</span>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════ RIGHT FORM ══════════ */}
        <section className="lm-form">
          {/* Close button */}
          {!hideCancelButton && (
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'flex-end', marginBottom: 'auto' }}>
              <button onClick={onClose} style={{ color: '#14171C', fontWeight: 600, padding: '6px 12px', borderRadius: 8, background: '#fff', border: '1px solid rgba(20,23,28,0.09)', cursor: 'pointer', font: 'inherit', fontSize: 13 }}>닫기</button>
            </div>
          )}

          <div className="lm-formCard" style={{ width: '100%', maxWidth: 420, margin: 'auto', position: 'relative', zIndex: 1 }}>
            {success ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'oklch(0.96 0.04 145)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', fontSize: 22 }}>✓</div>
                <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>{success}</p>
                <button onClick={() => { setSuccess(null); switchMode('login') }} style={{ color: P.accent, fontSize: 14, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>로그인하러 가기 →</button>
              </div>
            ) : (
              <>
                <div className="lm-formHello" style={{ fontSize: 13, color: '#6B7280', fontWeight: 500, marginBottom: 8 }}>WELCOME</div>
                <h2 className="lm-formH1" style={{ fontSize: 34, lineHeight: 1.1, letterSpacing: -1.2, fontWeight: 700, margin: '0 0 10px', color: '#14171C' }}>
                  {mode === 'login' ? <>다시 만나서<br />반가워요 👋</> : <>새로 오셨나요?<br />반갑습니다 🙌</>}
                </h2>
                <p className="lm-formLede" style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px', lineHeight: 1.5 }}>
                  {mode === 'login' ? '이메일 또는 소셜 계정으로 로그인해 주세요.' : '조직을 선택하고 활동을 시작해 보세요.'}
                </p>

                {/* Tabs */}
                <div className="lm-tabs" style={{ display: 'inline-flex', background: 'rgba(20,23,28,0.06)', padding: 4, borderRadius: 12, marginBottom: 22, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 4, height: 'calc(100% - 8px)', background: '#fff', borderRadius: 9, boxShadow: '0 1px 0 rgba(20,23,28,0.04),0 2px 8px -2px rgba(20,23,28,0.10)', transition: 'transform .25s cubic-bezier(.4,0,.2,1),width .25s cubic-bezier(.4,0,.2,1)', zIndex: 0, width: pillStyle.width, transform: `translateX(${pillStyle.left}px)` }} />
                  {(['login','signup'] as Mode[]).map(t => (
                    <button key={t} ref={t==='login'?tabLoginRef:tabSignupRef} onClick={() => switchMode(t)}
                      style={{ padding: '9px 18px', fontSize: 13.5, fontWeight: 600, color: mode===t ? '#14171C' : '#6B7280', border: 0, background: 'transparent', borderRadius: 9, position: 'relative', zIndex: 1, cursor: 'pointer', font: 'inherit', transition: 'color .15s', whiteSpace: 'nowrap' }}>
                      {t==='login' ? '로그인' : '회원가입'}
                    </button>
                  ))}
                </div>

                {/* Social */}
                <div className="lm-socials" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                  <button onClick={handleGoogle} disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', height: 48, fontSize: 14, fontWeight: 600, borderRadius: 12, border: '1px solid rgba(20,23,28,0.09)', background: '#fff', color: '#14171C', cursor: 'pointer', font: 'inherit', whiteSpace: 'nowrap' }}>
                    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20.4H24v7.1h11.3c-1.5 4.1-5.4 7-11.3 7-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5-5C32.9 5.1 28.7 3.4 24 3.4 12.5 3.4 3.4 12.5 3.4 24S12.5 44.6 24 44.6c11 0 20-8 20-20 0-1.4-.1-2.7-.4-4.1z"/><path fill="#FF3D00" d="M5.3 13.6l5.8 4.3C12.8 14.1 18 11 24 11c3 0 5.8 1.1 7.9 3l5-5C32.9 5.1 28.7 3.4 24 3.4 16.4 3.4 9.8 7.6 5.3 13.6z"/><path fill="#4CAF50" d="M24 44.6c4.6 0 8.7-1.7 11.9-4.5l-5.5-4.6c-1.7 1.3-3.9 2.1-6.4 2.1-5.8 0-10.7-3.9-11.2-7H7v4.7C10.5 40.6 16.8 44.6 24 44.6z"/><path fill="#1976D2" d="M43.6 20.5H42V20.4H24v7.1h11.3c-.7 2-2 3.7-3.6 5l5.5 4.6c-.4.4 5.8-4.2 5.8-13.2 0-1.4-.1-2.7-.4-3.4z"/></svg>
                    Google로 계속하기
                  </button>
                  <button onClick={handleKakao} disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', height: 48, fontSize: 14, fontWeight: 600, borderRadius: 12, border: 'none', background: '#FEE500', color: '#181600', cursor: 'pointer', font: 'inherit', whiteSpace: 'nowrap' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.7 6.7-.2.7-.7 2.7-.8 3.1-.1.5.2.5.4.4.2-.1 2.6-1.7 3.6-2.4.7.1 1.4.2 2.1.2 5.5 0 10-3.6 10-8s-4.5-8-10-8Z"/></svg>
                    카카오로 계속하기
                  </button>
                </div>

                <div className="lm-divider" style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 18px', color: '#8A8F99', fontSize: 12, fontWeight: 500 }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(20,23,28,0.14)' }} />또는 이메일로 계속<div style={{ flex: 1, height: 1, background: 'rgba(20,23,28,0.14)' }} />
                </div>

                <form className="lm-loginForm" onSubmit={handleSubmit}>
                  {mode === 'signup' && (
                    <>
                      {/* 조직 선택 */}
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#353A44', marginBottom: 6 }}>가입할 조직 *</label>
                        <select value={tenantId} onChange={e => setTenantId(e.target.value)} style={{ ...inputSt, padding: '0 14px', appearance: 'none' }}>
                          <option value="">조직을 선택하세요</option>
                          {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      {/* 활동 유형 */}
                      {tenantId && (
                        <div style={{ marginBottom: 14 }}>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#353A44', marginBottom: 6 }}>활동 유형 *</label>
                          {tenantRoles === null ? <p style={{ fontSize: 12, color: '#8A8F99' }}>로딩 중...</p>
                            : hasCustomRoles ? (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                                {tenantRoles.map(tr => (
                                  <button key={tr.id} type="button" onClick={() => { setTenantRoleId(tr.id); setRole(null) }}
                                    style={{ padding: '10px 12px', borderRadius: 12, fontSize: 13, fontWeight: 600, border: `2px solid ${tenantRoleId===tr.id ? P.accent : 'rgba(20,23,28,0.14)'}`, background: tenantRoleId===tr.id ? 'oklch(0.95 0.04 28)' : '#fff', color: tenantRoleId===tr.id ? 'oklch(0.38 0.13 28)' : '#6B7280', cursor: 'pointer', font: 'inherit', transition: 'all .15s' }}>{tr.name}</button>
                                ))}
                              </div>
                            ) : (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                                {[...DEFAULT_ROLES, { value: 'admin' as const, label: '관리자' }].map(opt => (
                                  <button key={opt.value} type="button" onClick={() => { setRole(opt.value); setTenantRoleId(null) }}
                                    style={{ padding: '10px 12px', borderRadius: 12, fontSize: 13, fontWeight: 600, border: `2px solid ${role===opt.value ? P.accent : 'rgba(20,23,28,0.14)'}`, background: role===opt.value ? 'oklch(0.95 0.04 28)' : '#fff', color: role===opt.value ? 'oklch(0.38 0.13 28)' : '#6B7280', cursor: 'pointer', font: 'inherit', transition: 'all .15s' }}>{opt.label}</button>
                                ))}
                              </div>
                            )}
                        </div>
                      )}
                      {/* 이름 */}
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#353A44', marginBottom: 6 }}>이름</label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#8A8F99', display: 'flex' }}>
                            <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="7" r="3"/><path d="M3 18c0-3.3 3.1-6 7-6s7 2.7 7 6"/></svg>
                          </span>
                          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" style={inputSt} />
                        </div>
                      </div>
                    </>
                  )}

                  {/* 이메일 */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#353A44', marginBottom: 6 }}>이메일</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#8A8F99', display: 'flex' }}>
                        <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="4.5" width="15" height="11" rx="2"/><path d="m3 6 7 5 7-5"/></svg>
                      </span>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required style={inputSt} />
                    </div>
                  </div>

                  {/* 비밀번호 */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#353A44', marginBottom: 6 }}>비밀번호</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#8A8F99', display: 'flex' }}>
                        <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="9" width="12" height="8" rx="1.5"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9"/></svg>
                      </span>
                      <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="비밀번호" autoComplete={mode==='login' ? 'current-password' : 'new-password'} required style={inputSt} />
                      <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, border: 0, background: 'transparent', borderRadius: 8, color: '#8A8F99', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                        <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z"/><circle cx="10" cy="10" r="2"/></svg>
                      </button>
                    </div>
                  </div>

                  {mode === 'signup' && (
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#353A44', marginBottom: 6 }}>비밀번호 확인</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#8A8F99', display: 'flex' }}>
                          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="9" width="12" height="8" rx="1.5"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9"/></svg>
                        </span>
                        <input type={showPw ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="비밀번호 확인" required style={inputSt} />
                      </div>
                    </div>
                  )}

                  {mode === 'login' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0 16px', fontSize: 13 }}>
                      <span style={{ color: '#353A44' }}>로그인 유지</span>
                      <button type="button" style={{ color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', fontSize: 13, fontWeight: 500 }}>비밀번호를 잊으셨나요?</button>
                    </div>
                  )}

                  {error && (
                    <div style={{ margin: '10px 0', padding: '10px 14px', borderRadius: 10, background: 'oklch(0.97 0.02 25)', border: '1px solid oklch(0.88 0.06 25)', color: 'oklch(0.45 0.15 25)', fontSize: 13 }}>{error}</div>
                  )}

                  <button type="submit" disabled={loading} style={{ marginTop: mode==='signup' ? 14 : 0, width: '100%', height: 52, background: '#14171C', color: '#fff', border: 0, borderRadius: 14, fontSize: 15, fontWeight: 600, letterSpacing: -0.2, cursor: loading ? 'not-allowed' : 'pointer', font: 'inherit', opacity: loading ? 0.6 : 1, boxShadow: '0 1px 0 rgba(20,23,28,0.06),0 8px 22px -8px rgba(20,23,28,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'transform .12s' }}>
                    {loading ? '처리 중...' : mode==='login' ? '로그인' : '가입하기'}
                    {!loading && <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M11 5l5 5-5 5"/></svg>}
                  </button>
                </form>
              </>
            )}
          </div>

          <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: '#8A8F99' }}>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', whiteSpace: 'nowrap' }}>스케줄러 v1.0</span>
          </div>
        </section>
      </div>
    </div>
  )
}
