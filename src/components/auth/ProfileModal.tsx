import { useState, useEffect } from 'react'
import type { Profile } from '../../types'

interface Props {
  profile: Profile
  onClose: () => void
  linkGoogle: () => Promise<string | null>
  linkKakao: () => Promise<string | null>
  getIdentities: () => Promise<{ provider: string }[]>
}

const PROVIDER_LABEL: Record<string, string> = {
  email: '이메일',
  google: 'Google',
  kakao: '카카오',
}

const PROVIDER_COLOR: Record<string, React.CSSProperties> = {
  email:  { background: '#F4F1EA', color: '#353A44', border: '1px solid rgba(20,23,28,0.12)' },
  google: { background: '#fff', color: '#353A44', border: '1px solid rgba(20,23,28,0.12)' },
  kakao:  { background: '#FEE500', color: '#181600', border: '1px solid transparent' },
}

export function ProfileModal({ profile, onClose, linkGoogle, linkKakao, getIdentities }: Props) {
  const [identities, setIdentities] = useState<{ provider: string }[]>([])
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getIdentities().then(setIdentities)
  }, [getIdentities])

  const hasProvider = (p: string) => identities.some(i => i.provider === p)

  async function handleLink(provider: 'google' | 'kakao') {
    setLoadingProvider(provider); setError(null)
    const err = provider === 'google' ? await linkGoogle() : await linkKakao()
    setLoadingProvider(null)
    if (err) setError(err)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(20,23,28,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{
        width: '100%', maxWidth: 400, background: '#fff',
        border: '1px solid rgba(20,23,28,0.07)', borderRadius: 18, padding: '24px 24px 20px',
        boxShadow: '0 22px 60px -28px rgba(20,23,28,0.22)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: 'oklch(0.66 0.16 28)', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 4 }}>ACCOUNT</div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: -0.4, color: '#14171C' }}>{profile.name}</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#8A8F99' }}>{profile.email}</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, border: '1px solid rgba(20,23,28,0.09)', borderRadius: 8, background: '#F4F1EA', color: '#6B7280', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>
          </button>
        </div>

        {/* 연동 현황 */}
        <div style={{ fontSize: 11.5, fontWeight: 600, color: '#353A44', marginBottom: 10 }}>소셜 계정 연동</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(['google', 'kakao'] as const).map(provider => {
            const linked = hasProvider(provider)
            const isLoading = loadingProvider === provider
            return (
              <div key={provider} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: '#FAFAF9', border: '1px solid rgba(20,23,28,0.07)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {provider === 'google' ? (
                    <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20.4H24v7.1h11.3c-1.5 4.1-5.4 7-11.3 7-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5-5C32.9 5.1 28.7 3.4 24 3.4 12.5 3.4 3.4 12.5 3.4 24S12.5 44.6 24 44.6c11 0 20-8 20-20 0-1.4-.1-2.7-.4-4.1z"/><path fill="#FF3D00" d="M5.3 13.6l5.8 4.3C12.8 14.1 18 11 24 11c3 0 5.8 1.1 7.9 3l5-5C32.9 5.1 28.7 3.4 24 3.4 16.4 3.4 9.8 7.6 5.3 13.6z"/><path fill="#4CAF50" d="M24 44.6c4.6 0 8.7-1.7 11.9-4.5l-5.5-4.6c-1.7 1.3-3.9 2.1-6.4 2.1-5.8 0-10.7-3.9-11.2-7H7v4.7C10.5 40.6 16.8 44.6 24 44.6z"/><path fill="#1976D2" d="M43.6 20.5H42V20.4H24v7.1h11.3c-.7 2-2 3.7-3.6 5l5.5 4.6c-.4.4 5.8-4.2 5.8-13.2 0-1.4-.1-2.7-.4-3.4z"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#181600"><path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.7 6.7-.2.7-.7 2.7-.8 3.1-.1.5.2.5.4.4.2-.1 2.6-1.7 3.6-2.4.7.1 1.4.2 2.1.2 5.5 0 10-3.6 10-8s-4.5-8-10-8Z"/></svg>
                  )}
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: '#14171C' }}>{PROVIDER_LABEL[provider]}</span>
                </div>
                {linked ? (
                  <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 999, ...PROVIDER_COLOR[provider] }}>연동됨</span>
                ) : (
                  <button onClick={() => handleLink(provider)} disabled={!!loadingProvider} style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, background: '#14171C', color: '#fff', border: 0, cursor: loadingProvider ? 'not-allowed' : 'pointer', opacity: loadingProvider ? 0.6 : 1, fontFamily: 'inherit' }}>
                    {isLoading ? '연결 중...' : '연동하기'}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'oklch(0.97 0.02 25)', border: '1px solid oklch(0.88 0.06 25)', color: 'oklch(0.45 0.15 25)', fontSize: 13 }}>{error}</div>
        )}

        <p style={{ marginTop: 14, fontSize: 11.5, color: '#8A8F99', lineHeight: 1.6 }}>
          연동하면 해당 소셜 계정으로도 동일한 계정에 로그인할 수 있습니다.
        </p>
      </div>
    </div>
  )
}
