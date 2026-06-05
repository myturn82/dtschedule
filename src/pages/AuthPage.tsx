import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { ScheduleBackground } from '../components/auth/ScheduleBackground'

type Tab         = 'login' | 'signup'
type JoinStep    = 'org' | 'name' | 'email' | 'password' | 'confirm'
type ServiceStep = 'name' | 'email' | 'password' | 'confirm'
type SignupMode  = 'join' | 'service' | null

interface SearchableComboProps {
  value: string
  items: { id: string; name: string }[]
  placeholder: string
  disabled?: boolean
  onSelect: (id: string, name: string) => void
}

function SearchableCombo({ value, items, placeholder, disabled, onSelect }: SearchableComboProps) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)

  useEffect(() => { setQuery(value) }, [value])

  const filtered = items.filter(it =>
    it.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        disabled={disabled}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        style={{
          width: '100%', height: 42, padding: '0 14px',
          boxSizing: 'border-box',
          background: disabled ? '#F4F1EA' : '#fff',
          border: '1px solid rgba(20,23,28,0.09)',
          borderRadius: 10, fontSize: 13.5, color: '#14171C',
          outline: 'none', fontFamily: 'inherit',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
      {open && !disabled && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: '#fff', border: '1px solid rgba(20,23,28,0.10)',
          borderRadius: 10, boxShadow: '0 8px 24px -8px rgba(20,23,28,0.18)',
          maxHeight: 200, overflowY: 'auto', marginTop: 4,
        }}>
          {filtered.map(it => (
            <div
              key={it.id}
              onMouseDown={() => { onSelect(it.id, it.name); setQuery(it.name); setOpen(false) }}
              style={{
                padding: '9px 14px', fontSize: 13.5, cursor: 'pointer',
                color: '#14171C', borderBottom: '1px solid rgba(20,23,28,0.05)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F4F1EA')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {it.name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const JOIN_STEPS: JoinStep[]    = ['org', 'name', 'email', 'password', 'confirm']
const SERVICE_STEPS: ServiceStep[] = ['name', 'email', 'password', 'confirm']

export function AuthPage() {
  const { profile, signIn, signUp, signInWithGoogle, signInWithKakao } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (profile) navigate('/', { replace: true })
  }, [profile, navigate])

  const initTab = searchParams.get('tab') === 'login' ? 'login' : 'signup'
  const [tab, setTab] = useState<Tab>(initTab as Tab)

  const tabLoginRef  = useRef<HTMLButtonElement>(null)
  const tabSignupRef = useRef<HTMLButtonElement>(null)
  const [pillStyle, setPillStyle] = useState({ width: 0, left: 0 })

  // Login form
  const [loginEmail, setLoginEmail] = useState(() => localStorage.getItem('lastLoginEmail') ?? '')
  const [loginPw, setLoginPw]       = useState('')
  const [showPw, setShowPw]         = useState(false)

  // Signup mode
  const [signupMode, setSignupMode] = useState<SignupMode>(null)

  // Join org wizard
  const [joinStep, setJoinStep]                 = useState<JoinStep>('org')
  const [customers, setCustomers]               = useState<{ id: string; name: string }[]>([])
  const [tenants, setTenants]                   = useState<{ id: string; name: string }[]>([])
  const [selectedCustId, setSelectedCustId]     = useState('')
  const [selectedCustName, setSelectedCustName] = useState('')
  const [selectedTenId, setSelectedTenId]       = useState('')
  const [selectedTenName, setSelectedTenName]   = useState('')
  const [joinName, setJoinName]       = useState('')
  const [joinEmail, setJoinEmail]     = useState('')
  const [joinPw, setJoinPw]           = useState('')
  const [joinConfirm, setJoinConfirm] = useState('')

  // Service start wizard
  const [serviceStep, setServiceStep] = useState<ServiceStep>('name')
  const [servName, setServName]       = useState('')
  const [servEmail, setServEmail]     = useState('')
  const [servPw, setServPw]           = useState('')
  const [servConfirm, setServConfirm] = useState('')

  // Shared
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Load customers
  useEffect(() => {
    supabase.from('customers').select('id, name').order('name')
      .then(({ data }) => setCustomers(data ?? []))
  }, [])

  // Load tenants when customer changes
  useEffect(() => {
    if (!selectedCustId) {
      setTenants([])
      setSelectedTenId('')
      setSelectedTenName('')
      return
    }
    supabase.from('tenants').select('id, name').eq('customer_id', selectedCustId).order('name')
      .then(({ data }) => {
        setTenants(data ?? [])
        setSelectedTenId('')
        setSelectedTenName('')
      })
  }, [selectedCustId])

  // Tab pill animation
  function updatePill(t: Tab) {
    const ref = t === 'login' ? tabLoginRef.current : tabSignupRef.current
    const wrap = ref?.parentElement
    if (!ref || !wrap) return
    const r = ref.getBoundingClientRect()
    const pr = wrap.getBoundingClientRect()
    setPillStyle({ width: r.width, left: r.left - pr.left - 3 })
  }
  useEffect(() => { updatePill(tab) }, [tab])
  useEffect(() => {
    const fn = () => updatePill(tab)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [tab])

  function switchTab(t: Tab) {
    setTab(t)
    setError(null)
    setSuccess(null)
    setSignupMode(null)
    setJoinStep('org')
    setServiceStep('name')
  }

  // Handlers
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!loginEmail.trim() || !loginPw) { setError('이메일과 비밀번호를 입력해 주세요.'); return }
    setError(null); setLoading(true)
    const err = await signIn(loginEmail, loginPw)
    setLoading(false)
    if (err) setError(err)
    else { localStorage.setItem('lastLoginEmail', loginEmail); navigate('/', { replace: true }) }
  }

  async function handleJoinSubmit() {
    if (joinPw !== joinConfirm) { setError('비밀번호가 일치하지 않습니다.'); return }
    if (joinPw.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return }
    setLoading(true); setError(null)
    const err = await signUp(joinEmail.trim(), joinPw, joinName.trim(), 'volunteer', selectedTenId)
    setLoading(false)
    if (err) setError(err)
    else setSuccess('가입이 완료됐습니다. 이메일을 확인한 후 조직 관리자의 승인을 기다려 주세요.')
  }

  async function handleServiceSubmit() {
    if (servPw !== servConfirm) { setError('비밀번호가 일치하지 않습니다.'); return }
    if (servPw.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return }
    setLoading(true); setError(null)
    const err = await signUp(servEmail.trim(), servPw, servName.trim(), 'volunteer')
    setLoading(false)
    if (err) setError(err)
    else setSuccess('가입이 완료됐습니다. 이메일 인증 후 로그인하면 서비스를 시작할 수 있습니다.')
  }

  async function handleGoogle() {
    setLoading(true); setError(null)
    const err = await signInWithGoogle()
    setLoading(false); if (err) setError(err)
  }

  async function handleKakao() {
    setLoading(true); setError(null)
    const err = await signInWithKakao()
    setLoading(false); if (err) setError(err)
  }

  // Inline style helpers
  const inputSt: React.CSSProperties = {
    width: '100%', height: 42, padding: '0 14px 0 40px', boxSizing: 'border-box',
    background: '#fff', border: '1px solid rgba(20,23,28,0.09)',
    borderRadius: 10, fontSize: 13.5, color: '#14171C',
    outline: 'none', fontFamily: 'inherit',
  }
  const errBox: React.CSSProperties = {
    margin: '8px 0', padding: '10px 14px', borderRadius: 10,
    background: 'oklch(0.97 0.02 25)', border: '1px solid oklch(0.88 0.06 25)',
    color: 'oklch(0.45 0.15 25)', fontSize: 13,
  }
  const backBtn: React.CSSProperties = {
    width: '100%', marginTop: 8, height: 36, background: 'none', border: 'none',
    fontSize: 12.5, color: '#8A8F99', cursor: 'pointer', fontFamily: 'inherit',
  }

  const accent     = 'oklch(0.66 0.16 28)'

  // Google SVG
  const googleIcon = (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20.4H24v7.1h11.3c-1.5 4.1-5.4 7-11.3 7-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5-5C32.9 5.1 28.7 3.4 24 3.4 12.5 3.4 3.4 12.5 3.4 24S12.5 44.6 24 44.6c11 0 20-8 20-20 0-1.4-.1-2.7-.4-4.1z"/>
      <path fill="#FF3D00" d="M5.3 13.6l5.8 4.3C12.8 14.1 18 11 24 11c3 0 5.8 1.1 7.9 3l5-5C32.9 5.1 28.7 3.4 24 3.4 16.4 3.4 9.8 7.6 5.3 13.6z"/>
      <path fill="#4CAF50" d="M24 44.6c4.6 0 8.7-1.7 11.9-4.5l-5.5-4.6c-1.7 1.3-3.9 2.1-6.4 2.1-5.8 0-10.7-3.9-11.2-7H7v4.7C10.5 40.6 16.8 44.6 24 44.6z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20.4H24v7.1h11.3c-.7 2-2 3.7-3.6 5l5.5 4.6c-.4.4 5.8-4.2 5.8-13.2 0-1.4-.1-2.7-.4-3.4z"/>
    </svg>
  )

  // Kakao SVG
  const kakaoIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.7 6.7-.2.7-.7 2.7-.8 3.1-.1.5.2.5.4.4.2-.1 2.6-1.7 3.6-2.4.7.1 1.4.2 2.1.2 5.5 0 10-3.6 10-8s-4.5-8-10-8Z"/>
    </svg>
  )

  // topNavSlot
  const topNavSlot = (
    <>
      <span className="lmp-nav-hint" style={{ fontSize: 13, color: '#6B7280' }}>
        {tab === 'login' ? '계정이 없으신가요?' : '이미 계정이 있나요?'}
      </span>
      <button className="lmp-nav-btn" onClick={() => switchTab(tab === 'login' ? 'signup' : 'login')}>
        {tab === 'login' ? '회원가입' : '로그인'}
      </button>
    </>
  )

  // Join wizard step index
  const joinStepIdx = JOIN_STEPS.indexOf(joinStep)

  // Service wizard step index
  const servStepIdx = SERVICE_STEPS.indexOf(serviceStep)

  function renderJoinWizard() {
    return (
      <div>
        {/* Step indicator */}
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#8A8F99', marginBottom: 12, textAlign: 'right' as const }}>
          {joinStepIdx + 1} / 5
        </div>

        {joinStep === 'org' && (
          <>
            <div className="lmp-field">
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#353A44', marginBottom: 5 }}>고객사</label>
              <SearchableCombo
                value={selectedCustName}
                items={customers}
                placeholder="고객사를 검색하세요"
                onSelect={(id, name) => { setSelectedCustId(id); setSelectedCustName(name) }}
              />
            </div>
            <div className="lmp-field">
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#353A44', marginBottom: 5 }}>조직</label>
              <SearchableCombo
                value={selectedTenName}
                items={tenants}
                placeholder="조직을 검색하세요"
                disabled={!selectedCustId}
                onSelect={(id, name) => { setSelectedTenId(id); setSelectedTenName(name) }}
              />
            </div>
            {error && <div style={errBox}>{error}</div>}
            <button
              className="lmp-submit-btn"
              style={{ marginTop: 14 }}
              onClick={() => {
                if (!selectedTenId) { setError('가입할 조직을 선택해 주세요.'); return }
                setError(null); setJoinStep('name')
              }}
            >
              계속하기
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
            </button>
            <button style={backBtn} onClick={() => { setSignupMode(null); setError(null) }}>← 취소</button>
          </>
        )}

        {joinStep === 'name' && (
          <>
            <div className="lmp-field">
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#353A44', marginBottom: 5 }}>이름</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#8A8F99', display: 'flex', pointerEvents: 'none' }}>
                  <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="7" r="3"/><path d="M3 18c0-3.3 3.1-6 7-6s7 2.7 7 6"/></svg>
                </span>
                <input type="text" value={joinName} onChange={e => setJoinName(e.target.value)} placeholder="홍길동" style={inputSt} autoFocus />
              </div>
            </div>
            {error && <div style={errBox}>{error}</div>}
            <button
              className="lmp-submit-btn"
              style={{ marginTop: 14 }}
              onClick={() => {
                if (!joinName.trim()) { setError('이름을 입력해 주세요.'); return }
                setError(null); setJoinStep('email')
              }}
            >
              계속하기
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
            </button>
            <button style={backBtn} onClick={() => { setJoinStep('org'); setError(null) }}>← 뒤로</button>
          </>
        )}

        {joinStep === 'email' && (
          <>
            <div className="lmp-field">
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#353A44', marginBottom: 5 }}>이메일</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#8A8F99', display: 'flex', pointerEvents: 'none' }}>
                  <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="4.5" width="15" height="11" rx="2"/><path d="m3 6 7 5 7-5"/></svg>
                </span>
                <input type="email" value={joinEmail} onChange={e => setJoinEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" style={inputSt} autoFocus />
              </div>
            </div>
            {error && <div style={errBox}>{error}</div>}
            <button
              className="lmp-submit-btn"
              style={{ marginTop: 14 }}
              onClick={() => {
                if (!joinEmail.trim() || !joinEmail.includes('@')) { setError('올바른 이메일을 입력해 주세요.'); return }
                setError(null); setJoinStep('password')
              }}
            >
              계속하기
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
            </button>
            <button style={backBtn} onClick={() => { setJoinStep('name'); setError(null) }}>← 뒤로</button>
          </>
        )}

        {joinStep === 'password' && (
          <>
            <div className="lmp-field">
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#353A44', marginBottom: 5 }}>비밀번호</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#8A8F99', display: 'flex', pointerEvents: 'none' }}>
                  <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="9" width="12" height="8" rx="1.5"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9"/></svg>
                </span>
                <input type={showPw ? 'text' : 'password'} value={joinPw} onChange={e => setJoinPw(e.target.value)} placeholder="6자 이상" autoComplete="new-password" style={inputSt} autoFocus />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, border: 0, background: 'transparent', borderRadius: 6, color: '#8A8F99', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                  <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z"/><circle cx="10" cy="10" r="2"/></svg>
                </button>
              </div>
            </div>
            {error && <div style={errBox}>{error}</div>}
            <button
              className="lmp-submit-btn"
              style={{ marginTop: 14 }}
              onClick={() => {
                if (joinPw.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return }
                setError(null); setJoinStep('confirm')
              }}
            >
              계속하기
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
            </button>
            <button style={backBtn} onClick={() => { setJoinStep('email'); setError(null) }}>← 뒤로</button>
          </>
        )}

        {joinStep === 'confirm' && (
          <>
            <div className="lmp-field">
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#353A44', marginBottom: 5 }}>비밀번호 확인</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#8A8F99', display: 'flex', pointerEvents: 'none' }}>
                  <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="9" width="12" height="8" rx="1.5"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9"/></svg>
                </span>
                <input type={showPw ? 'text' : 'password'} value={joinConfirm} onChange={e => setJoinConfirm(e.target.value)} placeholder="비밀번호 재입력" autoComplete="new-password" style={inputSt} autoFocus />
              </div>
            </div>
            {error && <div style={errBox}>{error}</div>}
            <button
              className="lmp-submit-btn"
              style={{ marginTop: 14, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              disabled={loading}
              onClick={handleJoinSubmit}
            >
              {loading ? '처리 중...' : '가입하기'}
              {!loading && <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M11 5l5 5-5 5"/></svg>}
            </button>
            <button style={backBtn} onClick={() => { setJoinStep('password'); setError(null) }}>← 뒤로</button>
          </>
        )}
      </div>
    )
  }

  function renderServiceWizard() {
    return (
      <div>
        {/* Step indicator */}
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#8A8F99', marginBottom: 12, textAlign: 'right' as const }}>
          {servStepIdx + 1} / 4
        </div>

        {serviceStep === 'name' && (
          <>
            <div className="lmp-field">
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#353A44', marginBottom: 5 }}>이름</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#8A8F99', display: 'flex', pointerEvents: 'none' }}>
                  <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="7" r="3"/><path d="M3 18c0-3.3 3.1-6 7-6s7 2.7 7 6"/></svg>
                </span>
                <input type="text" value={servName} onChange={e => setServName(e.target.value)} placeholder="홍길동" style={inputSt} autoFocus />
              </div>
            </div>
            {error && <div style={errBox}>{error}</div>}
            <button
              className="lmp-submit-btn"
              style={{ marginTop: 14 }}
              onClick={() => {
                if (!servName.trim()) { setError('이름을 입력해 주세요.'); return }
                setError(null); setServiceStep('email')
              }}
            >
              계속하기
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
            </button>
            <button style={backBtn} onClick={() => { setSignupMode(null); setError(null) }}>← 취소</button>
          </>
        )}

        {serviceStep === 'email' && (
          <>
            <div className="lmp-field">
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#353A44', marginBottom: 5 }}>이메일</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#8A8F99', display: 'flex', pointerEvents: 'none' }}>
                  <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="4.5" width="15" height="11" rx="2"/><path d="m3 6 7 5 7-5"/></svg>
                </span>
                <input type="email" value={servEmail} onChange={e => setServEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" style={inputSt} autoFocus />
              </div>
            </div>
            {error && <div style={errBox}>{error}</div>}
            <button
              className="lmp-submit-btn"
              style={{ marginTop: 14 }}
              onClick={() => {
                if (!servEmail.trim() || !servEmail.includes('@')) { setError('올바른 이메일을 입력해 주세요.'); return }
                setError(null); setServiceStep('password')
              }}
            >
              계속하기
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
            </button>
            <button style={backBtn} onClick={() => { setServiceStep('name'); setError(null) }}>← 뒤로</button>
          </>
        )}

        {serviceStep === 'password' && (
          <>
            <div className="lmp-field">
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#353A44', marginBottom: 5 }}>비밀번호</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#8A8F99', display: 'flex', pointerEvents: 'none' }}>
                  <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="9" width="12" height="8" rx="1.5"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9"/></svg>
                </span>
                <input type={showPw ? 'text' : 'password'} value={servPw} onChange={e => setServPw(e.target.value)} placeholder="6자 이상" autoComplete="new-password" style={inputSt} autoFocus />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, border: 0, background: 'transparent', borderRadius: 6, color: '#8A8F99', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                  <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z"/><circle cx="10" cy="10" r="2"/></svg>
                </button>
              </div>
            </div>
            {error && <div style={errBox}>{error}</div>}
            <button
              className="lmp-submit-btn"
              style={{ marginTop: 14 }}
              onClick={() => {
                if (servPw.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return }
                setError(null); setServiceStep('confirm')
              }}
            >
              계속하기
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
            </button>
            <button style={backBtn} onClick={() => { setServiceStep('email'); setError(null) }}>← 뒤로</button>
          </>
        )}

        {serviceStep === 'confirm' && (
          <>
            <div className="lmp-field">
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#353A44', marginBottom: 5 }}>비밀번호 확인</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#8A8F99', display: 'flex', pointerEvents: 'none' }}>
                  <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="9" width="12" height="8" rx="1.5"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9"/></svg>
                </span>
                <input type={showPw ? 'text' : 'password'} value={servConfirm} onChange={e => setServConfirm(e.target.value)} placeholder="비밀번호 재입력" autoComplete="new-password" style={inputSt} autoFocus />
              </div>
            </div>
            {error && <div style={errBox}>{error}</div>}
            <button
              className="lmp-submit-btn"
              style={{ marginTop: 14, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              disabled={loading}
              onClick={handleServiceSubmit}
            >
              {loading ? '처리 중...' : '가입하기'}
              {!loading && <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M11 5l5 5-5 5"/></svg>}
            </button>
            <button style={backBtn} onClick={() => { setServiceStep('password'); setError(null) }}>← 뒤로</button>
          </>
        )}
      </div>
    )
  }

  const sectionLabelSt: React.CSSProperties = {
    fontFamily: '"JetBrains Mono",monospace',
    fontSize: 10,
    fontWeight: 700,
    color: '#8A8F99',
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
    marginBottom: 10,
  }

  return (
    <ScheduleBackground topNavSlot={topNavSlot}>
      <style>{`
        /* form element classes — enables media query overrides on inline-styled nodes */
        .lmp-form-title { font-size:26px; line-height:1.18; letter-spacing:-0.8px; font-weight:700; margin:0 0 18px; color:#14171C; }
        .lmp-tabs-bar { display:inline-flex; background:rgba(20,23,28,0.06); padding:3px; border-radius:10px; margin-bottom:18px; position:relative; }
        .lmp-socials { display:flex; flex-direction:column; gap:8px; margin-bottom:14px; }
        .lmp-social-btn { display:flex; align-items:center; justify-content:center; gap:10px; width:100%; height:42px; font:inherit; font-size:13.5px; font-weight:600; letter-spacing:-0.2px; border-radius:10px; border:1px solid rgba(20,23,28,0.09); background:#fff; color:#14171C; cursor:pointer; white-space:nowrap; transition:background .12s,border-color .12s,transform .12s; }
        .lmp-social-btn-kakao { background:#FEE500; color:#181600; border-color:transparent; }
        .lmp-divider { display:flex; align-items:center; gap:10px; margin:4px 0 12px; color:#8A8F99; font-size:11.5px; font-weight:500; }
        .lmp-field { margin-bottom:10px; }
        .lmp-submit-btn { width:100%; height:46px; background:#14171C; color:#fff; border:0; border-radius:12px; font:inherit; font-size:14px; font-weight:600; letter-spacing:-0.2px; cursor:pointer; box-shadow:0 1px 0 rgba(20,23,28,0.06),0 8px 20px -8px rgba(20,23,28,0.30); display:flex; align-items:center; justify-content:center; gap:8px; transition:transform .12s; }
        .lmp-submit-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .lmp-card {
          position:relative; z-index:5; width:100%; max-width:420px;
          background:#fff; border:1px solid rgba(20,23,28,0.07); border-radius:18px;
          padding:28px 28px 26px; margin:auto;
          box-shadow:0 1px 0 rgba(20,23,28,0.03),0 22px 60px -28px rgba(20,23,28,0.22),0 4px 14px -8px rgba(20,23,28,0.10);
        }
        @media (max-width:540px) {
          .lmp-form-title { font-size:22px; margin-bottom:14px; }
          .lmp-form-title br { display:none; }
          .lmp-tabs-bar { margin-bottom:14px; }
          .lmp-socials { gap:7px; margin-bottom:12px; }
          .lmp-social-btn { height:40px; font-size:13px; }
          .lmp-field { margin-bottom:9px; }
          .lmp-submit-btn { height:44px; font-size:13.5px; }
          .lmp-card { max-width:100%; padding:20px 18px 18px; border-radius:14px; }
        }
        @media (max-height:620px) and (min-width:541px) {
          .lmp-form-title { font-size:22px; margin-bottom:14px; }
          .lmp-socials { gap:7px; margin-bottom:10px; }
          .lmp-social-btn { height:38px; font-size:13px; }
          .lmp-divider { margin:2px 0 10px; }
          .lmp-field { margin-bottom:8px; }
          .lmp-submit-btn { height:42px; }
          .lmp-card { padding:16px 22px 14px; }
        }
      `}</style>

      {success ? (
        <div className="lmp-card">
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'oklch(0.96 0.04 145)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', fontSize: 22 }}>✓</div>
            <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>{success}</p>
            <button
              onClick={() => { setSuccess(null); switchTab('login') }}
              style={{ color: accent, fontSize: 14, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              로그인하러 가기 →
            </button>
          </div>
        </div>
      ) : (
        <div className="lmp-card">
          {/* eyebrow */}
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: accent, fontWeight: 700, marginBottom: 6, letterSpacing: '1.2px', textTransform: 'uppercase' as const }}>
            {tab === 'login' ? 'WELCOME BACK' : 'JOIN US'}
          </div>

          {/* title */}
          <h2 className="lmp-form-title">
            {tab === 'login' ? <>다시 만나서<br />반가워요 👋</> : <>새로 오셨나요?<br />반갑습니다 🙌</>}
          </h2>

          {/* Tab pill */}
          <div className="lmp-tabs-bar">
            <div style={{ position: 'absolute', top: 3, height: 'calc(100% - 6px)', background: '#fff', borderRadius: 8, boxShadow: '0 1px 0 rgba(20,23,28,0.04),0 2px 6px -2px rgba(20,23,28,0.10)', transition: 'transform .25s cubic-bezier(.4,0,.2,1),width .25s cubic-bezier(.4,0,.2,1)', zIndex: 0, width: pillStyle.width, transform: `translateX(${pillStyle.left}px)` }} />
            {(['login', 'signup'] as Tab[]).map(t => (
              <button
                key={t}
                ref={t === 'login' ? tabLoginRef : tabSignupRef}
                onClick={() => switchTab(t)}
                style={{ padding: '7px 14px', fontSize: 12.5, fontWeight: 600, color: tab === t ? '#14171C' : '#6B7280', border: 0, background: 'transparent', borderRadius: 8, position: 'relative', zIndex: 1, cursor: 'pointer', fontFamily: 'inherit', transition: 'color .15s', whiteSpace: 'nowrap' }}
              >
                {t === 'login' ? '로그인' : '회원가입'}
              </button>
            ))}
          </div>

          {/* Login tab */}
          {tab === 'login' && (
            <>
              <div className="lmp-socials">
                <button onClick={handleGoogle} disabled={loading} className="lmp-social-btn">
                  {googleIcon}
                  Google로 계속하기
                </button>
                <button onClick={handleKakao} disabled={loading} className="lmp-social-btn lmp-social-btn-kakao">
                  {kakaoIcon}
                  카카오로 계속하기
                </button>
              </div>
              <div className="lmp-divider">
                <div style={{ flex: 1, height: 1, background: 'rgba(20,23,28,0.12)' }} />
                또는 이메일로 계속
                <div style={{ flex: 1, height: 1, background: 'rgba(20,23,28,0.12)' }} />
              </div>
              <form onSubmit={handleLogin}>
                <div className="lmp-field">
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#353A44', marginBottom: 5 }}>이메일</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#8A8F99', display: 'flex', pointerEvents: 'none' }}>
                      <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="4.5" width="15" height="11" rx="2"/><path d="m3 6 7 5 7-5"/></svg>
                    </span>
                    <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" style={inputSt} />
                  </div>
                </div>
                <div className="lmp-field">
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#353A44', marginBottom: 5 }}>비밀번호</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#8A8F99', display: 'flex', pointerEvents: 'none' }}>
                      <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="9" width="12" height="8" rx="1.5"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9"/></svg>
                    </span>
                    <input type={showPw ? 'text' : 'password'} value={loginPw} onChange={e => setLoginPw(e.target.value)} placeholder="비밀번호" autoComplete="current-password" style={inputSt} />
                    <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, border: 0, background: 'transparent', borderRadius: 6, color: '#8A8F99', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                      <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z"/><circle cx="10" cy="10" r="2"/></svg>
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '6px 0 14px', fontSize: 12 }}>
                  <span style={{ color: '#353A44' }}>로그인 유지</span>
                  <button type="button" style={{ color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 500 }}>비밀번호를 잊으셨나요?</button>
                </div>
                {error && <div style={errBox}>{error}</div>}
                <button type="submit" disabled={loading} className="lmp-submit-btn" style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? '처리 중...' : '로그인'}
                  {!loading && <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M11 5l5 5-5 5"/></svg>}
                </button>
              </form>
            </>
          )}

          {/* Signup tab */}
          {tab === 'signup' && (
            <div>
              {/* ── 조직에 가입 section ── */}
              <div style={{ marginBottom: 18 }}>
                <div style={sectionLabelSt}>조직에 가입</div>
                {signupMode !== 'join' ? (
                  <div className="lmp-socials">
                    <button onClick={handleGoogle} disabled={loading} className="lmp-social-btn">
                      {googleIcon}
                      Google로 계속하기
                    </button>
                    <button onClick={handleKakao} disabled={loading} className="lmp-social-btn lmp-social-btn-kakao">
                      {kakaoIcon}
                      카카오로 계속하기
                    </button>
                    <button
                      disabled={loading}
                      className="lmp-social-btn"
                      onClick={() => { setSignupMode('join'); setError(null) }}
                    >
                      <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="4.5" width="15" height="11" rx="2"/><path d="m3 6 7 5 7-5"/></svg>
                      이메일로 계속하기
                    </button>
                  </div>
                ) : (
                  renderJoinWizard()
                )}
              </div>

              {/* divider */}
              <div className="lmp-divider">
                <div style={{ flex: 1, height: 1, background: 'rgba(20,23,28,0.12)' }} />
              </div>

              {/* ── 비즈니스 사용자 가입 section ── */}
              <div style={{ marginBottom: 18 }}>
                <div style={sectionLabelSt}>비즈니스 사용자 가입</div>
                {signupMode !== 'service' ? (
                  <div className="lmp-socials">
                    <button onClick={handleGoogle} disabled={loading} className="lmp-social-btn">
                      {googleIcon}
                      Google로 계속하기
                    </button>
                    <button onClick={handleKakao} disabled={loading} className="lmp-social-btn lmp-social-btn-kakao">
                      {kakaoIcon}
                      카카오로 계속하기
                    </button>
                    <button
                      disabled={loading}
                      className="lmp-social-btn"
                      onClick={() => { setSignupMode('service'); setError(null) }}
                    >
                      <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="4.5" width="15" height="11" rx="2"/><path d="m3 6 7 5 7-5"/></svg>
                      이메일로 시작하기
                    </button>
                  </div>
                ) : (
                  renderServiceWizard()
                )}
              </div>

              {/* Legal footer */}
              <p style={{ fontSize: 11.5, color: '#8A8F99', textAlign: 'center' as const, lineHeight: 1.6, marginTop: 8 }}>
                계속하면{' '}
                <span
                  style={{ color: accent, cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => navigate('/consent')}
                >
                  서비스 약관
                </span>{' '}
                및{' '}
                <span
                  style={{ color: accent, cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => navigate('/consent')}
                >
                  개인정보 처리방침
                </span>
                에 동의하는 것입니다.
              </p>
            </div>
          )}
        </div>
      )}
    </ScheduleBackground>
  )
}
