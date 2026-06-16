import { useState, useEffect } from 'react'
import { DevFileLabel } from '../components/DevFileLabel'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ScheduleBackground } from '../components/auth/ScheduleBackground'

const ILock = () => (
  <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="9" width="12" height="8" rx="2"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9"/>
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

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Check if a recovery session already exists (token processed before mount)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setReady(true)
    })

    // Catch PASSWORD_RECOVERY / SIGNED_IN if they fire after mount
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit() {
    if (password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return }
    if (password !== confirm) { setError('비밀번호가 일치하지 않습니다.'); return }
    setLoading(true); setError(null)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setDone(true)
    setTimeout(() => navigate('/auth?tab=login', { replace: true }), 2500)
  }

  return (
    <ScheduleBackground topNavSlot={null}>
      <div className="af-card">
        <span className="af-eyebrow">비밀번호 재설정</span>

        {done ? (
          <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
            <h2 className="af-title" style={{ marginBottom: 6 }}>변경 완료!</h2>
            <p className="af-sub">새 비밀번호로 로그인해 주세요.<br />잠시 후 로그인 페이지로 이동합니다.</p>
          </div>
        ) : !ready ? (
          <>
            <h2 className="af-title">링크를 확인 중...</h2>
            <p className="af-sub">이메일의 재설정 링크를 통해 접근해 주세요.</p>
            <button className="af-btn af-btn-primary" style={{ marginTop: 16 }}
              onClick={() => navigate('/auth?tab=login', { replace: true })}>
              로그인으로 돌아가기
            </button>
          </>
        ) : (
          <>
            <h2 className="af-title">새 비밀번호<br />설정하기</h2>
            <div className="af-field" style={{ marginTop: 20 }}>
              <label className="af-label">새 비밀번호</label>
              <div className="af-input-wrap">
                <span className="af-input-ic"><ILock /></span>
                <input className="af-input" type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="6자 이상"
                  autoComplete="new-password" autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }} />
                <button type="button" className="af-input-eye" onClick={() => setShowPw(p => !p)}>
                  {showPw ? <IEyeOff /> : <IEye />}
                </button>
              </div>
            </div>
            <div className="af-field">
              <label className="af-label">비밀번호 확인</label>
              <div className="af-input-wrap">
                <span className="af-input-ic"><ILock /></span>
                <input className="af-input" type={showPw ? 'text' : 'password'} value={confirm}
                  onChange={e => setConfirm(e.target.value)} placeholder="비밀번호 재입력"
                  autoComplete="new-password"
                  onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }} />
              </div>
            </div>
            {error && <div className="af-err">{error}</div>}
            <button className="af-btn af-btn-primary" style={{ marginTop: 6, opacity: loading ? 0.6 : 1 }}
              disabled={loading} onClick={handleSubmit}>
              {loading ? '변경 중...' : <>비밀번호 변경 <IArrow /></>}
            </button>
          </>
        )}
      </div>
      <DevFileLabel file="ResetPasswordPage.tsx" />
    </ScheduleBackground>
  )
}
