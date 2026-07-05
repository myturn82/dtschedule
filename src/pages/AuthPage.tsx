import { useState, useEffect, useRef } from 'react'
import { DevFileLabel } from '../components/DevFileLabel'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { ScheduleBackground } from '../components/auth/ScheduleBackground'
import { isValidPhone, formatPhone } from '../lib/phone'
import { TERMS, type DocKey } from '../lib/legalTerms'

type Tab       = 'login' | 'signup'
type LoginStep = 'buttons' | 'email' | 'password' | 'forgot'
type JoinStep  = 'name' | 'password' | 'confirm' | 'choice' | 'org-name' | 'org-select'

const COUNTABLE: JoinStep[] = ['name', 'password', 'confirm', 'org-name']

// ── SVG icons ──────────────────────────────────────────────────
const IKakao = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.7 6.7-.2.7-.7 2.7-.8 3.1-.1.5.2.5.4.4.2-.1 2.6-1.7 3.6-2.4.7.1 1.4.2 2.1.2 5.5 0 10-3.6 10-8s-4.5-8-10-8Z"/>
  </svg>
)
const IMail = (s = 16) => (
  <svg viewBox="0 0 20 20" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.5" y="4.5" width="15" height="11" rx="2.5"/><path d="m3.2 6 6.8 4.8L16.8 6"/>
  </svg>
)
const ILock = () => (
  <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="9" width="12" height="8" rx="2"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9"/>
  </svg>
)
const IUser = () => (
  <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="7" r="3"/><path d="M3.5 17.5c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5"/>
  </svg>
)
const IEye = () => (
  <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z"/><circle cx="10" cy="10" r="2.2"/>
  </svg>
)
const IEyeOff = () => (
  <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 5.5C2.8 6.9 2 8.7 2 10c0 0 3 5 8 5 1.3 0 2.4-.3 3.4-.8M8 5.2c.6-.1 1.3-.2 2-.2 5 0 8 5 8 5-.5.9-1.2 1.8-2 2.5"/><path d="m4 4 12 12"/>
  </svg>
)
const IArrow = () => (
  <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 10h12M11 5l5 5-5 5"/>
  </svg>
)
const IBack = () => (
  <svg viewBox="0 0 20 20" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 10H4M9 5l-5 5 5 5"/>
  </svg>
)
const IClose = () => (
  <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
    <path d="m5 5 10 10M15 5 5 15"/>
  </svg>
)
const ICheck = () => (
  <svg viewBox="0 0 20 20" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="m4 10 4 4 8-9"/>
  </svg>
)
const ISpark = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/>
    <rect x="14" y="3" width="7" height="7" rx="2"/><path d="M17.5 14v7M14 17.5h7"/>
  </svg>
)
const IJoin = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="m10 8 4 4-4 4"/><path d="M14 12H4"/>
  </svg>
)
const IPlus = () => (
  <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2v16M2 10h16"/>
  </svg>
)

export function AuthPage() {
  const { profile, signIn, signUp, signInWithKakao, resetPassword } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initTab = searchParams.get('tab') === 'login' ? 'login' : 'signup'
  const [tab, setTab] = useState<Tab>(initTab)

  const signupInProgress = useRef(false)

  // Login
  const [loginStep, setLoginStep] = useState<LoginStep>('buttons')
  const [loginEmail, setLoginEmail] = useState(() => localStorage.getItem('lastLoginEmail') ?? '')
  const [loginPw, setLoginPw] = useState('')
  const [showLoginPw, setShowLoginPw] = useState(false)

  // Signup
  const [signupEmailInCard, setSignupEmailInCard] = useState(false)
  const [joinEmail, setJoinEmail] = useState('')

  // Wizard popup
  const [wizOpen, setWizOpen] = useState(false)
  const [joinStep, setJoinStep] = useState<JoinStep>('name')
  const [joinName, setJoinName] = useState('')
  const [joinPw, setJoinPw] = useState('')
  const [joinConfirm, setJoinConfirm] = useState('')
  const [orgName, setOrgName] = useState('')
  const [orgPhone, setOrgPhone] = useState('')
  const [showJoinPw, setShowJoinPw] = useState(false)
  const [wizChoice, setWizChoice] = useState<'service' | 'join'>('service')
  const [orgSearch, setOrgSearch] = useState('')
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)
  const [orgOptions, setOrgOptions] = useState<{ name: string; tenantId: string }[]>([])

  // Forgot password
  const [forgotSent, setForgotSent] = useState(false)

  // Shared
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [joinProgress, setJoinProgress] = useState('')
  const [legalDoc, setLegalDoc] = useState<DocKey | null>(null)

  useEffect(() => {
    if (profile && !signupInProgress.current) {
      navigate(profile.is_super_admin ? '/superadmin' : '/', { replace: true })
    }
  }, [profile, navigate])

  // 회원가입 탭은 서비스 이용 동의(/consent)를 거친 적이 있어야 접근 허용.
  // 동의 플래그는 즉시 소멸시키지 않고 같은 탭(세션) 동안 유지 — 새로고침해도
  // 다시 동의 화면으로 튕기지 않음. 새 탭/재로그인 등 새 세션에서는 sessionStorage가
  // 자연히 비어 있으므로 다시 동의를 거치게 된다.
  useEffect(() => {
    if (tab !== 'signup') return
    if (sessionStorage.getItem('vs_consent_ok') !== '1') {
      navigate('/consent', { replace: true })
    }
  }, [tab, navigate])

  function switchTab(t: Tab) {
    signupInProgress.current = false
    setTab(t); setError(null)
    setLoginStep('buttons')
    setSignupEmailInCard(false); setWizOpen(false)
    setJoinStep('name')
  }

  function closeWiz() {
    signupInProgress.current = false
    setWizOpen(false); setError(null)
    setSignupEmailInCard(true)
    setJoinStep('name')
    setJoinName(''); setJoinPw(''); setJoinConfirm('')
    setOrgSearch(''); setSelectedTenantId(null); setOrgOptions([])
  }

  // ── handlers ──────────────────────────────────────────────────

  async function handleLogin() {
    if (!loginEmail.trim() || !loginPw) { setError('이메일과 비밀번호를 입력해 주세요.'); return }
    setError(null); setLoading(true)
    const err = await signIn(loginEmail, loginPw)
    setLoading(false)
    if (err) setError(err)
    else {
      localStorage.setItem('lastLoginEmail', loginEmail)
      sessionStorage.setItem('vs_just_logged_in', '1')
      navigate('/', { replace: true })
    }
  }

  async function handleForgotPassword() {
    if (!loginEmail.trim() || !loginEmail.includes('@')) { setError('올바른 이메일을 입력해 주세요.'); return }
    setError(null); setLoading(true)
    const err = await resetPassword(loginEmail.trim())
    setLoading(false)
    if (err) { setError(err); return }
    setForgotSent(true)
  }

  async function handleEmailNext() {
    if (!joinEmail.trim() || !joinEmail.includes('@')) { setError('올바른 이메일을 입력해 주세요.'); return }
    setLoading(true); setError(null)
    const { data } = await supabase.from('profiles').select('id').eq('email', joinEmail.trim()).maybeSingle()
    setLoading(false)
    if (data) {
      setTab('login')
      setLoginStep('password')
      setLoginEmail(joinEmail.trim())
      setLoginPw('')
      setError('이미 가입된 이메일입니다. 로그인을 이용해 주세요.')
      return
    }
    signupInProgress.current = true
    setSignupEmailInCard(false)
    setJoinStep('name')
    setJoinName(''); setJoinPw(''); setJoinConfirm('')
    setOrgSearch(''); setSelectedTenantId(null); setOrgOptions([])
    setWizOpen(true)
  }

  // 이미 가입된 이메일 오류 시 wizard를 완전히 초기화하고 로그인 비밀번호 단계로 전환
  function redirectToLoginTab(message: string) {
    signupInProgress.current = false
    setWizOpen(false)
    setTab('login')
    setLoginStep('password')
    setLoginEmail(joinEmail.trim())
    setLoginPw('')
    setJoinStep('name')
    setJoinName(''); setJoinPw(''); setJoinConfirm('')
    setOrgSearch(''); setSelectedTenantId(null); setOrgOptions([])
    setError(message)
  }

  async function loadOrgList() {
    const { data } = await supabase.rpc('list_active_org_customers')
    if (!data) return
    const opts = (data as { customer_name: string; tenant_id: string }[])
      .map(row => ({ name: row.customer_name, tenantId: row.tenant_id }))
    setOrgOptions(opts)
  }

  async function handleSignUpOnly(tenantId = '') {
    setLoading(true); setError(null)
    // signUp 도중 App.tsx가 PendingPage로 전환되기 전에 먼저 세팅
    localStorage.setItem('vs_pending_mode', 'join-org')
    const err = await signUp(joinEmail.trim(), joinPw, joinName.trim(), 'volunteer', tenantId)
    setLoading(false)
    if (err) {
      localStorage.removeItem('vs_pending_mode')
      if (err.includes('이미 가입된')) { redirectToLoginTab(err); return }
      setError(err); return
    }
    window.location.href = '/'
  }

  async function handleJoinSubmit() {
    if (!orgName.trim()) { setError('서비스 이름을 입력해 주세요.'); return }
    if (!isValidPhone(orgPhone)) { setError('올바른 전화번호를 입력해 주세요. (예: 010-1234-5678)'); return }
    setLoading(true); setError(null); setJoinProgress('계정을 만드는 중...')
    const err = await signUp(joinEmail.trim(), joinPw, joinName.trim(), 'volunteer', '')
    if (err) {
      setLoading(false); setJoinProgress('')
      if (err.includes('이미 가입된')) { redirectToLoginTab(err); return }
      setError(err); return
    }
    // signUp 성공 → SIGNED_IN 이벤트로 React가 리렌더링되어 다른 화면이 깜빡이는 것을 방지
    sessionStorage.setItem('vs_setup_creating', '1')
    // 아래 작업 도중 새로고침·이탈로 중단되면 플래그가 영구히 남아 메인 화면 진입이
    // 막히던 문제 방지 — 페이지를 떠나는 순간 플래그를 정리
    const clearCreatingFlag = () => sessionStorage.removeItem('vs_setup_creating')
    window.addEventListener('beforeunload', clearCreatingFlag)
    try {
      setJoinProgress('조직을 만드는 중...')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); setJoinProgress(''); sessionStorage.removeItem('vs_setup_creating'); setError('인증 오류가 발생했습니다.'); return }
      const { data: custData, error: custErr } = await supabase
        .from('customers')
        .insert({ name: orgName.trim(), phone: orgPhone.trim(), owner_user_id: user.id, plan: 'basic' })
        .select('id').single()
      if (custErr || !custData) { setLoading(false); setJoinProgress(''); sessionStorage.removeItem('vs_setup_creating'); setError(`조직 생성 오류: ${custErr?.message}`); return }

      // tenant 바로 생성 → CustomerAdminPage 경유 없이 /setup으로 직행
      const DEFAULT_SLOTS = ['09-10','10-11','11-12','12-13','13-14','14-15','15-16','16-17','17-18']
      const tenantName = orgName.trim()
      const tenantSettings = { title: tenantName, time_slots: DEFAULT_SLOTS, open_from: '09:00', open_to: '22:00', slot_interval_minutes: 60, timezone: 'Asia/Seoul', locale: 'ko-KR', tenant_mode: '회원공유' }
      const base = tenantName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-+|-+$/g, '')
      let tenantId: string | null = null
      let tenantSlug = ''
      for (let i = 0; i < 3; i++) {
        tenantId = crypto.randomUUID()
        tenantSlug = `${base || 'org'}-${Math.random().toString(36).slice(2, 7)}`
        const { error: te } = await supabase.from('tenants').insert({
          id: tenantId, slug: tenantSlug, name: tenantName, customer_id: custData.id, is_active: true, settings: tenantSettings
        })
        if (!te) break
        if (te.code !== '23505') { tenantId = null; break }
        tenantId = null
      }
      if (!tenantId) { setLoading(false); setJoinProgress(''); sessionStorage.removeItem('vs_setup_creating'); setError('조직 초기화 오류가 발생했습니다.'); return }
      await supabase.from('tenant_members').insert({ tenant_id: tenantId, user_id: user.id, role: 'admin', is_approved: true })
      await supabase.from('schedule_rules').insert(
        [0,1,2,3,4,5,6].flatMap(d => DEFAULT_SLOTS.map(s => ({ tenant_id: tenantId!, day_of_week: d, time_slot: s, is_open: true })))
      )
      sessionStorage.setItem('vs_setup_tenant', JSON.stringify({ id: tenantId, slug: tenantSlug, name: tenantName, customer_id: custData.id, is_active: true, settings: tenantSettings }))
      setJoinProgress('이동하는 중...')
      window.location.href = '/setup?org=' + tenantId
    } finally {
      window.removeEventListener('beforeunload', clearCreatingFlag)
    }
  }

  async function handleKakao() {
    setLoading(true); setError(null)
    if (tab === 'login') sessionStorage.setItem('vs_just_logged_in', '1')
    const err = await signInWithKakao()
    setLoading(false); if (err) setError(err)
  }

  // ── wizard dots ───────────────────────────────────────────────
  const stepIdx = (joinStep === 'choice' || joinStep === 'org-name' || joinStep === 'org-select')
    ? COUNTABLE.length - 1
    : COUNTABLE.indexOf(joinStep)

  // ── top nav ───────────────────────────────────────────────────
  const topNavSlot = (
    <>
      <span className="lmp-nav-hint">{tab === 'login' ? '계정이 없으신가요?' : '이미 계정이 있나요?'}</span>
      <button className="lmp-nav-btn" onClick={() => switchTab(tab === 'login' ? 'signup' : 'login')}>
        {tab === 'login' ? '회원가입' : '로그인'}
      </button>
    </>
  )

  // ── password field helper ─────────────────────────────────────
  function PwField({ id, value, onChange, placeholder, show, onToggle, onEnter }: {
    id: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    placeholder: string; show: boolean; onToggle: () => void; onEnter?: () => void
  }) {
    return (
      <div className="af-input-wrap">
        <span className="af-input-ic"><ILock /></span>
        <input id={id} name={id} className="af-input" type={show ? 'text' : 'password'} value={value}
          onChange={onChange} placeholder={placeholder} autoComplete="new-password" autoFocus
          onKeyDown={e => { if (e.key === 'Enter' && onEnter) onEnter() }} />
        <button type="button" className="af-input-eye" onClick={onToggle} aria-label="비밀번호 표시">
          {show ? <IEyeOff /> : <IEye />}
        </button>
      </div>
    )
  }

  return (
    <ScheduleBackground topNavSlot={topNavSlot}>

      {/* ── Main card ── */}
      <div className="af-card">
        <div style={{ marginBottom: 24 }}>
          <img src="/logo-timetable-stack.png" alt="Dynamic Team Schedule" style={{ width: 200, height: 'auto', display: 'block' }} />
        </div>
        <span className="af-eyebrow">{tab === 'login' ? 'WELCOME BACK' : 'JOIN US'}</span>
        <h2 className="af-title">
          {tab === 'login' ? <>다시 만나서<br />반가워요</> : <>새로 오셨군요<br />반갑습니다</>}
        </h2>

        {/* Segmented tabs */}
        <div className="af-seg">
          <div className="af-seg-ind" style={{ transform: `translateX(${tab === 'signup' ? '100%' : '0%'})` }} />
          {(['login', 'signup'] as Tab[]).map(t => (
            <button key={t} className={`af-seg-btn${tab === t ? ' on' : ''}`} onClick={() => switchTab(t)}>
              {t === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        {/* ── Login ── */}
        {tab === 'login' && (
          <>
            {loginStep === 'buttons' && (
              <div className="af-socials">
                <button className="af-btn-social kakao" onClick={handleKakao} disabled={loading}>
                  <IKakao /> 카카오로 계속하기
                </button>
                <button className="af-btn-social" disabled={loading} onClick={() => { setError(null); setLoginStep('email') }}>
                  {IMail()} 이메일로 계속하기
                </button>
              </div>
            )}

            {loginStep === 'email' && (
              <>
                <div className="af-field">
                  <label className="af-label">이메일</label>
                  <div className="af-input-wrap">
                    <span className="af-input-ic">{IMail()}</span>
                    <input id="login-email" name="email" className="af-input" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                      placeholder="you@example.com" autoComplete="email" autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          if (!loginEmail.trim() || !loginEmail.includes('@')) { setError('올바른 이메일을 입력해 주세요.'); return }
                          setError(null); setLoginStep('password')
                        }
                      }} />
                  </div>
                </div>
                {error && <div className="af-err">{error}</div>}
                <button className="af-btn af-btn-primary" style={{ marginTop: 6 }} onClick={() => {
                  if (!loginEmail.trim() || !loginEmail.includes('@')) { setError('올바른 이메일을 입력해 주세요.'); return }
                  setError(null); setLoginStep('password')
                }}>
                  계속하기 <IArrow />
                </button>
                <button className="af-back-link" onClick={() => { setLoginStep('buttons'); setError(null) }}>
                  <IBack /> 뒤로
                </button>
              </>
            )}

            {loginStep === 'password' && (
              <>
                <div className="af-recap">{IMail(13)} {loginEmail}</div>
                <div className="af-field">
                  <label className="af-label">비밀번호</label>
                  <div className="af-input-wrap">
                    <span className="af-input-ic"><ILock /></span>
                    <input id="login-password" name="password" className="af-input" type={showLoginPw ? 'text' : 'password'} value={loginPw}
                      onChange={e => setLoginPw(e.target.value)} placeholder="비밀번호" autoComplete="current-password" autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleLogin() }} />
                    <button type="button" className="af-input-eye" onClick={() => setShowLoginPw(p => !p)}>
                      {showLoginPw ? <IEyeOff /> : <IEye />}
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '2px 0 10px' }}>
                  <button style={{ fontSize: 12.5, color: 'var(--ink-500)', fontWeight: 500 }}
                    onClick={() => { setForgotSent(false); setError(null); setLoginStep('forgot') }}>
                    비밀번호를 잊으셨나요?
                  </button>
                </div>
                {error && <div className="af-err">{error}</div>}
                <button className="af-btn af-btn-primary" onClick={handleLogin}
                  disabled={loading} style={{ opacity: loading ? 0.6 : 1 }}>
                  {loading ? '처리 중...' : <> 로그인 <IArrow /></>}
                </button>
                <button className="af-back-link" onClick={() => { setLoginStep('email'); setLoginPw(''); setError(null) }}>
                  <IBack /> 뒤로
                </button>
              </>
            )}
            {loginStep === 'forgot' && (
              <>
                {forgotSent ? (
                  <>
                    <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>📧</div>
                      <h3 className="af-title sm" style={{ marginBottom: 6 }}>이메일을 확인해 주세요</h3>
                      <p className="af-sub" style={{ marginBottom: 0 }}>
                        <strong>{loginEmail}</strong>로<br />비밀번호 재설정 링크를 보냈습니다.
                      </p>
                    </div>
                    <button className="af-btn af-btn-primary" style={{ marginTop: 20 }}
                      onClick={() => { setLoginStep('buttons'); setForgotSent(false); setError(null) }}>
                      로그인으로 돌아가기
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="af-title sm" style={{ marginBottom: 4 }}>비밀번호 재설정</h3>
                    <p className="af-sub">가입한 이메일로 재설정 링크를 보내드립니다.</p>
                    <div className="af-field">
                      <label className="af-label">이메일</label>
                      <div className="af-input-wrap">
                        <span className="af-input-ic">{IMail()}</span>
                        <input id="forgot-email" name="email" className="af-input" type="email" value={loginEmail}
                          onChange={e => setLoginEmail(e.target.value)}
                          placeholder="you@example.com" autoComplete="email" autoFocus
                          onKeyDown={e => { if (e.key === 'Enter') handleForgotPassword() }} />
                      </div>
                    </div>
                    {error && <div className="af-err">{error}</div>}
                    <button className="af-btn af-btn-primary" style={{ marginTop: 6, opacity: loading ? 0.6 : 1 }}
                      disabled={loading} onClick={handleForgotPassword}>
                      {loading ? '전송 중...' : <>링크 보내기 <IArrow /></>}
                    </button>
                    <button className="af-back-link" onClick={() => { setLoginStep('password'); setError(null) }}>
                      <IBack /> 뒤로
                    </button>
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* ── Signup ── */}
        {tab === 'signup' && (
          <>
            {!signupEmailInCard ? (
              <div className="af-socials">
                <button className="af-btn-social kakao" onClick={handleKakao} disabled={loading}>
                  <IKakao /> 카카오로 계속하기
                </button>
                <button className="af-btn-social" disabled={loading} onClick={() => { setSignupEmailInCard(true); setError(null) }}>
                  {IMail()} 이메일로 계속하기
                </button>
              </div>
            ) : (
              <>
                <div className="af-field">
                  <label className="af-label">이메일</label>
                  <div className="af-input-wrap">
                    <span className="af-input-ic">{IMail()}</span>
                    <input id="signup-email" name="email" className="af-input" type="email" value={joinEmail} onChange={e => setJoinEmail(e.target.value)}
                      placeholder="you@example.com" autoComplete="email" autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleEmailNext() }} />
                  </div>
                </div>
                {error && <div className="af-err">{error}</div>}
                <button className="af-btn af-btn-primary" style={{ marginTop: 6, opacity: loading ? 0.6 : 1 }}
                  disabled={loading} onClick={handleEmailNext}>
                  {loading ? '확인 중...' : <> 계속하기 <IArrow /></>}
                </button>
                <button className="af-back-link" onClick={() => { setSignupEmailInCard(false); setError(null) }}>
                  <IBack /> 취소
                </button>
              </>
            )}
            <p className="af-legal">
              가입 시{' '}
              <a onClick={() => setLegalDoc('tos')}>서비스 약관</a>{' '}및{' '}
              <a onClick={() => setLegalDoc('privacy')}>개인정보 처리방침</a>에 동의하게 됩니다.
            </p>
          </>
        )}
      </div>

      {/* ── Wizard popup ── */}
      {wizOpen && (
        <>
          <div className="af-overlay" />
          <div className="af-popup-layer">
            <div className="af-popup">
              {/* Header: dots + close */}
              <div className="af-popup-head">
                <div className="af-dots">
                  {COUNTABLE.map((_, i) => (
                    <span key={i} className={`af-dot-step${i < stepIdx ? ' done' : i === stepIdx ? ' now' : ''}`} />
                  ))}
                </div>
                <button className="af-popup-x" onClick={closeWiz}><IClose /></button>
              </div>

              {/* name */}
              {joinStep === 'name' && (
                <>
                  <h3 className="af-title sm">이름을 입력하세요</h3>
                  <p className="af-sub">실명으로 입력하면 동료가 알아보기 쉬워요.</p>
                  <div className="af-field">
                    <label className="af-label">이름</label>
                    <div className="af-input-wrap">
                      <span className="af-input-ic"><IUser /></span>
                      <input id="signup-name" name="name" className="af-input" type="text" value={joinName} onChange={e => setJoinName(e.target.value)}
                        placeholder="홍길동" autoComplete="name" autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            if (!joinName.trim()) { setError('이름을 입력해 주세요.'); return }
                            setError(null); setJoinStep('password')
                          }
                        }} />
                    </div>
                  </div>
                  {error && <div className="af-err">{error}</div>}
                  <button className="af-btn af-btn-primary" style={{ marginTop: 6 }} onClick={() => {
                    if (!joinName.trim()) { setError('이름을 입력해 주세요.'); return }
                    setError(null); setJoinStep('password')
                  }}>계속하기 <IArrow /></button>
                  <button className="af-back-link" onClick={closeWiz}><IBack /> 취소</button>
                </>
              )}

              {/* password */}
              {joinStep === 'password' && (
                <>
                  <h3 className="af-title sm">비밀번호를 설정하세요</h3>
                  <p className="af-sub">6자 이상으로 안전하게 만들어 주세요.</p>
                  <div className="af-field">
                    <label className="af-label">비밀번호</label>
                    <PwField id="signup-password" value={joinPw} onChange={e => setJoinPw(e.target.value)} placeholder="6자 이상"
                      show={showJoinPw} onToggle={() => setShowJoinPw(p => !p)}
                      onEnter={() => {
                        if (joinPw.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return }
                        setError(null); setJoinStep('confirm')
                      }} />
                  </div>
                  {error && <div className="af-err">{error}</div>}
                  <button className="af-btn af-btn-primary" style={{ marginTop: 6 }} onClick={() => {
                    if (joinPw.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return }
                    setError(null); setJoinStep('confirm')
                  }}>계속하기 <IArrow /></button>
                  <button className="af-back-link" onClick={() => { setJoinStep('name'); setError(null) }}><IBack /> 뒤로</button>
                </>
              )}

              {/* confirm */}
              {joinStep === 'confirm' && (
                <>
                  <h3 className="af-title sm">비밀번호를 확인하세요</h3>
                  <p className="af-sub">동일한 비밀번호를 한 번 더 입력해 주세요.</p>
                  <div className="af-field">
                    <label className="af-label">비밀번호 확인</label>
                    <PwField id="signup-password-confirm" value={joinConfirm} onChange={e => setJoinConfirm(e.target.value)} placeholder="비밀번호 재입력"
                      show={showJoinPw} onToggle={() => setShowJoinPw(p => !p)}
                      onEnter={() => {
                        if (joinPw !== joinConfirm) { setError('비밀번호가 일치하지 않습니다.'); return }
                        if (joinPw.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return }
                        setError(null); setJoinStep('choice')
                      }} />
                  </div>
                  {error && <div className="af-err">{error}</div>}
                  <button className="af-btn af-btn-primary" style={{ marginTop: 6 }} onClick={() => {
                    if (joinPw !== joinConfirm) { setError('비밀번호가 일치하지 않습니다.'); return }
                    if (joinPw.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return }
                    setError(null); setJoinStep('choice')
                  }}>계속하기 <IArrow /></button>
                  <button className="af-back-link" onClick={() => { setJoinStep('password'); setError(null) }}><IBack /> 뒤로</button>
                </>
              )}

              {/* choice */}
              {joinStep === 'choice' && (
                <>
                  <h3 className="af-title sm">어떻게 시작할까요?</h3>
                  <p className="af-sub">가입 후에도 변경할 수 있어요.</p>
                  <div className="af-choices">
                    <button className={`af-choice${wizChoice === 'service' ? ' on' : ''}`} onClick={() => setWizChoice('service')}>
                      <span className="af-choice-ic"><ISpark /></span>
                      <span className="af-choice-body">
                        <span className="af-choice-t">내 서비스 시작하기 <span className="af-badge">BASIC 무료</span></span>
                        <span className="af-choice-d">나만의 조직을 직접 만들고 관리합니다</span>
                      </span>
                      <span className="af-choice-radio"><ICheck /></span>
                    </button>
                    <button className={`af-choice${wizChoice === 'join' ? ' on' : ''}`} onClick={() => setWizChoice('join')}>
                      <span className="af-choice-ic"><IJoin /></span>
                      <span className="af-choice-body">
                        <span className="af-choice-t">기존 조직에 가입하기</span>
                        <span className="af-choice-d">운영 중인 조직에 구성원으로 가입합니다</span>
                      </span>
                      <span className="af-choice-radio"><ICheck /></span>
                    </button>
                  </div>
                  {error && <div className="af-err">{error}</div>}
                  <button className="af-btn af-btn-primary" style={{ marginTop: 8, opacity: loading ? 0.6 : 1 }}
                    disabled={loading}
                    onClick={() => {
                      if (wizChoice === 'service') { setJoinStep('org-name'); setError(null) }
                      else { setJoinStep('org-select'); setError(null); loadOrgList() }
                    }}>
                    {loading ? '처리 중...' : <>계속하기 <IArrow /></>}
                  </button>
                  <button className="af-back-link" onClick={() => { setJoinStep('confirm'); setError(null) }}><IBack /> 뒤로</button>
                </>
              )}

              {/* org-select */}
              {joinStep === 'org-select' && (
                <>
                  <h3 className="af-title sm">어느 조직에 가입할까요?</h3>
                  <p className="af-sub">가입 후 관리자 승인이 필요할 수 있어요.</p>
                  <div className="af-field">
                    <label className="af-label">조직 검색</label>
                    <div className="af-input-wrap">
                      <input className="af-input" type="text" value={orgSearch} autoFocus
                        onChange={e => { setOrgSearch(e.target.value); setSelectedTenantId(null) }}
                        placeholder="조직 이름을 검색하세요" />
                    </div>
                  </div>
                  <div style={{ maxHeight: 180, overflowY: 'auto', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {orgOptions
                      .filter(o => !orgSearch || o.name.toLowerCase().includes(orgSearch.toLowerCase()))
                      .map(o => (
                        <button key={o.tenantId}
                          className={`af-choice${selectedTenantId === o.tenantId ? ' on' : ''}`}
                          onClick={() => { setSelectedTenantId(o.tenantId); setError(null) }}>
                          <span className="af-choice-body"><span className="af-choice-t">{o.name}</span></span>
                          <span className="af-choice-radio"><ICheck /></span>
                        </button>
                      ))}
                    {orgOptions.filter(o => !orgSearch || o.name.toLowerCase().includes(orgSearch.toLowerCase())).length === 0 && (
                      <p style={{ textAlign: 'center', color: 'var(--ink-400)', fontSize: 13, padding: '12px 0' }}>
                        {orgSearch ? '검색 결과가 없습니다.' : '등록된 조직이 없습니다.'}
                      </p>
                    )}
                  </div>
                  {error && <div className="af-err">{error}</div>}
                  <button className="af-btn af-btn-primary"
                    style={{ marginTop: 8, opacity: (loading || !selectedTenantId) ? 0.6 : 1 }}
                    disabled={loading || !selectedTenantId}
                    onClick={() => {
                      if (!selectedTenantId) { setError('조직을 선택해 주세요.'); return }
                      handleSignUpOnly(selectedTenantId)
                    }}>
                    {loading ? '처리 중...' : <>가입 신청하기 <IArrow /></>}
                  </button>
                  <button className="af-back-link" onClick={() => { setJoinStep('choice'); setError(null) }}>
                    <IBack /> 뒤로
                  </button>
                </>
              )}

              {/* org-name */}
              {joinStep === 'org-name' && (
                <>
                  <h3 className="af-title sm">서비스 이름을 정해주세요</h3>
                  <p className="af-sub">나중에 변경할 수 있어요.</p>
                  <div className="af-field">
                    <label className="af-label">서비스 이름</label>
                    <div className="af-input-wrap">
                      <span className="af-input-ic"><IPlus /></span>
                      <input id="signup-org-name" name="organization" className="af-input" type="text" value={orgName} onChange={e => setOrgName(e.target.value)}
                        placeholder="예: 홍길동 미용실" autoComplete="organization" autoFocus
                        onKeyDown={e => { if (e.key === 'Enter' && orgName.trim()) handleJoinSubmit() }} />
                    </div>
                  </div>
                  <div className="af-field">
                    <label className="af-label">전화번호</label>
                    <div className="af-input-wrap">
                      <span className="af-input-ic"><IPlus /></span>
                      <input id="signup-org-phone" name="tel" className="af-input" type="tel" required value={orgPhone} onChange={e => setOrgPhone(formatPhone(e.target.value))}
                        placeholder="예: 010-1234-5678" autoComplete="tel"
                        onKeyDown={e => { if (e.key === 'Enter' && orgName.trim()) handleJoinSubmit() }} />
                    </div>
                  </div>
                  {error && <div className="af-err">{error}</div>}
                  <button className="af-btn af-btn-primary" style={{ marginTop: 6, opacity: loading ? 0.6 : 1 }}
                    disabled={loading} onClick={handleJoinSubmit}>
                    {loading
                      ? <><span className="af-btn-spinner" /> {joinProgress || '처리 중...'}</>
                      : <>시작하기 <IArrow /></>}
                  </button>
                  <button className="af-back-link" onClick={() => { setJoinStep('choice'); setError(null) }}><IBack /> 뒤로</button>
                </>
              )}
            </div>
          </div>
        </>
      )}
      {/* 약관 상세 모달 */}
      {legalDoc && (
        <>
          <div className="af-overlay" onClick={() => setLegalDoc(null)} />
          <div className="af-popup-layer">
            <div className="af-doc">
              <div className="af-doc-head">
                <span className="af-doc-title">{TERMS[legalDoc].title}</span>
                <button className="af-popup-x" onClick={() => setLegalDoc(null)}><IClose /></button>
              </div>
              <div className="af-doc-body">
                <p>{TERMS[legalDoc].body}</p>
              </div>
            </div>
          </div>
        </>
      )}
      <DevFileLabel file="AuthPage.tsx" />
    </ScheduleBackground>
  )
}
